from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
import uvicorn
import asyncio
import logging
import re
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="StudyPal Chat API with Streaming")

# Configure CORS
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

# Initialize Gemini model for streaming
streaming_model = genai.GenerativeModel('gemini-1.5-flash')

logger.info("Gemini AI configured successfully for StudyPal Chat")

# ----------------------------
# Pydantic Models
# ----------------------------

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    status: str
    session_id: str

# ----------------------------
# Chat Processing Functions
# ----------------------------

class StudyPalChat:
    """StudyPal Chat with streaming and word highlighting"""
    
    def __init__(self):
        self.model = streaming_model
    
    def highlight_important_words(self, text: str) -> str:
        """Add highlighting to important words in the response"""
        
        # Define patterns for important words/phrases to highlight
        highlight_patterns = [
            # Academic terms
            r'\b(definition|theorem|formula|equation|concept|principle|theory|hypothesis|analysis|conclusion|method|approach|technique|strategy)\b',
            # Programming terms
            r'\b(function|variable|array|object|class|method|algorithm|syntax|debugging|compilation|loop|condition|statement)\b',
            # Math terms
            r'\b(derivative|integral|matrix|vector|polynomial|exponential|logarithm|trigonometry|algebra|geometry|calculus)\b',
            # Science terms
            r'\b(molecule|atom|electron|photon|DNA|RNA|protein|enzyme|catalyst|reaction|hypothesis|experiment|observation)\b',
            # Important connectors and emphasis
            r'\b(important|key|crucial|essential|fundamental|critical|significant|main|primary|basic|advanced|complex)\b',
            r'\b(always|never|must|should|cannot|will not|definitely|absolutely|typically|usually|often|rarely)\b',
            # Study and learning terms
            r'\b(study|learn|practice|review|understand|memorize|analyze|solve|calculate|explain|demonstrate|apply)\b',
            # Question and answer terms
            r'\b(question|answer|solution|problem|example|step|process|procedure|instruction|guide|tutorial)\b',
            # Organizational terms
            r'\b(first|second|third|next|then|finally|conclusion|summary|overview|introduction|background)\b'
        ]
        
        highlighted_text = text
        
        # Apply highlighting using markdown bold formatting
        for pattern in highlight_patterns:
            highlighted_text = re.sub(
                pattern,
                r'**\1**',
                highlighted_text,
                flags=re.IGNORECASE
            )
        
        # Highlight code snippets and technical terms in backticks
        highlighted_text = re.sub(
            r'`([^`]+)`',
            r'**`\1`**',
            highlighted_text
        )
        
        # Highlight numbers in educational context
        highlighted_text = re.sub(
            r'\b(\d+(?:\.\d+)?)\s*(percent|%|degrees|minutes|seconds|hours|days|years)\b',
            r'**\1 \2**',
            highlighted_text,
            flags=re.IGNORECASE
        )
        
        # Highlight numbered lists and steps
        highlighted_text = re.sub(
            r'^(\d+\.)\s',
            r'**\1** ',
            highlighted_text,
            flags=re.MULTILINE
        )
        
        # Highlight section markers
        highlighted_text = re.sub(
            r'\b(Step \d+|Part \d+|Section \d+|Chapter \d+)\b',
            r'**\1**',
            highlighted_text,
            flags=re.IGNORECASE
        )
        
        return highlighted_text
    
    def create_system_prompt(self) -> str:
        """Create system prompt for StudyPal Chat"""
        return """You are StudyPal, an intelligent AI learning assistant. Your goal is to provide helpful, clear, and well-structured responses to student questions.

*Response Guidelines:*
- Provide clear, concise, and accurate answers
- Use simple language that students can understand
- Always structure responses with proper formatting and organization
- Break down complex information into digestible sections
- Include practical examples when helpful
- Be encouraging and supportive

*Formatting Requirements (VERY IMPORTANT):*
- Start with a brief overview or main answer
- Use ## for main topic headings
- Use ### for subtopics
- Use bullet points (*) for lists and key points
- Use numbered lists (1., 2., 3.) for step-by-step processes
- Use **bold** for important terms and concepts
- Add blank lines between sections for readability
- Keep paragraphs short (1-2 sentences max)

*Structure Every Response Like This:*
1. Brief direct answer to the question
2. Main explanation broken into clear sections
3. Key points or important notes
4. Examples (if applicable)
5. Summary or next steps (if relevant)

*Example Response Structure:*
```
## Main Topic

Brief answer to your question...

### Key Points
* First important point
* Second important point
* Third important point

### Explanation
Detailed explanation broken into short paragraphs.

Each paragraph should be concise and focused.

### Example
Practical example here...

### Remember
* Important takeaway 1
* Important takeaway 2
```

*Teaching Approach:*
- Break down complex concepts into simple, organized parts
- Provide practical examples in structured format
- Encourage further learning with clear next steps
- Be patient and thorough but well-organized

Always format your responses with clear structure, headings, and bullet points to make learning easy and enjoyable!"""
    
    async def generate_streaming_response(self, message: str, session_id: str = None):
        """Generate streaming response with word highlighting"""
        try:
            logger.info(f"Processing streaming query: {message[:50]}...")
            
            # Create the prompt
            system_prompt = self.create_system_prompt()
            full_prompt = f"{system_prompt}\n\nStudent Question: {message}\n\nPlease provide a helpful response:"
            
            # Yield initial status
            yield {
                "type": "response_start",
                "message": "Generating response...",
                "session_id": session_id or "default"
            }
            
            # Generate streaming response using Gemini
            response = self.model.generate_content(
                full_prompt,
                stream=True
            )
            
            full_response = ""
            sentence_buffer = ""
            
            for chunk in response:
                if chunk.text:
                    # Process each character
                    for char in chunk.text:
                        sentence_buffer += char
                        
                        # Check if we have a complete sentence or significant chunk
                        if char in ['.', '!', '?', ':', '\n'] or len(sentence_buffer) >= 80:
                            if sentence_buffer.strip():
                                # Apply highlighting to the sentence buffer
                                highlighted_sentence = self.highlight_important_words(sentence_buffer)
                                full_response += highlighted_sentence
                                
                                # Yield the highlighted sentence
                                yield {
                                    "type": "content",
                                    "content": highlighted_sentence,
                                    "highlighted": highlighted_sentence != sentence_buffer
                                }
                                
                                # Add natural typing delay based on content
                                if char in ['.', '!', '?']:
                                    await asyncio.sleep(0.15)  # Longer pause after sentences
                                elif char == '\n':
                                    await asyncio.sleep(0.08)  # Pause for line breaks
                                elif char == ':':
                                    await asyncio.sleep(0.06)  # Pause after colons
                                else:
                                    await asyncio.sleep(0.04)  # Normal pause
                            
                            sentence_buffer = ""
                        else:
                            # For characters that are part of sentences, continue accumulating
                            continue
            
            # Process any remaining content in buffer
            if sentence_buffer.strip():
                highlighted_sentence = self.highlight_important_words(sentence_buffer)
                full_response += highlighted_sentence
                yield {
                    "type": "content",
                    "content": highlighted_sentence,
                    "highlighted": highlighted_sentence != sentence_buffer
                }
            
            # Final processing - apply additional formatting
            full_response = self.apply_final_formatting(full_response)
            
            # Send completion signal
            yield {
                "type": "complete",
                "message": "Response completed",
                "full_response": full_response,
                "word_count": len(full_response.split()),
                "session_id": session_id or "default"
            }
            
            logger.info("Streaming response completed successfully")
            
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}")
            yield {
                "type": "error",
                "error": str(e),
                "message": "An error occurred while generating the response"
            }
    
    def apply_final_formatting(self, text: str) -> str:
        """Apply final formatting improvements to the response"""
        
        # Enhance section headers with better formatting
        text = re.sub(r'^(#{1,3})\s*(.+)$', r'\1 **\2**', text, flags=re.MULTILINE)
        
        # Enhance bullet points with better formatting
        text = re.sub(r'^(\*|\-)\s*(.+)$', r'• **\2**', text, flags=re.MULTILINE)
        
        # Enhance numbered lists
        text = re.sub(r'^(\d+\.)\s*(.+)$', r'**\1** \2', text, flags=re.MULTILINE)
        
        # Highlight important phrases at the start of sentences
        text = re.sub(
            r'\b(Key point|Important|Note|Remember|Tip|Warning|Example|Summary|Conclusion):\s*',
            r'**\1:** ',
            text,
            flags=re.IGNORECASE
        )
        
        # Add spacing after headings
        text = re.sub(r'^(#{1,3}\s+.+)$', r'\1\n', text, flags=re.MULTILINE)
        
        # Ensure proper spacing between sections
        text = re.sub(r'\n(#{1,3}\s)', r'\n\n\1', text)
        
        # Clean up multiple newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
    
    def generate_response(self, message: str, session_id: str = None) -> str:
        """Generate non-streaming response with highlighting (fallback)"""
        try:
            logger.info(f"Processing non-streaming query: {message[:50]}...")
            
            # Create the prompt
            system_prompt = self.create_system_prompt()
            full_prompt = f"{system_prompt}\n\nStudent Question: {message}\n\nPlease provide a helpful response:"
            
            # Generate response using Gemini
            response = self.model.generate_content(full_prompt)
            
            # Apply highlighting
            highlighted_response = self.highlight_important_words(response.text)
            final_response = self.apply_final_formatting(highlighted_response)
            
            logger.info("Non-streaming response generated successfully")
            return final_response
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return f"I encountered an error while processing your request: {str(e)}"

