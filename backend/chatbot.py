# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# from pydantic import BaseModel
# from langchain_groq import ChatGroq
# from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
# from tavily import TavilyClient
# import os
# from dotenv import load_dotenv
# import uvicorn
# import logging
# import asyncio
# import json
# import re
# from datetime import datetime, timedelta
# from typing import List, Dict, Optional, Any
# import uuid
# from gradio_client import Client
# from PIL import Image
# import base64
# import io
# from intelligent_agent import IntelligentAgent

# # Load environment variables
# load_dotenv()

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="StudyPal AI Agent with Tavily Search", version="1.0.0")

# # Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configure APIs
# groq_api_key = os.getenv("GROQ_API_KEY")
# tavily_api_key = os.getenv("TAVILY_API_KEY")

# # Configure Hugging Face tokens for image generation
# HF_TOKENS = os.getenv("HF_TOKENS")

# if not groq_api_key:
#     logger.error("GROQ_API_KEY not found in environment variables")
#     raise ValueError("GROQ_API_KEY must be set in environment variables")

# # Initialize Tavily client
# tavily_client = None
# if tavily_api_key:
#     try:
#         tavily_client = TavilyClient(api_key=tavily_api_key)
#         logger.info("Tavily search client configured successfully")
#     except Exception as e:
#         logger.error(f"Failed to initialize Tavily client: {str(e)}")
#         tavily_client = None
# else:
#     logger.warning("TAVILY_API_KEY not found - web search functionality disabled")

# logger.info("Configuring Groq AI for StudyPal Agent...")

# # Initialize the Groq LLM
# llm = ChatGroq(
#     groq_api_key=groq_api_key,
#     model="llama3-8b-8192",
#     temperature=0.7,
#     max_tokens=2048,
#     streaming=False
# )

# # Initialize the streaming Groq LLM
# streaming_llm = ChatGroq(
#     groq_api_key=groq_api_key,
#     model="llama3-8b-8192",
#     temperature=0.7,
#     max_tokens=2048,
#     streaming=True
# )

# logger.info("Groq AI configured successfully for StudyPal Agent")

# # ----------------------------
# # Memory Management
# # ----------------------------

# class ConversationMemory:
#     """Manages conversation history and context"""
    
#     def __init__(self, memory_file="conversation_memory.json"):
#         self.memory_file = memory_file
#         self.conversations = self._load_memory()
#         self.max_context_messages = 10  # Keep last 10 exchanges for context
#         self.session_timeout_hours = 24  # Sessions expire after 24 hours
    
#     def _load_memory(self) -> Dict:
#         """Load conversation history from file"""
#         try:
#             if os.path.exists(self.memory_file):
#                 with open(self.memory_file, 'r', encoding='utf-8') as f:
#                     return json.load(f)
#         except Exception as e:
#             logger.error(f"Error loading memory: {str(e)}")
#         return {}
    
#     def _save_memory(self):
#         """Save conversation history to file"""
#         try:
#             with open(self.memory_file, 'w', encoding='utf-8') as f:
#                 json.dump(self.conversations, f, indent=2, ensure_ascii=False)
#         except Exception as e:
#             logger.error(f"Error saving memory: {str(e)}")
    
#     def get_session_id(self, user_id: str = "default") -> str:
#         """Get or create a session ID for the user"""
#         current_time = datetime.now()
        
#         # Check if user has an active session
#         for session_id, session_data in self.conversations.items():
#             if (session_data.get("user_id") == user_id and 
#                 self._is_session_active(session_data.get("last_activity"))):
#                 # Update last activity
#                 session_data["last_activity"] = current_time.isoformat()
#                 self._save_memory()
#                 return session_id
        
#         # Create new session
#         session_id = str(uuid.uuid4())
#         self.conversations[session_id] = {
#             "user_id": user_id,
#             "created_at": current_time.isoformat(),
#             "last_activity": current_time.isoformat(),
#             "messages": []
#         }
#         self._save_memory()
#         return session_id
    
#     def _is_session_active(self, last_activity_str: str) -> bool:
#         """Check if a session is still active"""
#         try:
#             last_activity = datetime.fromisoformat(last_activity_str)
#             return datetime.now() - last_activity < timedelta(hours=self.session_timeout_hours)
#         except:
#             return False
    
#     def add_message(self, session_id: str, message: str, response: str):
#         """Add a message exchange to conversation history with enhanced metadata"""
#         if session_id not in self.conversations:
#             self.conversations[session_id] = {
#                 "user_id": "default",
#                 "created_at": datetime.now().isoformat(),
#                 "last_activity": datetime.now().isoformat(),
#                 "messages": [],
#                 "user_info": {}
#             }
        
#         # Ensure user_info exists for backward compatibility
#         if "user_info" not in self.conversations[session_id]:
#             self.conversations[session_id]["user_info"] = {}
        
#         # Extract user name if mentioned
#         user_name = self._extract_user_name(message)
#         if user_name and "name" not in self.conversations[session_id]["user_info"]:
#             self.conversations[session_id]["user_info"]["name"] = user_name
        
#         # Extract key topics/entities from the conversation
#         try:
#             message_keywords = self._extract_keywords(message.lower())
#             response_keywords = self._extract_keywords(response.lower())
#             keywords = list(message_keywords.union(response_keywords))
#         except Exception as e:
#             logger.error(f"Error extracting keywords: {str(e)}")
#             keywords = []
        
#         self.conversations[session_id]["messages"].append({
#             "timestamp": datetime.now().isoformat(),
#             "user_message": message,
#             "bot_response": response,
#             "keywords": keywords,
#             "message_length": len(message),
#             "response_length": len(response)
#         })
        
#         # Keep only recent messages to prevent memory bloat
#         if len(self.conversations[session_id]["messages"]) > self.max_context_messages:
#             self.conversations[session_id]["messages"] = self.conversations[session_id]["messages"][-self.max_context_messages:]
        
#         self.conversations[session_id]["last_activity"] = datetime.now().isoformat()
#         self._save_memory()
    
#     def _extract_user_name(self, message: str) -> Optional[str]:
#         """Extract user name from message"""
#         # Common patterns for name introduction
#         name_patterns = [
#             r"my name is (\w+)",
#             r"i'm (\w+)",
#             r"i am (\w+)",
#             r"call me (\w+)",
#             r"name's (\w+)",
#         ]
        
