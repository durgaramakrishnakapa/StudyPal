# import json
# import os
# import pickle
# import re
# import io
# import time
# import webbrowser
# import asyncio
# import base64
# from concurrent.futures import ThreadPoolExecutor, as_completed
# import google.generativeai as genai
# from google.auth.transport.requests import Request
# from google_auth_oauthlib.flow import InstalledAppFlow
# from googleapiclient.discovery import build
# from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
# from gradio_client import Client
# from PIL import Image
# from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional, Dict, List
# import uuid
# import logging
# from dataclasses import dataclass
# from enum import Enum

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # --- CONFIGURATION ---
# CREDENTIALS_FILE = 'credentials.json'
# TOKEN_FILE = 'token.pickle'
# SCOPES = ['https://www.googleapis.com/auth/presentations',
#           'https://www.googleapis.com/auth/drive.file']
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# HF_TOKENS = os.getenv("HF_TOKENS")
# import random

# app = FastAPI(title="Advanced PPT Maker API with Multi-Agent AI", description="Professional presentation generator with specialized AI agents")

# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # WebSocket connection manager
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: Dict[str, WebSocket] = {}
    
#     async def connect(self, websocket: WebSocket, session_id: str):
#         await websocket.accept()
#         self.active_connections[session_id] = websocket
#         print(f"🔌 WebSocket connected: {session_id}")
    
#     def disconnect(self, session_id: str):
#         if session_id in self.active_connections:
#             del self.active_connections[session_id]
#             print(f"🔌 WebSocket disconnected: {session_id}")
    
#     async def send_message(self, session_id: str, message: dict):
#         if session_id in self.active_connections:
#             try:
#                 await self.active_connections[session_id].send_text(json.dumps(message))
#             except Exception as e:
#                 print(f"❌ Error sending WebSocket message: {e}")
#                 self.disconnect(session_id)

# manager = ConnectionManager()

# # --- MULTI-AGENT AI SYSTEM ---
# class AgentRole(Enum):
#     CONTENT_STRATEGIST = "content_strategist"
#     DESIGN_SPECIALIST = "design_specialist"
#     VISUAL_CURATOR = "visual_curator"

# @dataclass
# class AgentResponse:
#     agent_role: AgentRole
#     content: Dict
#     confidence_score: float
#     processing_time: float

# def parse_json_response(response_text: str) -> Dict:
#     """Robust JSON parsing with error handling"""
#     try:
#         cleaned_text = response_text.strip().replace('```json', '').replace('```', '')
#         return json.loads(cleaned_text)
#     except json.JSONDecodeError as e:
#         logger.warning(f"JSON parsing error, attempting to fix: {e}")
#         try:
#             json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
#             if json_match:
#                 return json.loads(json_match.group())
#         except:
#             pass
#         # Return fallback structure
#         return {"error": "JSON parsing failed", "fallback": True}

# class ContentStrategistAgent:
#     def __init__(self, api_key: str):
#         self.api_key = api_key
#         genai.configure(api_key=api_key)
#         self.model = genai.GenerativeModel('gemini-1.5-flash')
#         self.generation_config = genai.types.GenerationConfig(
#             temperature=0.8, top_p=0.9, max_output_tokens=3000
#         )
    
#     async def process(self, topic: str, slide_count: int, tone: str, audience: str = "business professionals") -> AgentResponse:
#         start_time = time.time()
        
#         # Determine context and approach based on tone
#         tone_contexts = {
#             "professional": "business and professional context with data-driven insights",
#             "creative": "innovative and artistic perspective with visual storytelling",
#             "academic": "scholarly and research-based approach with citations and analysis",
#             "friendly": "conversational and accessible style with relatable examples",
#             "casual": "informal and easy-to-understand approach with practical tips"
#         }
        
#         context = tone_contexts.get(tone, "professional and informative")
        
#         prompt = f"""Create a comprehensive content strategy specifically about "{topic}".

# CRITICAL REQUIREMENTS:
# - Topic: "{topic}" - BE VERY SPECIFIC to this exact topic, not generic business content
# - {slide_count} total slides (1 title + {slide_count-1} content slides)
# - Tone: {tone} ({context})
# - Make content HIGHLY RELEVANT to "{topic}" specifically
# - Avoid generic business language unless topic is business-related
# - Focus on the actual subject matter of "{topic}"

# Return ONLY valid JSON:
# {{
#     "presentation_strategy": {{
#         "core_message": "Main message about {topic} that audience should remember",
#         "narrative_arc": "How the {topic} story unfolds across slides"
#     }},
#     "content_outline": {{
#         "title": "Compelling title specifically about {topic}",
#         "subtitle": "Engaging subtitle related to {topic}",
#         "slides": [
#             {{
#                 "slide_number": 1,
#                 "title": "Introduction to {topic}",
#                 "key_message": "Why {topic} matters",
#                 "talking_points": [
#                     "What exactly is {topic}",
#                     "Why {topic} is important/relevant",
#                     "Key aspects of {topic} we'll explore",
#                     "What you'll learn about {topic}"
#                 ],
#                 "content_type": "introduction"
#             }}
#         ]
#     }}
# }}"""

#         try:
#             response = await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
#             )
            
#             content = parse_json_response(response.text)
#             processing_time = time.time() - start_time
            
#             if content.get("fallback"):
#                 content = self._create_fallback_content(topic, slide_count, tone)
            
#             confidence_score = 0.9 if not content.get("fallback") else 0.7
            
#             return AgentResponse(
#                 agent_role=AgentRole.CONTENT_STRATEGIST,
#                 content=content,
#                 confidence_score=confidence_score,
#                 processing_time=processing_time
#             )
            
#         except Exception as e:
#             logger.error(f"Content Strategist error: {e}")
#             return AgentResponse(
#                 agent_role=AgentRole.CONTENT_STRATEGIST,
#                 content=self._create_fallback_content(topic, slide_count, tone),
#                 confidence_score=0.6,
#                 processing_time=time.time() - start_time
#             )
    
#     def _create_fallback_content(self, topic: str, slide_count: int, tone: str) -> Dict:
#         return {
#             "presentation_strategy": {
#                 "core_message": f"Understanding and implementing {topic} effectively",
#                 "narrative_arc": "Introduction → Analysis → Solutions → Implementation → Conclusion"
#             },
#             "content_outline": {
#                 "title": f"Mastering {topic}: A Strategic Approach",
#                 "subtitle": "Practical insights for immediate implementation",
#                 "slides": [
#                     {
#                         "slide_number": i+1,
#                         "title": f"{topic} - Key Aspect {i+1}",
#                         "key_message": f"Important insight about {topic}",
#                         "talking_points": [
#                             f"Key point about {topic}",
#                             f"Important consideration for implementation",
#                             f"Best practice recommendation",
#                             f"Future implications and trends"
#                         ],
#                         "content_type": "analysis"
#                     } for i in range(slide_count-1)
#                 ]
#             }
#         }

# class DesignSpecialistAgent:
#     def __init__(self, api_key: str):
#         self.api_key = api_key
#         genai.configure(api_key=api_key)
#         self.model = genai.GenerativeModel('gemini-1.5-flash')
#         self.generation_config = genai.types.GenerationConfig(
#             temperature=0.7, top_p=0.8, max_output_tokens=2000
#         )
    
#     async def process(self, content_outline: Dict, theme: str) -> AgentResponse:
#         start_time = time.time()
        
#         prompt = f"""Create design specifications for presentation slides.

# Content: {json.dumps(content_outline, indent=2)}
# Theme: {theme}

# Return ONLY valid JSON:
# {{
#     "design_system": {{
#         "color_palette": {{
#             "primary": {{"r": 0, "g": 0, "b": 0}},
#             "secondary": {{"r": 0, "g": 0, "b": 0}},
#             "accent": {{"r": 0, "g": 0, "b": 0}},
#             "text": {{"r": 255, "g": 255, "b": 255}}
#         }},
#         "typography": {{
#             "heading_font": "Inter",
#             "body_font": "Inter",
#             "font_sizes": {{"h1": 36, "h2": 28, "body": 18}}
#         }}
#     }},
#     "slide_layouts": [
#         {{
#             "slide_number": 1,
#             "layout_type": "content_left",
#             "visual_hierarchy": "Title → Content → Image"
#         }}
#     ]
# }}"""

#         try:
#             response = await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
#             )
            
#             content = parse_json_response(response.text)
#             processing_time = time.time() - start_time
            
#             if content.get("fallback"):
#                 content = self._create_fallback_design(theme)
            
#             confidence_score = 0.9 if not content.get("fallback") else 0.7
            
#             return AgentResponse(
#                 agent_role=AgentRole.DESIGN_SPECIALIST,
#                 content=content,
#                 confidence_score=confidence_score,
#                 processing_time=processing_time
#             )
            
#         except Exception as e:
#             logger.error(f"Design Specialist error: {e}")
#             return AgentResponse(
#                 agent_role=AgentRole.DESIGN_SPECIALIST,
#                 content=self._create_fallback_design(theme),
#                 confidence_score=0.6,
#                 processing_time=time.time() - start_time
#             )
    