# Initialize the chat system
studypal_chat = StudyPalChat()

# ----------------------------
# FastAPI Endpoints
# ----------------------------

@app.get("/")
async def root():
    return {
        "message": "StudyPal Chat API with Streaming and Word Highlighting",
        "version": "1.0.0",
        "features": ["streaming_responses", "word_highlighting", "educational_assistance"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "StudyPal Chat API",
        "model": "gemini-1.5-flash",
        "features": {
            "streaming": True,
            "word_highlighting": True,
            "real_time_processing": True
        }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    """Standard chat endpoint (non-streaming)"""
    try:
        if not chat_message.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        logger.info(f"Processing chat message: {chat_message.message[:50]}...")
        
        # Generate response
        response = studypal_chat.generate_response(
            chat_message.message,
            chat_message.session_id
        )
        
        return ChatResponse(
            response=response,
            status="success",
            session_id=chat_message.session_id or "default"
        )
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.post("/chat/stream")
async def chat_stream(chat_message: ChatMessage):
    """Streaming chat endpoint with word highlighting"""
    try:
        if not chat_message.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        logger.info(f"Processing streaming chat: {chat_message.message[:50]}...")
        
        async def generate_stream():
            try:
                # Send initial session info
                session_data = {
                    "type": "session",
                    "session_id": chat_message.session_id or "default",
                    "timestamp": datetime.now().isoformat(),
                    "done": False
                }
                yield f"data: {json.dumps(session_data)}\n\n"
                
                # Stream the response with highlighting
                async for chunk in studypal_chat.generate_streaming_response(
                    chat_message.message,
                    chat_message.session_id
                ):
                    # Add metadata to chunks
                    chunk_data = {
                        **chunk,
                        "done": chunk.get("type") == "complete",
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    yield f"data: {json.dumps(chunk_data)}\n\n"
                    
                    # Add natural delays for better UX
                    if chunk.get("type") == "content":
                        # Variable delay based on content
                        content = chunk.get("content", "")
                        if content.endswith('.') or content.endswith('!') or content.endswith('?'):
                            await asyncio.sleep(0.08)  # Longer pause after sentences
                        elif content.endswith(' '):
                            await asyncio.sleep(0.04)  # Pause after words
                        else:
                            await asyncio.sleep(0.02)  # Normal typing speed
                
                # Send final completion signal
                final_data = {
                    "type": "stream_complete",
                    "message": "Stream finished successfully",
                    "done": True,
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(final_data)}\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming: {str(e)}")
                error_data = {
                    "type": "error",
                    "error": str(e),
                    "message": "An error occurred during streaming",
                    "done": True,
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    except Exception as e:
        logger.error(f"Error in streaming chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating streaming response: {str(e)}")

@app.get("/test")
async def test_chat():
    """Test endpoint to verify chat functionality"""
    try:
        test_response = studypal_chat.generate_response(
            "Hello! Please introduce yourself as StudyPal and explain what you can help with."
        )
        
        return {
            "status": "success",
            "message": "StudyPal Chat is working correctly",
            "model": "gemini-1.5-flash",
            "features": ["streaming", "word_highlighting", "educational_assistance"],
            "test_response": test_response[:300] + "..." if len(test_response) > 300 else test_response
        }
    except Exception as e:
        logger.error(f"Chat test failed: {str(e)}")
        return {
            "status": "error",
            "message": f"StudyPal Chat test failed: {str(e)}"
        }

@app.get("/features")
async def get_features():
    """Get information about chat features"""
    return {
        "streaming": {
            "enabled": True,
            "description": "Real-time response streaming with natural typing effects",
            "endpoint": "/chat/stream"
        },
        "word_highlighting": {
            "enabled": True,
            "description": "Automatic highlighting of important terms and concepts",
            "patterns": [
                "Academic terms (definition, theorem, concept, etc.)",
                "Programming terms (function, variable, algorithm, etc.)",
                "Math terms (derivative, integral, matrix, etc.)",
                "Science terms (molecule, atom, DNA, etc.)",
                "Important connectors (important, key, crucial, etc.)",
                "Study terms (learn, practice, analyze, etc.)"
            ]
        },
        "formatting": {
            "enabled": True,
            "description": "Enhanced text formatting for better readability",
            "features": [
                "Bold important terms",
                "Structured bullet points",
                "Numbered step-by-step processes",
                "Code block highlighting",
                "Section headers"
            ]
        },
        "educational_assistance": {
            "enabled": True,
            "description": "Specialized in helping students learn",
            "capabilities": [
                "Clear explanations",
                "Step-by-step breakdowns",
                "Practical examples",
                "Encouraging feedback",
                "Multi-subject support"
            ]
        }
    }

if __name__ == "__main__":
    print("🚀 Starting StudyPal Chat Server...")
    print("📡 Server will be available at: http://localhost:8012")
    print("🔧 Health Check: http://localhost:8012/health")
    print("📚 API Docs: http://localhost:8012/docs")
    print("✨ Features: http://localhost:8012/features")
    print("\n🌟 Key Features:")
    print("   • 🔄 Real-time response streaming")
    print("   • 🎯 Intelligent word highlighting")
    print("   • 📖 Educational assistance")
    print("   • ⚡ Natural typing effects")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    uvicorn.run("chat:app", host="0.0.0.0", port=8012, reload=True)