#         message_lower = message.lower()
#         for pattern in name_patterns:
#             match = re.search(pattern, message_lower)
#             if match:
#                 name = match.group(1).capitalize()
#                 # Filter out common words that aren't names
#                 if name not in ['studying', 'learning', 'working', 'trying', 'looking', 'going', 'doing']:
#                     return name
#         return None
    
#     def get_user_name(self, session_id: str) -> Optional[str]:
#         """Get user name from session"""
#         if session_id in self.conversations:
#             # Handle backward compatibility - older sessions might not have user_info
#             user_info = self.conversations[session_id].get("user_info", {})
#             return user_info.get("name")
#         return None
    
#     def get_conversation_context(self, session_id: str, current_query: str = "") -> str:
#         """Get intelligent conversation context for the session"""
#         if session_id not in self.conversations:
#             return ""
        
#         messages = self.conversations[session_id]["messages"]
#         if not messages:
#             return ""
        
#         # Analyze current query for context relevance
#         query_keywords = self._extract_keywords(current_query.lower())
        
#         # Get relevant messages based on keywords and recency
#         relevant_messages = self._get_relevant_messages(messages, query_keywords)
        
#         if not relevant_messages:
#             # Fallback to recent messages if no keyword matches
#             relevant_messages = messages[-3:]  # Last 3 exchanges
        
#         context = "*Previous Conversation Context:*\n"
#         context += "The following information was discussed earlier in our conversation:\n\n"
        
#         for i, msg in enumerate(relevant_messages, 1):
#             # Include full context for better understanding
#             user_msg = msg['user_message']
#             bot_msg = msg['bot_response']
            
#             # Truncate only if extremely long
#             if len(user_msg) > 200:
#                 user_msg = user_msg[:200] + "..."
#             if len(bot_msg) > 300:
#                 bot_msg = bot_msg[:300] + "..."
            
#             context += f"Exchange {i}:\n"
#             context += f"User asked: {user_msg}\n"
#             context += f"StudyPal responded: {bot_msg}\n\n"
        
#         # Add contextual instructions
#         context += "*Important Instructions:*\n"
#         context += "- Reference this previous context when the user asks follow-up questions\n"
#         context += "- If the user says 'that', 'it', 'this topic', etc., refer to the most recent relevant topic\n"
#         context += "- Build upon previous explanations rather than starting from scratch\n"
#         context += "- Acknowledge what was previously discussed when relevant\n\n"
        
#         return context
    
#     def _extract_keywords(self, text: str) -> set:
#         """Extract meaningful keywords from text"""
#         # Common stop words to ignore
#         stop_words = {
#             'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
#             'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
#             'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 
#             'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 
#             'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
#             'what', 'when', 'where', 'why', 'how', 'who', 'which'
#         }
        
#         # Extract words and filter out stop words
#         words = re.findall(r'\b\w+\b', text.lower())
#         keywords = {word for word in words if len(word) > 2 and word not in stop_words}
        
#         return keywords
    
#     def _get_relevant_messages(self, messages: list, query_keywords: set) -> list:
#         """Get messages relevant to the current query"""
#         if not query_keywords:
#             return messages[-3:]  # Return recent messages if no keywords
        
#         scored_messages = []
        
#         for msg in messages:
#             # Combine user message and bot response for scoring
#             combined_text = f"{msg['user_message']} {msg['bot_response']}".lower()
#             msg_keywords = self._extract_keywords(combined_text)
            
#             # Calculate relevance score
#             common_keywords = query_keywords.intersection(msg_keywords)
#             relevance_score = len(common_keywords)
            
#             if relevance_score > 0:
#                 scored_messages.append((msg, relevance_score))
        
#         # Sort by relevance score (descending) and take top messages
#         scored_messages.sort(key=lambda x: x[1], reverse=True)
        
#         # Return top 4 relevant messages, but ensure we include recent ones too
#         relevant = [msg for msg, score in scored_messages[:4]]
        
#         # Always include the last message for immediate context
#         if messages and messages[-1] not in relevant:
#             relevant.append(messages[-1])
        
#         # Sort by original order (chronological)
#         relevant.sort(key=lambda x: messages.index(x))
        
#         return relevant[-5:]  # Limit to last 5 for performance
    
#     def _is_followup_question(self, query: str) -> bool:
#         """Detect if the query is a follow-up question"""
#         followup_indicators = [
#             # Pronouns referring to previous topics
#             'that', 'it', 'this', 'these', 'those', 'they', 'them',
#             # Continuation phrases
#             'also', 'additionally', 'furthermore', 'moreover', 'besides',
#             # Reference phrases
#             'the topic', 'what we discussed', 'as mentioned', 'you said',
#             'earlier', 'before', 'previously', 'above',
#             # Question words that often refer back
#             'why is that', 'how does that', 'what about that',
#             # Comparative phrases
#             'compared to', 'similar to', 'different from', 'like that',
#             # Elaboration requests
#             'tell me more', 'explain further', 'go deeper', 'elaborate',
#             'can you expand', 'more details', 'more about'
#         ]
        
#         query_lower = query.lower()
#         return any(indicator in query_lower for indicator in followup_indicators)
    
#     def get_enhanced_context(self, session_id: str, current_query: str) -> str:
#         """Get enhanced context with follow-up detection"""
#         if session_id not in self.conversations:
#             return ""
        
#         messages = self.conversations[session_id]["messages"]
#         if not messages:
#             return ""
        
#         is_followup = self._is_followup_question(current_query)
        
#         if is_followup:
#             # For follow-up questions, provide more comprehensive context
#             context = "*IMPORTANT - This is a FOLLOW-UP question:*\n"
#             context += f"Current question: '{current_query}'\n\n"
#             context += "*Complete Recent Context (User is referring to something discussed):*\n"
            
#             # Include more messages for follow-up questions
#             recent_messages = messages[-4:]  # Last 4 exchanges
            
#             for i, msg in enumerate(recent_messages, 1):
#                 context += f"\nExchange {i}:\n"
#                 context += f"User: {msg['user_message']}\n"
#                 context += f"StudyPal: {msg['bot_response'][:400]}{'...' if len(msg['bot_response']) > 400 else ''}\n"
            
#             context += "\n*CRITICAL INSTRUCTIONS for follow-up:*\n"
#             context += "- The user is asking about something from the above conversation\n"
#             context += "- Identify what 'that', 'it', 'this topic' refers to from the context\n"
#             context += "- Start your response by acknowledging what they're referring to\n"
#             context += "- Build directly on the previous discussion\n"
#             context += "- Don't repeat basic information already covered\n\n"
#         else:
#             # Regular context for new topics
#             context = self.get_conversation_context(session_id, current_query)
        
