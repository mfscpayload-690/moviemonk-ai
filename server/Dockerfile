FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for httpx and hiredis
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HuggingFace Spaces expects port 7860
EXPOSE 7860

# Run with uvicorn - single worker for free tier
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--log-level", "info"]
