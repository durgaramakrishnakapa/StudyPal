#!/usr/bin/env python3
"""
Resource Provider Backend Runner
Starts the FastAPI server for the Resource Provider API
"""

import uvicorn
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    """Run the Resource Provider API server"""
    print("🚀 Starting Resource Provider API Server...")
    print("📚 AI-powered learning resource discovery")
    print("🌐 Server will be available at: http://localhost:8004")
    print("📖 API Documentation: http://localhost:8004/docs")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "resource_provider:app",
            host="0.0.0.0",
            port=8004,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Resource Provider API Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()