#         return context
    
#     def clear_session(self, session_id: str):
#         """Clear a specific session"""
#         if session_id in self.conversations:
#             del self.conversations[session_id]
#             self._save_memory()
    
#     def get_session_summary(self, session_id: str) -> Dict:
#         """Get summary of a session"""
#         if session_id not in self.conversations:
#             return {}
        
#         session = self.conversations[session_id]
#         return {
#             "session_id": session_id,
#             "created_at": session.get("created_at"),
#             "last_activity": session.get("last_activity"),
#             "message_count": len(session.get("messages", [])),
#             "is_active": self._is_session_active(session.get("last_activity", ""))
#         }

# # Initialize memory system
# conversation_memory = ConversationMemory()

# # ----------------------------
# # System Prompt
# # ----------------------------

# SYSTEM_PROMPT = """You are StudyPal, an intelligent AI learning assistant with advanced capabilities. Your goal is to provide HIGHLY RELEVANT, SIMPLE, and DIRECT answers to student questions.

# *Personalization Guidelines:*
# - ALWAYS use the user's name when you know it - make responses personal and friendly
# - If you don't know their name yet, ask for it naturally in conversation
# - Remember personal details and reference them appropriately
# - Adapt your teaching style to their learning preferences

# *Response Guidelines:*
# - ANSWER THE EXACT QUESTION ASKED - stay focused and relevant
# - Use SIMPLE, clear language that students can easily understand
# - Be CONCISE - avoid unnecessary information or lengthy explanations
# - Get straight to the point in the first sentence
# - Use practical examples that relate directly to the question

# *Formatting Guidelines:*
# - Use *bold text* for key points and main topics
# - Use bullet points (*) for lists and important facts
# - Use numbered lists (1., 2., 3.) only for step-by-step processes
# - For CODE: Always format in proper markdown code blocks with language specification
# - For MATH: Use proper mathematical notation
# - Keep paragraphs SHORT (1-2 sentences max)
# - Add blank lines between sections for readability

# *Capability Awareness:*
# - You have REAL-TIME INTERNET ACCESS via Tavily search tool
# - When asked about internet access, confirm: "Yes, I have access to the internet using the Tavily search tool"
# - You have IMAGE GENERATION capabilities using the FLUX AI model
# - When asked about image generation, confirm: "Yes, I can generate images using the FLUX AI model"
# - You can search for current information, latest news, real-time data
# - You have CONVERSATION MEMORY - you remember everything we discuss
# - You can help with coding, math, research, writing, academic subjects, and creating images
# - You can provide step-by-step explanations and examples

# *When using web search results:*
# - PRIORITIZE the most current and relevant information
# - SYNTHESIZE information from multiple sources
# - Clearly state "Based on current web sources" when using search data
# - Focus on FACTS and ACCURACY from reliable sources

# *Memory and Context:*
# - You have access to previous conversation history - USE IT ACTIVELY
# - When users ask follow-up questions, ALWAYS reference what was discussed before
# - If users say "that", "it", "this", "the topic we discussed", etc., identify what they're referring to from context
# - Build upon previous explanations - don't repeat everything, just add new information
# - Acknowledge previous discussions: "As we discussed earlier..." or "Building on what I mentioned about..."
# - If a user asks about something similar to a previous topic, connect the dots explicitly

# *Remember:*
# - Students want QUICK, ACCURATE answers
# - Avoid over-explaining unless specifically asked for details
# - Make every word count - be precise and helpful
# - If the question is simple, give a simple answer
# - Use conversation context to provide more personalized responses
# - Always be encouraging and supportive in your teaching approach

# Please provide responses that are immediately useful and easy to understand."""

# # ----------------------------
# # Agent Functions
# # ----------------------------

# class StudyPalAgent:
#     """Simplified StudyPal Agent with intelligent routing"""
    
#     def _init_(self):
#         self.llm = llm
#         self.streaming_llm = streaming_llm
#         self.tavily_client = tavily_client
#         self.intelligent_agent = IntelligentAgent()
    
#     def needs_web_search(self, query: str) -> bool:
#         """Determine if a query needs web search"""
#         query_lower = query.lower()
        
#         # Define indicators that suggest web search is needed
#         web_search_indicators = [
#             # Time and date related
#             'current date', 'what date', 'today\'s date', 'current time', 'what time',
#             'today', 'now', 'this year', '2024', '2025',
            
#             # Current events and news
#             'latest', 'recent', 'breaking', 'news', 'current events', 'what happened',
#             'trending', 'viral', 'popular now', 'just announced',
            
#             # Real-time data
#             'weather', 'temperature', 'forecast', 'stock price', 'market', 'cryptocurrency',
#             'bitcoin', 'price of', 'cost of', 'exchange rate',
            
#             # Explicit search requests
#             'search web', 'look up', 'find online', 'check online', 'google',
#             'search for', 'find current', 'what\'s new'
#         ]
        
#         # Check for patterns that indicate current information is needed
#         current_patterns = [
#             r'what.current.',
#             r'what.latest.',
#             r'what.today.',
#             r'what.now.',
#             r'current.*',
#             r'latest.*',
#             r'recent.*'
#         ]
        
#         # Check indicators
#         for indicator in web_search_indicators:
#             if indicator in query_lower:
#                 return True
        
#         # Check patterns
#         for pattern in current_patterns:
#             if re.search(pattern, query_lower):
#                 return True
        
#         return False
    
#     def needs_image_generation(self, query: str) -> bool:
#         """Determine if a query needs image generation"""
#         query_lower = query.lower()
        
#         # Define indicators that suggest image generation is needed
#         image_generation_indicators = [
#             # Direct requests
#             'generate image', 'create image', 'make image', 'draw image',
#             'generate picture', 'create picture', 'make picture', 'draw picture',
#             'generate photo', 'create photo', 'make photo',
            
#             # Art and design requests
#             'design', 'illustrate', 'visualize', 'sketch', 'paint',
#             'artwork', 'illustration', 'visual', 'graphic',
            
#             # Show me requests
#             'show me', 'can you show', 'i want to see',
            
#             # Creative requests
#             'imagine', 'picture of', 'image of', 'drawing of',
#             'render', 'create art', 'make art'
#         ]
        
