#!/usr/bin/env python3
"""
Startup script for the Agenty Platform API
Run this to start the development server
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add src to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

def main():
    """Start the Agenty Platform API server"""

    # Set environment variables for development
    os.environ.setdefault("ENVIRONMENT", "development")
    os.environ.setdefault("LOG_LEVEL", "info")

    print("🚀 Starting Agenty Platform API...")
    print(f"📁 Working directory: {current_dir}")
    print(f"🐍 Python path: {src_dir}")

    try:
        # Import the FastAPI app
        from main import app

        # Run the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            reload_dirs=[str(src_dir)],
            access_log=True
        )

    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
        sys.exit(1)

    except KeyboardInterrupt:
        print("\n👋 Agenty Platform API shutting down...")
        sys.exit(0)

    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()