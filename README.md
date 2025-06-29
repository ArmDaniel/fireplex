<div align="center">

# Fireplexity

A blazing-fast AI search engine. It gets intelligent answers with real-time citations and live data by using a powerful backend combination: a search API (Serper.dev by default) to find relevant web pages and `crawl4ai` to perform in-depth scraping and content extraction.

<img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjBxbWFxamZycWRkMmVhMGFiZnNuZjMxc3lpNHpuamR4OWlwa3F4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QbfaTCB1OmkRmIQwzJ/giphy.gif" width="100%" alt="Fireplexity Demo" />

</div>

## Features

- **Real-time Web Search & Scraping** - Uses a search API (e.g., Serper.dev) to find information and `crawl4ai` to extract high-quality, LLM-ready content.
- **Flexible AI Providers** - Choose between OpenAI and OpenRouter
- **Configurable Models** - Select from available models when using OpenRouter
- **AI Responses** - Streaming answers from your chosen LLM
- **Source Citations** - Every claim backed by references
- **Live Stock Data** - Automatic TradingView charts
- **Smart Follow-ups** - AI-generated questions

## Quick Start

### 1. Clone & Install Frontend
```bash
git clone https://github.com/mendableai/fireplexity.git
cd fireplexity
npm install # or pnpm install / yarn install
```

### 2. Set API Keys for Fireplexity (Next.js App)
Create a `.env.local` file in the root of the `fireplexity` directory by copying `.env.example` (if it exists) or creating a new one:
```bash
cp .env.example .env.local # If .env.example exists
# or touch .env.local
```

Add the following to `.env.local`:
```env
# Required if using the OpenAI provider for LLM responses
OPENAI_API_KEY=sk-your-api-key

# Required if using the OpenRouter provider for LLM responses
OPENROUTER_API_KEY=your-openrouter-key

# URL of your deployed or local crawl4ai_service (Python backend)
# For local development, if the Python service runs on port 8008:
CRAWL4AI_SERVICE_URL=http://localhost:8008/search
```
**Note on `FIRECRAWL_API_KEY`:** This project previously used Firecrawl directly. If you have `FIRECRAWL_API_KEY` in your environment, it's no longer used by the primary search/scraping features.

**Note on UI API Key Entry:** If environment variables for `OPENAI_API_KEY` or `OPENROUTER_API_KEY` are not set, the application may prompt you to enter them in the UI for `localStorage` storage. `CRAWL4AI_SERVICE_URL` should be set as an environment variable.

### 3. Setup and Run the `crawl4ai_service` (Python Backend)

The Python backend service handles web searching (via Serper.dev) and scraping (via `crawl4ai`).

**Navigate to the service directory:**
```bash
cd crawl4ai_service # This directory is inside the fireplexity project
```

**Create a Python virtual environment (recommended):**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**Install Playwright browsers:**
```bash
python -m playwright install --with-deps chromium
```

**Set API Key for the Python Service:**
Create a `.env` file in the `crawl4ai_service` directory:
```env
SERPER_API_KEY="your_serper_api_key_here"
# PORT=8008 # Optional, defaults to 8008
```

**Run the Python service:**
```bash
python main.py
```
Or using Uvicorn for auto-reload:
```bash
uvicorn main:app --host 0.0.0.0 --port 8008 --reload
```
This service will typically run on `http://localhost:8008`.

### 4. Run the Fireplexity Next.js App
Navigate back to the root `fireplexity` directory if you changed out of it.
```bash
# If you are in crawl4ai_service, go back: cd ..
npm run dev
```

Visit http://localhost:3000 to use Fireplexity.

## Tech Stack

- **`crawl4ai` & Python FastAPI** - For backend web scraping and content processing.
- **Serper.dev (or other search API)** - For initial web search to find relevant URLs.
- **Next.js 15** - React framework for the frontend and API routes.
- **OpenAI / OpenRouter** - LLM providers
- **Vercel AI SDK** - For AI response streaming.
- **TradingView** - For live stock charts.
- **Shadcn UI & Tailwind CSS** - For frontend components.

## Deployment

Deploying Fireplexity now involves two main components:

1.  **The `crawl4ai_service` (Python Backend):**
    *   This is a Dockerized FastAPI application.
    *   It needs to be deployed to a platform that supports Docker containers (e.g., Fly.io, Render, Google Cloud Run, AWS App Runner).
    *   Refer to the `crawl4ai_service/README.md` for instructions on building and running with Docker.
    *   **Required Environment Variable for deployed Python service:** `SERPER_API_KEY`.

2.  **The Fireplexity Next.js Application (Frontend & Next.js API Routes):**
    *   Can be deployed to Vercel (as before) or any Next.js hosting platform.
    *   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmendableai%2Ffireplexity)
    *   **Required Environment Variables for deployed Next.js app:**
        *   `OPENAI_API_KEY` (if using OpenAI)
        *   `OPENROUTER_API_KEY` (if using OpenRouter)
        *   `CRAWL4AI_SERVICE_URL`: This **must** be set to the public URL of your deployed `crawl4ai_service`.

## Resources

- **`crawl4ai`**: [GitHub Repository](https://github.com/unclecode/crawl4ai)
- **Serper.dev**: [Website](https://serper.dev) (for search API key)
- **Next.js**: [Documentation](https://nextjs.org/docs)
- **Vercel AI SDK**: [Documentation](https://sdk.vercel.ai/docs)

## License

MIT License

---

Powered by `crawl4ai` and various AI/Search APIs.