#     def _create_fallback_design(self, theme: str) -> Dict:
#         theme_colors = {
#             'modern': {'primary': {'r': 38, 'g': 64, 'b': 217}, 'secondary': {'r': 20, 'g': 31, 'b': 64}},
#             'corporate': {'primary': {'r': 20, 'g': 46, 'b': 107}, 'secondary': {'r': 10, 'g': 20, 'b': 46}},
#             'creative': {'primary': {'r': 217, 'g': 38, 'b': 89}, 'secondary': {'r': 242, 'g': 89, 'b': 20}},
#             'minimal': {'primary': {'r': 250, 'g': 250, 'b': 250}, 'secondary': {'r': 235, 'g': 235, 'b': 235}},
#             'dark': {'primary': {'r': 20, 'g': 20, 'b': 20}, 'secondary': {'r': 46, 'g': 46, 'b': 46}}
#         }
        
#         colors = theme_colors.get(theme, theme_colors['modern'])
        
#         return {
#             "design_system": {
#                 "color_palette": {
#                     "primary": colors['primary'],
#                     "secondary": colors['secondary'],
#                     "accent": {'r': 89, 'g': 217, 'b': 89},
#                     "text": {'r': 255, 'g': 255, 'b': 255}
#                 },
#                 "typography": {
#                     "heading_font": "Inter",
#                     "body_font": "Inter",
#                     "font_sizes": {"h1": 36, "h2": 28, "body": 18}
#                 }
#             },
#             "slide_layouts": [
#                 {
#                     "slide_number": 1,
#                     "layout_type": "content_left",
#                     "visual_hierarchy": "Title → Content → Image"
#                 }
#             ]
#         }

# class VisualCuratorAgent:
#     def __init__(self, api_key: str):
#         self.api_key = api_key
#         genai.configure(api_key=api_key)
#         self.model = genai.GenerativeModel('gemini-1.5-flash')
#         self.generation_config = genai.types.GenerationConfig(
#             temperature=0.9, top_p=0.95, max_output_tokens=1500
#         )
    
#     async def process(self, slides: List[Dict], theme: str) -> AgentResponse:
#         start_time = time.time()
        
#         prompt = f"""Create visual concepts for presentation slides.

# Slides: {len(slides)} slides
# Theme: {theme}

# Return ONLY valid JSON:
# {{
#     "visual_strategy": {{
#         "overall_aesthetic": "Professional {theme} aesthetic",
#         "consistency_elements": ["Color harmony", "Style consistency"]
#     }},
#     "slide_visuals": [
#         {{
#             "slide_number": 1,
#             "primary_image": {{
#                 "prompt": "Professional image prompt for slide content",
#                 "style": "photography",
#                 "mood": "professional"
#             }}
#         }}
#     ]
# }}"""

#         try:
#             response = await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
#             )
            
#             content = parse_json_response(response.text)
#             processing_time = time.time() - start_time
            
#             if content.get("fallback"):
#                 content = self._create_fallback_visuals(slides, theme)
            
#             confidence_score = 0.9 if not content.get("fallback") else 0.7
            
#             return AgentResponse(
#                 agent_role=AgentRole.VISUAL_CURATOR,
#                 content=content,
#                 confidence_score=confidence_score,
#                 processing_time=processing_time
#             )
            
#         except Exception as e:
#             logger.error(f"Visual Curator error: {e}")
#             return AgentResponse(
#                 agent_role=AgentRole.VISUAL_CURATOR,
#                 content=self._create_fallback_visuals(slides, theme),
#                 confidence_score=0.6,
#                 processing_time=time.time() - start_time
#             )
    
#     def _create_fallback_visuals(self, slides: List[Dict], theme: str) -> Dict:
#         return {
#             "visual_strategy": {
#                 "overall_aesthetic": f"Professional {theme} aesthetic with high-quality visuals",
#                 "consistency_elements": ["Color harmony", "Style consistency", "Professional quality"]
#             },
#             "slide_visuals": [
#                 {
#                     "slide_number": i+1,
#                     "primary_image": {
#                         "prompt": f"Professional {theme} style image representing slide content about {slide.get('title', 'business topic')}",
#                         "style": "photography",
#                         "mood": "professional"
#                     }
#                 } for i, slide in enumerate(slides)
#             ]
#         }

# class MultiAgentOrchestrator:
#     def __init__(self, api_key: str):
#         self.content_agent = ContentStrategistAgent(api_key)
#         self.design_agent = DesignSpecialistAgent(api_key)
#         self.visual_agent = VisualCuratorAgent(api_key)
    
#     async def create_enhanced_presentation(self, topic: str, slide_count: int, tone: str, theme: str, session_id: str = None) -> Dict:
#         logger.info(f"🚀 Starting multi-agent presentation creation for: {topic}")
        
#         try:
#             # Stage 1: Content Strategy
#             if session_id:
#                 await send_stream_update(session_id, "agent_status", {
#                     "agent": "Content Strategist", "status": "processing", "message": "Creating content strategy..."
#                 })
            
#             content_response = await self.content_agent.process(topic, slide_count, tone)
#             logger.info(f"✅ Content strategy completed (confidence: {content_response.confidence_score:.2f})")
            
#             # Stage 2: Design Specifications
#             if session_id:
#                 await send_stream_update(session_id, "agent_status", {
#                     "agent": "Design Specialist", "status": "processing", "message": "Creating design specifications..."
#                 })
            
#             design_response = await self.design_agent.process(
#                 content_response.content.get('content_outline', {}), theme
#             )
#             logger.info(f"✅ Design specifications completed (confidence: {design_response.confidence_score:.2f})")
            
#             # Stage 3: Visual Curation
#             if session_id:
#                 await send_stream_update(session_id, "agent_status", {
#                     "agent": "Visual Curator", "status": "processing", "message": "Curating visual elements..."
#                 })
            
#             visual_response = await self.visual_agent.process(
#                 content_response.content.get('content_outline', {}).get('slides', []), theme
#             )
#             logger.info(f"✅ Visual curation completed (confidence: {visual_response.confidence_score:.2f})")
            
#             # Integration
#             integrated_presentation = self._integrate_outputs(content_response, design_response, visual_response)
            
#             logger.info("🎉 Multi-agent presentation creation completed successfully!")
            
#             return {
#                 'success': True,
#                 'presentation': integrated_presentation,
#                 'agent_reports': {
#                     'content_strategist': content_response,
#                     'design_specialist': design_response,
#                     'visual_curator': visual_response
#                 },
#                 'overall_confidence': (content_response.confidence_score + design_response.confidence_score + visual_response.confidence_score) / 3
#             }
            
#         except Exception as e:
#             logger.error(f"❌ Multi-agent orchestration failed: {e}")
#             return {'success': False, 'error': str(e)}
    
#     def _integrate_outputs(self, content_resp, design_resp, visual_resp) -> Dict:
#         content_outline = content_resp.content.get('content_outline', {})
#         slide_visuals = visual_resp.content.get('slide_visuals', [])
        
#         integrated_slides = []
#         base_slides = content_outline.get('slides', [])
        
#         for i, base_slide in enumerate(base_slides):
#             visual_data = next((v for v in slide_visuals if v.get('slide_number') == i+1), {})
            
#             integrated_slide = {
#                 'slide_number': i + 1,
#                 'title': base_slide.get('title', ''),
#                 'points': base_slide.get('talking_points', []),
#                 'image_prompt': visual_data.get('primary_image', {}).get('prompt', ''),
#                 'layout_suggestion': 'content_left',
#                 'key_insight': base_slide.get('key_message', '')
#             }
            
#             integrated_slides.append(integrated_slide)
        
#         # Convert design system to expected theme format
#         design_system = design_resp.content.get('design_system', {})
#         color_palette = design_system.get('color_palette', {})
        
#         # Convert from {r, g, b} format to {red, green, blue} format with proper scaling
#         def convert_color(color_dict):
#             if 'r' in color_dict:
#                 return {
#                     'red': color_dict['r'] / 255.0 if color_dict['r'] > 1 else color_dict['r'],
#                     'green': color_dict['g'] / 255.0 if color_dict['g'] > 1 else color_dict['g'],
#                     'blue': color_dict['b'] / 255.0 if color_dict['b'] > 1 else color_dict['b']
#                 }
#             return color_dict
        
#         # Calculate luminance to ensure proper contrast
#         def get_luminance(color):
#             r, g, b = color['red'], color['green'], color['blue']
#             return 0.299 * r + 0.587 * g + 0.114 * b
        
#         # Get background color
#         bg_color = convert_color(color_palette.get('primary', {'r': 20, 'g': 20, 'b': 20}))
#         bg_luminance = get_luminance(bg_color)
        
#         # Choose text color based on background luminance for maximum contrast
#         if bg_luminance > 0.5:  # Light background
#             text_color = {'red': 0.1, 'green': 0.1, 'blue': 0.1}  # Dark text
#         else:  # Dark background
#             text_color = {'red': 1.0, 'green': 1.0, 'blue': 1.0}  # White text
        
#         theme = {
#             'backgroundColor': bg_color,
#             'textColor': text_color,
#             'accentColor': convert_color(color_palette.get('accent', {'r': 89, 'g': 217, 'b': 89}))
#         }
        
#         return {
#             'title': content_outline.get('title', ''),
#             'subtitle': content_outline.get('subtitle', ''),
#             'theme': theme,
#             'slides': integrated_slides,
#             'agent_enhanced': True
#         }

# # Initialize multi-agent orchestrator
# orchestrator = MultiAgentOrchestrator(GEMINI_API_KEY)

# # --- REQUEST/RESPONSE MODELS ---
# class PresentationRequest(BaseModel):
#     topic: str
#     slideCount: int = 6
#     tone: str = "professional"
#     theme: str = "modern"
#     use_agents: bool = True  # Enable multi-agent system by default

