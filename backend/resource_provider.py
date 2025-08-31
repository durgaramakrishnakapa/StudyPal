import json
import os
import time
import asyncio
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import requests
from datetime import datetime
import uuid
import re
from urllib.parse import quote
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import SerperDevTool
try:
    from crewai_tools import SerperDevTool
    SERPER_AVAILABLE = True
except ImportError:
    print("⚠️ SerperDevTool not available. Install with: pip install crewai-tools")
    SERPER_AVAILABLE = False

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "tvly-your-api-key-here")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

# Initialize SerperDevTool if available
serper_tool = None
if SERPER_AVAILABLE and SERPER_API_KEY:
    try:
        os.environ["SERPER_API_KEY"] = SERPER_API_KEY
        serper_tool = SerperDevTool()
        print("✅ SerperDevTool initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing SerperDevTool: {e}")
        serper_tool = None

app = FastAPI(title="Resource Provider API", description="AI-powered learning resource discovery")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ResourceRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "All Levels"
    resource_types: Optional[List[str]] = ["Books", "Courses", "Websites", "YouTube"]
    max_results: Optional[int] = 8

class Resource(BaseModel):
    id: int
    title: str
    type: str
    source: str
    difficulty: str
    duration: str
    description: str
    url: str
    rating: float
    reviews: int
    tags: Optional[List[str]] = []
    price: Optional[str] = "Free"
    language: Optional[str] = "English"

class ResourceResponse(BaseModel):
    success: bool
    resources: List[Resource]
    total_count: int
    topic: str
    message: Optional[str] = None
    error: Optional[str] = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        print(f"🔌 WebSocket connected: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            print(f"🔌 WebSocket disconnected: {session_id}")
    
    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"❌ Error sending WebSocket message: {e}")
                self.disconnect(session_id)

manager = ConnectionManager()

# Helper Functions
def get_resource_categories():
    """Define comprehensive resource categories and sources"""
    return {
        "Books": {
            "sources": ["O'Reilly Media", "Packt Publishing", "Manning Publications", "Apress", "No Starch Press", "Pragmatic Bookshelf"],
            "typical_duration": ["200-400 pages", "300-500 pages", "150-300 pages"],
            "price_ranges": ["$29.99", "$39.99", "$49.99", "Free"]
        },
        "Courses": {
            "sources": ["Udemy", "Coursera", "edX", "Pluralsight", "LinkedIn Learning", "Skillshare", "Khan Academy"],
            "typical_duration": ["2-4 hours", "6-12 hours", "20-40 hours", "3-6 months"],
            "price_ranges": ["Free", "$19.99", "$49.99", "$99.99", "$199.99"]
        },
        "Websites": {
            "sources": ["Official Docs", "MDN Web Docs", "W3Schools", "FreeCodeCamp", "GeeksforGeeks", "Stack Overflow", "GitHub"],
            "typical_duration": ["Reference", "Interactive", "Self-paced", "Ongoing"],
            "price_ranges": ["Free", "Freemium", "$9.99/month"]
        },
        "YouTube": {
            "sources": ["freeCodeCamp", "Traversy Media", "The Net Ninja", "Academind", "Programming with Mosh", "Corey Schafer", "Tech With Tim"],
            "typical_duration": ["30 minutes", "1-2 hours", "3-5 hours", "8-12 hours"],
            "price_ranges": ["Free", "Free with ads"]
        },
        "Podcasts": {
            "sources": ["Software Engineering Daily", "CodeNewbie", "Syntax", "The Changelog", "Developer Tea", "Full Stack Radio"],
            "typical_duration": ["30-60 minutes", "45-90 minutes"],
            "price_ranges": ["Free", "Premium $4.99/month"]
        },
        "Tools": {
            "sources": ["GitHub", "VS Code Extensions", "Chrome DevTools", "Postman", "Docker", "AWS", "Figma"],
            "typical_duration": ["Setup guide", "Documentation", "Tutorials"],
            "price_ranges": ["Free", "Free tier", "$10/month", "$29/month"]
        }
    }

