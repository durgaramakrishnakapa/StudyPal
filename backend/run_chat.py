#!/usr/bin/env python3
"""
StudyPal Chat Backend Runner
A FastAPI service that provides streaming chat responses with word highlighting
"""

import subprocess
import sys
import os
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    import importlib
    
    # Map package names to their import names
    package_imports = {
        'fastapi': 'fastapi',
        'uvicorn': 'uvicorn', 
        'google-generativeai': 'google.generativeai',
        'python-dotenv': 'dotenv',
        'pydantic': 'pydantic'
    }
    
    missing_packages = []
    
    for package_name, import_name in package_imports.items():
        try:
            importlib.import_module(import_name)
        except ImportError:
            missing_packages.append(package_name)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n💡 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(__file__).parent / '.env'
    
    if not env_file.exists():
        print("❌ .env file not found!")
        print("📝 Please create a .env file with your Gemini API key:")
        print("   GEMINI_API_KEY=your_api_key_here")
        return False
    
    # Check if GEMINI_API_KEY is in the file
    with open(env_file, 'r') as f:
        content = f.read()
        if 'GEMINI_API_KEY' not in content:
            print("❌ GEMINI_API_KEY not found in .env file!")
            print("📝 Please add your Gemini API key to the .env file:")
            print("   GEMINI_API_KEY=your_api_key_here")
            return False
    
    return True

def main():
    """Main function to run the chat server"""
    print("🚀 StudyPal Chat Backend Runner")
    print("=" * 40)
    
    # Check dependencies
    print("📦 Checking dependencies...")
    if not check_dependencies():
        sys.exit(1)
    print("✅ All dependencies are installed")
    
    # Check environment file
    print("🔐 Checking environment configuration...")
    if not check_env_file():
        sys.exit(1)
    print("✅ Environment configuration is valid")
    
    # Run the server
    print("\n🌟 Starting StudyPal Chat Server...")
    print("📡 Server: http://localhost:8012")
    print("📚 API Docs: http://localhost:8012/docs")
    print("✨ Features: http://localhost:8012/features")
    print("\n🔧 Available Endpoints:")
    print("   POST /chat - Standard chat (non-streaming)")
    print("   POST /chat/stream - Streaming chat with highlighting")
    print("   GET  /features - List all available features")
    print("   GET  /test - Test chat functionality")
    print("\n🌟 Key Features:")
    print("   🔄 Real-time response streaming")
    print("   🎯 Intelligent word highlighting")
    print("   📖 Educational assistance optimized")
    print("   ⚡ Natural typing effects")
    print("   🎨 Beautiful text formatting")
    print("\n💡 Highlighting Patterns:")
    print("   • Academic terms (definition, theorem, concept)")
    print("   • Programming terms (function, variable, algorithm)")
    print("   • Math terms (derivative, integral, matrix)")
    print("   • Science terms (molecule, atom, DNA)")
    print("   • Important connectors (important, key, crucial)")
    print("   • Study terms (learn, practice, analyze)")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 40)
    
    try:
        # Import and run the app
        from chat import app
        import uvicorn
        
        uvicorn.run(
            "chat:app",
            host="0.0.0.0",
            port=8012,
            reload=True,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down StudyPal Chat Server...")
        print("✅ Server stopped successfully")
    except Exception as e:
        print(f"\n❌ Error running server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()