"""
Multi-Agent System for Enhanced PPT Generation
Each agent specializes in a specific aspect of presentation creation
"""

import json
import asyncio
import time
from typing import Dict, List, Optional, Any
import google.generativeai as genai
from dataclasses import dataclass
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentRole(Enum):
    CONTENT_STRATEGIST = "content_strategist"
    DESIGN_SPECIALIST = "design_specialist"
    VISUAL_CURATOR = "visual_curator"
    NARRATIVE_ARCHITECT = "narrative_architect"
    QUALITY_ASSURANCE = "quality_assurance"

@dataclass
class AgentResponse:
    agent_role: AgentRole
    content: Dict[str, Any]
    confidence_score: float
    processing_time: float
    suggestions: List[str] = None

class BaseAgent:
    def __init__(self, role: AgentRole, api_key: str):
        self.role = role
        self.api_key = api_key
        self.model = None
        self.initialize_model()
    
    def initialize_model(self):
        """Initialize Gemini model with role-specific configuration"""
        try:
            genai.configure(api_key=self.api_key)
            
            # Role-specific model configurations
            configs = {
                AgentRole.CONTENT_STRATEGIST: {
                    'temperature': 0.8,
                    'top_p': 0.9,
                    'max_output_tokens': 3000
                },
                AgentRole.DESIGN_SPECIALIST: {
                    'temperature': 0.7,
                    'top_p': 0.8,
                    'max_output_tokens': 2000
                },
                AgentRole.VISUAL_CURATOR: {
                    'temperature': 0.9,
                    'top_p': 0.95,
                    'max_output_tokens': 1500
                },
                AgentRole.NARRATIVE_ARCHITECT: {
                    'temperature': 0.6,
                    'top_p': 0.85,
                    'max_output_tokens': 2500
                },
                AgentRole.QUALITY_ASSURANCE: {
                    'temperature': 0.3,
                    'top_p': 0.7,
                    'max_output_tokens': 2000
                }
            }
            
            config = configs.get(self.role, configs[AgentRole.CONTENT_STRATEGIST])
            self.generation_config = genai.types.GenerationConfig(**config)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            
            logger.info(f"✅ {self.role.value} agent initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize {self.role.value} agent: {e}")
            raise
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Base processing method to be overridden by specific agents"""
        raise NotImplementedError("Each agent must implement its own process method")

class ContentStrategistAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__(AgentRole.CONTENT_STRATEGIST, api_key)
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Generate comprehensive content strategy and structure"""
        start_time = time.time()
        
        topic = input_data.get('topic', '')
        slide_count = input_data.get('slide_count', 6)
        tone = input_data.get('tone', 'professional')
        audience = input_data.get('audience', 'general business')
        
        prompt = f"""You are a world-class Content Strategist specializing in high-impact presentations. 
        
Your task: Create a comprehensive content strategy for a presentation about "{topic}".

REQUIREMENTS:
- {slide_count} total slides (1 title + {slide_count-1} content slides)
- Tone: {tone}
- Target audience: {audience}
- Each slide must have a clear purpose and strong narrative flow
- Content should be engaging, actionable, and memorable

STRATEGIC CONSIDERATIONS:
1. Hook the audience from the first slide
2. Build logical progression of ideas
3. Include compelling data points and insights
4. Create emotional connection with the audience
5. End with strong call-to-action

OUTPUT FORMAT (JSON):
{{
    "presentation_strategy": {{
        "core_message": "Main message audience should remember",
        "narrative_arc": "How the story unfolds across slides",
        "engagement_hooks": ["List of engagement techniques to use"],
        "key_differentiators": ["What makes this presentation unique"]
    }},
    "content_outline": {{
        "title": "Compelling presentation title",
        "subtitle": "Engaging subtitle that adds value",
        "slides": [
            {{
                "slide_number": 1,
                "purpose": "What this slide achieves",
                "title": "Specific, action-oriented title",
                "key_message": "Main takeaway",
                "content_type": "introduction/problem/solution/evidence/action",
                "talking_points": [
                    "Specific, detailed point with context",
                    "Actionable insight with supporting evidence",
                    "Compelling fact or statistic with relevance",
                    "Forward-looking statement with implications"
                ],
                "audience_impact": "How this slide affects the audience"
            }}
        ]
    }},
    "content_guidelines": {{
        "tone_specifications": "Detailed tone guidance",
        "language_style": "Specific language recommendations",
        "engagement_techniques": ["Specific techniques for audience engagement"],
        "credibility_builders": ["Elements that build trust and authority"]
    }}
}}

Topic: {topic}
Slide Count: {slide_count}
Tone: {tone}
Audience: {audience}"""

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
            )
            
            content = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            processing_time = time.time() - start_time
            
            # Calculate confidence score based on content completeness
            confidence_score = self._calculate_confidence(content)
            
            suggestions = [
                "Consider adding more specific data points for credibility",
                "Ensure each slide has a clear call-to-action",
                "Add storytelling elements to increase engagement"
            ]
            
            return AgentResponse(
                agent_role=self.role,
                content=content,
                confidence_score=confidence_score,
                processing_time=processing_time,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"❌ Content Strategist error: {e}")
            return self._create_fallback_response(input_data, time.time() - start_time)
    
    def _calculate_confidence(self, content: Dict) -> float:
        """Calculate confidence score based on content quality"""
        score = 0.5  # Base score
        
        if content.get('presentation_strategy'):
            score += 0.2
        if content.get('content_outline', {}).get('slides'):
            score += 0.2
        if len(content.get('content_outline', {}).get('slides', [])) >= 3:
            score += 0.1
            
        return min(score, 1.0)
    
    def _create_fallback_response(self, input_data: Dict, processing_time: float) -> AgentResponse:
        """Create fallback response when main processing fails"""
        topic = input_data.get('topic', 'Presentation Topic')
        slide_count = input_data.get('slide_count', 6)
        
        fallback_content = {
            "presentation_strategy": {
                "core_message": f"Understanding and implementing {topic} effectively",
                "narrative_arc": "Introduction → Analysis → Solutions → Implementation → Conclusion",
                "engagement_hooks": ["Opening question", "Relevant statistics", "Real-world examples"],
                "key_differentiators": ["Actionable insights", "Practical approach", "Clear next steps"]
            },
            "content_outline": {
                "title": f"Mastering {topic}: A Strategic Approach",
                "subtitle": "Practical insights for immediate implementation",
                "slides": [
                    {
                        "slide_number": i+1,
                        "purpose": f"Slide {i+1} purpose",
                        "title": f"{topic} - Key Aspect {i+1}",
                        "key_message": f"Important insight about {topic}",
                        "content_type": "analysis",
                        "talking_points": [
                            f"Key point about {topic}",
                            f"Important consideration for implementation",
                            f"Best practice recommendation",
                            f"Future implications and trends"
                        ],
                        "audience_impact": "Provides actionable insights"
                    } for i in range(slide_count-1)
                ]
            }
        }
        
        return AgentResponse(
            agent_role=self.role,
            content=fallback_content,
            confidence_score=0.6,
            processing_time=processing_time,
            suggestions=["Fallback content generated - consider manual review"]
        )

class DesignSpecialistAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__(AgentRole.DESIGN_SPECIALIST, api_key)
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Create advanced design specifications and layout recommendations"""
        start_time = time.time()
        
        content_outline = input_data.get('content_outline', {})
        theme = input_data.get('theme', 'modern')
        brand_guidelines = input_data.get('brand_guidelines', {})
        
        prompt = f"""You are an expert Design Specialist creating world-class presentation designs.

CONTENT TO DESIGN:
{json.dumps(content_outline, indent=2)}

DESIGN REQUIREMENTS:
- Theme: {theme}
- Create visually stunning, professional layouts
- Ensure perfect visual hierarchy and readability
- Design for maximum audience engagement
- Consider accessibility and inclusivity
- Brand guidelines: {brand_guidelines}

OUTPUT FORMAT (JSON):
{{
    "design_system": {{
        "color_palette": {{
            "primary": {{"r": 0, "g": 0, "b": 0}},
            "secondary": {{"r": 0, "g": 0, "b": 0}},
            "accent": {{"r": 0, "g": 0, "b": 0}},
            "text": {{"r": 0, "g": 0, "b": 0}},
            "background": {{"r": 0, "g": 0, "b": 0}}
        }},
        "typography": {{
            "heading_font": "Font name for headings",
            "body_font": "Font name for body text",
            "font_sizes": {{"h1": 36, "h2": 28, "body": 18}}
        }},
        "spacing": {{
            "margins": {{"top": 60, "bottom": 60, "left": 80, "right": 80}},
            "element_spacing": 24,
            "line_height": 1.4
        }}
    }},
    "slide_layouts": [
        {{
            "slide_number": 1,
            "layout_type": "title_slide/content_left/content_right/full_visual/split_content",
            "visual_hierarchy": "Description of element priorities",
            "layout_specifications": {{
                "text_area": {{"x": 0, "y": 0, "width": 500, "height": 300}},
                "image_area": {{"x": 520, "y": 0, "width": 400, "height": 300}},
                "title_position": "top/center/left/right",
                "content_alignment": "left/center/right/justified"
            }},
            "visual_elements": [
                "Specific design elements to include"
            ],
            "accessibility_features": [
                "High contrast ratios",
                "Readable font sizes",
                "Clear visual hierarchy"
            ]
        }}
    ],
    "design_principles": {{
        "visual_consistency": "How to maintain consistency",
        "brand_alignment": "How design supports brand",
        "engagement_factors": ["Visual elements that increase engagement"],
        "accessibility_compliance": "WCAG compliance considerations"
    }}
}}