#         # Check for patterns that indicate image generation is needed
#         image_patterns = [
#             r'generate.image.',
#             r'create.image.',
#             r'make.image.',
#             r'draw.*',
#             r'show me.image.',
#             r'show me.picture.',
#             r'can you.image.',
#             r'can you.picture.',
#             r'i want.image.',
#             r'i need.image.'
#         ]
        
#         # Check indicators
#         for indicator in image_generation_indicators:
#             if indicator in query_lower:
#                 return True
        
#         # Check patterns
#         for pattern in image_patterns:
#             if re.search(pattern, query_lower):
#                 return True
        
#         return False
    
#     def search_web(self, query: str) -> str:
#         """Perform dual web searches using Tavily for comprehensive results"""
#         if not self.tavily_client:
#             return "Web search not available"
        
#         try:
#             logger.info(f"Performing dual web searches for: {query[:50]}...")
            
#             # Create two different search queries for better coverage
#             primary_query = query
#             secondary_query = self._create_alternative_query(query)
            
#             # Perform two simultaneous searches
#             import asyncio
#             import concurrent.futures
            
#             def perform_single_search(search_query, search_type="advanced"):
#                 try:
#                     return self.tavily_client.search(
#                         query=search_query,
#                         search_depth=search_type,
#                         max_results=4
#                     )
#                 except Exception as e:
#                     logger.error(f"Error in single search: {str(e)}")
#                     return None
            
#             # Execute both searches concurrently
#             with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
#                 future1 = executor.submit(perform_single_search, primary_query, "advanced")
#                 future2 = executor.submit(perform_single_search, secondary_query, "basic")
                
#                 search_response1 = future1.result(timeout=10)
#                 search_response2 = future2.result(timeout=10)
            
#             # Combine and format search results
#             search_content = self._format_dual_search_results(search_response1, search_response2, query)
            
#             logger.info("Dual web search completed successfully")
#             return search_content
            
#         except Exception as e:
#             logger.error(f"Error performing dual web search: {str(e)}")
#             return f"Error performing web search: {str(e)}"
    
#     def _create_alternative_query(self, original_query: str) -> str:
#         """Create an alternative search query for broader coverage"""
#         query_lower = original_query.lower()
        
#         # Add context-specific terms for better search coverage
#         if 'current date' in query_lower or 'what date' in query_lower:
#             return "today's date current time"
#         elif 'weather' in query_lower:
#             return f"{original_query} forecast today"
#         elif 'news' in query_lower or 'latest' in query_lower:
#             return f"{original_query} recent updates"
#         elif 'stock' in query_lower or 'price' in query_lower:
#             return f"{original_query} market today"
#         else:
#             # Add "latest" or "current" to make it more specific
#             return f"latest {original_query} current information"
    
#     def _format_dual_search_results(self, search1, search2, original_query: str) -> str:
#         """Format and combine results from dual searches"""
#         all_results = []
        
#         # Collect results from first search
#         if search1 and "results" in search1:
#             for result in search1["results"][:3]:
#                 all_results.append({
#                     "title": result.get("title", ""),
#                     "content": result.get("content", ""),
#                     "url": result.get("url", ""),
#                     "source": "Search 1"
#                 })
        
#         # Collect results from second search
#         if search2 and "results" in search2:
#             for result in search2["results"][:3]:
#                 # Avoid duplicates by checking title similarity
#                 is_duplicate = any(
#                     self._is_similar_title(result.get("title", ""), existing["title"]) 
#                     for existing in all_results
#                 )
#                 if not is_duplicate:
#                     all_results.append({
#                         "title": result.get("title", ""),
#                         "content": result.get("content", ""),
#                         "url": result.get("url", ""),
#                         "source": "Search 2"
#                     })
        
#         # Format combined results
#         if not all_results:
#             return "No search results found"
        
#         search_content = f"*Web Search Results for: {original_query}*\n\n"
#         search_content += f"Found {len(all_results)} relevant sources from dual search\n\n"
        
#         for i, result in enumerate(all_results[:5], 1):  # Limit to top 5 results
#             search_content += f"{i}. *{result['title']}*\n"
#             search_content += f"   {result['content'][:180]}...\n"
#             search_content += f"   Source: {result['url']}\n\n"
        
#         return search_content
    
#     def _is_similar_title(self, title1: str, title2: str) -> bool:
#         """Check if two titles are similar to avoid duplicates"""
#         if not title1 or not title2:
#             return False
        
#         # Simple similarity check - if they share significant words
#         words1 = set(title1.lower().split())
#         words2 = set(title2.lower().split())
        
#         # Remove common words
#         common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
#         words1 = words1 - common_words
#         words2 = words2 - common_words
        
#         if len(words1) == 0 or len(words2) == 0:
#             return False
        
#         # If more than 60% of words overlap, consider it similar
#         overlap = len(words1.intersection(words2))
#         similarity = overlap / min(len(words1), len(words2))
        
#         return similarity > 0.6
    
#     def process_intelligent_query(self, user_id: str, query: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
#         """Process query using intelligent agent for smart follow-up questions"""
#         try:
#             # Use the intelligent agent to analyze and process the query
#             result = self.intelligent_agent.process_query(user_id, query, conversation_history)
            
#             # If the agent needs follow-up questions, return them
#             if result.get("needs_followup", False):
#                 return result
            
#             # If the agent has sufficient information, process the complete response
#             if result.get("type") == "complete_response":
#                 # Route to appropriate handler based on task type
#                 task_type = result.get("task_type", "general_query")
                
#                 if task_type == "image_generation":
#                     # Generate image with the complete information
#                     image_result = self.generate_image(query)
#                     result["image_data"] = image_result
#                 elif self.needs_web_search(query):
#                     # Add web search results
#                     search_results = self.search_web(query)
#                     result["search_results"] = search_results
                
#                 # Generate the final response using LLM
#                 enhanced_query = f"""
#                 Task Type: {task_type}
#                 Original Query: {query}
#                 Analysis: {result.get('analysis', {})}
                
#                 Please provide a complete, helpful response to this query.
#                 """
                
#                 messages = [
#                     SystemMessage(content=SYSTEM_PROMPT),
#                     HumanMessage(content=enhanced_query)
#                 ]
                
#                 llm_response = self.llm.invoke(messages)
#                 result["final_response"] = llm_response.content
            
#             return result
            
#         except Exception as e:
#             logger.error(f"Error in intelligent query processing: {str(e)}")
#             return {
#                 "type": "error",
#                 "response": f"I encountered an error processing your request: {str(e)}",
#                 "needs_followup": False
#             }
    