# class PresentationResponse(BaseModel):
#     success: bool
#     presentation_id: Optional[str] = None
#     presentation_url: Optional[str] = None
#     presentation_embed_url: Optional[str] = None
#     presentation_preview_url: Optional[str] = None
#     title: Optional[str] = None
#     message: Optional[str] = None
#     error: Optional[str] = None
#     agent_enhanced: Optional[bool] = False
#     agent_confidence: Optional[float] = None

# # --- HELPER FUNCTIONS ---
# async def send_stream_update(session_id: str, update_type: str, data: dict):
#     """Send real-time updates via WebSocket"""
#     message = {
#         "type": update_type,
#         "timestamp": time.time(),
#         "data": data
#     }
#     await manager.send_message(session_id, message)

# async def send_progress_update(session_id: str, progress: int, step: str, message: str):
#     """Send progress updates"""
#     await send_stream_update(session_id, "progress", {
#         "progress": progress,
#         "step": step,
#         "message": message
#     })

# async def send_slide_preview(session_id: str, slide_number: int, slide_data: dict, image_thumbnail: str = None):
#     """Send slide preview with thumbnail"""
#     await send_stream_update(session_id, "slide_preview", {
#         "slide_number": slide_number,
#         "title": slide_data.get("title", ""),
#         "points": slide_data.get("points", []),
#         "image_thumbnail": image_thumbnail,
#         "status": "completed"
#     })

# async def send_image_status(session_id: str, slide_number: int, status: str, thumbnail: str = None):
#     """Send image generation status"""
#     await send_stream_update(session_id, "image_status", {
#         "slide_number": slide_number,
#         "status": status,  # generating, completed, failed
#         "thumbnail": thumbnail
#     })

# def create_image_thumbnail(image_path: str) -> str:
#     """Create base64 thumbnail for real-time preview"""
#     try:
#         with Image.open(image_path) as img:
#             # Create thumbnail
#             img.thumbnail((200, 150), Image.Resampling.LANCZOS)
            
#             # Convert to base64
#             buffer = io.BytesIO()
#             img.save(buffer, format='PNG')
#             img_str = base64.b64encode(buffer.getvalue()).decode()
#             return f"data:image/png;base64,{img_str}"
#     except Exception as e:
#         print(f"❌ Error creating thumbnail: {e}")
#         return None

# def retry_operation(func, retries=3, delay=5, *args, **kwargs):
#     """A wrapper to automatically retry a function if it fails."""
#     for i in range(retries):
#         try:
#             result = func(*args, **kwargs)
#             if result:
#                 return result
#             print(f"   - Operation returned None. Retrying in {delay}s... ({i+1}/{retries})")
#         except Exception as e:
#             print(f"   - Operation failed with error: {e}. Retrying in {delay}s... ({i+1}/{retries})")
#         time.sleep(delay)
#     print(f"❌ Operation failed after {retries} retries.")
#     return None

# def get_advanced_theme_colors(theme_name: str):
#     """Get advanced color schemes based on theme selection - Gamma-level quality"""
#     themes = {
#         'modern': {
#             'primary': {'red': 0.15, 'green': 0.25, 'blue': 0.85},
#             'secondary': {'red': 0.08, 'green': 0.12, 'blue': 0.25},
#             'accent': {'red': 0.25, 'green': 0.75, 'blue': 1.0},
#             'text': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
#             'description': 'sleek modern gradient with deep blues and electric accents',
#             'style': 'minimalist, high-tech, contemporary, clean lines'
#         },
#         'corporate': {
#             'primary': {'red': 0.08, 'green': 0.18, 'blue': 0.42},
#             'secondary': {'red': 0.04, 'green': 0.08, 'blue': 0.18},
#             'accent': {'red': 0.85, 'green': 0.65, 'blue': 0.15},
#             'text': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
#             'description': 'professional navy blue with gold accents',
#             'style': 'business-like, polished, executive, formal'
#         },
#         'creative': {
#             'primary': {'red': 0.85, 'green': 0.15, 'blue': 0.35},
#             'secondary': {'red': 0.95, 'green': 0.35, 'blue': 0.08},
#             'accent': {'red': 1.0, 'green': 0.85, 'blue': 0.15},
#             'text': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
#             'description': 'vibrant coral and orange with bright yellow highlights',
#             'style': 'artistic, vibrant, dynamic, innovative, expressive'
#         },
#         'minimal': {
#             'primary': {'red': 0.98, 'green': 0.98, 'blue': 0.98},
#             'secondary': {'red': 0.92, 'green': 0.92, 'blue': 0.92},
#             'accent': {'red': 0.15, 'green': 0.15, 'blue': 0.15},
#             'text': {'red': 0.08, 'green': 0.08, 'blue': 0.08},
#             'description': 'clean white and light gray with dark text',
#             'style': 'clean, simple, uncluttered, elegant, refined'
#         },
#         'dark': {
#             'primary': {'red': 0.08, 'green': 0.08, 'blue': 0.08},
#             'secondary': {'red': 0.18, 'green': 0.18, 'blue': 0.18},
#             'accent': {'red': 0.35, 'green': 0.85, 'blue': 0.35},
#             'text': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
#             'description': 'dark charcoal with bright green accents',
#             'style': 'sophisticated, dramatic, high-contrast, premium'
#         },
#         'academic': {
#             'primary': {'red': 0.18, 'green': 0.28, 'blue': 0.52},
#             'secondary': {'red': 0.08, 'green': 0.18, 'blue': 0.28},
#             'accent': {'red': 0.75, 'green': 0.52, 'blue': 0.28},
#             'text': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
#             'description': 'scholarly blue with warm brown accents',
#             'style': 'scholarly, research-focused, educational, authoritative'
#         }
#     }
#     return themes.get(theme_name, themes['modern'])

# async def generate_gamma_level_content(topic: str, num_slides: int = 5, tone: str = "professional", theme: str = "modern", session_id: str = None):
#     """Enhanced multi-agent content generation with specialized AI agents"""
#     print(f"\n🤖 MULTI-AGENT: Starting enhanced content generation for '{topic}'...")
    
#     # Use multi-agent system for superior content generation
#     try:
#         if session_id:
#             await send_progress_update(session_id, 10, "multi_agent_init", "Initializing AI agents...")
        
#         agent_result = await orchestrator.create_enhanced_presentation(
#             topic=topic,
#             slide_count=num_slides,
#             tone=tone,
#             theme=theme,
#             session_id=session_id
#         )
        
#         if agent_result.get('success'):
#             presentation_data = agent_result['presentation']
            
#             # Convert to expected format for existing pipeline
#             final_content = {
#                 "title": presentation_data.get('title', f'Professional Presentation: {topic}'),
#                 "subtitle": presentation_data.get('subtitle', f'A comprehensive overview with {tone} approach'),
#                 "theme": presentation_data.get('theme', get_advanced_theme_colors(theme)),
#                 "slides": presentation_data.get('slides', [])
#             }
            
#             print(f"✅ MULTI-AGENT: Enhanced content generation completed")
#             print(f"📊 Generated: {len(final_content['slides'])} professional slides with AI agents")
#             print(f"🎯 Overall confidence: {agent_result.get('overall_confidence', 0.85):.2f}")
            
#             return final_content
#         else:
#             print(f"⚠️ MULTI-AGENT: Falling back to basic generation due to: {agent_result.get('error', 'Unknown error')}")
#             return await generate_fallback_content(topic, num_slides, tone, theme)
            
#     except Exception as e:
#         print(f"❌ MULTI-AGENT: Error in enhanced generation: {e}")
#         print(f"🔄 Falling back to basic content generation...")
#         return await generate_fallback_content(topic, num_slides, tone, theme)

# async def generate_fallback_content(topic: str, num_slides: int, tone: str, theme: str):
#     """Fallback content generation when multi-agent system fails"""
#     print(f"\n🔄 FALLBACK: Basic content generation for '{topic}'...")
    
#     # Get advanced theme colors
#     theme_colors = get_advanced_theme_colors(theme)
    
#     try:
#         if session_id:
#             await send_progress_update(session_id, 20, "fallback_generation", "Generating basic content...")
        
#         # Create basic but professional content structure
#         slides = []
#         slide_topics = [
#             f"Introduction to {topic}",
#             f"Key Benefits of {topic}",
#             f"Implementation Strategy for {topic}",
#             f"Best Practices in {topic}",
#             f"Future of {topic}"
#         ]
        
#         for i in range(min(num_slides - 1, len(slide_topics))):
#             slide = {
#                 "slide_number": i + 1,
#                 "title": slide_topics[i],
#                 "points": [
#                     f"Key aspect {i+1} of {topic}",
#                     f"Important consideration for {topic}",
#                     f"Best practice in {topic}",
#                     f"Strategic advantage of {topic}",
#                     f"Future implications of {topic}"
#                 ],
#                 "image_prompt": f"Professional illustration representing {topic}, {theme_colors['style']}, {theme_colors['description']}",
#                 "layout_suggestion": "content_left",
#                 "key_insight": f"Understanding {topic} is crucial for success"
#             }
#             slides.append(slide)
        
#         fallback_content = {
#             "title": f"Professional Presentation: {topic}",
#             "subtitle": f"A comprehensive overview with {tone} approach",
#             "theme": theme_colors,
#             "slides": slides
#         }
        
#         print(f"✅ FALLBACK: Generated {len(slides)} basic slides")
#         return fallback_content
        
