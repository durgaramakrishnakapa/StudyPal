#!/usr/bin/env python3
"""
Startup script for the PPT Maker API
Run this to start the presentation generation service
"""

import os
import sys

def main():
    print("🚀 Starting PPT Maker API Server...")
    print("=" * 50)
    
    # Check if credentials.json exists
    if not os.path.exists('credentials.json'):
        print("❌ Error: credentials.json not found!")
        print("\n📋 Setup Instructions:")
        print("1. Go to Google Cloud Console")
        print("2. Create a new project or select existing one")
        print("3. Enable Google Slides API and Google Drive API")
        print("4. Create credentials (OAuth 2.0 Client ID)")
        print("5. Download the credentials.json file")
        print("6. Place it in the backend directory")
        print("\nFor detailed setup instructions, visit:")
        print("https://developers.google.com/slides/quickstart/python")
        return
    
    # Import and run the FastAPI app
    try:
        import uvicorn
        print("✅ PPT Maker API loaded successfully!")
        print("🌐 Server will be available at: http://localhost:8002")
        print("📡 API endpoint: http://localhost:8002/api/create-presentation")
        print("📚 API docs: http://localhost:8002/docs")
        print("\n🔧 Make sure your frontend is configured to use this endpoint")
        print("=" * 50)
        
        uvicorn.run("pptmaker:app", host="0.0.0.0", port=8002, reload=True)
        
    except ImportError as e:
        print(f"❌ Error importing pptmaker: {e}")
        print("Make sure all dependencies are installed:")
        print("pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == '__main__':
    main()