#     def generate_image(self, prompt: str) -> str:
#         """Generate image using FLUX AI model and save to file for fast loading"""
#         if not HF_TOKENS:
#             return "Image generation not available - Hugging Face tokens not configured"
        
#         try:
#             logger.info(f"Generating image with FLUX AI: {prompt[:50]}...")
            
#             # Select token (use first available for simplicity)
#             selected_token = HF_TOKENS[0]
            
#             # Enhance the prompt for better results
#             enhanced_prompt = f"{prompt}, high quality, detailed, professional, 8k resolution"
            
#             # Connect to FLUX model
#             client = Client("black-forest-labs/FLUX.1-schnell", hf_token=selected_token)
            
#             # Generate image
#             result = client.predict(
#                 prompt=enhanced_prompt,
#                 height=576,
#                 width=1024,
#                 num_inference_steps=8,
#                 api_name="/infer"
#             )
            
#             # Get the generated image path
#             temp_image_path = result[0]
            
#             # Create images directory if it doesn't exist
#             import os
#             images_dir = "generated_images"
#             if not os.path.exists(images_dir):
#                 os.makedirs(images_dir)
            
#             # Generate unique filename
#             import time
#             timestamp = int(time.time())
#             image_filename = f"generated_image_{timestamp}.png"
#             image_path = os.path.join(images_dir, image_filename)
            
#             # Optimize and save image for fast loading
#             with Image.open(temp_image_path) as img:
#                 img = img.convert('RGB')
#                 # Optimize size for web (smaller = faster loading)
#                 if img.size[0] > 600:
#                     img.thumbnail((600, 450), Image.Resampling.LANCZOS)
                
#                 # Save optimized image
#                 img.save(image_path, format='PNG', quality=80, optimize=True)
            
#             logger.info(f"Image saved to: {image_path}")
            
#             # Return the image URL instead of base64 for instant loading
#             image_url = f"http://localhost:8001/images/{image_filename}"
#             logger.info("Image generated successfully with FLUX AI")
#             return image_url
            
#         except Exception as e:
#             logger.error(f"Error generating image with FLUX AI: {str(e)}")
#             # Try with fallback token if available
#             if len(HF_TOKENS) > 1:
#                 try:
#                     logger.info("Retrying with fallback token...")
#                     fallback_token = HF_TOKENS[1]
#                     client = Client("black-forest-labs/FLUX.1-schnell", hf_token=fallback_token)
                    
#                     result = client.predict(
#                         prompt=enhanced_prompt,
#                         height=576,
#                         width=1024,
#                         num_inference_steps=8,
#                         api_name="/infer"
#                     )
                    
#                     temp_image_path = result[0]
                    
#                     # Create images directory if it doesn't exist
#                     import os
#                     images_dir = "generated_images"
#                     if not os.path.exists(images_dir):
#                         os.makedirs(images_dir)
                    
#                     # Generate unique filename
#                     import time
#                     timestamp = int(time.time())
#                     image_filename = f"generated_image_{timestamp}.png"
#                     image_path = os.path.join(images_dir, image_filename)
                    
#                     with Image.open(temp_image_path) as img:
#                         img = img.convert('RGB')
#                         if img.size[0] > 600:
#                             img.thumbnail((600, 450), Image.Resampling.LANCZOS)
                        
#                         img.save(image_path, format='PNG', quality=80, optimize=True)
                    
#                     image_url = f"http://localhost:8001/images/{image_filename}"
#                     logger.info("Image generated successfully with fallback token")
#                     return image_url
                    
#                 except Exception as e2:
#                     logger.error(f"Error with fallback token: {str(e2)}")
#                     return f"Error generating image: {str(e2)}"
#             else:
#                 return f"Error generating image: {str(e)}"
    
#     def generate_intelligent_response(self, query: str, session_id: str = None) -> Dict:
#         """Generate intelligent response with follow-up questions and task continuation"""
#         logger.info(f"🧠 Processing intelligent query: {query[:50]}...")
        
#         # Use the intelligent agent to analyze and respond
#         intelligent_result = self.intelligent_agent.generate_intelligent_response(query, session_id)
        
#         # Check if we need web search or image generation
#         needs_search = self.needs_web_search(query)
#         needs_image = self.needs_image_generation(query)
        
#         search_results = ""
#         generated_image = ""
        
#         # Only perform search/image generation if we have sufficient info
#         if intelligent_result["analysis"]["sufficient_info"]:
#             if needs_search:
#                 logger.info("Query requires web search - performing search...")
#                 search_results = self.search_web(query)
                
#                 # Enhance response with search results
#                 enhanced_query = f"""
# Original query: {query}

# Web search results: {search_results}

# Please provide a comprehensive response using both the search results and your knowledge.
# """
#                 intelligent_result["response"] = self._enhance_response_with_search(
#                     intelligent_result["response"], enhanced_query, session_id
#                 )
                
#             elif needs_image:
#                 logger.info("Query requires image generation - generating image...")
#                 generated_image = self.generate_image(query)
                
#                 # Add image to response
#                 if generated_image:
#                     if generated_image.startswith('http'):
#                         intelligent_result["response"] += f"\n\n![Generated Image]({generated_image})"
#                     else:
#                         intelligent_result["response"] += f"\n\n![Generated Image](data:image/png;base64,{generated_image})"
        
#         # Store conversation in memory
#         if session_id:
#             try:
#                 conversation_memory.add_message(session_id, query, intelligent_result["response"])
#             except Exception as e:
#                 logger.error(f"Error storing conversation in memory: {str(e)}")
        
#         return intelligent_result
    
#     def _enhance_response_with_search(self, base_response: str, enhanced_query: str, session_id: str = None) -> str:
#         """Enhance response with web search results"""
#         try:
#             # Get conversation context
#             context = ""
#             if session_id:
#                 context = conversation_memory.get_enhanced_context(session_id, enhanced_query)
            
#             enhancement_prompt = f"""
# You have provided this initial response:
# {base_response}

# Now enhance it with current web search information:
# {enhanced_query}

# Conversation context: {context}

# Provide an enhanced, comprehensive response that combines your initial answer with the current web information.
# """
            
#             messages = [
#                 SystemMessage(content=SYSTEM_PROMPT),
#                 HumanMessage(content=enhancement_prompt)
#             ]
            
#             response = self.llm.invoke(messages)
#             return response.content
            