#     except Exception as e:
#         print(f"❌ Error in fallback content generation: {e}")
#         # Ultimate fallback - simple structure
#         return {
#             "title": f"Presentation: {topic}",
#             "subtitle": f"Overview and insights",
#             "theme": get_advanced_theme_colors(theme),
#             "slides": [
#                 {
#                     "title": f"Overview of {topic}",
#                     "points": [
#                         f"Key concepts in {topic}",
#                         f"Important aspects to consider",
#                         f"Best practices and recommendations",
#                         f"Future outlook and trends"
#                     ],
#                     "image_prompt": f"Professional image about {topic}",
#                     "layout_suggestion": "balanced",
#                     "key_insight": f"Understanding {topic}"
#                 }
#             ]
#         }

# def create_context_aware_image_prompt(base_prompt: str, theme_colors: dict, slide_content: dict):
#     """Create advanced, context-aware image prompts that match theme and content"""
#     theme_desc = theme_colors['description']
#     theme_style = theme_colors['style']
#     layout = slide_content.get('layout_suggestion', 'balanced')
    
#     # Advanced layout-specific styling
#     layout_styles = {
#         'visual_heavy': 'large central focus, dramatic composition, minimal text space, impactful visual storytelling',
#         'text_focus': 'subtle background, text-friendly composition, non-distracting, supportive imagery',
#         'balanced': 'harmonious composition, equal visual and text space, professional balance',
#         'infographic': 'data visualization friendly, chart-compatible, clean background for overlays',
#         'smart': 'intelligent adaptive composition, context-aware positioning, professional flexibility'
#     }
    
#     # Color harmony and mood
#     color_instruction = f"Color palette perfectly matching {theme_desc}, harmonious with presentation theme"
#     mood_instruction = f"Mood and atmosphere: {slide_content.get('key_insight', 'professional and engaging')}"
    
#     # Create advanced prompt
#     enhanced_prompt = f"""Professional presentation slide image: {base_prompt}

# VISUAL STYLE: {theme_style}, premium quality, presentation-ready
# LAYOUT APPROACH: {layout_styles.get(layout, 'balanced professional composition')}
# COLOR HARMONY: {color_instruction}
# MOOD & ATMOSPHERE: {mood_instruction}

# TECHNICAL SPECIFICATIONS:
# - Ultra-high quality, 4K resolution, professional photography or illustration
# - Perfect composition using rule of thirds, proper lighting
# - No text overlays, clean composition suitable for business presentation
# - Modern aesthetic, visually appealing, presentation-ready
# - Supports the slide's key message and enhances understanding

# CONTENT ALIGNMENT: Image should visually support and enhance the slide's main concept while maintaining professional presentation standards."""
    
#     return enhanced_prompt

# def generate_context_aware_image(base_prompt: str, output_path: str, theme_colors: dict, slide_content: dict, slide_index: int = 0):
#     """Generate advanced, context-aware images using FLUX with theme matching and token rotation"""
#     enhanced_prompt = create_context_aware_image_prompt(base_prompt, theme_colors, slide_content)
    
#     # Select token based on slide index for load balancing
#     selected_token = HF_TOKENS[slide_index % len(HF_TOKENS)]
#     token_number = (slide_index % len(HF_TOKENS)) + 1
    
#     print(f"      🎨 Generating context-aware image (Token {token_number})...")
#     print(f"      🎯 Theme: {theme_colors.get('description', 'professional')}")
#     print(f"      📐 Layout: {slide_content.get('layout_suggestion', 'balanced')}")
    
#     if not HF_TOKENS or not selected_token:
#         print("      ❌ Error: Hugging Face tokens are not configured.")
#         return None
    
#     try:
#         print(f"      🔄 Connecting to FLUX AI model (Token {token_number})...")
#         client = Client("black-forest-labs/FLUX.1-schnell", hf_token=selected_token)
        
#         print(f"      🖼️  Processing advanced image generation...")
#         result = client.predict(
#             prompt=enhanced_prompt,
#             height=576,
#             width=1024,
#             num_inference_steps=8,  # Higher quality
#             api_name="/infer"
#         )
        
#         temp_image_path = result[0]
        
#         # Enhance and optimize image
#         with Image.open(temp_image_path) as img:
#             # Ensure high quality and proper format
#             img = img.convert('RGB')
#             img.save(output_path, 'PNG', quality=95, optimize=True)
        
#         print(f"      ✅ Context-aware image saved (Token {token_number}): {os.path.basename(output_path)}")
#         return output_path
#     except Exception as e:
#         print(f"      ❌ Error generating context-aware image (Token {token_number}): {e}")
#         # Try with a different token if available
#         if len(HF_TOKENS) > 1:
#             fallback_token = HF_TOKENS[(slide_index + 1) % len(HF_TOKENS)]
#             fallback_number = ((slide_index + 1) % len(HF_TOKENS)) + 1
#             print(f"      🔄 Retrying with Token {fallback_number}...")
#             try:
#                 client = Client("black-forest-labs/FLUX.1-schnell", hf_token=fallback_token)
#                 result = client.predict(
#                     prompt=enhanced_prompt,
#                     height=576,
#                     width=1024,
#                     num_inference_steps=8,
#                     api_name="/infer"
#                 )
#                 temp_image_path = result[0]
#                 with Image.open(temp_image_path) as img:
#                     img = img.convert('RGB')
#                     img.save(output_path, 'PNG', quality=95, optimize=True)
#                 print(f"      ✅ Context-aware image saved (Token {fallback_number}): {os.path.basename(output_path)}")
#                 return output_path
#             except Exception as e2:
#                 print(f"      ❌ Fallback token also failed: {e2}")
#         return None

# # --- OAUTHPPTMAKER CLASS ---
# class OAuthPPTMaker:
#     def __init__(self):
#         self.credentials = None
#         self.slides_service = None
#         self.drive_service = None
#         self.authenticate()

#     def authenticate(self):
#         if os.path.exists(TOKEN_FILE):
#             with open(TOKEN_FILE, 'rb') as token:
#                 self.credentials = pickle.load(token)

#         if not self.credentials or not self.credentials.valid:
#             if self.credentials and self.credentials.expired and self.credentials.refresh_token:
#                 self.credentials.refresh(Request())
#             else:
#                 flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
#                 self.credentials = flow.run_local_server(port=0)

#             with open(TOKEN_FILE, 'wb') as token:
#                 pickle.dump(self.credentials, token)

#         self.slides_service = build('slides', 'v1', credentials=self.credentials)
#         self.drive_service = build('drive', 'v3', credentials=self.credentials)
#         print("✅ Authentication successful!")

#     def _upload_image_to_drive(self, image_path: str):
#         print(f"      ☁️  Uploading {os.path.basename(image_path)} to Google Drive...")
#         file_metadata = {'name': os.path.basename(image_path)}
#         media = MediaFileUpload(image_path, mimetype='image/png')
        
#         file = self.drive_service.files().create(
#             body=file_metadata,
#             media_body=media,
#             fields='id, webContentLink'
#         ).execute()

#         permission = {'type': 'anyone', 'role': 'reader'}
#         self.drive_service.permissions().create(
#             fileId=file.get('id'),
#             body=permission
#         ).execute()

#         print(f"      ✅ Upload complete: {os.path.basename(image_path)}")
#         return file.get('webContentLink')

#     def create_presentation(self, title):
#         body = {'title': title}
#         presentation = self.slides_service.presentations().create(body=body).execute()
#         presentation_id = presentation.get('presentationId')
#         print(f'\n✅ Created presentation: {title}')
#         return presentation_id

#     def add_title_slide(self, presentation_id, title, subtitle, theme):
#         """Create title slide with tags format like reference image"""
#         presentation = self.slides_service.presentations().get(presentationId=presentation_id).execute()
#         slide_id = presentation['slides'][0]['objectId']
        
#         # Clear existing elements
#         requests = [
#             {
#                 'deleteObject': {
#                     'objectId': presentation['slides'][0]['pageElements'][0]['objectId']
#                 }
#             },
#             {
#                 'deleteObject': {
#                     'objectId': presentation['slides'][0]['pageElements'][1]['objectId']
#                 }
#             }
#         ]
        
#         # Create new text boxes for tags format
#         title_box_id = f'title_box_{os.urandom(4).hex()}'
#         subtitle_box_id = f'subtitle_box_{os.urandom(4).hex()}'
        
