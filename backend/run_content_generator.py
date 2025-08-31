#!/usr/bin/env python3
"""
Content Generator Backend Runner
A FastAPI service that generates beautifully formatted content using Gemini AI
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
        'pydantic': 'pydantic',
        'markdown': 'markdown'
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
    """Main function to run the content generator server"""
    print("🚀 Content Generator Backend Runner")
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
    print("\n🌟 Starting Content Generator Server...")
    print("📡 Server: http://localhost:8009")
    print("📚 API Docs: http://localhost:8009/docs")
    print("📝 Content Types: http://localhost:8009/content-types")
    print("\n🔧 Available Endpoints:")
    print("   POST /generate - Generate formatted content from topic")
    print("   POST /enhance - Enhance existing content")
    print("   POST /convert-format - Convert between HTML, Markdown, Plain text")
    print("   GET  /content-types - List available content types and options")
    print("\n✨ Content Types Available:")
    print("   📚 Study Notes - Comprehensive notes with examples")
    print("   📝 Summary - Concise overview of key points") 
    print("   🔍 Explanation - Detailed step-by-step breakdown")
    print("   📖 Guide - Tutorial-style instructional content")
    print("\n🎨 Features:")
    print("   • Beautiful HTML formatting with CSS styling")
    print("   • Multiple depth levels (Basic, Medium, Advanced)")
    print("   • Different target audiences (Student, Professional, Beginner)")
    print("   • Word count and reading time estimation")
    print("   • Section extraction and content analysis")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 40)
    
    try:
        # Import and run the app
        from content_generator import app
        import uvicorn
        
        uvicorn.run(
            "content_generator:app",
            host="0.0.0.0",
            port=8009,
            reload=True,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down Content Generator Server...")
        print("✅ Server stopped successfully")
    except Exception as e:
        print(f"\n❌ Error running server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()