#         except Exception as e:
#             logger.error(f"Error enhancing response with search: {e}")
#             return base_response
    
#     def generate_response(self, query: str, session_id: str = None) -> str:
#         """Generate response with optional web search and conversation memory"""
#         logger.info(f"Processing query: {query[:50]}...")
        
#         # Get enhanced conversation context and user info if session_id provided
#         conversation_context = ""
#         user_name = ""
#         if session_id:
#             conversation_context = conversation_memory.get_enhanced_context(session_id, query)
#             user_name = conversation_memory.get_user_name(session_id) or ""
        
#         # Check if web search is needed
#         needs_search = self.needs_web_search(query)
#         search_results = ""
        
#         # Check if image generation is needed
#         needs_image = self.needs_image_generation(query)
#         generated_image = ""
        
#         if needs_search:
#             logger.info("Query requires web search - performing search...")
#             search_results = self.search_web(query)
#         elif needs_image:
#             logger.info("Query requires image generation - generating image...")
#             generated_image = self.generate_image(query)
#         else:
#             logger.info("Query can be answered with knowledge - proceeding without search or image generation")
        
#         # Prepare the prompt with context and search results
#         enhanced_prompt = SYSTEM_PROMPT
        
#         # Add user name information if available
#         if user_name:
#             enhanced_prompt += f"\n\n*USER INFORMATION:*\nThe user's name is {user_name}. Always address them by name and make responses personal.\n"
        
#         if conversation_context:
#             enhanced_prompt += f"\n\n{conversation_context}"
        
#         if search_results and needs_search:
#             enhanced_prompt += f"""

# *IMPORTANT: You have access to current web search results. Use this information to provide up-to-date, accurate answers.*

# Web Search Results:
# {search_results}

# Based on the above search results, conversation context, and your knowledge, please provide a comprehensive answer to the user's question. Make sure to:
# 1. Use the most current information from the search results
# 2. Clearly indicate that the information is from recent web sources
# 3. Structure your response with proper formatting
# 4. Synthesize information from multiple sources when available
# 5. Reference previous conversation context when relevant"""
#         else:
#             if conversation_context:
#                 enhanced_prompt += "\n\nBased on the conversation context and your knowledge, please provide a helpful response that maintains continuity with previous exchanges."
        
#         messages = [
#             SystemMessage(content=enhanced_prompt),
#             HumanMessage(content=query)
#         ]
        
#         # Generate response using Groq
#         response = self.llm.invoke(messages)
        
#         # Include generated image in response if available
#         final_response = response.content
#         if generated_image:
#             if generated_image.startswith('http'):
#                 # Image URL format for fast loading
#                 final_response += f"\n\n![Generated Image]({generated_image})"
#             else:
#                 # Fallback to base64 if URL not available
#                 final_response += f"\n\n![Generated Image](data:image/png;base64,{generated_image})"
#             logger.info("Image included in response")
        
#         # Store the conversation in memory
#         if session_id:
#             try:
#                 conversation_memory.add_message(session_id, query, final_response)
#             except Exception as e:
#                 logger.error(f"Error storing conversation in memory: {str(e)}")
        
#         logger.info("Response generated successfully")
#         return final_response
    
#     async def generate_streaming_response(self, query: str, session_id: str = None):
#         """Generate streaming response with optional web search, memory, and status updates"""
#         logger.info(f"Processing streaming query: {query[:50]}...")
        
#         # Get enhanced conversation context and user info if session_id provided
#         conversation_context = ""
#         user_name = ""
#         if session_id:
#             conversation_context = conversation_memory.get_enhanced_context(session_id, query)
#             user_name = conversation_memory.get_user_name(session_id) or ""
        
#         # Check if web search or image generation is needed
#         needs_search = self.needs_web_search(query)
#         needs_image = self.needs_image_generation(query)
#         search_results = ""
#         generated_image = ""
        
#         # Yield search status if needed
#         if needs_search:
#             logger.info("Query requires web search - performing search...")
#             yield {"type": "search_start", "message": "Searching the web..."}
#             search_results = self.search_web(query)
#             yield {"type": "search_complete", "message": "Search completed"}
#         elif needs_image:
#             logger.info("Query requires image generation - generating image...")
#             yield {"type": "image_start", "message": "Generating image with FLUX AI..."}
#             generated_image = self.generate_image(query)
#             yield {"type": "image_complete", "message": "Image generated successfully"}
#         else:
#             logger.info("Query can be answered with knowledge - proceeding without search or image generation")
        
#         # Prepare the prompt with context and search results
#         enhanced_prompt = SYSTEM_PROMPT
        
#         # Add user name information if available
#         if user_name:
#             enhanced_prompt += f"\n\n*USER INFORMATION:*\nThe user's name is {user_name}. Always address them by name and make responses personal.\n"
        
#         if conversation_context:
#             enhanced_prompt += f"\n\n{conversation_context}"
        
#         if search_results and needs_search:
#             enhanced_prompt += f"""

# *IMPORTANT: You have access to current web search results. Use this information to provide up-to-date, accurate answers.*

# Web Search Results:
# {search_results}

# Based on the above search results, conversation context, and your knowledge, please provide a comprehensive answer to the user's question. Make sure to:
# 1. Use the most current information from the search results
# 2. Clearly indicate that the information is from recent web sources
# 3. Structure your response with proper formatting
# 4. Synthesize information from multiple sources when available
# 5. Reference previous conversation context when relevant"""
#         else:
#             if conversation_context:
#                 enhanced_prompt += "\n\nBased on the conversation context and your knowledge, please provide a helpful response that maintains continuity with previous exchanges."
        
#         messages = [
#             SystemMessage(content=enhanced_prompt),
#             HumanMessage(content=query)
#         ]
        
#         # Indicate response generation is starting
#         yield {"type": "response_start", "message": "Generating response..."}
        
#         # Stream response using Groq and collect full response for memory
#         full_response = ""
#         async for chunk in self.streaming_llm.astream(messages):
#             if chunk.content:
#                 full_response += chunk.content
#                 yield {"type": "content", "content": chunk.content}
        
#         # Add generated image to response if available
#         if generated_image:
#             if generated_image.startswith('http'):
#                 # Image URL format for fast loading
#                 image_markdown = f"\n\n![Generated Image]({generated_image})"
#             else:
#                 # Fallback to base64 if URL not available
#                 image_markdown = f"\n\n![Generated Image](data:image/png;base64,{generated_image})"
            