#         # Add title with border (tags format)
#         requests.extend([
#             {
#                 'createShape': {
#                     'objectId': title_box_id,
#                     'shapeType': 'TEXT_BOX',
#                     'elementProperties': {
#                         'pageObjectId': slide_id,
#                         'size': {
#                             'height': {'magnitude': 150, 'unit': 'PT'},
#                             'width': {'magnitude': 600, 'unit': 'PT'}
#                         },
#                         'transform': {
#                             'scaleX': 1,
#                             'scaleY': 1,
#                             'translateX': 75, 
#                             'translateY': 150,
#                             'unit': 'PT'
#                         }
#                     }
#                 }
#             },
#             {
#                 'createShape': {
#                     'objectId': subtitle_box_id,
#                     'shapeType': 'TEXT_BOX',
#                     'elementProperties': {
#                         'pageObjectId': slide_id,
#                         'size': {
#                             'height': {'magnitude': 80, 'unit': 'PT'},
#                             'width': {'magnitude': 600, 'unit': 'PT'}
#                         },
#                         'transform': {
#                             'scaleX': 1,
#                             'scaleY': 1,
#                             'translateX': 75,
#                             'translateY': 320,
#                             'unit': 'PT'
#                         }
#                     }
#                 }
#             },
#             # Add border to title box (tags style)
#             {
#                 'updateShapeProperties': {
#                     'objectId': title_box_id,
#                     'shapeProperties': {
#                         'outline': {
#                             'outlineFill': {
#                                 'solidFill': {
#                                     'color': {
#                                         'rgbColor': theme.get('accentColor', theme.get('accent', {'red': 0.25, 'green': 0.75, 'blue': 1.0}))
#                                     }
#                                 }
#                             },
#                             'weight': {'magnitude': 3, 'unit': 'PT'}
#                         }
#                     },
#                     'fields': 'outline'
#                 }
#             },
#             # Insert text
#             {'insertText': {'objectId': title_box_id, 'text': title}},
#             {'insertText': {'objectId': subtitle_box_id, 'text': subtitle}},
#             # Style title text
#             {
#                 'updateTextStyle': {
#                     'objectId': title_box_id,
#                     'style': {
#                         'foregroundColor': {
#                             'opaqueColor': {
#                                 'rgbColor': theme.get('textColor', theme.get('text', {'red': 1.0, 'green': 1.0, 'blue': 1.0}))
#                             }
#                         },
#                         'fontSize': {'magnitude': 32, 'unit': 'PT'},
#                         'bold': True
#                     },
#                     'fields': 'foregroundColor,fontSize,bold'
#                 }
#             },
#             # Style subtitle text
#             {
#                 'updateTextStyle': {
#                     'objectId': subtitle_box_id,
#                     'style': {
#                         'foregroundColor': {
#                             'opaqueColor': {
#                                 'rgbColor': theme.get('accentColor', theme.get('accent', {'red': 0.25, 'green': 0.75, 'blue': 1.0}))
#                             }
#                         },
#                         'fontSize': {'magnitude': 16, 'unit': 'PT'}
#                     },
#                     'fields': 'foregroundColor,fontSize'
#                 }
#             }
#         ])

#         self.slides_service.presentations().batchUpdate(
#             presentationId=presentation_id,
#             body={'requests': requests}
#         ).execute()
#         print(f"🎨 Added title slide with tags format (bordered style)")

#     def add_smart_content_slide(self, presentation_id, slide_data, theme, image_url=None, secondary_image_url=None, slide_number=1):
#         """Add slide with advanced layouts, alternating positions, and multiple images"""
#         slide_id = f'slide_{os.urandom(4).hex()}'
#         title = slide_data['title']
#         bullet_points = slide_data['points']
#         layout_type = slide_data.get('layout_suggestion', 'balanced')
#         image_position = slide_data.get('image_position', 'right' if slide_number % 2 == 0 else 'left')
        
#         # Create slide
#         requests = [
#             {
#                 'createSlide': {
#                     'objectId': slide_id,
#                     'slideLayoutReference': {
#                         'predefinedLayout': 'TITLE_AND_BODY'
#                     }
#                 }
#             }
#         ]

#         self.slides_service.presentations().batchUpdate(
#             presentationId=presentation_id,
#             body={'requests': requests}
#         ).execute()

#         # Get slide dimensions
#         presentation = self.slides_service.presentations().get(presentationId=presentation_id).execute()
#         new_slide = next(s for s in presentation['slides'] if s['objectId'] == slide_id)
#         slide_width = presentation['pageSize']['width']['magnitude']
#         slide_height = presentation['pageSize']['height']['magnitude']
        
#         # Initialize all variables to avoid scope issues
#         img2_width = slide_width * 0.28
#         img2_x = slide_width * 0.70
        
#         # Advanced layout positioning with alternating sides
#         if layout_type == 'dual_image' and image_url and secondary_image_url:
#             # Two images layout
#             text_width = slide_width * 0.35
#             text_x = slide_width * 0.32  # Center text
#             img_width = slide_width * 0.28  # Primary image width
#             img_x = slide_width * 0.02      # Primary image position
#             img1_width = slide_width * 0.28
#             img1_x = slide_width * 0.02
#             img2_width = slide_width * 0.28
#             img2_x = slide_width * 0.70
#             img_height = slide_height * 0.5
#         elif layout_type == 'dual_image' and secondary_image_url:
#             # Secondary image only (no primary)
#             text_width = slide_width * 0.52
#             text_x = slide_width * 0.02
#             img_width = slide_width * 0.42
#             img_x = slide_width * 0.56
#             img2_width = slide_width * 0.42
#             img2_x = slide_width * 0.56
#             img_height = slide_height * 0.6
#         elif image_position == 'left' and image_url:
#             # Image on left, text on right
#             text_width = slide_width * 0.52
#             text_x = slide_width * 0.46
#             img_width = slide_width * 0.42
#             img_x = slide_width * 0.02
#             img_height = slide_height * 0.6
#         elif image_position == 'right' and image_url:
#             # Image on right, text on left
#             text_width = slide_width * 0.52
#             text_x = slide_width * 0.02
#             img_width = slide_width * 0.42
#             img_x = slide_width * 0.56
#             img_height = slide_height * 0.6
#         elif layout_type == 'visual_heavy' and image_url:
#             # Large central image with minimal text
#             text_width = slide_width * 0.35
#             text_x = slide_width * 0.05
#             img_width = slide_width * 0.55
#             img_x = slide_width * 0.42
#             img_height = slide_height * 0.7
#         else:
#             # Text-focused or no image
#             text_width = slide_width * 0.85
#             text_x = slide_width * 0.075
#             img_width = slide_width * 0.25
#             img_x = slide_width * 0.72
#             img_height = slide_height * 0.3

#         # Get existing elements
#         title_id = next(el['objectId'] for el in new_slide['pageElements'] 
#                        if el.get('shape', {}).get('placeholder', {}).get('type') == 'TITLE')
#         original_body_id = next(el['objectId'] for el in new_slide['pageElements'] 
#                                if el.get('shape', {}).get('placeholder', {}).get('type') == 'BODY')

#         new_body_id = f'body_{os.urandom(4).hex()}'

#         # Background and title styling (EXACT working pattern)
#         style_requests = [
#             {
#                 'updatePageProperties': {
#                     'objectId': slide_id,
#                     'pageProperties': {
#                         'pageBackgroundFill': {
#                             'solidFill': {
#                                 'color': {
#                                     'rgbColor': theme.get('backgroundColor', theme.get('background', {'red': 0.1, 'green': 0.1, 'blue': 0.1}))
#                                 }
#                             }
#                         }
#                     },
#                     'fields': 'pageBackgroundFill'
#                 }
#             },
#             {'insertText': {'objectId': title_id, 'text': title}},
#             {
#                 'updateTextStyle': {
#                     'objectId': title_id,
#                     'style': {
#                         'foregroundColor': {
#                             'opaqueColor': {
#                                 'rgbColor': theme.get('textColor', theme.get('text', {'red': 1.0, 'green': 1.0, 'blue': 1.0}))
#                             }
#                         },
#                         'fontSize': {'magnitude': 26, 'unit': 'PT'},
#                         'bold': True
#                     },
#                     'fields': 'foregroundColor,fontSize,bold'
#                 }
#             },
#             {'deleteObject': {'objectId': original_body_id}},
#             {
#                 'createShape': {
#                     'objectId': new_body_id,
#                     'shapeType': 'TEXT_BOX',
#                     'elementProperties': {
#                         'pageObjectId': slide_id,
#                         'size': {
#                             'width': {'magnitude': text_width, 'unit': 'EMU'},
#                             'height': {'magnitude': slide_height * 0.55, 'unit': 'EMU'}
#                         },
#                         'transform': {
#                             'scaleX': 1,
#                             'scaleY': 1,
#                             'translateX': text_x,
#                             'translateY': slide_height * 0.28,
#                             'unit': 'EMU'
#                         }
#                     }
#                 }
#             }
#         ]

#         # Add primary image
#         if image_url:
#             image_y = slide_height * 0.28
#             print(f"      🖼️ Adding primary image: {image_url}")
#             print(f"      📐 Position: x={img_x}, y={image_y}, width={img_width}, height={img_height}")
#             print(f"      🎯 Layout: {layout_type}, Position: {image_position}")
            
#             style_requests.append({
#                 'createImage': {
#                     'url': image_url,
#                     'elementProperties': {
#                         'pageObjectId': slide_id,
#                         'size': {
#                             'width': {'magnitude': img_width, 'unit': 'EMU'},
#                             'height': {'magnitude': img_height, 'unit': 'EMU'}
#                         },
#                         'transform': {
#                             'scaleX': 1,
#                             'scaleY': 1,
#                             'translateX': img_x,
#                             'translateY': image_y,
#                             'unit': 'EMU'
#                         }
#                     }
#                 }
#             })

#         # Add secondary image for dual-image layouts
#         if secondary_image_url and layout_type == 'dual_image':
#             print(f"      🖼️ Adding secondary image: {secondary_image_url}")
#             print(f"      📐 Secondary position: x={img2_x}, y={slide_height * 0.28}, width={img2_width}")
            
#             style_requests.append({
#                 'createImage': {
#                     'url': secondary_image_url,
#                     'elementProperties': {
#                         'pageObjectId': slide_id,
#                         'size': {
#                             'width': {'magnitude': img2_width, 'unit': 'EMU'},
#                             'height': {'magnitude': img_height, 'unit': 'EMU'}
#                         },
#                         'transform': {
#                             'scaleX': 1,
#                             'scaleY': 1,
#                             'translateX': img2_x,
#                             'translateY': slide_height * 0.28,
#                             'unit': 'EMU'
#                         }
#                     }
#                 }
#             })