async def generate_ai_resources(topic: str, difficulty: str = "All Levels", resource_types: List[str] = None, max_results: int = 8) -> List[Resource]:
    """Generate AI-powered resource recommendations using Gemini"""
    print(f"🧠 Generating AI resources for: {topic}")
    
    if not GEMINI_API_KEY:
        print("❌ Gemini API key not configured, using enhanced fallback resources")
        return await generate_enhanced_fallback_resources(topic, difficulty, resource_types, max_results)
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        resource_categories = get_resource_categories()
        types_filter = resource_types if resource_types else list(resource_categories.keys())
        
        prompt = f"""You are an expert learning resource curator. Generate {max_results} high-quality, real learning resources for the topic "{topic}" with difficulty level "{difficulty}".

REQUIREMENTS:
- Create diverse, realistic resources across these types: {', '.join(types_filter)}
- Include real-world sources and realistic details
- Vary difficulty levels appropriately
- Include specific, actionable descriptions
- Add realistic ratings (4.0-5.0 range) and review counts
- Include relevant tags for each resource
- Make titles specific and engaging
- Ensure descriptions are detailed and helpful

RESOURCE CATEGORIES AVAILABLE:
{json.dumps(resource_categories, indent=2)}

OUTPUT FORMAT (JSON Array):
[
    {{
        "title": "Specific, engaging title related to {topic}",
        "type": "Books/Courses/Websites/YouTube/Podcasts/Tools",
        "source": "Realistic source from the category",
        "difficulty": "Beginner/Intermediate/Advanced/All Levels",
        "duration": "Realistic duration for the resource type",
        "description": "Detailed, specific description explaining what learners will gain",
        "url": "https://example.com/resource-link",
        "rating": 4.5,
        "reviews": 1250,
        "tags": ["relevant", "topic", "tags"],
        "price": "Free/Realistic price",
        "language": "English"
    }}
]

Topic: {topic}
Difficulty: {difficulty}
Resource Types: {types_filter}
Number of Resources: {max_results}

Generate realistic, high-quality resources that would genuinely help someone learn {topic}."""

        # Run the synchronous Gemini call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        content = response.text.strip().replace('```json', '').replace('```', '')
        
        try:
            resources_data = json.loads(content)
            resources = []
            
            # Get real data for each resource type
            youtube_videos = []
            books_resources = []
            courses_resources = []
            websites_resources = []
            
            # Fetch real resources based on requested types
            if "YouTube" in types_filter:
                youtube_videos = await search_youtube_videos(f"{topic} tutorial complete guide", max_results=4)
            if "Books" in types_filter:
                books_resources = await search_online_resources(topic, "Books")
            if "Courses" in types_filter:
                courses_resources = await search_online_resources(topic, "Courses")
            if "Websites" in types_filter:
                websites_resources = await search_online_resources(topic, "Websites")
            
            # Counters for real resources
            youtube_index = 0
            books_index = 0
            courses_index = 0
            websites_index = 0
            
            for i, resource_data in enumerate(resources_data[:max_results]):
                title = resource_data.get("title", f"{topic} Resource {i+1}")
                resource_type = resource_data.get("type", "Websites")
                source = resource_data.get("source", "Unknown")
                url = resource_data.get("url", "#")
                description = resource_data.get("description", f"Learn about {topic}")
                price = resource_data.get("price", "Free")
                
                # Use real resources based on type
                if resource_type == "YouTube" and youtube_index < len(youtube_videos):
                    youtube_video = youtube_videos[youtube_index]
                    title = youtube_video['title']
                    url = youtube_video['url']
                    source = youtube_video['channel']
                    description = youtube_video['description']
                    price = "Free"
                    youtube_index += 1
                    
                elif resource_type == "Books" and books_index < len(books_resources):
                    book_resource = books_resources[books_index]
                    title = book_resource['title']
                    url = book_resource['url']
                    source = book_resource['source']
                    description = book_resource['description']
                    price = book_resource.get('price', 'Free')
                    books_index += 1
                    
                elif resource_type == "Courses" and courses_index < len(courses_resources):
                    course_resource = courses_resources[courses_index]
                    title = course_resource['title']
                    url = course_resource['url']
                    source = course_resource['source']
                    description = course_resource['description']
                    price = course_resource.get('price', 'Free')
                    courses_index += 1
                    
                elif resource_type == "Websites" and websites_index < len(websites_resources):
                    website_resource = websites_resources[websites_index]
                    title = website_resource['title']
                    url = website_resource['url']
                    source = website_resource['source']
                    description = website_resource['description']
                    price = website_resource.get('price', 'Free')
                    websites_index += 1
                
                # Generate better URL if it's still a placeholder
                if url in ["#", "https://example.com/resource-link"]:
                    url = generate_resource_url(resource_type, source, topic, title)
                
                resource = Resource(
                    id=i + 1,
                    title=title,
                    type=resource_type,
                    source=source,
                    difficulty=resource_data.get("difficulty", difficulty),
                    duration=resource_data.get("duration", "Self-paced"),
                    description=description,
                    url=url,
                    rating=float(resource_data.get("rating", 4.5)),
                    reviews=int(resource_data.get("reviews", 1000)),
                    tags=resource_data.get("tags", [topic.lower()]),
                    price=price,
                    language=resource_data.get("language", "English")
                )
                resources.append(resource)
            
            print(f"✅ Generated {len(resources)} resources with real URLs and YouTube videos")
            return resources
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            return await generate_enhanced_fallback_resources(topic, difficulty, resource_types, max_results)
            
    except Exception as e:
        print(f"❌ Error generating AI resources: {e}")
        return await generate_enhanced_fallback_resources(topic, difficulty, resource_types, max_results)

