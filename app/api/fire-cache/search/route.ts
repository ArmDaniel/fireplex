import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText, createDataStreamResponse } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Fire Cache Search API called`)
  try {
    const body = await request.json()
    const messages = body.messages || []
    const query = messages[messages.length - 1]?.content || body.query
    console.log(`[${requestId}] Query received:`, query)

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    // The new Python service URL, should be an environment variable
    const crawl4aiServiceUrl = process.env.CRAWL4AI_SERVICE_URL || 'http://localhost:8008/search';

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Configure OpenAI with API key
    const openai = createOpenAI({
      apiKey: openaiApiKey
    })

    // Always perform a fresh search for each query to ensure relevant results
    const isFollowUp = messages.length > 2
    
    // Use createDataStreamResponse with a custom data stream
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          let sources: Array<{
            url: string
            title: string
            description?: string
            content?: string
            markdown?: string
            publishedDate?: string
            author?: string
            image?: string
            favicon?: string
            siteName?: string
          }> = []
          let context = ''
          
          // Always search for sources to ensure fresh, relevant results
          dataStream.writeData({ type: 'status', message: 'Starting search...' })
          dataStream.writeData({ type: 'status', message: 'Searching for relevant sources...' })

          // Call the new Python backend service
          const response = await fetch(crawl4aiServiceUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId // Pass request ID for tracing
            },
            body: JSON.stringify({
              query,
              limit: 5, // The Python service defaults to 5, but we can set it. Let's use a moderate number.
                        // This 'limit' now refers to the number of search results to process from Serper.
            }),
          })

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[${requestId}] crawl4ai-service error: ${response.statusText}`, errorBody)
            throw new Error(`Search and scrape service error: ${response.statusText} - ${errorBody}`)
          }

          // The new service should return data in the format we expect for `sources`
          // It returns a list of Source objects directly
          const fetchedSources = await response.json()
          
          sources = fetchedSources.map((item: any) => ({
            url: item.url,
            title: item.title || item.url, // Fallback title to URL if not present
            description: item.description,
            // The python service returns 'content' and 'markdown' as the same (fit_markdown)
            content: item.content,
            markdown: item.markdown,
            publishedDate: item.publishedDate,
            author: item.author,
            image: item.image,
            favicon: item.favicon,
            siteName: item.siteName,
          })) || []

          // Send sources immediately
          dataStream.writeData({ type: 'sources', sources })
          
          // Small delay to ensure sources render first
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Update status
          dataStream.writeData({ type: 'status', message: 'Analyzing sources and generating answer...' })
          
          // Detect if query is about a company
          const ticker = detectCompanyTicker(query)
          console.log(`[${requestId}] Query: "${query}" -> Detected ticker: ${ticker}`)
          if (ticker) {
            dataStream.writeData({ type: 'ticker', symbol: ticker })
          }
          
          // Prepare context from sources
          context = sources
            .map((source: { title: string; markdown?: string; content?: string; url: string }, index: number) => {
              const content = source.markdown || source.content || ''
              const truncatedContent = content.length > 2000 ? content.slice(0, 2000) + '...' : content
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${truncatedContent}`
            })
            .join('\n\n---\n\n')

          console.log(`[${requestId}] Creating text stream for query:`, query)
          console.log(`[${requestId}] Context length:`, context.length)
          
          // Prepare messages for the AI
          let aiMessages = []
          
          if (!isFollowUp) {
            // Initial query with sources
            aiMessages = [
              {
                role: 'system',
                content: `You are a friendly assistant that helps users find information.
                
                RESPONSE STYLE:
                - For greetings (hi, hello), respond warmly and ask how you can help
                - For simple questions, give direct, concise answers
                - For complex topics, provide detailed explanations only when needed
                - Match the user's energy level - be brief if they're brief
                
                FORMAT:
                - Use markdown for readability when appropriate
                - Keep responses natural and conversational
                - Include citations inline as [1], [2], etc. when referencing specific sources
                - Citations should correspond to the source order (first source = [1], second = [2], etc.)
                - Use the format [1] not CITATION_1 or any other format`
              },
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          } else {
            // Follow-up question - still use fresh sources from the new search
            aiMessages = [
              {
                role: 'system',
                content: `You are a friendly assistant continuing our conversation.
                
                REMEMBER:
                - Keep the same conversational tone from before
                - Build on previous context naturally
                - Match the user's communication style
                - Use markdown when it helps clarity
                - Include citations inline as [1], [2], etc. when referencing specific sources
                - Citations should correspond to the source order (first source = [1], second = [2], etc.)
                - Use the format [1] not CITATION_1 or any other format`
              },
              // Include conversation context
              ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content
              })),
              // Add the current query with the fresh sources
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          }
          
          // Start generating follow-up questions in parallel (before streaming answer)
          const conversationPreview = isFollowUp 
            ? messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n\n')
            : `user: ${query}`
            
          const followUpPromise = generateText({
            model: openai('gpt-4o'),
            messages: [
              {
                role: 'system',
                content: `Generate 5 natural follow-up questions based on the query and context.\n                \n                ONLY generate questions if the query warrants them:\n                - Skip for simple greetings or basic acknowledgments\n                - Create questions that feel natural, not forced\n                - Make them genuinely helpful, not just filler\n                - Focus on the topic and sources available\n                \n                If the query doesn't need follow-ups, return an empty response.
                ${isFollowUp ? 'Consider the full conversation history and avoid repeating previous questions.' : ''}
                Return only the questions, one per line, no numbering or bullets.`
              },
              {
                role: 'user',
                content: `Query: ${query}\n\nConversation context:\n${conversationPreview}\n\n${sources.length > 0 ? `Available sources about: ${sources.map((s: { title: string }) => s.title).join(', ')}\n\n` : ''}Generate 5 diverse follow-up questions that would help the user learn more about this topic from different angles.`
              }
            ],
            temperature: 0.7,
            maxTokens: 150,
          })
          
          // Stream the text generation
          const result = streamText({
            model: openai('gpt-4o'),
            messages: aiMessages,
            temperature: 0.7,
            maxTokens: 2000
          })
          
          // Merge the text stream into the data stream
          // This ensures proper ordering of text chunks
          result.mergeIntoDataStream(dataStream)
          
          // Wait for both the text generation and follow-up questions
          const [fullAnswer, followUpResponse] = await Promise.all([
            result.text,
            followUpPromise
          ])
          
          // Process follow-up questions
          const followUpQuestions = followUpResponse.text
            .split('\n')
            .map((q: string) => q.trim())
            .filter((q: string) => q.length > 0)
            .slice(0, 5)

          // Send follow-up questions after the answer is complete
          dataStream.writeData({ type: 'follow_up_questions', questions: followUpQuestions })
          
          // Signal completion
          dataStream.writeData({ type: 'complete' })
          
        } catch (error) {
          console.error('Stream error:', error)
          dataStream.writeData({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
        }
      },
      headers: {
        'x-vercel-ai-data-stream': 'v1',
      },
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { error: 'Search failed', message: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}