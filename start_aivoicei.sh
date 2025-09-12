#!/bin/bash

# AI Voicei Web Server Startup Script
# Usage: ./start_aivoicei.sh [development|production]

set -e

# Default to development if no argument provided
ENV=${1:-development}

echo "🚀 Starting AI Voicei Web Server in $ENV mode..."

# Load the appropriate environment file
if [ "$ENV" = "production" ]; then
    echo "📋 Loading production environment..."
    export $(cat .env.production | grep -v '^#' | xargs)
    ENV_FILE=".env.production"
else
    echo "📋 Loading development environment..."
    ENV_FILE=".env"
fi

# Check if Google API key is configured
if [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" = "your-google-api-key-here" ]; then
    echo "❌ Error: GOOGLE_API_KEY not configured in $ENV_FILE"
    echo "Please set your Google API key in the environment file"
    exit 1
fi

# Check if dependencies are installed
echo "🔧 Checking dependencies..."
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed"
    echo "Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
uv sync --group dev --all-extras --no-extra gstreamer --no-extra krisp --no-extra local

# Start the server
echo "🎯 Starting AI Voicei Web Server..."
echo "   Environment: $ENV"
echo "   Host: ${HOST:-localhost}"
echo "   Port: ${PORT:-7860}"
echo ""
echo "🌐 Server will be available at: http://${HOST:-localhost}:${PORT:-7860}"
echo "🏥 Health check: http://${HOST:-localhost}:${PORT:-7860}/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server
uv run python aivoicei_web_server.py