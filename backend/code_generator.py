from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
import uvicorn
import re
from dotenv import load_dotenv
from typing import Optional, List

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Code Generator API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Please set GEMINI_API_KEY in your .env file")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Request/Response Models
class CodeRequest(BaseModel):
    requirement: str
    language: Optional[str] = "javascript"
    framework: Optional[str] = None
    style: Optional[str] = "clean"
    include_comments: Optional[bool] = True
    include_tests: Optional[bool] = False

class CodeResponse(BaseModel):
    success: bool
    generated_code: str
    language: str
    explanation: str
    suggestions: List[str]
    error: Optional[str] = None

# Pre-defined prompts for different programming languages and frameworks
LANGUAGE_PROMPTS = {
    "javascript": {
        "base": "Generate clean, modern JavaScript code",
        "frameworks": {
            "react": "Generate React components with hooks and modern patterns",
            "vue": "Generate Vue.js components with composition API",
            "node": "Generate Node.js server-side code with best practices",
            "express": "Generate Express.js API endpoints and middleware"
        }
    },
    "python": {
        "base": "Generate clean, Pythonic code following PEP 8 standards",
        "frameworks": {
            "django": "Generate Django models, views, and templates",
            "flask": "Generate Flask applications with routes and templates",
            "fastapi": "Generate FastAPI endpoints with proper type hints",
            "pandas": "Generate data analysis code using pandas"
        }
    },
    "java": {
        "base": "Generate clean Java code with proper OOP principles",
        "frameworks": {
            "spring": "Generate Spring Boot applications with annotations",
            "android": "Generate Android app components and activities"
        }
    },
    "html": {
        "base": "Generate semantic HTML with proper structure",
        "frameworks": {
            "bootstrap": "Generate responsive HTML with Bootstrap classes",
            "tailwind": "Generate HTML with Tailwind CSS utility classes"
        }
    },
    "css": {
        "base": "Generate modern CSS with flexbox/grid layouts",
        "frameworks": {
            "scss": "Generate SCSS with variables and mixins",
            "tailwind": "Generate Tailwind CSS utility classes"
        }
    }
}