async def search_youtube_videos(query: str, max_results: int = 5) -> List[Dict]:
    """Search YouTube for real videos using YouTube Data API"""
    print(f"🎥 Searching YouTube for: {query}")
    
    if not YOUTUBE_API_KEY:
        print("❌ YouTube API key not configured, using fallback")
        return []
    
    try:
        search_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'key': YOUTUBE_API_KEY,
            'maxResults': max_results,
            'type': 'video',
            'order': 'relevance',
            'safeSearch': 'moderate'
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        results = response.json()
        
        videos = []
        for item in results.get('items', []):
            video_data = {
                'title': item['snippet']['title'],
                'video_id': item['id']['videoId'],
                'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                'description': item['snippet']['description'][:200] + "..." if len(item['snippet']['description']) > 200 else item['snippet']['description'],
                'channel': item['snippet']['channelTitle'],
                'published_at': item['snippet']['publishedAt'],
                'thumbnail': item['snippet']['thumbnails'].get('medium', {}).get('url', '')
            }
            videos.append(video_data)
        
        print(f"✅ Found {len(videos)} YouTube videos")
        return videos
        
    except Exception as e:
        print(f"❌ Error searching YouTube: {e}")
        return []

async def search_web_resources(topic: str, resource_type: str) -> List[Dict]:
    """Search the web for real resources using SerperDevTool"""
    print(f"🌐 Searching web for {resource_type}: {topic}")
    
    if not serper_tool:
        print("❌ SerperDevTool not available")
        return []
    
    try:
        # Create specific search queries for different resource types
        search_queries = {
            "Books": f"{topic} book tutorial guide free PDF download",
            "Courses": f"{topic} online course free tutorial Coursera edX Udemy",
            "Websites": f"{topic} official documentation tutorial website guide",
            "YouTube": f"{topic} tutorial video YouTube channel",
            "Tools": f"{topic} tools software development GitHub"
        }
        
        query = search_queries.get(resource_type, f"{topic} learning resources")
        
        # Perform web search
        loop = asyncio.get_event_loop()
        search_result = await loop.run_in_executor(None, serper_tool.run, query)
        
        # Parse search results
        resources = []
        if isinstance(search_result, str):
            # Try to extract useful information from the search result
            lines = search_result.split('\n')
            current_resource = {}
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Look for URLs
                if 'http' in line and ('Title:' in line or 'Link:' in line):
                    if current_resource and 'url' in current_resource:
                        resources.append(current_resource)
                        current_resource = {}
                    
                    # Extract URL
                    url_start = line.find('http')
                    url = line[url_start:].split()[0]
                    current_resource['url'] = url
                    
                    # Extract title if present
                    if 'Title:' in line:
                        title_start = line.find('Title:') + 6
                        title_end = line.find('Link:') if 'Link:' in line else len(line)
                        title = line[title_start:title_end].strip()
                        current_resource['title'] = title
                
                elif 'Snippet:' in line:
                    snippet = line.replace('Snippet:', '').strip()
                    current_resource['description'] = snippet[:200] + "..." if len(snippet) > 200 else snippet
            
            # Add the last resource
            if current_resource and 'url' in current_resource:
                resources.append(current_resource)
        
        # Clean up and enhance resources
        cleaned_resources = []
        for i, resource in enumerate(resources[:4]):  # Limit to 4 results
            if 'url' not in resource:
                continue
                
            cleaned_resource = {
                'title': resource.get('title', f"{topic} Resource {i+1}"),
                'url': resource['url'],
                'source': extract_domain(resource['url']),
                'description': resource.get('description', f"Web resource for learning {topic}"),
                'difficulty': 'All Levels',
                'price': 'Free'
            }
            cleaned_resources.append(cleaned_resource)
        
        print(f"✅ Found {len(cleaned_resources)} web resources via SerperDevTool")
        return cleaned_resources
        
    except Exception as e:
        print(f"❌ Error searching web resources: {e}")
        return []