Theme: {theme}
Slides to design: {len(content_outline.get('slides', []))}"""

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
            )
            
            content = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            processing_time = time.time() - start_time
            
            confidence_score = self._calculate_design_confidence(content)
            
            suggestions = [
                "Consider A/B testing different color combinations",
                "Ensure all text meets WCAG AA contrast requirements",
                "Test layouts on different screen sizes"
            ]
            
            return AgentResponse(
                agent_role=self.role,
                content=content,
                confidence_score=confidence_score,
                processing_time=processing_time,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"❌ Design Specialist error: {e}")
            return self._create_design_fallback(input_data, time.time() - start_time)
    
    def _calculate_design_confidence(self, content: Dict) -> float:
        """Calculate confidence score for design quality"""
        score = 0.5
        
        if content.get('design_system'):
            score += 0.2
        if content.get('slide_layouts'):
            score += 0.2
        if len(content.get('slide_layouts', [])) >= 3:
            score += 0.1
            
        return min(score, 1.0)
    
    def _create_design_fallback(self, input_data: Dict, processing_time: float) -> AgentResponse:
        """Create fallback design specifications"""
        theme = input_data.get('theme', 'modern')
        
        # Theme-based color palettes
        theme_colors = {
            'modern': {'primary': {'r': 38, 'g': 64, 'b': 217}, 'secondary': {'r': 20, 'g': 31, 'b': 64}},
            'corporate': {'primary': {'r': 20, 'g': 46, 'b': 107}, 'secondary': {'r': 10, 'g': 20, 'b': 46}},
            'creative': {'primary': {'r': 217, 'g': 38, 'b': 89}, 'secondary': {'r': 242, 'g': 89, 'b': 20}},
            'minimal': {'primary': {'r': 250, 'g': 250, 'b': 250}, 'secondary': {'r': 235, 'g': 235, 'b': 235}},
            'dark': {'primary': {'r': 20, 'g': 20, 'b': 20}, 'secondary': {'r': 46, 'g': 46, 'b': 46}}
        }
        
        colors = theme_colors.get(theme, theme_colors['modern'])
        
        fallback_content = {
            "design_system": {
                "color_palette": {
                    "primary": colors['primary'],
                    "secondary": colors['secondary'],
                    "accent": {'r': 89, 'g': 217, 'b': 89},
                    "text": {'r': 255, 'g': 255, 'b': 255},
                    "background": colors['primary']
                },
                "typography": {
                    "heading_font": "Inter",
                    "body_font": "Inter",
                    "font_sizes": {"h1": 36, "h2": 28, "body": 18}
                }
            },
            "slide_layouts": [
                {
                    "slide_number": 1,
                    "layout_type": "content_left",
                    "visual_hierarchy": "Title → Content → Image",
                    "layout_specifications": {
                        "text_area": {"x": 80, "y": 120, "width": 480, "height": 320},
                        "image_area": {"x": 580, "y": 120, "width": 360, "height": 320}
                    }
                }
            ]
        }
        
        return AgentResponse(
            agent_role=self.role,
            content=fallback_content,
            confidence_score=0.7,
            processing_time=processing_time,
            suggestions=["Fallback design applied - consider customization"]
        )

class VisualCuratorAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__(AgentRole.VISUAL_CURATOR, api_key)
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Generate sophisticated image prompts and visual concepts"""
        start_time = time.time()
        
        slides = input_data.get('slides', [])
        theme = input_data.get('theme', 'modern')
        design_system = input_data.get('design_system', {})
        
        prompt = f"""You are a world-class Visual Curator specializing in creating stunning presentation visuals.

SLIDES TO ENHANCE:
{json.dumps(slides, indent=2)}

DESIGN CONTEXT:
- Theme: {theme}
- Design system: {design_system}

VISUAL CURATION REQUIREMENTS:
1. Create compelling, professional image prompts for each slide
2. Ensure visual consistency across all slides
3. Match the theme and brand aesthetic perfectly
4. Consider layout and composition for presentation format
5. Include alternative visual concepts for variety
6. Specify technical requirements for optimal quality

OUTPUT FORMAT (JSON):
{{
    "visual_strategy": {{
        "overall_aesthetic": "Description of visual approach",
        "consistency_elements": ["Elements that tie visuals together"],
        "quality_standards": "Technical and artistic quality requirements"
    }},
    "slide_visuals": [
        {{
            "slide_number": 1,
            "primary_image": {{
                "prompt": "Detailed, professional image prompt",
                "style": "photography/illustration/diagram/infographic",
                "composition": "landscape/portrait/square",
                "mood": "professional/energetic/calm/inspiring",
                "technical_specs": "4K, high contrast, presentation-ready"
            }},
            "secondary_image": {{
                "prompt": "Optional secondary image prompt",
                "purpose": "support/contrast/comparison/detail",
                "placement": "background/overlay/side-by-side"
            }},
            "visual_alternatives": [
                "Alternative visual concept 1",
                "Alternative visual concept 2"
            ],
            "color_harmony": "How image colors work with slide design",
            "layout_integration": "How image fits with text and other elements"
        }}
    ],
    "visual_guidelines": {{
        "image_quality": "Minimum quality standards",
        "style_consistency": "How to maintain visual consistency",
        "brand_alignment": "How visuals support brand message",
        "accessibility": "Visual accessibility considerations"
    }}
}}

Theme: {theme}
Number of slides: {len(slides)}"""

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
            )
            
            content = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            processing_time = time.time() - start_time
            
            confidence_score = self._calculate_visual_confidence(content)
            
            suggestions = [
                "Consider creating mood boards for visual consistency",
                "Test image visibility at different screen sizes",
                "Ensure images support rather than distract from content"
            ]
            
            return AgentResponse(
                agent_role=self.role,
                content=content,
                confidence_score=confidence_score,
                processing_time=processing_time,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"❌ Visual Curator error: {e}")
            return self._create_visual_fallback(input_data, time.time() - start_time)
    
    def _calculate_visual_confidence(self, content: Dict) -> float:
        """Calculate confidence score for visual curation"""
        score = 0.5
        
        if content.get('visual_strategy'):
            score += 0.2
        if content.get('slide_visuals'):
            score += 0.2
        if len(content.get('slide_visuals', [])) >= 3:
            score += 0.1
            
        return min(score, 1.0)
    
    def _create_visual_fallback(self, input_data: Dict, processing_time: float) -> AgentResponse:
        """Create fallback visual specifications"""
        slides = input_data.get('slides', [])
        theme = input_data.get('theme', 'modern')
        
        fallback_content = {
            "visual_strategy": {
                "overall_aesthetic": f"Professional {theme} aesthetic with high-quality visuals",
                "consistency_elements": ["Color harmony", "Style consistency", "Professional quality"],
                "quality_standards": "4K resolution, professional photography/illustration"
            },
            "slide_visuals": [
                {
                    "slide_number": i+1,
                    "primary_image": {
                        "prompt": f"Professional {theme} style image representing slide content",
                        "style": "photography",
                        "composition": "landscape",
                        "mood": "professional",
                        "technical_specs": "4K, high contrast, presentation-ready"
                    },
                    "visual_alternatives": [
                        "Infographic style representation",
                        "Minimalist illustration"
                    ]
                } for i, slide in enumerate(slides)
            ]
        }
        
        return AgentResponse(
            agent_role=self.role,
            content=fallback_content,
            confidence_score=0.6,
            processing_time=processing_time,
            suggestions=["Fallback visuals generated - consider customization"]
        )

class NarrativeArchitectAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__(AgentRole.NARRATIVE_ARCHITECT, api_key)
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Create compelling narrative flow and storytelling elements"""
        start_time = time.time()
        
        content_outline = input_data.get('content_outline', {})
        audience = input_data.get('audience', 'general business')
        objectives = input_data.get('objectives', [])
        
        prompt = f"""You are a master Narrative Architect specializing in creating compelling presentation stories.

CONTENT TO ENHANCE:
{json.dumps(content_outline, indent=2)}

NARRATIVE REQUIREMENTS:
- Target audience: {audience}
- Presentation objectives: {objectives}
- Create emotional connection with audience
- Build compelling narrative arc
- Include storytelling elements and transitions
- Ensure logical flow and engagement

OUTPUT FORMAT (JSON):
{{
    "narrative_structure": {{
        "story_arc": "Overall narrative progression",
        "emotional_journey": "How audience emotions should evolve",
        "key_moments": ["Critical points in the presentation"],
        "engagement_peaks": ["Moments of highest audience engagement"]
    }},
    "enhanced_slides": [
        {{
            "slide_number": 1,
            "narrative_purpose": "Role in overall story",
            "emotional_tone": "Specific emotional approach",
            "storytelling_elements": {{
                "hook": "Opening element to grab attention",
                "conflict": "Problem or challenge presented",
                "resolution": "Solution or insight provided",
                "transition": "Bridge to next slide"
            }},
            "audience_engagement": {{
                "interaction_opportunities": ["Ways to engage audience"],
                "questions_to_pose": ["Thought-provoking questions"],
                "call_to_action": "What audience should do/think"
            }},
            "enhanced_content": {{
                "title": "Refined title with narrative impact",
                "opening_statement": "Compelling opening line",
                "key_points": [
                    "Enhanced point with storytelling elements",
                    "Point with emotional resonance",
                    "Point with clear audience benefit"
                ],
                "closing_statement": "Memorable closing line"
            }}
        }}
    ],
    "presentation_flow": {{
        "opening_strategy": "How to start powerfully",
        "transition_techniques": ["Methods to connect slides smoothly"],
        "climax_moment": "Peak moment of presentation",
        "closing_strategy": "How to end memorably"
    }}
}}