@app.get("/")
async def root():
    return {"message": "Code Generator API is running!", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Code Generator API"}

@app.get("/languages")
async def get_supported_languages():
    """Get list of supported programming languages and frameworks"""
    return {
        "languages": list(LANGUAGE_PROMPTS.keys()),
        "frameworks": {lang: list(data["frameworks"].keys()) for lang, data in LANGUAGE_PROMPTS.items()}
    }

def create_prompt(request: CodeRequest) -> str:
    """Create a detailed prompt for code generation based on the request"""
    
    base_prompt = f"""
    You are an expert programmer. Generate high-quality, production-ready code based on the following requirement:

    **Requirement:** {request.requirement}

    **Specifications:**
    - Programming Language: {request.language}
    - Code Style: {request.style}
    - Include Comments: {request.include_comments}
    - Include Tests: {request.include_tests}
    """
    
    if request.framework:
        base_prompt += f"- Framework/Library: {request.framework}\n"
    
    # Add language-specific instructions
    if request.language in LANGUAGE_PROMPTS:
        lang_data = LANGUAGE_PROMPTS[request.language]
        base_prompt += f"\n**Language Guidelines:** {lang_data['base']}\n"
        
        if request.framework and request.framework in lang_data["frameworks"]:
            base_prompt += f"**Framework Guidelines:** {lang_data['frameworks'][request.framework]}\n"
    
    base_prompt += f"""

    **Output Requirements:**
    1. Generate clean, readable, and well-structured code
    2. Follow best practices and coding standards for {request.language}
    3. Include proper error handling where appropriate
    4. Add meaningful variable and function names
    5. {'Include helpful comments explaining the logic' if request.include_comments else 'Minimize comments, focus on clean code'}
    6. {'Include basic unit tests or usage examples' if request.include_tests else 'Focus on the main implementation'}
    
    **Response Format:**
    Provide ONLY the code without any markdown formatting or explanations outside the code.
    The code should be ready to run or use immediately.
    
    Start generating the code now:
    """
    
    return base_prompt

def extract_code_info(code: str, language: str) -> dict:
    """Extract information about the generated code"""
    
    info = {
        "functions": [],
        "classes": [],
        "imports": [],
        "complexity": "medium"
    }
    
    lines = code.split('\n')
    
    try:
        if language.lower() == "python":
            for line in lines:
                line = line.strip()
                if line.startswith('def '):
                    func_name = re.search(r'def\s+(\w+)', line)
                    if func_name:
                        info["functions"].append(func_name.group(1))
                elif line.startswith('class '):
                    class_name = re.search(r'class\s+(\w+)', line)
                    if class_name:
                        info["classes"].append(class_name.group(1))
                elif line.startswith('import ') or line.startswith('from '):
                    info["imports"].append(line)
                    
        elif language.lower() == "javascript":
            for line in lines:
                line = line.strip()
                if 'function ' in line or '=>' in line:
                    func_match = re.search(r'(?:function\s+(\w+)|const\s+(\w+)\s*=)', line)
                    if func_match:
                        func_name = func_match.group(1) or func_match.group(2)
                        if func_name:
                            info["functions"].append(func_name)
                elif 'class ' in line:
                    class_match = re.search(r'class\s+(\w+)', line)
                    if class_match:
                        info["classes"].append(class_match.group(1))
                elif 'import ' in line or 'require(' in line:
                    info["imports"].append(line)
        
        # Determine complexity based on code length and features
        if len(lines) > 100:
            info["complexity"] = "high"
        elif len(lines) > 30:
            info["complexity"] = "medium"
        else:
            info["complexity"] = "low"
            
    except Exception as e:
        print(f"Error analyzing code: {e}")
    
    return info

def generate_suggestions(requirement: str, language: str, code_info: dict) -> List[str]:
    """Generate helpful suggestions based on the generated code"""
    
    suggestions = []
    
    # General suggestions based on language
    if language.lower() == "python":
        suggestions.extend([
            "Consider adding type hints for better code documentation",
            "Use virtual environments for dependency management",
            "Add docstrings to functions and classes"
        ])
    elif language.lower() == "javascript":
        suggestions.extend([
            "Consider using TypeScript for better type safety",
            "Add JSDoc comments for documentation",
            "Use modern ES6+ features where appropriate"
        ])
    
    # Suggestions based on complexity
    if code_info["complexity"] == "high":
        suggestions.append("Consider breaking down complex functions into smaller ones")
        suggestions.append("Add comprehensive error handling and logging")
    
    # Suggestions based on detected features
    if len(code_info["functions"]) > 5:
        suggestions.append("Consider organizing functions into classes or modules")
    
    if not code_info["imports"]:
        suggestions.append("Consider if any standard libraries could improve the code")
    
    return suggestions[:4]  # Limit to 4 suggestions

@app.post("/generate", response_model=CodeResponse)
async def generate_code(request: CodeRequest):
    """Generate code based on user requirements"""
    try:
        print(f"🚀 Generating code for: {request.requirement[:50]}...")
        
        # Validate request
        if not request.requirement.strip():
            raise HTTPException(status_code=400, detail="Requirement cannot be empty")
        
        # Create prompt
        prompt = create_prompt(request)
        print(f"📝 Created prompt for {request.language} code generation")
        
        # Generate code using Gemini
        print("🤖 Sending request to Gemini AI...")
        response = model.generate_content(prompt)
        generated_code = response.text.strip()
        
        # Clean up the code (remove markdown formatting if present)
        if "```" in generated_code:
            # Extract code from markdown code blocks
            code_match = re.search(r'```(?:\w+)?\n?(.*?)\n?```', generated_code, re.DOTALL)
            if code_match:
                generated_code = code_match.group(1).strip()
        
        print(f"✅ Generated {len(generated_code)} characters of code")
        
        # Analyze the generated code
        code_info = extract_code_info(generated_code, request.language)
        
        # Generate explanation
        explanation_prompt = f"""
        Briefly explain what this {request.language} code does in 2-3 sentences:
        
        {generated_code[:500]}...
        
        Focus on the main purpose and key features.
        """
        
        explanation_response = model.generate_content(explanation_prompt)
        explanation = explanation_response.text.strip()
        
        # Generate suggestions
        suggestions = generate_suggestions(request.requirement, request.language, code_info)
        
        return CodeResponse(
            success=True,
            generated_code=generated_code,
            language=request.language,
            explanation=explanation,
            suggestions=suggestions
        )
        
    except Exception as e:
        print(f"❌ Error generating code: {str(e)}")
        return CodeResponse(
            success=False,
            generated_code="",
            language=request.language,
            explanation="",
            suggestions=[],
            error=str(e)
        )

@app.post("/improve")
async def improve_code(request: dict):
    """Improve existing code with suggestions"""
    try:
        code = request.get("code", "")
        improvement_type = request.get("type", "general")  # general, performance, readability, security
        
        if not code.strip():
            raise HTTPException(status_code=400, detail="Code cannot be empty")
        
        improvement_prompts = {
            "general": "Improve this code with better practices and optimization:",
            "performance": "Optimize this code for better performance:",
            "readability": "Make this code more readable and maintainable:",
            "security": "Improve the security of this code:"
        }
        
        prompt = f"""
        {improvement_prompts.get(improvement_type, improvement_prompts["general"])}
        
        {code}
        
        Provide the improved version with explanations of changes made.
        """
        
        response = model.generate_content(prompt)
        improved_code = response.text.strip()
        
        return {
            "success": True,
            "improved_code": improved_code,
            "improvement_type": improvement_type
        }
        
    except Exception as e:
        print(f"❌ Error improving code: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/explain")
async def explain_code(request: dict):
    """Explain existing code"""
    try:
        code = request.get("code", "")
        
        if not code.strip():
            raise HTTPException(status_code=400, detail="Code cannot be empty")
        
        prompt = f"""
        Explain this code in detail:
        
        {code}
        
        Include:
        1. What the code does
        2. How it works step by step
        3. Key concepts used
        4. Potential improvements
        """
        
        response = model.generate_content(prompt)
        explanation = response.text.strip()
        
        return {
            "success": True,
            "explanation": explanation
        }
        
    except Exception as e:
        print(f"❌ Error explaining code: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    print("🚀 Starting Code Generator Server...")
    print("📡 Server will be available at: http://localhost:8001")
    print("🔧 Health Check: http://localhost:8001/health")
    print("📚 API Docs: http://localhost:8001/docs")
    print("🔤 Supported Languages: http://localhost:8001/languages")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    uvicorn.run("code_generator:app", host="0.0.0.0", port=8001, reload=True)