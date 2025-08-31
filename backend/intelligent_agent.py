"""
Intelligent Agent - A powerful mini ChatGPT that asks follow-up questions
when data is insufficient and continues tasks from where it stopped.
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import logging

class IntelligentAgent:
    def __init__(self):
        self.conversation_memory = {}
        self.task_states = {}
        self.context_analyzer = ContextAnalyzer()
        self.question_generator = QuestionGenerator()
        
    def process_query(self, user_id: str, query: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Main processing function that analyzes queries and determines if more info is needed
        """
        # Store conversation in memory
        if user_id not in self.conversation_memory:
            self.conversation_memory[user_id] = []
        
        self.conversation_memory[user_id].append({
            "timestamp": datetime.now().isoformat(),
            "user_query": query,
            "type": "user_input"
        })
        
        # Analyze the query completeness
        analysis = self.context_analyzer.analyze_query_completeness(
            query, 
            self.conversation_memory[user_id],
            conversation_history or []
        )
        
        # Determine response strategy
        if analysis["is_sufficient"]:
            response = self._generate_complete_response(user_id, query, analysis)
        else:
            response = self._generate_follow_up_questions(user_id, query, analysis)
        
        # Store response in memory
        self.conversation_memory[user_id].append({
            "timestamp": datetime.now().isoformat(),
            "agent_response": response,
            "type": "agent_response",
            "analysis": analysis
        })
        
        return response
    
    def _generate_complete_response(self, user_id: str, query: str, analysis: Dict) -> Dict[str, Any]:
        """Generate a complete response when sufficient information is available"""
        return {
            "type": "complete_response",
            "response": f"Based on your request: '{query}', here's what I can help you with...",
            "confidence": analysis["confidence"],
            "task_type": analysis["task_type"],
            "analysis": analysis,
            "needs_followup": False,
            "continuation": self._check_task_continuation(user_id, query)
        }
    
    def _generate_follow_up_questions(self, user_id: str, query: str, analysis: Dict) -> Dict[str, Any]:
        """Generate intelligent follow-up questions when information is insufficient"""
        questions = self.question_generator.generate_questions(query, analysis)
        
        return {
            "type": "follow_up_questions",
            "response": f"I'd love to help you with that! To give you the best assistance, I need a bit more information:",
            "questions": questions,
            "confidence": analysis["confidence"],
            "task_type": analysis["task_type"],
            "analysis": analysis,
            "needs_followup": True,
            "original_query": query
        }
    
    def _check_task_continuation(self, user_id: str, query: str) -> Optional[Dict]:
        """Check if this query continues a previous task"""
        if user_id not in self.conversation_memory:
            return None
            
        recent_conversations = self.conversation_memory[user_id][-10:]  # Last 10 interactions
        
        # Look for continuation keywords
        continuation_keywords = ["also", "and", "additionally", "furthermore", "continue", "next", "then"]
        
        if any(keyword in query.lower() for keyword in continuation_keywords):
            # Find the last incomplete task
            for conv in reversed(recent_conversations):
                if conv.get("type") == "agent_response" and conv.get("analysis", {}).get("task_type"):
                    return {
                        "continuing_task": True,
                        "previous_task": conv.get("analysis", {}).get("task_type"),
                        "context": conv.get("agent_response", {}).get("response", "")
                    }
        
        return None