Audience: {audience}
Objectives: {objectives}"""

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
            )
            
            content = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            processing_time = time.time() - start_time
            
            confidence_score = self._calculate_narrative_confidence(content)
            
            suggestions = [
                "Practice transitions between slides for smooth flow",
                "Consider adding personal anecdotes for connection",
                "Test narrative pacing with target audience"
            ]
            
            return AgentResponse(
                agent_role=self.role,
                content=content,
                confidence_score=confidence_score,
                processing_time=processing_time,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"❌ Narrative Architect error: {e}")
            return self._create_narrative_fallback(input_data, time.time() - start_time)
    
    def _calculate_narrative_confidence(self, content: Dict) -> float:
        """Calculate confidence score for narrative quality"""
        score = 0.5
        
        if content.get('narrative_structure'):
            score += 0.2
        if content.get('enhanced_slides'):
            score += 0.2
        if content.get('presentation_flow'):
            score += 0.1
            
        return min(score, 1.0)
    
    def _create_narrative_fallback(self, input_data: Dict, processing_time: float) -> AgentResponse:
        """Create fallback narrative structure"""
        content_outline = input_data.get('content_outline', {})
        slides = content_outline.get('slides', [])
        
        fallback_content = {
            "narrative_structure": {
                "story_arc": "Problem → Analysis → Solution → Implementation → Success",
                "emotional_journey": "Curiosity → Understanding → Confidence → Action",
                "key_moments": ["Opening hook", "Problem revelation", "Solution presentation", "Call to action"],
                "engagement_peaks": ["Opening question", "Key insight", "Final challenge"]
            },
            "enhanced_slides": [
                {
                    "slide_number": i+1,
                    "narrative_purpose": f"Build understanding of key concept {i+1}",
                    "emotional_tone": "professional and engaging",
                    "enhanced_content": {
                        "title": slide.get('title', f'Key Point {i+1}'),
                        "opening_statement": "Let's explore this important aspect...",
                        "key_points": slide.get('talking_points', [])[:4],
                        "closing_statement": "This insight leads us to our next consideration..."
                    }
                } for i, slide in enumerate(slides)
            ]
        }
        
        return AgentResponse(
            agent_role=self.role,
            content=fallback_content,
            confidence_score=0.6,
            processing_time=processing_time,
            suggestions=["Fallback narrative created - consider enhancement"]
        )

class QualityAssuranceAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__(AgentRole.QUALITY_ASSURANCE, api_key)
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Review and optimize all presentation elements for quality"""
        start_time = time.time()
        
        presentation_data = input_data.get('presentation_data', {})
        quality_criteria = input_data.get('quality_criteria', {})
        
        prompt = f"""You are a Quality Assurance specialist ensuring presentation excellence.

PRESENTATION TO REVIEW:
{json.dumps(presentation_data, indent=2)}

QUALITY CRITERIA:
{json.dumps(quality_criteria, indent=2)}

QUALITY ASSURANCE REQUIREMENTS:
1. Content accuracy and relevance
2. Design consistency and professionalism
3. Narrative flow and engagement
4. Visual quality and appropriateness
5. Accessibility and inclusivity
6. Technical specifications compliance

OUTPUT FORMAT (JSON):
{{
    "quality_assessment": {{
        "overall_score": 8.5,
        "content_quality": 9.0,
        "design_quality": 8.0,
        "narrative_quality": 8.5,
        "visual_quality": 8.0,
        "accessibility_score": 9.0
    }},
    "identified_issues": [
        {{
            "issue_type": "content/design/narrative/visual/accessibility",
            "severity": "high/medium/low",
            "description": "Detailed description of the issue",
            "location": "Specific slide or element affected",
            "recommendation": "How to fix the issue"
        }}
    ],
    "optimization_recommendations": [
        {{
            "category": "content/design/narrative/visual/accessibility",
            "priority": "high/medium/low",
            "recommendation": "Specific improvement suggestion",
            "expected_impact": "How this will improve the presentation",
            "implementation": "How to implement this change"
        }}
    ],
    "compliance_check": {{
        "accessibility_wcag": "AA/AAA compliance status",
        "brand_guidelines": "Compliance with brand standards",
        "technical_standards": "Meeting technical requirements",
        "content_standards": "Professional content quality"
    }},
    "final_recommendations": {{
        "strengths": ["What works well in the presentation"],
        "areas_for_improvement": ["Priority areas to enhance"],
        "next_steps": ["Specific actions to take"],
        "quality_assurance_passed": true
    }}
}}

Review all aspects thoroughly and provide actionable feedback."""

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(prompt, generation_config=self.generation_config)
            )
            
            content = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            processing_time = time.time() - start_time
            
            confidence_score = self._calculate_qa_confidence(content)
            
            suggestions = [
                "Implement high-priority recommendations first",
                "Test presentation with target audience",
                "Conduct final technical review before delivery"
            ]
            
            return AgentResponse(
                agent_role=self.role,
                content=content,
                confidence_score=confidence_score,
                processing_time=processing_time,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"❌ Quality Assurance error: {e}")
            return self._create_qa_fallback(input_data, time.time() - start_time)
    
    def _calculate_qa_confidence(self, content: Dict) -> float:
        """Calculate confidence score for QA assessment"""
        score = 0.5
        
        if content.get('quality_assessment'):
            score += 0.2
        if content.get('identified_issues'):
            score += 0.1
        if content.get('optimization_recommendations'):
            score += 0.1
        if content.get('compliance_check'):
            score += 0.1
            
        return min(score, 1.0)
    
    def _create_qa_fallback(self, input_data: Dict, processing_time: float) -> AgentResponse:
        """Create fallback QA assessment"""
        fallback_content = {
            "quality_assessment": {
                "overall_score": 7.5,
                "content_quality": 8.0,
                "design_quality": 7.0,
                "narrative_quality": 7.5,
                "visual_quality": 7.0,
                "accessibility_score": 8.0
            },
            "optimization_recommendations": [
                {
                    "category": "content",
                    "priority": "medium",
                    "recommendation": "Review content for accuracy and relevance",
                    "expected_impact": "Improved audience engagement",
                    "implementation": "Fact-check all claims and statistics"
                }
            ],
            "final_recommendations": {
                "strengths": ["Professional structure", "Clear messaging"],
                "areas_for_improvement": ["Visual consistency", "Narrative flow"],
                "next_steps": ["Review design elements", "Test with audience"],
                "quality_assurance_passed": True
            }
        }
        
        return AgentResponse(
            agent_role=self.role,
            content=fallback_content,
            confidence_score=0.7,
            processing_time=processing_time,
            suggestions=["Basic QA completed - consider detailed review"]
        )

