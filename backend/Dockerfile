FROM python:3.13-slim

WORKDIR /app

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Start Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
