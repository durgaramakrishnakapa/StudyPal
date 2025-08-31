from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
import uvicorn
import re
from dotenv import load_dotenv
from typing import Optional, List, Dict
from datetime import datetime
import markdown

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Content Generator API")

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
class ContentRequest(BaseModel):
    topic: str
    content_type: Optional[str] = "study_notes"  # study_notes, summary, explanation, guide
    depth: Optional[str] = "medium"  # basic, medium, advanced
    format: Optional[str] = "html"  # html, markdown, plain
    include_examples: Optional[bool] = True
    include_diagrams: Optional[bool] = False
    target_audience: Optional[str] = "student"  # student, professional, beginner

class ContentResponse(BaseModel):
    success: bool
    content: str
    format: str
    topic: str
    word_count: int
    reading_time_minutes: int
    sections: List[str]
    error: Optional[str] = None

# CSS Styles for different content types
CSS_STYLES = {
    "study_notes": """
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 2.5em; 
            font-weight: 700; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .content { 
            padding: 30px; 
        }
        h2 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 10px; 
            margin-top: 30px; 
            font-size: 1.8em;
        }
        h3 { 
            color: #34495e; 
            margin-top: 25px; 
            font-size: 1.4em;
            border-left: 4px solid #e74c3c;
            padding-left: 15px;
        }
        .key-point { 
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); 
            border-left: 5px solid #3498db; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .definition { 
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); 
            border-radius: 10px; 
            padding: 20px; 
            margin: 20px 0; 
            border-left: 5px solid #f39c12;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .example { 
            background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); 
            border-radius: 8px; 
            padding: 15px; 
            margin: 15px 0; 
            border-left: 4px solid #9b59b6;
            font-style: italic;
        }
        ul, ol { 
            padding-left: 25px; 
        }
        li { 
            margin: 8px 0; 
            padding: 5px;
        }
        .highlight { 
            background: linear-gradient(120deg, #f6d365 0%, #fda085 100%); 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-weight: bold;
            color: #2c3e50;
        }
        .formula { 
            background: #2c3e50; 
            color: #ecf0f1; 
            padding: 15px; 
            border-radius: 8px; 
            font-family: 'Courier New', monospace; 
            text-align: center; 
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .warning { 
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); 
            border-left: 5px solid #e74c3c; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0;
        }
        .summary { 
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 25px 0;
            border: 2px solid #3498db;
        }
        .tag { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 5px 12px; 
            border-radius: 20px; 
            font-size: 0.9em; 
            margin: 3px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .step { 
            background: white; 
            border: 2px solid #3498db; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 10px 0; 
            position: relative;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .step::before { 
            content: counter(step-counter); 
            counter-increment: step-counter; 
            position: absolute; 
            left: -15px; 
            top: -10px; 
            background: #3498db; 
            color: white; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
        }
        .steps-container { 
            counter-reset: step-counter; 
        }
    </style>
    """,
    
    "summary": """
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .container { 
            max-width: 700px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%); 
            color: white; 
            padding: 25px; 
            text-align: center; 
        }
        .content { 
            padding: 25px; 
        }
        h1 { 
            font-size: 2.2em; 
            margin: 0; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        h2 { 
            color: #2d3436; 
            border-bottom: 2px solid #fd79a8; 
            padding-bottom: 8px; 
        }
        .summary-box { 
            background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
    </style>
    """,
    
    "explanation": """
    <style>
        body { 
            font-family: 'Georgia', serif; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .container { 
            max-width: 750px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 15px; 
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .header { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        h1 { 
            font-size: 2.4em; 
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .content { 
            padding: 30px; 
        }
        .concept { 
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); 
            border-radius: 10px; 
            padding: 20px; 
            margin: 20px 0;
            border-left: 5px solid #e17055;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
    </style>
    """
}