#         # Execute styling requests (EXACT working pattern)
#         self.slides_service.presentations().batchUpdate(
#             presentationId=presentation_id,
#             body={'requests': style_requests}
#         ).execute()

#         # Add content with optimized formatting for shorter text (EXACT working pattern)
#         bullet_text = '\n'.join(bullet_points)
#         content_requests = [
#             {'insertText': {'objectId': new_body_id, 'text': bullet_text}},
#             {
#                 'updateTextStyle': {
#                     'objectId': new_body_id,
#                     'style': {
#                         'foregroundColor': {
#                             'opaqueColor': {
#                                 'rgbColor': theme['textColor']
#                             }
#                         },
#                         'fontSize': {'magnitude': 16, 'unit': 'PT'}
#                     },
#                     'fields': 'foregroundColor,fontSize'
#                 }
#             },
#             {
#                 'createParagraphBullets': {
#                     'objectId': new_body_id,
#                     'textRange': {'type': 'ALL'},
#                     'bulletPreset': 'BULLET_DISC_CIRCLE_SQUARE'
#                 }
#             }
#         ]

#         self.slides_service.presentations().batchUpdate(
#             presentationId=presentation_id,
#             body={'requests': content_requests}
#         ).execute()

#         # Enhanced logging
#         image_desc = ""
#         if secondary_image_url:
#             image_desc = "(with dual images)"
#         elif image_url:
#             image_desc = f"(image {image_position})"
#         else:
#             image_desc = "(text-focused)"
            
#         print(f"🎨 Added advanced slide: {title} {image_desc}")

#     def make_shareable(self, presentation_id):
#         permission = {'type': 'anyone', 'role': 'reader'}
#         self.drive_service.permissions().create(
#             fileId=presentation_id,
#             body=permission
#         ).execute()
#         print("\n🌐 Presentation is now shareable.")

# # --- API ENDPOINTS ---
# @app.get("/")
# async def root():
#     return {
#         "message": "🚀 Advanced AI Presentation Creator API - Gamma Level",
#         "version": "2.0 - Professional Grade",
#         "features": [
#             "🧠 Dual-stage Gemini AI content refinement",
#             "🎨 Advanced theme-based color schemes", 
#             "🖼️ Context-aware FLUX image generation",
#             "📐 Smart layout positioning",
#             "🌐 Auto-browser opening",
#             "✨ Gamma-level professional presentations"
#         ]
#     }

# @app.websocket("/ws/{session_id}")
# async def websocket_endpoint(websocket: WebSocket, session_id: str):
#     await manager.connect(websocket, session_id)
#     try:
#         while True:
#             # Listen for messages from client
#             data = await websocket.receive_text()
#             message = json.loads(data)
            
#             if message.get("type") == "ping":
#                 await manager.send_message(session_id, {"type": "pong"})
#             elif message.get("type") == "start_presentation":
#                 # Handle real-time presentation generation
#                 await handle_realtime_presentation_generation(session_id, message.get("data", {}))
                
#     except WebSocketDisconnect:
#         manager.disconnect(session_id)
#     except Exception as e:
#         print(f"❌ WebSocket error: {e}")
#         await manager.send_message(session_id, {
#             "type": "error", 
#             "data": {"message": f"WebSocket error: {str(e)}"}
#         })
#         manager.disconnect(session_id)

# async def handle_realtime_presentation_generation(session_id: str, request_data: dict):
#     """Handle real-time presentation generation with live WebSocket updates"""
#     try:
#         # Parse request data
#         topic = request_data.get("topic", "")
#         slide_count = request_data.get("slideCount", 6)
#         tone = request_data.get("tone", "professional")
#         theme = request_data.get("theme", "modern")
        
#         if not topic.strip():
#             await send_stream_update(session_id, "error", {"message": "Topic is required"})
#             return
        
#         # Start generation process
#         await send_progress_update(session_id, 5, "initialization", "🚀 Starting Gamma-Level AI Presentation Creator...")
        
#         # Create output folder
#         output_folder = "generated_images"
#         os.makedirs(output_folder, exist_ok=True)
        
#         # Get theme colors
#         theme_colors = get_advanced_theme_colors(theme)
#         await send_progress_update(session_id, 10, "theme_setup", f"🎨 Using {theme} theme: {theme_colors['description']}")
        
#         # Generate content with real-time updates
#         await send_progress_update(session_id, 15, "content_generation", "🧠 Generating Gamma-level content with dual-stage AI refinement...")
#         content_data = await generate_gamma_level_content(topic, slide_count, tone, theme, session_id)
        
#         if not content_data:
#             await send_stream_update(session_id, "error", {"message": "Failed to generate presentation content"})
#             return
        
#         await send_progress_update(session_id, 25, "content_complete", f"📋 Generated: {content_data['title']}")
        
#         # Initialize PPT maker
#         await send_progress_update(session_id, 30, "ppt_initialization", "🔧 Initializing advanced presentation creator...")
#         ppt_maker = OAuthPPTMaker()
#         presentation_id = ppt_maker.create_presentation(content_data['title'])
        
#         # Create title slide
#         await send_progress_update(session_id, 35, "title_slide", f"🎨 Creating advanced title slide with {theme} theme...")
#         ppt_maker.add_title_slide(
#             presentation_id, 
#             content_data['title'], 
#             content_data['subtitle'],
#             content_data['theme']
#         )
        
#         # Create slides with real-time updates (includes image generation)
#         await send_progress_update(session_id, 40, "slide_creation", "� Creatting slides with parallel image generation...")
#         await create_slides_with_realtime_updates(
#             ppt_maker,
#             presentation_id,
#             content_data,
#             output_folder,
#             session_id
#         )
        
#         # Make shareable
#         await send_progress_update(session_id, 95, "finalization", "🌐 Making presentation publicly accessible...")
#         ppt_maker.make_shareable(presentation_id)
        
#         # Generate URLs
#         presentation_url = f"https://docs.google.com/presentation/d/{presentation_id}/edit"
#         presentation_embed_url = f"https://docs.google.com/presentation/d/{presentation_id}/embed?start=false&loop=false&delayms=3000"
        
#         # Send completion
#         await send_stream_update(session_id, "completed", {
#             "presentation_id": presentation_id,
#             "presentation_url": presentation_url,
#             "presentation_embed_url": presentation_embed_url,
#             "title": content_data['title'],
#             "total_slides": len(content_data['slides']) + 1,
#             "message": "🎉 Gamma-level presentation created successfully!"
#         })
        
#         await send_progress_update(session_id, 100, "complete", "✅ Presentation completed successfully!")
        
#         # Don't auto-open in browser - user will open manually
#         print(f"✅ Presentation ready: {presentation_url}")
            
#     except Exception as e:
#         print(f"❌ Error in real-time presentation generation: {e}")
#         await send_stream_update(session_id, "error", {"message": f"Failed to create presentation: {str(e)}"})

# # This function is now integrated into create_slides_with_realtime_updates

# async def create_slides_with_realtime_updates(ppt_maker, presentation_id, content_data, output_folder, session_id):
#     """Create slides with real-time WebSocket updates using the WORKING pattern"""
#     slides = content_data['slides']
#     theme = content_data['theme']
#     topic = content_data.get('title', 'presentation').replace(' ', '_')[:20]
    
#     # Step 1: Generate all images in parallel (like working code)
#     await send_progress_update(session_id, 75, "parallel_generation", f"🚀 STEP 1: Parallel image generation using {len(HF_TOKENS)} tokens...")
    
#     image_tasks = []
#     slide_data_with_paths = []
    
#     with ThreadPoolExecutor(max_workers=len(HF_TOKENS)) as executor:
#         for i, slide in enumerate(slides, 1):
#             image_filename = f"slide_{i}_{topic.replace(' ', '_')[:20]}.png"
#             secondary_image_filename = f"slide_{i}_secondary_{topic.replace(' ', '_')[:20]}.png"
#             image_path = os.path.join(output_folder, image_filename)
#             secondary_image_path = os.path.join(output_folder, secondary_image_filename)
            
#             slide_data_with_paths.append({
#                 'slide': slide,
#                 'image_path': image_path,
#                 'secondary_image_path': secondary_image_path,
#                 'slide_number': i
#             })
            
#             # Queue primary image
#             if slide.get('image_prompt'):
#                 print(f"      🎨 Queuing primary image for slide {i} (Token {((i-1) % len(HF_TOKENS)) + 1})...")
#                 future = executor.submit(
#                     generate_context_aware_image,
#                     slide['image_prompt'],
#                     image_path,
#                     get_advanced_theme_colors('dark'),  # Use theme colors
#                     slide,
#                     i - 1
#                 )
#                 image_tasks.append((f"{i}_primary", future))
#             else:
#                 image_tasks.append((f"{i}_primary", None))
            
#             # Queue secondary image if available (every 3rd slide gets dual images)
#             if slide.get('secondary_image_prompt') or i % 3 == 0:
#                 secondary_prompt = slide.get('secondary_image_prompt', 
#                     f"Supporting visual for {slide['title']}, complementary to main image, dark charcoal with bright green accents")
#                 print(f"      🎨 Queuing secondary image for slide {i} (Token {(i % len(HF_TOKENS)) + 1})...")
#                 future = executor.submit(
#                     generate_context_aware_image,
#                     secondary_prompt,
#                     secondary_image_path,
#                     get_advanced_theme_colors('dark'),
#                     slide,
#                     i  # Different token for secondary image
#                 )
#                 image_tasks.append((f"{i}_secondary", future))
#             else:
#                 image_tasks.append((f"{i}_secondary", None))
        