class ContextAnalyzer:
    def __init__(self):
        self.task_patterns = {
            "image_generation": {
                "keywords": ["create image", "generate image", "make picture", "draw", "visualize"],
                "required_info": ["subject", "style", "purpose"],
                "questions": {
                    "subject": "What should the image show or depict?",
                    "style": "What style would you prefer (realistic, cartoon, abstract, etc.)?",
                    "purpose": "What will you use this image for?"
                }
            },
            "presentation": {
                "keywords": ["presentation", "slides", "ppt", "powerpoint"],
                "required_info": ["topic", "audience", "length", "purpose"],
                "questions": {
                    "topic": "What topic should the presentation cover?",
                    "audience": "Who is your target audience?",
                    "length": "How many slides do you need?",
                    "purpose": "What's the main purpose or goal?"
                }
            },
            "code_generation": {
                "keywords": ["code", "program", "script", "function", "algorithm"],
                "required_info": ["language", "functionality", "requirements"],
                "questions": {
                    "language": "What programming language should I use?",
                    "functionality": "What should the code do exactly?",
                    "requirements": "Are there any specific requirements or constraints?"
                }
            },
            "research": {
                "keywords": ["research", "find information", "learn about", "explain"],
                "required_info": ["topic", "depth", "purpose"],
                "questions": {
                    "topic": "What specific aspect would you like me to focus on?",
                    "depth": "How detailed should the information be?",
                    "purpose": "Is this for academic, professional, or personal use?"
                }
            }
        }
    
    def analyze_query_completeness(self, query: str, memory: List[Dict], history: List[Dict]) -> Dict[str, Any]:
        """Analyze if a query has sufficient information for a complete response"""
        
        # Detect task type
        task_type = self._detect_task_type(query)
        
        # Check information completeness
        missing_info = self._check_missing_information(query, task_type, memory)
        
        # Calculate confidence score
        confidence = self._calculate_confidence(query, task_type, missing_info)
        
        # Determine if information is sufficient
        is_sufficient = len(missing_info) == 0 and confidence > 0.7
        
        return {
            "task_type": task_type,
            "missing_info": missing_info,
            "confidence": confidence,
            "is_sufficient": is_sufficient,
            "query_length": len(query.split()),
            "has_context": len(memory) > 1,
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def _detect_task_type(self, query: str) -> str:
        """Detect what type of task the user is requesting"""
        query_lower = query.lower()
        
        for task_type, config in self.task_patterns.items():
            if any(keyword in query_lower for keyword in config["keywords"]):
                return task_type
        
        return "general_query"
    
    def _check_missing_information(self, query: str, task_type: str, memory: List[Dict]) -> List[str]:
        """Check what information is missing for the detected task type"""
        if task_type not in self.task_patterns:
            return []
        
        required_info = self.task_patterns[task_type]["required_info"]
        missing = []
        
        query_lower = query.lower()
        
        # Check each required piece of information
        for info_type in required_info:
            if not self._has_information_type(query_lower, info_type, memory):
                missing.append(info_type)
        
        return missing
    
    def _has_information_type(self, query: str, info_type: str, memory: List[Dict]) -> bool:
        """Check if specific information type is present in query or memory"""
        
        # Define patterns for different information types
        patterns = {
            "subject": r"(about|of|showing|depicting|with|featuring)\s+\w+",
            "style": r"(style|realistic|cartoon|abstract|modern|vintage)",
            "purpose": r"(for|to|because|since|purpose)",
            "topic": r"(about|on|regarding|concerning)\s+\w+",
            "audience": r"(for|audience|students|professionals|children|adults)",
            "length": r"(\d+\s*(slide|page|minute)|short|long|brief)",
            "language": r"(python|javascript|java|c\+\+|html|css|sql)",
            "functionality": r"(should|will|must|need|want|function|do|calculate|process)",
            "requirements": r"(requirement|must|should|need|constraint|limit)",
            "depth": r"(detailed|brief|overview|comprehensive|simple|advanced)"
        }
        
        if info_type in patterns:
            if re.search(patterns[info_type], query, re.IGNORECASE):
                return True
        
        # Check in conversation memory
        for conv in memory[-5:]:  # Check last 5 conversations
            if info_type in str(conv).lower():
                return True
        
        return False
    
    def _calculate_confidence(self, query: str, task_type: str, missing_info: List[str]) -> float:
        """Calculate confidence score for the query completeness"""
        base_confidence = 0.5
        
        # Boost confidence based on query length and specificity
        word_count = len(query.split())
        if word_count > 10:
            base_confidence += 0.2
        elif word_count > 5:
            base_confidence += 0.1
        
        # Reduce confidence based on missing information
        if task_type in self.task_patterns:
            total_required = len(self.task_patterns[task_type]["required_info"])
            missing_count = len(missing_info)
            completeness_ratio = (total_required - missing_count) / total_required
            base_confidence = base_confidence * completeness_ratio
        
        # Boost confidence for specific keywords
        specific_keywords = ["specific", "exactly", "precisely", "detailed", "complete"]
        if any(keyword in query.lower() for keyword in specific_keywords):
            base_confidence += 0.1
        
        return min(1.0, max(0.0, base_confidence))

class QuestionGenerator:
    def __init__(self):
        self.context_analyzer = ContextAnalyzer()
    
    def generate_questions(self, query: str, analysis: Dict) -> List[Dict[str, str]]:
        """Generate intelligent follow-up questions based on missing information"""
        questions = []
        
        task_type = analysis.get("task_type", "general_query")
        missing_info = analysis.get("missing_info", [])
        
        if task_type in self.context_analyzer.task_patterns:
            task_config = self.context_analyzer.task_patterns[task_type]
            
            for info_type in missing_info:
                if info_type in task_config["questions"]:
                    questions.append({
                        "question": task_config["questions"][info_type],
                        "type": info_type,
                        "priority": self._get_question_priority(info_type, task_type)
                    })
        
        # Add contextual questions based on query analysis
        contextual_questions = self._generate_contextual_questions(query, analysis)
        questions.extend(contextual_questions)
        
        # Sort by priority and limit to top 4 questions
        questions.sort(key=lambda x: x["priority"], reverse=True)
        return questions[:4]
    
    def _get_question_priority(self, info_type: str, task_type: str) -> int:
        """Assign priority to different types of questions"""
        priority_map = {
            "subject": 10,
            "topic": 10,
            "functionality": 9,
            "purpose": 8,
            "audience": 7,
            "style": 6,
            "language": 8,
            "length": 5,
            "depth": 4,
            "requirements": 6
        }
        return priority_map.get(info_type, 3)
    
    def _generate_contextual_questions(self, query: str, analysis: Dict) -> List[Dict[str, str]]:
        """Generate additional contextual questions based on query content"""
        contextual = []
        
        # If query is very short, ask for more details
        if len(query.split()) < 3:
            contextual.append({
                "question": "Could you provide more details about what you're looking for?",
                "type": "clarification",
                "priority": 9
            })
        
        # If query mentions "help" without specifics
        if "help" in query.lower() and analysis["confidence"] < 0.5:
            contextual.append({
                "question": "What specific type of help do you need?",
                "type": "specification",
                "priority": 8
            })
        
        return contextual

# Example usage and testing
if __name__ == "__main__":
    agent = IntelligentAgent()
    
    # Test cases
    test_queries = [
        "create an image",
        "help me make a presentation about renewable energy for students with 10 slides",
        "write some code",
        "I need help with my project"
    ]
    
    for i, query in enumerate(test_queries):
        print(f"\n--- Test {i+1}: '{query}' ---")
        result = agent.process_query(f"user_{i}", query)
        print(f"Type: {result['type']}")
        print(f"Confidence: {result['confidence']:.2f}")
        if result['needs_followup']:
            print("Follow-up questions:")
            for q in result['questions']:
                print(f"  • {q['question']}")
        else:
            print(f"Response: {result['response']}")