@app.get("/")
async def root():
    return {"message": "Content Generator API is running!", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Content Generator API"}

@app.get("/content-types")
async def get_content_types():
    """Get available content types and their descriptions"""
    return {
        "content_types": {
            "study_notes": "Comprehensive study notes with key concepts, definitions, and examples",
            "summary": "Concise summary of the main points and key takeaways",
            "explanation": "Detailed explanation with step-by-step breakdown",
            "guide": "Step-by-step guide or tutorial format"
        },
        "depth_levels": {
            "basic": "Introductory level with fundamental concepts",
            "medium": "Intermediate level with detailed explanations",
            "advanced": "Advanced level with complex analysis and applications"
        },
        "target_audiences": {
            "student": "Formatted for students and learners",
            "professional": "Business and professional context",
            "beginner": "Complete beginners with no prior knowledge"
        }
    }

def create_content_prompt(request: ContentRequest) -> str:
    """Create a detailed prompt for content generation"""
    
    content_type_prompts = {
        "study_notes": "Create comprehensive study notes that include definitions, key concepts, examples, and important points",
        "summary": "Create a concise but thorough summary that captures the main ideas and key takeaways",
        "explanation": "Provide a detailed explanation that breaks down complex concepts into understandable parts",
        "guide": "Create a step-by-step guide or tutorial that teaches how to understand or apply the concepts"
    }
    
    depth_instructions = {
        "basic": "Keep explanations simple and focus on fundamental concepts. Use basic vocabulary.",
        "medium": "Provide moderate detail with some technical terms. Balance accessibility with thoroughness.",
        "advanced": "Include complex analysis, technical details, and advanced applications. Use professional terminology."
    }
    
    audience_instructions = {
        "student": "Format for academic learning with clear structure, examples, and study-friendly organization.",
        "professional": "Use professional language and focus on practical applications and business relevance.",
        "beginner": "Assume no prior knowledge. Define all terms and explain concepts from the ground up."
    }
    
    base_prompt = f"""
    You are an expert content creator specializing in educational materials. Create {content_type_prompts.get(request.content_type, content_type_prompts['study_notes'])} on the topic: "{request.topic}"

    **Content Specifications:**
    - Content Type: {request.content_type}
    - Depth Level: {request.depth} - {depth_instructions.get(request.depth, depth_instructions['medium'])}
    - Target Audience: {request.target_audience} - {audience_instructions.get(request.target_audience, audience_instructions['student'])}
    - Include Examples: {request.include_examples}
    
    **Structure Requirements:**
    1. Start with a clear, engaging introduction
    2. Organize content with proper headings and subheadings
    3. Use bullet points and numbered lists for clarity
    4. Include definitions for key terms
    5. {'Add relevant examples and applications' if request.include_examples else 'Focus on theoretical concepts'}
    6. End with a summary or conclusion
    
    **Formatting Guidelines:**
    - Use HTML tags for structure (h1, h2, h3, p, ul, ol, li)
    - Apply CSS classes for styling:
      - Use class="definition" for key definitions
      - Use class="key-point" for important concepts
      - Use class="example" for examples
      - Use class="highlight" for emphasized terms
      - Use class="formula" for equations or formulas
      - Use class="warning" for important warnings or notes
      - Use class="summary" for summary sections
      - Use class="tag" for keywords or tags
      - Use class="step" for step-by-step instructions
      - Use class="steps-container" to wrap step sequences
    
    **Content Quality Requirements:**
    - Accurate and up-to-date information
    - Clear and logical flow
    - Engaging and educational
    - Appropriate for the specified audience level
    - Well-structured with good use of headings
    
    Generate the content now in HTML format with proper styling classes:
    """
    
    return base_prompt

def extract_sections(html_content: str) -> List[str]:
    """Extract section headings from HTML content"""
    sections = []
    
    # Find all heading tags
    heading_patterns = [
        r'<h1[^>]*>(.*?)</h1>',
        r'<h2[^>]*>(.*?)</h2>',
        r'<h3[^>]*>(.*?)</h3>'
    ]
    
    for pattern in heading_patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
        for match in matches:
            # Clean up the text (remove any HTML tags)
            clean_text = re.sub(r'<[^>]+>', '', match).strip()
            if clean_text and len(clean_text) < 100:  # Reasonable heading length
                sections.append(clean_text)
    
    return sections[:10]  # Limit to 10 sections

def estimate_reading_time(content: str) -> int:
    """Estimate reading time in minutes based on word count"""
    # Remove HTML tags for word count
    text = re.sub(r'<[^>]+>', '', content)
    words = len(text.split())
    # Average reading speed is about 200 words per minute
    return max(1, round(words / 200))

def get_word_count(content: str) -> int:
    """Get word count from content (excluding HTML tags)"""
    text = re.sub(r'<[^>]+>', '', content)
    return len(text.split())

@app.post("/generate", response_model=ContentResponse)
async def generate_content(request: ContentRequest):
    """Generate formatted content based on user requirements"""
    try:
        print(f"🚀 Generating {request.content_type} content for: {request.topic}")
        
        # Validate request
        if not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty")
        
        # Create prompt
        prompt = create_content_prompt(request)
        print(f"📝 Created prompt for {request.content_type} generation")
        
        # Generate content using Gemini
        print("🤖 Sending request to Gemini AI...")
        response = model.generate_content(prompt)
        generated_content = response.text.strip()
        
        print(f"✅ Generated {len(generated_content)} characters of content")
        
        # Clean up content and ensure proper HTML structure
        if not generated_content.startswith('<!DOCTYPE') and not generated_content.startswith('<html'):
            # Add CSS styling based on content type
            css_style = CSS_STYLES.get(request.content_type, CSS_STYLES["study_notes"])
            
            # Wrap content in proper HTML structure
            formatted_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{request.topic} - {request.content_type.replace('_', ' ').title()}</title>
                {css_style}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{request.topic}</h1>
                        <div class="tag">{request.content_type.replace('_', ' ').title()}</div>
                        <div class="tag">{request.depth.title()} Level</div>
                        <div class="tag">For {request.target_audience.title()}</div>
                    </div>
                    <div class="content">
                        {generated_content}
                    </div>
                </div>
            </body>
            </html>
            """
        else:
            formatted_content = generated_content
        
        # Extract sections and calculate stats
        sections = extract_sections(formatted_content)
        word_count = get_word_count(formatted_content)
        reading_time = estimate_reading_time(formatted_content)
        
        return ContentResponse(
            success=True,
            content=formatted_content,
            format=request.format,
            topic=request.topic,
            word_count=word_count,
            reading_time_minutes=reading_time,
            sections=sections
        )
        
    except Exception as e:
        print(f"❌ Error generating content: {str(e)}")
        return ContentResponse(
            success=False,
            content="",
            format=request.format,
            topic=request.topic,
            word_count=0,
            reading_time_minutes=0,
            sections=[],
            error=str(e)
        )

@app.post("/enhance")
async def enhance_content(request: dict):
    """Enhance existing content with additional information"""
    try:
        content = request.get("content", "")
        enhancement_type = request.get("type", "expand")  # expand, simplify, add_examples, add_details
        
        if not content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        enhancement_prompts = {
            "expand": "Expand this content with additional details, examples, and explanations:",
            "simplify": "Simplify this content to make it easier to understand:",
            "add_examples": "Add more practical examples and real-world applications to this content:",
            "add_details": "Add more detailed explanations and technical information to this content:"
        }
        
        prompt = f"""
        {enhancement_prompts.get(enhancement_type, enhancement_prompts["expand"])}
        
        {content}
        
        Maintain the same HTML structure and CSS classes. Only enhance the content within the existing framework.
        """
        
        response = model.generate_content(prompt)
        enhanced_content = response.text.strip()
        
        return {
            "success": True,
            "enhanced_content": enhanced_content,
            "enhancement_type": enhancement_type
        }
        
    except Exception as e:
        print(f"❌ Error enhancing content: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/convert-format")
async def convert_format(request: dict):
    """Convert content between different formats"""
    try:
        content = request.get("content", "")
        target_format = request.get("format", "html")  # html, markdown, plain
        
        if not content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        if target_format == "markdown":
            # Convert HTML to Markdown
            # Remove HTML tags and convert to markdown structure
            markdown_content = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1', content)
            markdown_content = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1', markdown_content)
            markdown_content = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1', markdown_content)
            markdown_content = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n', markdown_content)
            markdown_content = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1', markdown_content)
            markdown_content = re.sub(r'<[^>]+>', '', markdown_content)  # Remove remaining HTML tags
            
            return {
                "success": True,
                "converted_content": markdown_content,
                "format": target_format
            }
        
        elif target_format == "plain":
            # Convert to plain text
            plain_content = re.sub(r'<[^>]+>', '', content)
            plain_content = re.sub(r'\s+', ' ', plain_content).strip()
            
            return {
                "success": True,
                "converted_content": plain_content,
                "format": target_format
            }
        
        else:
            return {
                "success": True,
                "converted_content": content,
                "format": "html"
            }
        
    except Exception as e:
        print(f"❌ Error converting format: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    print("🚀 Starting Content Generator Server...")
    print("📡 Server will be available at: http://localhost:8009")
    print("🔧 Health Check: http://localhost:8009/health")
    print("📚 API Docs: http://localhost:8009/docs")
    print("📝 Content Types: http://localhost:8009/content-types")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    uvicorn.run("content_generator:app", host="0.0.0.0", port=8009, reload=True)