#         # Wait for all image generation to complete
#         image_results = {}
#         for image_key, future in image_tasks:
#             if future:
#                 try:
#                     result = future.result(timeout=120)  # 2 minute timeout per image
#                     image_results[image_key] = result
#                     if result:
#                         print(f"      ✅ {image_key} image generation completed")
#                         # Send real-time update
#                         slide_num = int(image_key.split('_')[0])
#                         thumbnail = create_image_thumbnail(result)
#                         await send_image_status(session_id, slide_num, "completed", thumbnail)
#                     else:
#                         print(f"      ⚠️ {image_key} image generation failed")
#                         slide_num = int(image_key.split('_')[0])
#                         await send_image_status(session_id, slide_num, "failed")
#                 except Exception as e:
#                     print(f"      ❌ {image_key} image generation error: {e}")
#                     image_results[image_key] = None
#                     slide_num = int(image_key.split('_')[0])
#                     await send_image_status(session_id, slide_num, "failed")
#             else:
#                 image_results[image_key] = None
    
#     print(f"✅ Parallel image generation completed!")
    
#     # Step 2: Upload images and create slides (like working code)
#     await send_progress_update(session_id, 85, "slide_creation", f"🚀 STEP 2: Uploading images and creating slides...")
    
#     for slide_info in slide_data_with_paths:
#         slide = slide_info['slide']
#         slide_num = slide_info['slide_number']
#         image_path = slide_info['image_path']
#         secondary_image_path = slide_info['secondary_image_path']
        
#         print(f"\n--- Slide {slide_num}: {slide['title']} ---")
        
#         # Upload primary image if generation was successful
#         image_url = None
#         if image_results.get(f"{slide_num}_primary"):
#             print(f"      ☁️ Uploading primary image to Google Drive...")
#             try:
#                 image_url = ppt_maker._upload_image_to_drive(image_path)
#                 if image_url:
#                     print(f"      ✅ Primary image uploaded and ready")
#                 else:
#                     print(f"      ⚠️ Primary image upload failed")
#             except Exception as e:
#                 print(f"      ⚠️ Primary image upload error: {e}")
        
#         # Upload secondary image if generation was successful
#         secondary_image_url = None
#         if image_results.get(f"{slide_num}_secondary"):
#             print(f"      ☁️ Uploading secondary image to Google Drive...")
#             try:
#                 secondary_image_url = ppt_maker._upload_image_to_drive(secondary_image_path)
#                 if secondary_image_url:
#                     print(f"      ✅ Secondary image uploaded and ready")
#                 else:
#                     print(f"      ⚠️ Secondary image upload failed")
#             except Exception as e:
#                 print(f"      ⚠️ Secondary image upload error: {e}")
        
#         # Determine layout description
#         if image_url and secondary_image_url:
#             layout_desc = "dual-image layout with alternating positioning"
#             slide['layout_suggestion'] = 'dual_image'
#         elif image_url:
#             position = "left" if slide_num % 2 == 1 else "right"
#             layout_desc = f"single image ({position} side)"
#             slide['image_position'] = position
#         else:
#             layout_desc = "text-focused layout"
        
#         # Add slide with advanced layout
#         print(f"      📄 Creating slide with {layout_desc}")
#         ppt_maker.add_smart_content_slide(
#             presentation_id, 
#             slide, 
#             theme,
#             image_url,
#             secondary_image_url,
#             slide_num
#         )
        
#         print(f"      ✅ Slide {slide_num} completed with {layout_desc}")
        
#         # Send slide completion notification
#         await send_stream_update(session_id, "slide_completed", {
#             "slide_number": slide_num,
#             "title": slide['title'],
#             "has_image": image_url is not None,
#             "has_secondary_image": secondary_image_url is not None,
#             "layout": layout_desc
#         })

# @app.get("/api/health")
# async def health_check():
#     return {"status": "healthy", "message": "Advanced PPT Maker API with Real-Time Streaming"}

# @app.post("/api/test")
# async def test_endpoint(request: PresentationRequest):
#     """Test endpoint to debug issues"""
#     try:
#         print(f"🧪 Test endpoint received: {request}")
#         return {
#             "success": True,
#             "message": "Test successful",
#             "received_data": {
#                 "topic": request.topic,
#                 "slideCount": request.slideCount,
#                 "tone": request.tone,
#                 "theme": request.theme
#             }
#         }
#     except Exception as e:
#         print(f"❌ Test endpoint error: {e}")
#         return {"success": False, "error": str(e)}

# @app.post("/api/create-presentation-sync", response_model=PresentationResponse)
# async def create_presentation_sync(request: PresentationRequest):
#     """Fallback synchronous endpoint that definitely works with images"""
#     try:
#         print(f"🚀 Starting SYNC Gamma-Level AI Presentation Creator (with working images)")
#         print(f"📊 Topic: {request.topic}")
#         print(f"🎨 Theme: {request.theme} | Tone: {request.tone} | Slides: {request.slideCount}")
        
#         # Validate input
#         if not request.topic.strip():
#             return PresentationResponse(success=False, error="Topic is required")
        
#         # Create output folder
#         output_folder = "generated_images"
#         os.makedirs(output_folder, exist_ok=True)
        
#         # Generate content
#         print(f"🧠 Generating content...")
#         content_data = await generate_gamma_level_content(request.topic, request.slideCount, request.tone, request.theme)
        
#         if not content_data:
#             return PresentationResponse(success=False, error="Failed to generate presentation content")
        
#         # Initialize PPT maker
#         print(f"🔧 Initializing presentation creator...")
#         ppt_maker = OAuthPPTMaker()
#         presentation_id = ppt_maker.create_presentation(content_data['title'])
        
#         # Create title slide
#         print(f"🎨 Creating title slide...")
#         ppt_maker.add_title_slide(
#             presentation_id, 
#             content_data['title'], 
#             content_data['subtitle'],
#             content_data['theme']
#         )
        
#         # Generate and add slides with images
#         print(f"🖼️ Generating images and creating slides...")
#         for i, slide in enumerate(content_data['slides'], 1):
#             print(f"\n📄 Creating slide {i}: {slide['title']}")
            
#             # Generate image
#             image_url = None
#             if slide.get('image_prompt'):
#                 image_filename = f"slide_{i}_{request.topic.replace(' ', '_')[:20]}.png"
#                 image_path = os.path.join(output_folder, image_filename)
                
#                 print(f"      🎨 Generating image...")
#                 result = generate_context_aware_image(
#                     slide['image_prompt'],
#                     image_path,
#                     get_advanced_theme_colors(request.theme),
#                     slide,
#                     i - 1
#                 )
                
#                 if result and os.path.exists(result):
#                     print(f"      ☁️ Uploading image...")
#                     image_url = ppt_maker._upload_image_to_drive(result)
#                     time.sleep(2)  # Ensure image is processed
            
#             # Add slide with image
#             ppt_maker.add_smart_content_slide(
#                 presentation_id,
#                 slide,
#                 content_data['theme'],
#                 image_url,
#                 slide_number=i
#             )
        
#         # Make shareable
#         print(f"🌐 Making presentation shareable...")
#         ppt_maker.make_shareable(presentation_id)
        
#         # Generate URLs
#         presentation_url = f"https://docs.google.com/presentation/d/{presentation_id}/edit"
#         presentation_embed_url = f"https://docs.google.com/presentation/d/{presentation_id}/embed?start=false&loop=false&delayms=3000"
        
#         print(f"✅ Presentation created successfully!")
#         print(f"🔗 URL: {presentation_url}")
        
#         return PresentationResponse(
#             success=True,
#             presentation_id=presentation_id,
#             presentation_url=presentation_url,
#             presentation_embed_url=presentation_embed_url,
#             title=content_data['title'],
#             message="Presentation created successfully with working images!"
#         )
        
#     except Exception as e:
#         print(f"❌ Error in sync presentation creation: {e}")
#         return PresentationResponse(success=False, error=str(e))

# @app.post("/api/create-presentation", response_model=PresentationResponse)
# async def create_presentation(request: PresentationRequest):
#     try:
#         agent_enhanced = getattr(request, 'use_agents', True)
#         print(f"🚀 Starting {'Multi-Agent Enhanced' if agent_enhanced else 'Standard'} AI Presentation Creator")
#         print(f"📊 Received request: {request}")
#         print(f"📊 Topic: {request.topic}")
#         print(f"🎨 Theme: {request.theme} | Tone: {request.tone} | Slides: {request.slideCount}")
#         print(f"🤖 Multi-Agent System: {'Enabled' if agent_enhanced else 'Disabled'}")
#         print("=" * 80)
        
#         # Validate input
#         if not request.topic.strip():
#             raise HTTPException(status_code=400, detail="Topic is required")
        
#         # Create output folder
#         output_folder = "generated_images"
#         os.makedirs(output_folder, exist_ok=True)
        
#         # Get advanced theme colors
#         theme_colors = get_advanced_theme_colors(request.theme)
#         print(f"🎨 Using {request.theme} theme: {theme_colors['description']}")
        