def extract_domain(url: str) -> str:
    """Extract domain name from URL"""
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        return domain.replace('www.', '').title()
    except:
        return "Web Resource"

async def get_real_resource_urls(topic: str, resource_type: str) -> List[Dict]:
    """Get real, working URLs for different resource types using LLM knowledge"""
    print(f"🔍 Finding real URLs for {resource_type}: {topic}")
    
    try:
        if not GEMINI_API_KEY:
            return []
            
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""Find 3-4 real, working, high-quality {resource_type.lower()} for learning "{topic}". 
        
        REQUIREMENTS:
        - Provide ONLY real, existing URLs that actually work
        - Include popular, well-known platforms and resources
        - Ensure URLs are current and accessible
        - Focus on free or widely available resources
        
        For {resource_type}:
        {"- Books: Amazon, O'Reilly, Manning, free PDFs, official guides" if resource_type == "Books" else ""}
        {"- Courses: Coursera, edX, Udemy, Khan Academy, freeCodeCamp" if resource_type == "Courses" else ""}
        {"- Websites: Official docs, MDN, W3Schools, tutorials, GitHub repos" if resource_type == "Websites" else ""}
        
        OUTPUT FORMAT (JSON Array):
        [
            {{
                "title": "Exact title of the resource",
                "url": "https://exact-working-url.com",
                "source": "Platform name",
                "description": "Brief description of what this resource offers",
                "difficulty": "Beginner/Intermediate/Advanced",
                "price": "Free/Price"
            }}
        ]
        
        Topic: {topic}
        Resource Type: {resource_type}
        
        Return ONLY the JSON array with real, working URLs."""
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, model.generate_content, prompt)
        content = response.text.strip().replace('```json', '').replace('```', '')
        
        try:
            resources = json.loads(content)
            print(f"✅ Found {len(resources)} real {resource_type.lower()} URLs")
            return resources
        except json.JSONDecodeError:
            print(f"❌ Failed to parse LLM response for {resource_type}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting real URLs for {resource_type}: {e}")
        return []

async def search_online_resources(query: str, resource_type: str = "general") -> List[Dict]:
    """Enhanced online resource search with real URLs using web search"""
    print(f"🌐 Searching for real {resource_type} resources: {query}")
    
    # First try web search with SerperDevTool
    web_resources = await search_web_resources(query, resource_type)
    if web_resources:
        return web_resources
    
    # Fallback to LLM knowledge
    if resource_type in ["Books", "Courses", "Websites"]:
        real_resources = await get_real_resource_urls(query, resource_type)
        if real_resources:
            return real_resources
    
    # Fallback to curated real resources based on topic
    online_resources = []
    topic_lower = query.lower()
    
    if "javascript" in topic_lower or "js" in topic_lower:
        online_resources = [
            {
                "title": "JavaScript.info - The Modern JavaScript Tutorial",
                "url": "https://javascript.info/",
                "description": "Comprehensive modern JavaScript tutorial from basics to advanced topics.",
                "source": "JavaScript.info",
                "difficulty": "All Levels",
                "price": "Free"
            },
            {
                "title": "MDN JavaScript Guide",
                "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
                "description": "Official Mozilla documentation for JavaScript with examples.",
                "source": "MDN Web Docs",
                "difficulty": "All Levels", 
                "price": "Free"
            },
            {
                "title": "Eloquent JavaScript (Free Book)",
                "url": "https://eloquentjavascript.net/",
                "description": "A modern introduction to programming and JavaScript.",
                "source": "Eloquent JavaScript",
                "difficulty": "Beginner",
                "price": "Free"
            }
        ]
    elif "python" in topic_lower:
        online_resources = [
            {
                "title": "Python.org Official Tutorial",
                "url": "https://docs.python.org/3/tutorial/",
                "description": "Official Python tutorial covering fundamentals and advanced features.",
                "source": "Python.org",
                "difficulty": "All Levels",
                "price": "Free"
            },
            {
                "title": "Real Python",
                "url": "https://realpython.com/",
                "description": "High-quality Python tutorials and courses for all skill levels.",
                "source": "Real Python",
                "difficulty": "All Levels",
                "price": "Freemium"
            },
            {
                "title": "Automate the Boring Stuff with Python",
                "url": "https://automatetheboringstuff.com/",
                "description": "Free online book teaching Python through practical projects.",
                "source": "No Starch Press",
                "difficulty": "Beginner",
                "price": "Free"
            }
        ]
    elif "react" in topic_lower:
        online_resources = [
            {
                "title": "React Official Documentation",
                "url": "https://react.dev/",
                "description": "Official React docs with interactive examples and guides.",
                "source": "React.dev",
                "difficulty": "All Levels",
                "price": "Free"
            },
            {
                "title": "React Tutorial - W3Schools",
                "url": "https://www.w3schools.com/react/",
                "description": "Step-by-step React tutorial with examples and exercises.",
                "source": "W3Schools",
                "difficulty": "Beginner",
                "price": "Free"
            }
        ]
    elif "machine learning" in topic_lower or "ml" in topic_lower:
        online_resources = [
            {
                "title": "Machine Learning Course - Coursera",
                "url": "https://www.coursera.org/learn/machine-learning",
                "description": "Andrew Ng's famous machine learning course from Stanford.",
                "source": "Coursera",
                "difficulty": "Intermediate",
                "price": "Free Audit"
            },
            {
                "title": "Scikit-learn Documentation",
                "url": "https://scikit-learn.org/stable/",
                "description": "Official documentation for Python's machine learning library.",
                "source": "Scikit-learn",
                "difficulty": "Intermediate",
                "price": "Free"
            }
        ]
    elif "data science" in topic_lower:
        online_resources = [
            {
                "title": "Kaggle Learn",
                "url": "https://www.kaggle.com/learn",
                "description": "Free micro-courses in data science and machine learning.",
                "source": "Kaggle",
                "difficulty": "All Levels",
                "price": "Free"
            },
            {
                "title": "Data Science Handbook",
                "url": "https://jakevdp.github.io/PythonDataScienceHandbook/",
                "description": "Free online book covering essential tools for data science in Python.",
                "source": "O'Reilly",
                "difficulty": "Intermediate",
                "price": "Free"
            }
        ]
    
    print(f"✅ Found {len(online_resources)} curated resources")
    return online_resources

def generate_resource_url(resource_type: str, source: str, topic: str, title: str) -> str:
    """Generate realistic URLs for different resource types and sources"""
    topic_slug = topic.lower().replace(' ', '-').replace('.', '').replace('#', 'sharp')
    title_slug = title.lower().replace(' ', '-').replace(':', '').replace(',', '').replace('.', '')
    
    if resource_type == "Books":
        if "O'Reilly" in source:
            return f"https://www.oreilly.com/library/view/{title_slug}/"
        elif "Packt" in source:
            return f"https://www.packtpub.com/product/{title_slug}/"
        elif "Manning" in source:
            return f"https://www.manning.com/books/{title_slug}"
        else:
            return f"https://www.amazon.com/s?k={topic.replace(' ', '+')}"
    
    elif resource_type == "Courses":
        if "Udemy" in source:
            return f"https://www.udemy.com/course/{title_slug}/"
        elif "Coursera" in source:
            return f"https://www.coursera.org/learn/{topic_slug}"
        elif "edX" in source:
            return f"https://www.edx.org/search?q={topic.replace(' ', '+')}"
        elif "Pluralsight" in source:
            return f"https://www.pluralsight.com/search?q={topic.replace(' ', '+')}"
        else:
            return f"https://www.udemy.com/courses/search/?q={topic.replace(' ', '+')}"
    
    elif resource_type == "Websites":
        if "MDN" in source:
            return f"https://developer.mozilla.org/en-US/search?q={topic.replace(' ', '+')}"
        elif "W3Schools" in source:
            return f"https://www.w3schools.com/{topic_slug}/"
        elif "FreeCodeCamp" in source:
            return "https://www.freecodecamp.org/learn/"
        elif "Official Docs" in source:
            return f"https://docs.{topic_slug}.org/" if '.' not in topic else f"https://www.google.com/search?q={topic.replace(' ', '+')}+official+documentation"
        elif "GitHub" in source:
            return f"https://github.com/search?q={topic.replace(' ', '+')}"
        else:
            return f"https://www.google.com/search?q={topic.replace(' ', '+')}+tutorial"
    
    elif resource_type == "YouTube":
        if "freeCodeCamp" in source:
            return f"https://www.youtube.com/@freecodecamp/search?query={topic.replace(' ', '+')}"
        elif "Traversy Media" in source:
            return f"https://www.youtube.com/@TraversyMedia/search?query={topic.replace(' ', '+')}"
        else:
            return f"https://www.youtube.com/results?search_query={title.replace(' ', '+')}"
    
    elif resource_type == "Podcasts":
        return f"https://www.google.com/search?q={title.replace(' ', '+')}+podcast"
    
    elif resource_type == "Tools":
        if "GitHub" in source:
            return f"https://github.com/search?q={topic.replace(' ', '+')}"
        elif "VS Code" in source:
            return f"https://marketplace.visualstudio.com/search?term={topic.replace(' ', '+')}"
        else:
            return f"https://www.google.com/search?q={title.replace(' ', '+')}"
    
    else:
        return f"https://www.google.com/search?q={title.replace(' ', '+')}"

async def generate_enhanced_fallback_resources(topic: str, difficulty: str = "All Levels", resource_types: List[str] = None, max_results: int = 8) -> List[Resource]:
    """Generate enhanced fallback resources with real data from all sources"""
    print(f"🔄 Generating enhanced fallback resources for: {topic}")
    
    resource_categories = get_resource_categories()
    types_filter = resource_types if resource_types else ["Books", "Courses", "Websites", "YouTube"]
    
    # Get real data for all resource types
    youtube_videos = []
    books_resources = []
    courses_resources = []
    websites_resources = []
    
    if "YouTube" in types_filter:
        youtube_videos = await search_youtube_videos(f"{topic} tutorial", max_results=3)
    if "Books" in types_filter:
        books_resources = await search_online_resources(topic, "Books")
    if "Courses" in types_filter:
        courses_resources = await search_online_resources(topic, "Courses")
    if "Websites" in types_filter:
        websites_resources = await search_online_resources(topic, "Websites")
    
    resources = []
    resource_id = 1
    
    # Distribute resources across types
    resources_per_type = max(1, max_results // len(types_filter))
    
    for resource_type in types_filter:
        if len(resources) >= max_results:
            break
            
        category_info = resource_categories.get(resource_type, {})
        sources = category_info.get("sources", ["Unknown Source"])
        durations = category_info.get("typical_duration", ["Self-paced"])
        prices = category_info.get("price_ranges", ["Free"])
        
        # Get real resources for this type
        real_resources = []
        if resource_type == "YouTube":
            real_resources = youtube_videos
        elif resource_type == "Books":
            real_resources = books_resources
        elif resource_type == "Courses":
            real_resources = courses_resources
        elif resource_type == "Websites":
            real_resources = websites_resources
        
        # Generate resources for this type
        for i in range(min(resources_per_type, max_results - len(resources))):
            import random
            
            if i < len(real_resources):
                # Use real resource
                real_resource = real_resources[i]
                title = real_resource.get('title', f"{topic} Resource")
                url = real_resource.get('url', '#')
                source = real_resource.get('source', 'Unknown')
                description = real_resource.get('description', f"Learn about {topic}")
                price = real_resource.get('price', 'Free')
            else:
                # Generate fallback resource
                title = f"{topic}: {['Complete Guide', 'Mastery Course', 'Practical Handbook', 'Advanced Techniques'][i % 4]}"
                source = random.choice(sources)
                description = f"Comprehensive {resource_type.lower()} covering {topic} fundamentals and best practices."
                url = generate_resource_url(resource_type, source, topic, title)
                price = random.choice(prices)
            
            resource = Resource(
                id=resource_id,
                title=title,
                type=resource_type,
                source=source,
                difficulty=random.choice(["Beginner", "Intermediate", "Advanced"]) if difficulty == "All Levels" else difficulty,
                duration=random.choice(durations),
                description=description,
                url=url,
                rating=round(random.uniform(4.2, 4.9), 1),
                reviews=random.randint(500, 5000),
                tags=[topic.lower(), resource_type.lower(), "learning"],
                price=price,
                language="English"
            )
            resources.append(resource)
            resource_id += 1
    
    print(f"✅ Generated {len(resources)} enhanced fallback resources with real URLs")
    return resources

def generate_fallback_resources(topic: str, difficulty: str = "All Levels", resource_types: List[str] = None, max_results: int = 8) -> List[Resource]:
    """Generate fallback resources when AI is unavailable"""
    print(f"🔄 Generating fallback resources for: {topic}")
    
    resource_categories = get_resource_categories()
    types_filter = resource_types if resource_types else ["Books", "Courses", "Websites", "YouTube"]
    
    resources = []
    resource_id = 1
    
    for resource_type in types_filter:
        if len(resources) >= max_results:
            break
            
        category_info = resource_categories.get(resource_type, {})
        sources = category_info.get("sources", ["Unknown Source"])
        durations = category_info.get("typical_duration", ["Self-paced"])
        prices = category_info.get("price_ranges", ["Free"])
        
        # Generate 2 resources per type
        for i in range(min(2, max_results - len(resources))):
            import random
            
            title = f"{topic}: {['Complete Guide', 'Mastery Course', 'Practical Handbook', 'Advanced Techniques'][i % 4]}"
            source = random.choice(sources)
            
            resource = Resource(
                id=resource_id,
                title=title,
                type=resource_type,
                source=source,
                difficulty=random.choice(["Beginner", "Intermediate", "Advanced"]) if difficulty == "All Levels" else difficulty,
                duration=random.choice(durations),
                description=f"Comprehensive {resource_type.lower()} covering {topic} fundamentals, best practices, and real-world applications. Perfect for learners looking to master {topic} concepts.",
                url=generate_resource_url(resource_type, source, topic, title),
                rating=round(random.uniform(4.2, 4.9), 1),
                reviews=random.randint(500, 5000),
                tags=[topic.lower(), resource_type.lower(), "learning"],
                price=random.choice(prices),
                language="English"
            )
            resources.append(resource)
            resource_id += 1
    
    print(f"✅ Generated {len(resources)} fallback resources")
    return resources

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Resource Provider API is running", "version": "1.0.0"}

@app.post("/api/resources/search", response_model=ResourceResponse)
async def search_resources(request: ResourceRequest):
    """Search for learning resources based on topic and filters"""
    try:
        print(f"🔍 Searching resources for: {request.topic}")
        
        # Generate resources using AI
        resources = await generate_ai_resources(
            topic=request.topic,
            difficulty=request.difficulty or "All Levels",
            resource_types=request.resource_types or ["Books", "Courses", "Websites", "YouTube"],
            max_results=request.max_results or 8
        )
        
        return ResourceResponse(
            success=True,
            resources=resources,
            total_count=len(resources),
            topic=request.topic,
            message=f"Found {len(resources)} resources for {request.topic}"
        )
        
    except Exception as e:
        print(f"❌ Error searching resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resources/popular")
async def get_popular_topics():
    """Get popular learning topics"""
    popular_topics = [
        {"topic": "JavaScript", "count": 15420, "trend": "up"},
        {"topic": "Python", "count": 12350, "trend": "up"},
        {"topic": "React", "count": 9870, "trend": "stable"},
        {"topic": "Machine Learning", "count": 8750, "trend": "up"},
        {"topic": "Data Science", "count": 7650, "trend": "up"},
        {"topic": "Web Development", "count": 6540, "trend": "stable"},
        {"topic": "Node.js", "count": 5430, "trend": "stable"},
        {"topic": "Docker", "count": 4320, "trend": "up"},
        {"topic": "AWS", "count": 3210, "trend": "up"},
        {"topic": "TypeScript", "count": 2890, "trend": "up"}
    ]
    
    return {"success": True, "topics": popular_topics}

@app.get("/api/resources/categories")
async def get_resource_categories_endpoint():
    """Get available resource categories"""
    categories = get_resource_categories()
    return {"success": True, "categories": categories}

@app.get("/api/resources/youtube/{topic}")
async def get_youtube_videos(topic: str, max_results: int = 5):
    """Get real YouTube videos for a specific topic"""
    try:
        print(f"🎥 Getting YouTube videos for: {topic}")
        
        videos = await search_youtube_videos(topic, max_results)
        
        if not videos:
            return {
                "success": False,
                "message": "No YouTube videos found or API not configured",
                "videos": []
            }
        
        return {
            "success": True,
            "videos": videos,
            "total_count": len(videos),
            "topic": topic,
            "message": f"Found {len(videos)} YouTube videos for {topic}"
        }
        
    except Exception as e:
        print(f"❌ Error getting YouTube videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resources/web-search/{topic}")
async def search_web_for_topic(topic: str, resource_type: str = "general"):
    """Search the web for resources using SerperDevTool"""
    try:
        print(f"🔍 Web searching for: {topic} ({resource_type})")
        
        web_resources = await search_web_resources(topic, resource_type)
        
        if not web_resources:
            return {
                "success": False,
                "message": "No web resources found",
                "resources": []
            }
        
        return {
            "success": True,
            "resources": web_resources,
            "total_count": len(web_resources),
            "topic": topic,
            "resource_type": resource_type,
            "message": f"Found {len(web_resources)} web resources for {topic}"
        }
        
    except Exception as e:
        print(f"❌ Error searching web: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resources/best-video/{topic}")
async def get_best_video(topic: str):
    """Get the best YouTube video for a topic based on relevance and quality"""
    try:
        print(f"🏆 Finding best video for: {topic}")
        
        videos = await search_youtube_videos(f"{topic} complete tutorial guide", max_results=10)
        
        if not videos:
            return {
                "success": False,
                "message": "No videos found",
                "video": None
            }
        
        # Simple scoring algorithm to find the best video
        # You can enhance this with more sophisticated ranking
        best_video = videos[0]  # For now, take the first (most relevant) result
        
        # Add some metadata
        best_video['reason'] = "Most relevant result based on YouTube's ranking algorithm"
        best_video['quality_score'] = 95  # Mock quality score
        
        return {
            "success": True,
            "video": best_video,
            "topic": topic,
            "message": f"Found best video for {topic}"
        }
        
    except Exception as e:
        print(f"❌ Error getting best video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/resources/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time resource updates"""
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "search_resources":
                # Send progress updates
                await manager.send_message(session_id, {
                    "type": "progress",
                    "message": "Searching for resources...",
                    "progress": 25
                })
                
                # Simulate resource discovery
                await asyncio.sleep(1)
                await manager.send_message(session_id, {
                    "type": "progress", 
                    "message": "Analyzing content quality...",
                    "progress": 50
                })
                
                await asyncio.sleep(1)
                await manager.send_message(session_id, {
                    "type": "progress",
                    "message": "Ranking resources...",
                    "progress": 75
                })
                
                # Generate resources
                resources = await generate_ai_resources(
                    topic=message.get("topic", ""),
                    difficulty=message.get("difficulty", "All Levels"),
                    resource_types=message.get("resource_types", []),
                    max_results=message.get("max_results", 8)
                )
                
                await manager.send_message(session_id, {
                    "type": "resources_found",
                    "resources": [resource.dict() for resource in resources],
                    "progress": 100
                })
                
    except WebSocketDisconnect:
        manager.disconnect(session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)