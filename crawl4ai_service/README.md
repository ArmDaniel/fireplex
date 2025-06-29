# Crawl4AI Service

This Python FastAPI service provides an API endpoint to perform web searches (via Serper.dev) and then scrape the content of the resulting URLs using the `crawl4ai` library. It's designed to extract LLM-friendly markdown and relevant metadata.

## Features

-   Receives a search query.
-   Fetches search results from Serper.dev API.
-   Scrapes the content of returned URLs using `crawl4ai`.
-   Extracts clean markdown, title, description, images, favicons, and site names.
-   Returns structured data suitable for consumption by other services (e.g., a Next.js backend).

## API Endpoint

### `POST /search`

-   **Description:** Takes a search query, fetches relevant URLs via Serper, scrapes them using `crawl4ai`, and returns the scraped data.
-   **Request Body (JSON):**
    ```json
    {
      "query": "string", // The search query
      "limit": "integer" // Optional: Number of search results to process (defaults to 5 in main.py)
    }
    ```
-   **Response Body (JSON):**
    A list of `Source` objects:
    ```json
    [
      {
        "url": "string",
        "title": "string | null",
        "description": "string | null",
        "content": "string | null", // Markdown content
        "markdown": "string | null", // Markdown content
        "publishedDate": "string | null",
        "author": "string | null",
        "image": "string | null",
        "favicon": "string | null",
        "siteName": "string | null"
      }
      // ... more source objects
    ]
    ```

## Environment Variables

The following environment variables are required or can be set:

-   `SERPER_API_KEY` (Required): Your API key for Serper.dev.
-   `PORT` (Optional): The port on which the Uvicorn server will run. Defaults to `8008` if not specified and the Uvicorn command in `Dockerfile` or `main.py` isn't changed.

## Local Development Setup

1.  **Clone the repository (if you haven't already).**
2.  **Navigate to this service's directory:**
    ```bash
    cd path/to/your/project/crawl4ai_service
    ```
3.  **Create a Python virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
4.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Install Playwright browsers:**
    `crawl4ai` uses Playwright for browser automation. You need to install the necessary browser binaries.
    ```bash
    # This will install Chromium by default, which is generally sufficient.
    # The --with-deps flag attempts to install system dependencies for Linux.
    python -m playwright install --with-deps chromium
    ```
    Alternatively, `crawl4ai-setup` might be available if `crawl4ai` registers it as a command.

6.  **Set up environment variables:**
    Create a `.env` file in the `crawl4ai_service` directory:
    ```env
    SERPER_API_KEY="your_serper_api_key_here"
    # PORT=8008 # Optional, defaults to 8008
    ```
7.  **Run the service:**
    ```bash
    python main.py
    ```
    Or using Uvicorn directly for more options (like auto-reload):
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8008 --reload
    ```
    The service should now be running on `http://localhost:8008`.

## Docker

This service includes a `Dockerfile` for containerization.

1.  **Build the Docker image:**
    From the `crawl4ai_service` directory:
    ```bash
    docker build -t crawl4ai-service .
    ```
2.  **Run the Docker container:**
    ```bash
    docker run -p 8008:8008 -e SERPER_API_KEY="your_serper_api_key_here" --rm crawl4ai-service
    ```
    The `--rm` flag automatically removes the container when it exits.
    The service inside the container will be accessible on `http://localhost:8008` on your host machine.

## Deployment

-   This service is designed to be deployed as a Docker container.
-   Platforms like Fly.io, Render, Google Cloud Run, or AWS App Runner are suitable.
-   Ensure the `SERPER_API_KEY` environment variable is set in your deployment environment.
-   The service listens on port `8008` by default. Configure your deployment platform to map traffic to this port.
-   Consider resource allocation (CPU, Memory) as web scraping can be resource-intensive.

## Notes for Operating Systems

-   **Python & Pip:** Ensure Python 3.9+ and pip are installed. Download from [python.org](https://python.org).
-   **Git:** Ensure Git is installed. Download from [git-scm.com](https://git-scm.com).
-   **Docker:** Ensure Docker Desktop (Windows, macOS) or Docker Engine (Linux) is installed. Download from [docker.com](https://www.docker.com).
-   **Playwright System Dependencies (Linux):** The `python -m playwright install --with-deps chromium` command attempts to list missing dependencies. You might need to install them using your system's package manager (e.g., `apt-get install <dependency>` on Debian/Ubuntu). The `Dockerfile` includes a comprehensive list of these dependencies.
-   **Virtual Environment (venv):**
    -   Linux/macOS: `python3 -m venv venv` and `source venv/bin/activate`
    -   Windows (cmd): `python -m venv venv` and `venv\Scripts\activate.bat`
    -   Windows (PowerShell): `python -m venv venv` and `venv\Scripts\Activate.ps1` (you might need to set execution policy: `Set-ExecutionPolicy Unrestricted -Scope Process`).
-   **Environment Variables in Terminal (Temporary):**
    -   Linux/macOS: `export SERPER_API_KEY="your_key"`
    -   Windows (cmd): `set SERPER_API_KEY="your_key"`
    -   Windows (PowerShell): `$env:SERPER_API_KEY="your_key"`
    It's generally better to use a `.env` file for local development as supported by `python-dotenv`.
```