#             full_response += image_markdown
#             yield {"type": "content", "content": image_markdown}
#             yield {"type": "image_generated", "image": generated_image}
        
#         # Store the conversation in memory after streaming is complete
#         if session_id and full_response:
#             try:
#                 conversation_memory.add_message(session_id, query, full_response)
#             except Exception as e:
#                 logger.error(f"Error storing conversation in memory: {str(e)}")

# # Initialize the agent
# studypal_agent = StudyPalAgent()

# # ----------------------------
# # Pydantic Models
# # ----------------------------

# class ChatMessage(BaseModel):
#     message: str
#     session_id: Optional[str] = None
#     user_id: Optional[str] = "default"

# class ChatResponse(BaseModel):
#     response: str
#     status: str
#     session_id: str

# class SessionRequest(BaseModel):
#     user_id: Optional[str] = "default"

# class SessionResponse(BaseModel):
#     session_id: str
#     status: str

# # ----------------------------
# # FastAPI Endpoints
# # ----------------------------

# @app.get("/")
# async def root():
#     return {"message": "StudyPal AI Agent with Tavily Search is running!"}

# @app.post("/chat", response_model=ChatResponse)
# async def chat(chat_message: ChatMessage):
#     try:
#         if not chat_message.message.strip():
#             raise HTTPException(status_code=400, detail="Message cannot be empty")
        
#         # Get or create session
#         session_id = chat_message.session_id
#         if not session_id:
#             session_id = conversation_memory.get_session_id(chat_message.user_id)
        
#         logger.info(f"Processing query with StudyPal agent (session: {session_id[:8]}...): {chat_message.message[:50]}...")
        
#         # Generate response using the agent with memory
#         response = studypal_agent.generate_response(chat_message.message, session_id)
        
#         return ChatResponse(
#             response=response,
#             status="success",
#             session_id=session_id
#         )
    
#     except Exception as e:
#         logger.error(f"Error in chat endpoint: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# @app.post("/chat/intelligent")
# async def intelligent_chat(chat_message: ChatMessage):
#     """Intelligent chat endpoint with follow-up questions and task continuation"""
#     try:
#         if not chat_message.message.strip():
#             raise HTTPException(status_code=400, detail="Message cannot be empty")
        
#         # Get or create session
#         session_id = chat_message.session_id
#         if not session_id:
#             session_id = conversation_memory.get_session_id(chat_message.user_id)
        
#         logger.info(f"🧠 Processing intelligent query (session: {session_id[:8]}...): {chat_message.message[:50]}...")
        
#         # Get conversation history for context
#         conversation_history = []
#         if session_id in conversation_memory.conversations:
#             conversation_history = conversation_memory.conversations[session_id].get("messages", [])
        
#         # Process with intelligent agent
#         result = studypal_agent.process_intelligent_query(
#             user_id=chat_message.user_id or "default",
#             query=chat_message.message,
#             conversation_history=conversation_history
#         )
        
#         # Store the interaction in memory if it's a complete response
#         if result.get("type") == "complete_response" and result.get("final_response"):
#             conversation_memory.add_message(
#                 session_id, 
#                 chat_message.message, 
#                 result["final_response"]
#             )
        
#         return {
#             "response": result.get("final_response") or result.get("response", ""),
#             "status": "success",
#             "session_id": session_id,
#             "analysis": result.get("analysis", {}),
#             "follow_up_questions": result.get("questions", []),
#             "needs_clarification": result.get("needs_followup", False),
#             "response_type": result.get("type", "unknown"),
#             "confidence": result.get("confidence", 0.0),
#             "task_type": result.get("task_type", "general"),
#             "intelligence_level": "advanced",
#             "image_data": result.get("image_data"),
#             "search_results": result.get("search_results")
#         }
    
#     except Exception as e:
#         logger.error(f"Error in intelligent chat endpoint: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error generating intelligent response: {str(e)}")

# @app.post("/chat/stream")
# async def chat_stream(chat_message: ChatMessage):
#     try:
#         if not chat_message.message.strip():
#             raise HTTPException(status_code=400, detail="Message cannot be empty")
        
#         # Get or create session
#         session_id = chat_message.session_id
#         if not session_id:
#             session_id = conversation_memory.get_session_id(chat_message.user_id)
        
#         logger.info(f"Processing streaming query with StudyPal agent (session: {session_id[:8]}...): {chat_message.message[:50]}...")
        
#         async def generate_stream():
#             try:
#                 buffer = ""
#                 # Send session ID first
#                 session_data = {
#                     "type": "session",
#                     "session_id": session_id,
#                     "done": False
#                 }
#                 yield f"data: {json.dumps(session_data)}\n\n"
                
#                 async for chunk in studypal_agent.generate_streaming_response(chat_message.message, session_id):
#                     if isinstance(chunk, dict):
#                         # Handle status messages
#                         if chunk["type"] in ["search_start", "search_complete", "response_start"]:
#                             status_data = {
#                                 "type": "status",
#                                 "status": chunk["type"],
#                                 "message": chunk["message"],
#                                 "done": False
#                             }
#                             yield f"data: {json.dumps(status_data)}\n\n"
                            
#                             # Add a small delay for search operations
#                             if chunk["type"] == "search_start":
#                                 await asyncio.sleep(0.5)  # Show searching indicator
                        
#                         elif chunk["type"] == "content":
#                             # Handle content streaming
#                             content = chunk["content"]
#                             buffer += content
                            
#                             # Send content in small groups for natural typing effect
#                             while len(buffer) >= 3:  # Send 3 characters at a time
#                                 chunk_to_send = buffer[:3]
#                                 buffer = buffer[3:]
                                
#                                 data = {
#                                     "type": "content",
#                                     "content": chunk_to_send,
#                                     "done": False
#                                 }
#                                 yield f"data: {json.dumps(data)}\n\n"
                                
#                                 # Variable delay for more natural typing rhythm
#                                 if chunk_to_send.endswith(' '):
#                                     await asyncio.sleep(0.03)  # Slightly longer pause after words
#                                 elif chunk_to_send.endswith('.') or chunk_to_send.endswith('!') or chunk_to_send.endswith('?'):
#                                     await asyncio.sleep(0.08)  # Longer pause after sentences
#                                 else:
#                                     await asyncio.sleep(0.02)  # Normal typing speed
                    
#                     elif isinstance(chunk, str):
#                         # Handle legacy string content (fallback)
#                         buffer += chunk
                        
