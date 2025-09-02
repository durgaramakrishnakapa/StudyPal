import React, { useState, useEffect, useRef } from 'react';

const PresentationEnhanced = ({ onBack }) => {
    const [currentStep, setCurrentStep] = useState(1); // 1: Setup, 2: Generating, 3: Preview
    const [formData, setFormData] = useState({
        topic: '',
        slideCount: 6,
        theme: 'modern',
        tone: 'professional',
        audience: 'general business',
        objectives: [],
        useAgents: true
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentAgent, setCurrentAgent] = useState('');
    const [agentStatuses, setAgentStatuses] = useState({});
    const [generationStep, setGenerationStep] = useState('');
    const [generatedPresentation, setGeneratedPresentation] = useState(null);
    const [presentationUrl, setPresentationUrl] = useState('');
    const [error, setError] = useState('');
    const [qualityMetrics, setQualityMetrics] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const websocketRef = useRef(null);

    const themes = [
        {
            id: 'modern',
            name: 'Modern',
            preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Clean and contemporary design with tech aesthetics',
            style: 'minimalist, high-tech, contemporary'
        },
        {
            id: 'corporate',
            name: 'Corporate',
            preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            description: 'Professional business style with navy and gold',
            style: 'business-like, polished, executive'
        },
        {
            id: 'creative',
            name: 'Creative',
            preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
            description: 'Vibrant and engaging colors for dynamic presentations',
            style: 'artistic, vibrant, dynamic, innovative'
        },
        {
            id: 'minimal',
            name: 'Minimal',
            preview: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            description: 'Simple and clean aesthetic with elegant design',
            style: 'clean, simple, uncluttered, elegant'
        },
        {
            id: 'dark',
            name: 'Dark Mode',
            preview: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            description: 'Sleek dark interface with premium feel',
            style: 'sophisticated, dramatic, high-contrast'
        }
    ];

    const tones = [
        { id: 'professional', name: 'Professional', description: 'Formal business communication' },
        { id: 'educational', name: 'Educational', description: 'Clear and informative teaching style' },
        { id: 'inspiring', name: 'Inspiring', description: 'Motivational and uplifting tone' },
        { id: 'casual', name: 'Casual', description: 'Relaxed and conversational approach' },
        { id: 'technical', name: 'Technical', description: 'Detailed and precise explanations' }
    ];

    const audiences = [
        { id: 'general business', name: 'General Business', description: 'Mixed business audience' },
        { id: 'executives', name: 'Executives', description: 'C-suite and senior leadership' },
        { id: 'technical team', name: 'Technical Team', description: 'Engineers and developers' },
        { id: 'students', name: 'Students', description: 'Academic or training audience' },
        { id: 'investors', name: 'Investors', description: 'Financial stakeholders' },
        { id: 'customers', name: 'Customers', description: 'External clients and customers' }
    ];

    // Generate unique session ID
    useEffect(() => {
        setSessionId('session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now());
    }, []);

    // WebSocket connection for real-time updates
    const connectWebSocket = () => {
        if (!sessionId) return;

        const wsUrl = `ws://localhost:8009/ws/${sessionId}`;
        websocketRef.current = new WebSocket(wsUrl);

        websocketRef.current.onopen = () => {
            console.log('🔌 WebSocket connected for real-time updates');
        };

        websocketRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };

        websocketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocketRef.current.onclose = () => {
            console.log('🔌 WebSocket disconnected');
        };
    };

    // Handle WebSocket messages
    const handleWebSocketMessage = (message) => {
        const { type, data } = message;

        switch (type) {
            case 'progress':
                setProgress(data.progress);
                setGenerationStep(data.message);
                break;

            case 'agent_status':
                setCurrentAgent(data.agent);
                setAgentStatuses(prev => ({
                    ...prev,
                    [data.agent]: {
                        status: data.status,
                        confidence: data.confidence,
                        timestamp: data.timestamp
                    }
                }));
                break;

            case 'slide_preview':
                // Handle slide preview updates
                console.log('📄 Slide preview:', data);
                break;

            case 'image_status':
                // Handle image generation status
                console.log('🖼️ Image status:', data);
                break;

            default:
                console.log('📨 Unknown message type:', type, data);
        }
    };

    // Disconnect WebSocket
    const disconnectWebSocket = () => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
    };

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addObjective = () => {
        const objective = prompt('Enter presentation objective:');
        if (objective && objective.trim()) {
            setFormData(prev => ({
                ...prev,
                objectives: [...prev.objectives, objective.trim()]
            }));
        }
    };

    const removeObjective = (index) => {
        setFormData(prev => ({
            ...prev,
            objectives: prev.objectives.filter((_, i) => i !== index)
        }));
    };

    const generatePresentation = async () => {
        if (!formData.topic.trim()) {
            setError('Please enter a presentation topic');
            return;
        }

        setIsGenerating(true);
        setCurrentStep(2);
        setProgress(0);
        setError('');
        setAgentStatuses({});
        setCurrentAgent('');

        // Connect WebSocket for real-time updates
        if (formData.useAgents) {
            connectWebSocket();
        }

        try {
            const response = await fetch('http://localhost:8009/api/presentations/create-production', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: formData.topic,
                    slideCount: formData.slideCount,
                    tone: formData.tone,
                    theme: formData.theme,
                    audience: formData.audience,
                    objectives: formData.objectives,
                    use_agents: formData.useAgents
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setGeneratedPresentation(result);
                setQualityMetrics(result.quality_metrics);
                setPresentationUrl(result.presentation_url || '');
                setProgress(100);
                setCurrentStep(3);
                
                // Show success message
                setTimeout(() => {
                    setGenerationStep('🎉 Presentation created successfully!');
                }, 500);
            } else {
                throw new Error(result.error || 'Presentation generation failed');
            }

        } catch (error) {
            console.error('Presentation generation error:', error);
            setError(error.message);
            setCurrentStep(1);
        } finally {
            setIsGenerating(false);
            disconnectWebSocket();
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setFormData({
            topic: '',
            slideCount: 6,
            theme: 'modern',
            tone: 'professional',
            audience: 'general business',
            objectives: [],
            useAgents: true
        });
        setGeneratedPresentation(null);
        setQualityMetrics(null);
        setPresentationUrl('');
        setError('');
        setProgress(0);
        setAgentStatuses({});
        disconnectWebSocket();
    };

    const getAgentIcon = (agentName) => {
        const icons = {
            'content_strategist': '📋',
            'design_specialist': '🎨',
            'visual_curator': '🖼️',
            'narrative_architect': '📖',
            'quality_assurance': '✅'
        };
        return icons[agentName] || '🤖';
    };

    const getAgentDisplayName = (agentName) => {
        return agentName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const renderSetupStep = () => (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    🤖 AI-Powered Presentation Generator
                </h2>
                <p className="text-gray-300 text-lg">
                    Create professional presentations using our multi-agent AI system
                </p>
            </div>

            {/* Main Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Settings */}
                <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">📝 Content Settings</h3>
                        
                        {/* Topic Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Presentation Topic *
                            </label>
                            <input
                                type="text"
                                value={formData.topic}
                                onChange={(e) => handleInputChange('topic', e.target.value)}
                                placeholder="e.g., Digital Transformation Strategy, AI in Healthcare..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            />
                        </div>

                        {/* Slide Count */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Number of Slides
                            </label>
                            <select
                                value={formData.slideCount}
                                onChange={(e) => handleInputChange('slideCount', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {[4, 5, 6, 7, 8, 9, 10].map(count => (
                                    <option key={count} value={count} className="bg-gray-800">
                                        {count} slides
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tone Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Presentation Tone
                            </label>
                            <select
                                value={formData.tone}
                                onChange={(e) => handleInputChange('tone', e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {tones.map(tone => (
                                    <option key={tone.id} value={tone.id} className="bg-gray-800">
                                        {tone.name} - {tone.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Audience Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Target Audience
                            </label>
                            <select
                                value={formData.audience}
                                onChange={(e) => handleInputChange('audience', e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {audiences.map(audience => (
                                    <option key={audience.id} value={audience.id} className="bg-gray-800">
                                        {audience.name} - {audience.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Objectives */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">🎯 Objectives (Optional)</h3>
                        
                        <div className="space-y-2 mb-4">
                            {formData.objectives.map((objective, index) => (
                                <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                    <span className="text-gray-300">{objective}</span>
                                    <button
                                        onClick={() => removeObjective(index)}
                                        className="text-red-400 hover:text-red-300 ml-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button
                            onClick={addObjective}
                            className="w-full py-2 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                        >
                            + Add Objective
                        </button>
                    </div>
                </div>

                {/* Right Column - Theme & AI Settings */}
                <div className="space-y-6">
                    {/* Theme Selection */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">🎨 Visual Theme</h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {themes.map(theme => (
                                <div
                                    key={theme.id}
                                    onClick={() => handleInputChange('theme', theme.id)}
                                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-300 ${
                                        formData.theme === theme.id
                                            ? 'border-blue-400 bg-blue-400/20'
                                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-12 h-8 rounded"
                                            style={{ background: theme.preview }}
                                        />
                                        <div>
                                            <div className="text-white font-semibold">{theme.name}</div>
                                            <div className="text-gray-400 text-sm">{theme.description}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Enhancement Toggle */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">🤖 AI Enhancement</h3>
                        
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-white font-semibold">Multi-Agent AI System</div>
                                <div className="text-gray-400 text-sm">
                                    Use specialized AI agents for superior quality
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.useAgents}
                                    onChange={(e) => handleInputChange('useAgents', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {formData.useAgents && (
                            <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
                                <div className="text-blue-300 font-semibold mb-2">AI Agents Included:</div>
                                <div className="space-y-1 text-sm text-gray-300">
                                    <div>📋 Content Strategist - Strategic planning</div>
                                    <div>🎨 Design Specialist - Visual design</div>
                                    <div>🖼️ Visual Curator - Image concepts</div>
                                    <div>📖 Narrative Architect - Storytelling</div>
                                    <div>✅ Quality Assurance - Excellence validation</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <div className="text-red-300">❌ {error}</div>
                </div>
            )}

            {/* Generate Button */}
            <div className="text-center">
                <button
                    onClick={generatePresentation}
                    disabled={!formData.topic.trim() || isGenerating}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 text-lg"
                >
                    {isGenerating ? 'Generating...' : '🚀 Generate Presentation'}
                </button>
            </div>
        </div>
    );

    const renderGeneratingStep = () => (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    🤖 Creating Your Presentation
                </h2>
                <p className="text-gray-300 text-lg">
                    Our AI agents are working together to create something amazing...
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-semibold">Overall Progress</span>
                        <span className="text-blue-400 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {generationStep && (
                    <div className="text-center text-gray-300 mb-6">
                        {generationStep}
                    </div>
                )}

                {/* Agent Status */}
                {formData.useAgents && Object.keys(agentStatuses).length > 0 && (
                    <div>
                        <h3 className="text-white font-semibold mb-4">🤖 AI Agent Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(agentStatuses).map(([agentName, status]) => (
                                <div
                                    key={agentName}
                                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-2xl">{getAgentIcon(agentName)}</span>
                                        <span className="text-white font-medium text-sm">
                                            {getAgentDisplayName(agentName)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Status: {status.status}
                                    </div>
                                    {status.confidence && (
                                        <div className="text-xs text-blue-400">
                                            Confidence: {(status.confidence * 100).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Agent Highlight */}
                {currentAgent && (
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
                            <span className="text-2xl">{getAgentIcon(currentAgent)}</span>
                            <span className="text-blue-300 font-medium">
                                {getAgentDisplayName(currentAgent)} is working...
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancel Button */}
            <div className="text-center">
                <button
                    onClick={() => {
                        setIsGenerating(false);
                        setCurrentStep(1);
                        disconnectWebSocket();
                    }}
                    className="px-6 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                >
                    Cancel Generation
                </button>
            </div>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                    🎉 Presentation Created Successfully!
                </h2>
                <p className="text-gray-300 text-lg">
                    Your AI-enhanced presentation is ready
                </p>
            </div>

            {/* Presentation Info */}
            {generatedPresentation && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Presentation Details */}
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                {generatedPresentation.title || formData.topic}
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <span className="text-blue-400">📊</span>
                                    <span className="text-gray-300">
                                        {formData.slideCount} slides • {formData.theme} theme
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <span className="text-green-400">🎯</span>
                                    <span className="text-gray-300">
                                        {formData.tone} tone • {formData.audience} audience
                                    </span>
                                </div>
                                
                                {generatedPresentation.agent_enhanced && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-purple-400">🤖</span>
                                        <span className="text-gray-300">
                                            Enhanced with Multi-Agent AI
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quality Metrics */}
                            {qualityMetrics && (
                                <div className="mt-6">
                                    <h4 className="text-white font-semibold mb-3">📈 Quality Metrics</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Overall Confidence:</span>
                                            <span className="text-green-400 font-semibold">
                                                {(qualityMetrics.overall_confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Generation Time:</span>
                                            <span className="text-blue-400">
                                                {qualityMetrics.generation_time?.toFixed(1)}s
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">AI Agents Used:</span>
                                            <span className="text-purple-400">
                                                {qualityMetrics.agent_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="space-y-4">
                            {presentationUrl && (
                                <button
                                    onClick={() => window.open(presentationUrl, '_blank')}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-all duration-300"
                                >
                                    🔗 Open Presentation
                                </button>
                            )}
                            
                            <button
                                onClick={resetForm}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-all duration-300"
                            >
                                🚀 Create Another Presentation
                            </button>
                            
                            <button
                                onClick={onBack}
                                className="w-full py-2 px-6 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Agent Performance (if available) */}
            {qualityMetrics?.agent_performance && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">🤖 Agent Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(qualityMetrics.agent_performance).map(([agentName, performance]) => (
                            <div key={agentName} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-xl">{getAgentIcon(agentName)}</span>
                                    <span className="text-white font-medium text-sm">
                                        {getAgentDisplayName(agentName)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400 mb-1">
                                    Confidence: {(performance.confidence * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-400">
                                    Time: {performance.processing_time?.toFixed(1)}s
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="text-white/70 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back to Dashboard</span>
                        </button>
                        
                        <div className="text-center">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    AI Presentation Maker
                                </span>
                            </h1>
                            <p className="text-gray-300 mt-1">Powered by Multi-Agent AI System</p>
                        </div>
                        
                        <div className="w-32"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {currentStep === 1 && renderSetupStep()}
                {currentStep === 2 && renderGeneratingStep()}
                {currentStep === 3 && renderPreviewStep()}
            </main>
        </div>
    );
};

export default PresentationEnhanced;