#         # Generate content using enhanced multi-agent system or fallback
#         print(f"\n🧠 Generating {'multi-agent enhanced' if agent_enhanced else 'standard'} content...")
#         try:
#             content_data = await generate_gamma_level_content(
#                 request.topic, 
#                 request.slideCount, 
#                 request.tone,
#                 request.theme
#             )
            
#             if not content_data:
#                 raise HTTPException(status_code=500, detail="Failed to generate presentation content")
                
#             print(f"✅ Content generation successful")
#             agent_confidence = content_data.get('agent_confidence', 0.85) if agent_enhanced else 0.7
            
#         except Exception as e:
#             print(f"❌ Error in content generation: {e}")
#             raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")
        
#         print(f"✅ Gamma-level content generation completed!")
#         print(f"📋 Title: {content_data['title']}")
#         print(f"📝 Subtitle: {content_data['subtitle']}")
#         print(f"🎯 Generated {len(content_data['slides'])} professional slides")
        
#         # Initialize presentation creator
#         print(f"\n🔧 Initializing advanced presentation creator...")
#         ppt_maker = OAuthPPTMaker()
        
#         # Create presentation
#         presentation_id = ppt_maker.create_presentation(content_data['title'])
        
#         # Add themed title slide
#         print(f"\n🎨 Creating advanced title slide with {request.theme} theme...")
#         ppt_maker.add_title_slide(
#             presentation_id, 
#             content_data['title'], 
#             content_data['subtitle'],
#             content_data['theme']
#         )
        
#         # Process content slides with advanced features and parallel image generation
#         print(f"\n🖼️  Processing {len(content_data['slides'])} content slides with parallel image generation...")
        
#         # Step 1: Generate all images in parallel using both tokens
#         print(f"\n🚀 STEP 1: Parallel image generation using {len(HF_TOKENS)} tokens...")
#         image_tasks = []
#         slide_data_with_paths = []
        
#         with ThreadPoolExecutor(max_workers=len(HF_TOKENS)) as executor:
#             for i, slide in enumerate(content_data['slides'], 1):
#                 image_filename = f"slide_{i}_{request.topic.replace(' ', '_')[:20]}.png"
#                 secondary_image_filename = f"slide_{i}_secondary_{request.topic.replace(' ', '_')[:20]}.png"
#                 image_path = os.path.join(output_folder, image_filename)
#                 secondary_image_path = os.path.join(output_folder, secondary_image_filename)
                
#                 slide_data_with_paths.append({
#                     'slide': slide,
#                     'image_path': image_path,
#                     'secondary_image_path': secondary_image_path,
#                     'slide_number': i
#                 })
                
#                 # Queue primary image
#                 if slide.get('image_prompt'):
#                     print(f"      🎨 Queuing primary image for slide {i} (Token {((i-1) % len(HF_TOKENS)) + 1})...")
#                     future = executor.submit(
#                         generate_context_aware_image,
#                         slide['image_prompt'],
#                         image_path,
#                         theme_colors,
#                         slide,
#                         i - 1
#                     )
#                     image_tasks.append((f"{i}_primary", future))
#                 else:
#                     image_tasks.append((f"{i}_primary", None))
                
#                 # Queue secondary image if available
#                 if slide.get('secondary_image_prompt'):
#                     print(f"      🎨 Queuing secondary image for slide {i} (Token {(i % len(HF_TOKENS)) + 1})...")
#                     future = executor.submit(
#                         generate_context_aware_image,
#                         slide['secondary_image_prompt'],
#                         secondary_image_path,
#                         theme_colors,
#                         slide,
#                         i  # Different token for secondary image
#                     )
#                     image_tasks.append((f"{i}_secondary", future))
#                 else:
#                     image_tasks.append((f"{i}_secondary", None))
            
#             # Wait for all image generation to complete
#             image_results = {}
#             for image_key, future in image_tasks:
#                 if future:
#                     try:
#                         result = future.result(timeout=120)  # 2 minute timeout per image
#                         image_results[image_key] = result
#                         if result:
#                             print(f"      ✅ {image_key} image generation completed")
#                         else:
#                             print(f"      ⚠️  {image_key} image generation failed")
#                     except Exception as e:
#                         print(f"      ❌ {image_key} image generation error: {e}")
#                         image_results[image_key] = None
#                 else:
#                     image_results[image_key] = None
        
#         print(f"✅ Parallel image generation completed!")
        
#         # Step 2: Upload images to Google Drive and create slides
#         print(f"\n🚀 STEP 2: Uploading images and creating slides...")
        
#         for slide_info in slide_data_with_paths:
#             slide = slide_info['slide']
#             slide_num = slide_info['slide_number']
#             image_path = slide_info['image_path']
#             secondary_image_path = slide_info['secondary_image_path']
            
#             print(f"\n--- Slide {slide_num}: {slide['title']} ---")
            
#             # Upload primary image if generation was successful
#             image_url = None
#             if image_results.get(f"{slide_num}_primary"):
#                 print(f"      ☁️  Uploading primary image to Google Drive...")
#                 try:
#                     image_url = ppt_maker._upload_image_to_drive(image_path)
#                     if image_url:
#                         print(f"      ✅ Primary image uploaded and ready")
#                     else:
#                         print(f"      ⚠️  Primary image upload failed")
#                 except Exception as e:
#                     print(f"      ⚠️  Primary image upload error: {e}")
            
#             # Upload secondary image if generation was successful
#             secondary_image_url = None
#             if image_results.get(f"{slide_num}_secondary"):
#                 print(f"      ☁️  Uploading secondary image to Google Drive...")
#                 try:
#                     secondary_image_url = ppt_maker._upload_image_to_drive(secondary_image_path)
#                     if secondary_image_url:
#                         print(f"      ✅ Secondary image uploaded and ready")
#                     else:
#                         print(f"      ⚠️  Secondary image upload failed")
#                 except Exception as e:
#                     print(f"      ⚠️  Secondary image upload error: {e}")
            
#             # Determine layout description
#             if image_url and secondary_image_url:
#                 layout_desc = "dual-image layout with alternating positioning"
#             elif image_url:
#                 position = "left" if slide_num % 2 == 1 else "right"
#                 layout_desc = f"single image ({position} side)"
#             else:
#                 layout_desc = "text-focused layout"
            
#             # Add slide with advanced layout
#             print(f"      📄 Creating slide with {layout_desc}")
#             ppt_maker.add_smart_content_slide(
#                 presentation_id, 
#                 slide, 
#                 content_data['theme'],
#                 image_url,
#                 secondary_image_url,
#                 slide_num
#             )
            
#             print(f"      ✅ Slide {slide_num} completed with {layout_desc}")
        
#         # Make presentation shareable
#         print(f"\n🌐 Making presentation publicly accessible...")
#         ppt_maker.make_shareable(presentation_id)
        
#         # Generate presentation URLs
#         presentation_url = f"https://docs.google.com/presentation/d/{presentation_id}/edit"
#         presentation_embed_url = f"https://docs.google.com/presentation/d/{presentation_id}/embed?start=false&loop=false&delayms=3000"
#         presentation_preview_url = f"https://docs.google.com/presentation/d/{presentation_id}/preview"
        
#         # Display completion statistics
#         print(f"\n🎉 GAMMA-LEVEL PRESENTATION COMPLETED!")
#         print(f"=" * 80)
#         print(f"📊 Statistics:")
#         print(f"   • Title: {content_data['title']}")
#         print(f"   • Theme: {request.theme} ({theme_colors['description']})")
#         print(f"   • Slides: {len(content_data['slides']) + 1} (including title)")
#         print(f"   • Quality: Gamma AI professional standard")
#         print(f"   • Features: Context-aware images, smart layouts, dual-stage AI")
#         print(f"� URL:i {presentation_url}")
#         print(f"=" * 80)
        
#         # Auto-open in browser
#         try:
#             print(f"🌐 Opening presentation in default browser...")
#             webbrowser.open(presentation_url)
#             print(f"✅ Presentation opened in browser!")
#         except Exception as e:
#             print(f"⚠️  Could not auto-open browser: {e}")
        
#         return PresentationResponse(
#             success=True,
#             presentation_id=presentation_id,
#             presentation_url=presentation_url,
#             presentation_embed_url=presentation_embed_url,
#             presentation_preview_url=presentation_preview_url,
#             title=content_data['title'],
#             message=f"Gamma-level presentation created successfully with {len(content_data['slides']) + 1} slides using {request.theme} theme!"
#         )
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         import traceback
#         error_details = traceback.format_exc()
#         print(f"❌ Error creating Gamma-level presentation: {e}")
#         print(f"❌ Full error details: {error_details}")
#         return PresentationResponse(
#             success=False,
#             error=f"Failed to create presentation: {str(e)}"
#         )

# if __name__ == '__main__':
#     print("🚀 Starting Advanced AI Presentation Creator API - Gamma Level")
#     print("=" * 70)
#     print("✨ Features:")
#     print("   • Dual-stage Gemini AI content refinement")
#     print("   • Advanced theme-based color schemes")
#     print(f"   • Parallel FLUX image generation ({len(HF_TOKENS)} tokens)")
#     print("   • Smart layout positioning")
#     print("   • Auto-browser opening")
#     print("   • Gamma AI professional quality")
#     print("=" * 70)
#     print(f"� Irmage Generation: {len(HF_TOKENS)} parallel tokens for 2x speed")
#     print("🌐 Server starting on http://localhost:8002")
#     print("📚 API docs available at http://localhost:8002/docs")
    
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8002, reload=True)