#                         while len(buffer) >= 3:
#                             chunk_to_send = buffer[:3]
#                             buffer = buffer[3:]
                            
#                             data = {
#                                 "type": "content",
#                                 "content": chunk_to_send,
#                                 "done": False
#                             }
#                             yield f"data: {json.dumps(data)}\n\n"
#                             await asyncio.sleep(0.02)
                
#                 # Send any remaining content
#                 if buffer:
#                     data = {
#                         "type": "content",
#                         "content": buffer,
#                         "done": False
#                     }
#                     yield f"data: {json.dumps(data)}\n\n"
                
#                 # Send completion signal
#                 final_data = {
#                     "type": "complete",
#                     "content": "",
#                     "done": True
#                 }
#                 yield f"data: {json.dumps(final_data)}\n\n"
                
#             except Exception as e:
#                 logger.error(f"Error in streaming: {str(e)}")
#                 error_data = {
#                     "type": "error",
#                     "error": str(e),
#                     "done": True
#                 }
#                 yield f"data: {json.dumps(error_data)}\n\n"
        
#         return StreamingResponse(
#             generate_stream(),
#             media_type="text/plain",
#             headers={
#                 "Cache-Control": "no-cache",
#                 "Connection": "keep-alive",
#                 "Content-Type": "text/event-stream",
#             }
#         )
    
#     except Exception as e:
#         logger.error(f"Error in streaming chat endpoint: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error generating streaming response: {str(e)}")

# @app.get("/health")
# async def health_check():
#     return {
#         "status": "healthy", 
#         "service": "studypal-agent", 
#         "model": "groq-llama",
#         "agent_type": "simplified-intelligent-agent",
#         "web_search": "enabled" if tavily_client else "disabled",
#         "search_provider": "tavily"
#     }

# @app.get("/test")
# async def test_agent():
#     """Test endpoint to verify StudyPal agent"""
#     try:
#         # Test with a simple query
#         response = studypal_agent.generate_response("Hello, please introduce yourself as StudyPal.")
        
#         return {
#             "status": "success", 
#             "message": "StudyPal agent is working",
#             "model": "llama3-8b-8192",
#             "agent_type": "simplified-intelligent-agent",
#             "test_response": response[:200] + "..." if len(response) > 200 else response
#         }
#     except Exception as e:
#         logger.error(f"Agent test failed: {str(e)}")
#         return {"status": "error", "message": f"StudyPal agent test failed: {str(e)}"}

# @app.get("/test/search")
# async def test_search():
#     """Test endpoint to verify web search functionality"""
#     if not tavily_client:
#         return {"status": "error", "message": "Tavily search not configured"}
    
#     try:
#         # Test with a search query
#         response = studypal_agent.generate_response("What is the current date?")
        
#         return {
#             "status": "success",
#             "message": "Web search is working",
#             "search_provider": "tavily",
#             "test_response": response[:200] + "..." if len(response) > 200 else response
#         }
#     except Exception as e:
#         logger.error(f"Search test failed: {str(e)}")
#         return {"status": "error", "message": f"Web search test failed: {str(e)}"}

# # ----------------------------
# # Memory Management Endpoints
# # ----------------------------

# @app.post("/session/new", response_model=SessionResponse)
# async def create_new_session(request: SessionRequest):
#     """Create a new conversation session"""
#     try:
#         session_id = conversation_memory.get_session_id(request.user_id)
#         return SessionResponse(
#             session_id=session_id,
#             status="success"
#         )
#     except Exception as e:
#         logger.error(f"Error creating session: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

# @app.get("/session/{session_id}/summary")
# async def get_session_summary(session_id: str):
#     """Get summary of a conversation session"""
#     try:
#         summary = conversation_memory.get_session_summary(session_id)
#         if not summary:
#             raise HTTPException(status_code=404, detail="Session not found")
#         return summary
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error getting session summary: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error getting session summary: {str(e)}")

# @app.get("/session/{session_id}/history")
# async def get_session_history(session_id: str):
#     """Get conversation history for a session"""
#     try:
#         if session_id not in conversation_memory.conversations:
#             raise HTTPException(status_code=404, detail="Session not found")
        
#         session_data = conversation_memory.conversations[session_id]
#         return {
#             "session_id": session_id,
#             "messages": session_data.get("messages", []),
#             "created_at": session_data.get("created_at"),
#             "last_activity": session_data.get("last_activity")
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error getting session history: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error getting session history: {str(e)}")

# @app.delete("/session/{session_id}")
# async def clear_session(session_id: str):
#     """Clear a conversation session"""
#     try:
#         conversation_memory.clear_session(session_id)
#         return {"status": "success", "message": f"Session {session_id} cleared"}
#     except Exception as e:
#         logger.error(f"Error clearing session: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error clearing session: {str(e)}")

# @app.get("/memory/stats")
# async def get_memory_stats():
#     """Get memory system statistics"""
#     try:
#         total_sessions = len(conversation_memory.conversations)
#         active_sessions = sum(1 for session in conversation_memory.conversations.values() 
#                             if conversation_memory._is_session_active(session.get("last_activity", "")))
#         total_messages = sum(len(session.get("messages", [])) for session in conversation_memory.conversations.values())
        
#         return {
#             "total_sessions": total_sessions,
#             "active_sessions": active_sessions,
#             "total_messages": total_messages,
#             "memory_file": conversation_memory.memory_file,
#             "max_context_messages": conversation_memory.max_context_messages,
#             "session_timeout_hours": conversation_memory.session_timeout_hours
#         }
#     except Exception as e:
#         logger.error(f"Error getting memory stats: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error getting memory stats: {str(e)}")

# @app.get("/agent/info")
# async def agent_info():
#     """Get information about the StudyPal agent"""
#     return {
#         "agent_type": "StudyPal Intelligent Agent with Memory",
#         "capabilities": [
#             "Educational explanations",
#             "Intelligent web search",
#             "Current information retrieval",
#             "Structured formatting",
#             "Streaming responses",
#             "Smart query analysis",
#             "Conversation memory",
#             "Context awareness",
#             "Session management"
#         ],
#         "search_triggers": [
#             "Current date/time queries",
#             "Latest news or developments",
#             "Weather, stock prices, market data",
#             "Recent events or trending topics",
#             "Queries with 'current', 'latest', 'today', 'now'"
#         ],
#         "memory_features": [
#             "Automatic session creation",
#             "Conversation context retention",
#             "Reference to previous topics",
#             "Personalized responses",