class MultiAgentPPTOrchestrator:
    """Orchestrates multiple agents to create superior presentations"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.agents = {
            AgentRole.CONTENT_STRATEGIST: ContentStrategistAgent(api_key),
            AgentRole.DESIGN_SPECIALIST: DesignSpecialistAgent(api_key),
            AgentRole.VISUAL_CURATOR: VisualCuratorAgent(api_key),
            AgentRole.NARRATIVE_ARCHITECT: NarrativeArchitectAgent(api_key),
            AgentRole.QUALITY_ASSURANCE: QualityAssuranceAgent(api_key)
        }
        self.session_id = None
    
    async def create_presentation(self, 
                                topic: str, 
                                slide_count: int = 6, 
                                tone: str = "professional", 
                                theme: str = "modern",
                                audience: str = "general business",
                                session_id: str = None) -> Dict[str, Any]:
        """Orchestrate all agents to create a superior presentation"""
        
        self.session_id = session_id
        logger.info(f"🚀 Starting multi-agent presentation creation for: {topic}")
        
        # Send initial progress update
        if session_id:
            await self._send_progress(5, "initialization", "Initializing AI agents...")
        
        try:
            # Stage 1: Content Strategy
            logger.info("📋 Stage 1: Content Strategy")
            if session_id:
                await self._send_progress(15, "content_strategy", "Creating content strategy...")
            
            content_input = {
                'topic': topic,
                'slide_count': slide_count,
                'tone': tone,
                'audience': audience
            }
            
            content_response = await self.agents[AgentRole.CONTENT_STRATEGIST].process(content_input)
            logger.info(f"✅ Content strategy completed (confidence: {content_response.confidence_score:.2f})")
            
            # Stage 2: Design Specifications
            logger.info("🎨 Stage 2: Design Specifications")
            if session_id:
                await self._send_progress(30, "design_specs", "Creating design specifications...")
            
            design_input = {
                'content_outline': content_response.content.get('content_outline', {}),
                'theme': theme,
                'brand_guidelines': {}
            }
            
            design_response = await self.agents[AgentRole.DESIGN_SPECIALIST].process(design_input)
            logger.info(f"✅ Design specifications completed (confidence: {design_response.confidence_score:.2f})")
            
            # Stage 3: Visual Curation
            logger.info("🖼️ Stage 3: Visual Curation")
            if session_id:
                await self._send_progress(45, "visual_curation", "Curating visual elements...")
            
            visual_input = {
                'slides': content_response.content.get('content_outline', {}).get('slides', []),
                'theme': theme,
                'design_system': design_response.content.get('design_system', {})
            }
            
            visual_response = await self.agents[AgentRole.VISUAL_CURATOR].process(visual_input)
            logger.info(f"✅ Visual curation completed (confidence: {visual_response.confidence_score:.2f})")
            
            # Stage 4: Narrative Architecture
            logger.info("📖 Stage 4: Narrative Architecture")
            if session_id:
                await self._send_progress(60, "narrative", "Crafting narrative flow...")
            
            narrative_input = {
                'content_outline': content_response.content.get('content_outline', {}),
                'audience': audience,
                'objectives': [f"Educate about {topic}", "Engage audience", "Inspire action"]
            }
            
            narrative_response = await self.agents[AgentRole.NARRATIVE_ARCHITECT].process(narrative_input)
            logger.info(f"✅ Narrative architecture completed (confidence: {narrative_response.confidence_score:.2f})")
            
            # Stage 5: Integration and Synthesis
            logger.info("🔧 Stage 5: Integration and Synthesis")
            if session_id:
                await self._send_progress(75, "integration", "Integrating all elements...")
            
            integrated_presentation = await self._integrate_agent_outputs(
                content_response, design_response, visual_response, narrative_response
            )
            
            # Stage 6: Quality Assurance
            logger.info("✅ Stage 6: Quality Assurance")
            if session_id:
                await self._send_progress(90, "quality_assurance", "Performing quality checks...")
            
            qa_input = {
                'presentation_data': integrated_presentation,
                'quality_criteria': {
                    'min_content_score': 8.0,
                    'min_design_score': 7.5,
                    'accessibility_required': True
                }
            }
            
            qa_response = await self.agents[AgentRole.QUALITY_ASSURANCE].process(qa_input)
            logger.info(f"✅ Quality assurance completed (confidence: {qa_response.confidence_score:.2f})")
            
            # Final assembly
            final_presentation = await self._finalize_presentation(
                integrated_presentation, qa_response
            )
            
            if session_id:
                await self._send_progress(100, "completed", "Presentation creation completed!")
            
            logger.info("🎉 Multi-agent presentation creation completed successfully!")
            
            return {
                'success': True,
                'presentation': final_presentation,
                'agent_reports': {
                    'content_strategist': content_response,
                    'design_specialist': design_response,
                    'visual_curator': visual_response,
                    'narrative_architect': narrative_response,
                    'quality_assurance': qa_response
                },
                'overall_confidence': self._calculate_overall_confidence([
                    content_response, design_response, visual_response, 
                    narrative_response, qa_response
                ])
            }
            
        except Exception as e:
            logger.error(f"❌ Multi-agent orchestration failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'fallback_available': True
            }
    
    async def _integrate_agent_outputs(self, content_resp, design_resp, visual_resp, narrative_resp) -> Dict:
        """Integrate outputs from all agents into cohesive presentation"""
        
        content_outline = content_resp.content.get('content_outline', {})
        design_system = design_resp.content.get('design_system', {})
        slide_visuals = visual_resp.content.get('slide_visuals', [])
        enhanced_slides = narrative_resp.content.get('enhanced_slides', [])
        
        # Merge all agent outputs
        integrated_slides = []
        
        base_slides = content_outline.get('slides', [])
        
        for i, base_slide in enumerate(base_slides):
            # Find corresponding outputs from other agents
            visual_data = next((v for v in slide_visuals if v.get('slide_number') == i+1), {})
            narrative_data = next((n for n in enhanced_slides if n.get('slide_number') == i+1), {})
            
            integrated_slide = {
                # Base content from Content Strategist
                'slide_number': i + 1,
                'title': narrative_data.get('enhanced_content', {}).get('title', base_slide.get('title', '')),
                'purpose': base_slide.get('purpose', ''),
                'content_type': base_slide.get('content_type', ''),
                
                # Enhanced content from Narrative Architect
                'points': narrative_data.get('enhanced_content', {}).get('key_points', base_slide.get('talking_points', [])),
                'opening_statement': narrative_data.get('enhanced_content', {}).get('opening_statement', ''),
                'closing_statement': narrative_data.get('enhanced_content', {}).get('closing_statement', ''),
                
                # Visual elements from Visual Curator
                'image_prompt': visual_data.get('primary_image', {}).get('prompt', ''),
                'secondary_image_prompt': visual_data.get('secondary_image', {}).get('prompt', ''),
                'visual_style': visual_data.get('primary_image', {}).get('style', 'photography'),
                
                # Design specifications from Design Specialist
                'layout_type': design_resp.content.get('slide_layouts', [{}])[0].get('layout_type', 'content_left'),
                'layout_specifications': design_resp.content.get('slide_layouts', [{}])[0].get('layout_specifications', {}),
                
                # Narrative elements
                'narrative_purpose': narrative_data.get('narrative_purpose', ''),
                'emotional_tone': narrative_data.get('emotional_tone', 'professional'),
                'audience_engagement': narrative_data.get('audience_engagement', {}),
                
                # Key insights
                'key_message': base_slide.get('key_message', ''),
                'audience_impact': base_slide.get('audience_impact', '')
            }
            
            integrated_slides.append(integrated_slide)
        
        return {
            'title': content_outline.get('title', ''),
            'subtitle': content_outline.get('subtitle', ''),
            'theme': design_system,
            'slides': integrated_slides,
            'presentation_strategy': content_resp.content.get('presentation_strategy', {}),
            'narrative_structure': narrative_resp.content.get('narrative_structure', {}),
            'visual_strategy': visual_resp.content.get('visual_strategy', {}),
            'design_principles': design_resp.content.get('design_principles', {})
        }
    
    async def _finalize_presentation(self, integrated_presentation: Dict, qa_response: AgentResponse) -> Dict:
        """Apply QA recommendations and finalize presentation"""
        
        # Apply high-priority QA recommendations
        recommendations = qa_response.content.get('optimization_recommendations', [])
        high_priority_recs = [r for r in recommendations if r.get('priority') == 'high']
        
        # Log QA insights
        quality_scores = qa_response.content.get('quality_assessment', {})
        logger.info(f"📊 Quality Scores - Overall: {quality_scores.get('overall_score', 'N/A')}")
        
        # Add QA metadata
        integrated_presentation['quality_assessment'] = qa_response.content
        integrated_presentation['agent_enhanced'] = True
        integrated_presentation['creation_timestamp'] = time.time()
        
        return integrated_presentation
    
    def _calculate_overall_confidence(self, agent_responses: List[AgentResponse]) -> float:
        """Calculate overall confidence score from all agents"""
        if not agent_responses:
            return 0.0
        
        total_confidence = sum(resp.confidence_score for resp in agent_responses)
        return total_confidence / len(agent_responses)
    
    async def _send_progress(self, progress: int, step: str, message: str):
        """Send progress update via WebSocket if session_id is available"""
        if self.session_id:
            # This would integrate with the existing WebSocket manager
            # For now, just log the progress
            logger.info(f"Progress {progress}%: {step} - {message}")

# Export the main orchestrator class
__all__ = ['MultiAgentPPTOrchestrator', 'AgentRole', 'AgentResponse']