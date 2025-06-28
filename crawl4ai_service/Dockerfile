# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PLAYWRIGHT_BROWSERS_PATH /ms-playwright # Set a path for Playwright browsers

# Set work directory
WORKDIR /app

# Install system dependencies required for Playwright and headless browsers
# This list might need adjustment based on the specific python base image and crawl4ai needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libdbus-glib-1-2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libfontconfig1 \
    libx11-xcb1 \
    # Other potentially useful dependencies
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers using crawl4ai-setup
# crawl4ai-setup should handle installing the necessary Playwright browsers.
# Alternatively, use: RUN python -m playwright install --with-deps chromium
# Using crawl4ai-setup is generally better if the library provides it for its specific needs.
# Ensure playwright is installed first by pip before running this.
RUN crawl4ai-setup

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 8008

# Run the application
# Defaulting to port 8008, can be overridden by environment variable PORT if uvicorn is configured for it.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]
