import React, { useState, useRef, useEffect } from 'react';

const StreamingPresentation = ({ onBack }) => {
    const [currentStep, setCurrentStep] = useState(1); // 1: Setup, 2: Streaming, 3: Complete
    const [formData, setFormData] = useState({
        prompt: '',
        slideCount: 6,
        theme: 'modern',
        tone: 'professional',
        language: 'english'
    });

    // Streaming states
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamingProgress, setStreamingProgress] = useState(0);
    const [currentStreamStep, setCurrentStreamStep] = useState('');
    const [streamingMessage, setStreamingMessage] = useState('');
    const [slidesPreviews, setSlidesPreviews] = useState([]);
    const [presentationData, setPresentationData] = useState(null);
    const [streamingLogs, setStreamingLogs] = useState([]);
    const [error, setError] = useState('');
    const [websocket, setWebsocket] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [realTimeImages, setRealTimeImages] = useState([]);

    const eventSourceRef = useRef(null);
    const websocketRef = useRef(null);

    const themes = [
        {
            id: 'modern',
            name: 'Modern',
            preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Clean and contemporary design'
        },
        {
            id: 'corporate',
            name: 'Corporate',
            preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            description: 'Professional business style'
        },
        {
            id: 'creative',
            name: 'Creative',
            preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
            description: 'Vibrant and engaging colors'
        },
        {
            id: 'minimal',
            name: 'Minimal',
            preview: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            description: 'Simple and clean aesthetic'
        },
        {
            id: 'dark',
            name: 'Dark Mode',
            preview: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            description: 'Sleek dark interface'
        },
        {
            id: 'academic',
            name: 'Academic',
            preview: 'linear-gradient(135deg, #3742fa 0%, #2f3542 100%)',
            description: 'Scholarly and formal'
        }
    ];

    const tones = [
        { value: 'professional', label: 'Professional', icon: '💼' },
        { value: 'casual', label: 'Casual', icon: '😊' },
        { value: 'academic', label: 'Academic', icon: '�' },
        { value: 'creative', label: 'Creative', icon: '�' },
        { value: 'persuasive', label: 'Persuasive', icon: '🎯' },
        { value: 'informative', label: 'Informative', icon: '📊' }
    ];

    // Generate unique session ID
    useEffect(() => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
    }, []);

    // WebSocket connection
    useEffect(() => {
        if (!sessionId) return;

        const connectWebSocket = () => {
            const ws = new WebSocket(`ws://localhost:8002/ws/${sessionId}`);
            
            ws.onopen = () => {
                console.log('🔌 WebSocket connected');
                setWebsocket(ws);
                websocketRef.current = ws;
                
                // Send ping to keep connection alive
                const pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 30000);
                
                ws.pingInterval = pingInterval;
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setWebsocket(null);
                websocketRef.current = null;
                if (ws.pingInterval) {
                    clearInterval(ws.pingInterval);
                }
            };
            
            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setError('WebSocket connection failed. Please refresh the page.');
            };
        };

        connectWebSocket();

        return () => {
            if (websocketRef.current) {
                if (websocketRef.current.pingInterval) {
                    clearInterval(websocketRef.current.pingInterval);
                }
                websocketRef.current.close();
            }
        };
    }, [sessionId]);

    const handleWebSocketMessage = (message) => {
        console.log('📨 WebSocket message:', message);
        
        switch (message.type) {
            case 'progress':
                setStreamingProgress(message.data.progress);
                setStreamingMessage(message.data.message);
                setCurrentStreamStep(message.data.step);
                setStreamingLogs(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    message: message.data.message,
                    type: 'info',
                    step: message.data.step
                }]);
                break;
                
            case 'image_status':
                if (message.data.status === 'generating') {
                    setStreamingLogs(prev => [...prev, {
                        timestamp: new Date().toLocaleTimeString(),
                        message: `🎨 Generating image for slide ${message.data.slide_number}...`,
                        type: 'info'
                    }]);
                } else if (message.data.status === 'completed' && message.data.thumbnail) {
                    setRealTimeImages(prev => [...prev, {
                        slide_number: message.data.slide_number,
                        thumbnail: message.data.thumbnail,
                        status: 'completed'
                    }]);
                    setStreamingLogs(prev => [...prev, {
                        timestamp: new Date().toLocaleTimeString(),
                        message: `✅ Image completed for slide ${message.data.slide_number}`,
                        type: 'success'
                    }]);
                } else if (message.data.status === 'failed') {
                    setStreamingLogs(prev => [...prev, {
                        timestamp: new Date().toLocaleTimeString(),
                        message: `❌ Image failed for slide ${message.data.slide_number}`,
                        type: 'error'
                    }]);
                }
                break;
                
            case 'slide_preview':
                setSlidesPreviews(prev => [...prev, {
                    id: message.data.slide_number,
                    title: message.data.title,
                    points: message.data.points,
                    thumbnail: message.data.image_thumbnail,
                    status: message.data.status
                }]);
                break;
                
            case 'slide_completed':
                setStreamingLogs(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `📄 Completed slide: ${message.data.title}`,
                    type: 'success'
                }]);
                break;
                
            case 'completed':
                setPresentationData({
                    title: message.data.title,
                    presentation_url: message.data.presentation_url,
                    presentation_embed_url: message.data.presentation_embed_url,
                    total_slides: message.data.total_slides,
                    images_generated: realTimeImages.length,
                    success_rate: 100,
                    generation_time: 'Real-time'
                });
                setCurrentStep(3);
                setIsGenerating(false);
                setStreamingProgress(100);
                setStreamingLogs(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    message: message.data.message,
                    type: 'success'
                }]);
                break;
                
            case 'error':
                setError(message.data.message);
                setIsGenerating(false);
                setStreamingLogs(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `❌ Error: ${message.data.message}`,
                    type: 'error'
                }]);
                break;
                
            case 'browser_opened':
                setStreamingLogs(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    message: message.data.message,
                    type: 'success'
                }]);
                break;
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTestSyncGeneration = async () => {
        if (!formData.prompt.trim()) {
            setError('Please enter a topic for your presentation');
            return;
        }

        setIsGenerating(true);
        setCurrentStep(2);
        setStreamingProgress(0);
        setStreamingMessage('Testing synchronous version with working images...');
        setError('');

        try {
            const response = await fetch('http://localhost:8002/api/create-presentation-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: formData.prompt,
                    slideCount: formData.slideCount,
                    tone: formData.tone,
                    theme: formData.theme
                })
            });

            const data = await response.json();

            if (data.success) {
                setPresentationData({
                    title: data.title,
                    presentation_url: data.presentation_url,
                    presentation_embed_url: data.presentation_embed_url,
                    total_slides: formData.slideCount,
                    images_generated: formData.slideCount - 1,
                    success_rate: 100,
                    generation_time: 'Sync test'
                });
                setCurrentStep(3);
                setStreamingProgress(100);
                setStreamingMessage('✅ Sync test completed successfully!');
            } else {
                throw new Error(data.error || 'Failed to create presentation');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(`Error in sync test: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGeneratePresentation = async () => {
        if (!formData.prompt.trim()) {
            setError('Please enter a topic for your presentation');
            return;
        }

        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            setError('WebSocket connection not available. Please refresh the page.');
            return;
        }

        // Reset states
        setIsGenerating(true);
        setCurrentStep(2);
        setStreamingProgress(0);
        setStreamingMessage('');
        setCurrentStreamStep('');
        setSlidesPreviews([]);
        setStreamingLogs([]);
        setPresentationData(null);
        setRealTimeImages([]);
        setError('');

        try {
            // Send presentation request via WebSocket
            websocket.send(JSON.stringify({
                type: 'start_presentation',
                data: {
                    topic: formData.prompt,
                    slideCount: formData.slideCount,
                    tone: formData.tone,
                    theme: formData.theme
                }
            }));

            // Add initial log
            setStreamingLogs([{
                timestamp: new Date().toLocaleTimeString(),
                message: '🚀 Starting real-time presentation generation...',
                type: 'info',
                step: 'initialization'
            }]);

        } catch (error) {
            console.error('Error:', error);
            setError(`Error starting presentation generation: ${error.message}`);
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setSlidesPreviews([]);
        setStreamingLogs([]);
        setPresentationData(null);
        setStreamingProgress(0);
        setError('');
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        setFormData({
            prompt: '',
            slideCount: 6,
            theme: 'modern',
            tone: 'professional',
            language: 'english'
        });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
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
                        <div className="flex items-center space-x-4">
                            <h1 className="text-3xl font-bold text-white">
                                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                    AI Presentation Maker
                                </span>
                            </h1>
                            {currentStep > 1 && (
                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                    <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                                    <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                                    <div className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                                </div>
                            )}
                        </div>
                        <div className="w-32"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {currentStep === 1 && (
                    /* Step 1: Setup Form */
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-4xl font-bold text-white mb-4">Create a presentation with AI</h2>
                            <p className="text-xl text-gray-300">Watch your presentation come to life in real-time</p>
                        </div>

                        <div className="space-y-8">
                            {/* Main Prompt */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                <label className="block text-white font-semibold text-lg mb-4">
                                    What's your presentation about? ✨
                                </label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) => handleInputChange('prompt', e.target.value)}
                                    placeholder="e.g., 'Create a presentation about sustainable energy solutions for corporate executives, focusing on cost savings and environmental impact'"
                                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                                    rows="4"
                                />
                                <div className="mt-3 text-sm text-gray-400">
                                    💡 Be specific about your topic, audience, and key points you want to cover
                                </div>
                            </div>

                            {/* Configuration Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Slide Count */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                        <label className="block text-white font-medium mb-4">Number of slides</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[4, 6, 8].map((count) => (
                                                <button
                                                    key={count}
                                                    onClick={() => handleInputChange('slideCount', count)}
                                                    className={`relative p-4 rounded-xl border transition-all duration-300 ${formData.slideCount === count
                                                        ? 'border-yellow-400 bg-yellow-400/20 ring-2 ring-yellow-400/50'
                                                        : 'border-white/20 bg-white/5 hover:border-white/30'
                                                        }`}
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-white mb-1">{count}</div>
                                                        <div className="text-xs text-gray-300">slides</div>
                                                    </div>
                                                    {formData.slideCount === count && (
                                                        <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tone Selection */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                        <label className="block text-white font-medium mb-4">Tone & Style</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {tones.map((tone) => (
                                                <button
                                                    key={tone.value}
                                                    onClick={() => handleInputChange('tone', tone.value)}
                                                    className={`p-3 rounded-lg border transition-all duration-300 text-left ${formData.tone === tone.value
                                                        ? 'border-yellow-400 bg-yellow-400/20'
                                                        : 'border-white/20 bg-white/5 hover:border-white/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-lg">{tone.icon}</span>
                                                        <span className="text-white text-sm font-medium">{tone.label}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Theme Selection */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                    <label className="block text-white font-medium mb-4">Choose Theme</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => handleInputChange('theme', theme.id)}
                                                className={`relative p-4 rounded-xl border transition-all duration-300 ${formData.theme === theme.id
                                                    ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                                                    : 'border-white/20 hover:border-white/30'
                                                    }`}
                                            >
                                                <div
                                                    className="w-full h-16 rounded-lg mb-3"
                                                    style={{ background: theme.preview }}
                                                ></div>
                                                <div className="text-white font-medium text-sm">{theme.name}</div>
                                                <div className="text-gray-400 text-xs mt-1">{theme.description}</div>
                                                {formData.theme === theme.id && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="text-center">
                                <button
                                    onClick={handleGeneratePresentation}
                                    disabled={!formData.prompt.trim() || isGenerating || !websocket}
                                    className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Presentation ✨ (Real-time)'}
                                </button>
                                
                                {/* Test Sync Button */}
                                <button
                                    onClick={handleTestSyncGeneration}
                                    disabled={!formData.prompt.trim() || isGenerating}
                                    className="mt-3 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Test Sync Version (Images Working)
                                </button>
                                
                                {/* WebSocket Status */}
                                <div className="flex items-center justify-center mt-3 space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${websocket ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                    <span className="text-xs text-gray-400">
                                        {websocket ? 'Real-time connection active' : 'Connecting...'}
                                    </span>
                                </div>
                                
                                <p className="text-gray-400 text-sm mt-3">
                                    Watch your presentation being created in real-time
                                </p>
                                {error && (
                                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                                        <p className="font-medium">Error:</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    /* Step 2: Real-time Generation */
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Creating your presentation...</h2>
                            <p className="text-gray-300 text-lg mb-6">
                                {streamingMessage || 'Initializing AI systems...'}
                            </p>

                            {/* Progress Bar */}
                            <div className="max-w-2xl mx-auto mb-8">
                                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                                    <span>{currentStreamStep.replace(/_/g, ' ')}</span>
                                    <span>{streamingProgress}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${streamingProgress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Quick Access Link - Show when presentation is ready */}
                            {presentationData && presentationData.presentation_url && (
                                <div className="max-w-2xl mx-auto mb-6">
                                    <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-green-300 font-medium">Presentation Ready!</span>
                                        </div>
                                        <button
                                            onClick={() => window.open(presentationData.presentation_url, '_blank')}
                                            className="mt-3 w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200"
                                        >
                                            🚀 Open in Google Slides
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Real-Time Image Generation */}
                        {realTimeImages.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">🖼️ Live Image Generation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {realTimeImages.map((image) => (
                                        <div key={image.slide_number} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 animate-fade-in">
                                            <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden relative">
                                                {image.thumbnail ? (
                                                    <img 
                                                        src={image.thumbnail} 
                                                        alt={`Slide ${image.slide_number}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        image.status === 'completed' ? 'bg-green-500/20 text-green-300' : 
                                                        image.status === 'failed' ? 'bg-red-500/20 text-red-300' : 
                                                        'bg-yellow-500/20 text-yellow-300'
                                                    }`}>
                                                        {image.status === 'completed' ? '✅' : 
                                                         image.status === 'failed' ? '❌' : '⏳'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-yellow-400 font-medium">
                                                    Slide {image.slide_number}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {image.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Slide Previews */}
                        {slidesPreviews.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">📄 Live Slide Previews</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {slidesPreviews.map((slide) => (
                                        <div key={slide.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 animate-fade-in">
                                            <div className="aspect-video bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg mb-3 p-4 flex flex-col justify-center relative overflow-hidden">
                                                {slide.thumbnail && (
                                                    <img
                                                        src={slide.thumbnail}
                                                        alt="Slide preview"
                                                        className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-40"
                                                    />
                                                )}
                                                <div className="relative z-10">
                                                    <div className="text-white text-xs font-bold mb-2 opacity-80">
                                                        📄 Slide {slide.id}
                                                    </div>
                                                    <div className="text-white text-sm font-semibold line-clamp-2 mb-2">
                                                        {slide.title}
                                                    </div>
                                                    {slide.points && slide.points.length > 0 && (
                                                        <div className="text-gray-300 text-xs">
                                                            {slide.points.slice(0, 2).map((point, i) => (
                                                                <div key={i} className="line-clamp-1">• {point}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-yellow-400 font-medium">
                                                    Slide {slide.id}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    slide.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                    {slide.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Streaming Logs */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Generation Log</h3>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {streamingLogs.map((log, index) => (
                                    <div key={index} className="flex items-start space-x-3 text-sm">
                                        <span className="text-gray-500 text-xs mt-0.5 min-w-[60px]">
                                            {log.timestamp}
                                        </span>
                                        <span className={`${log.type === 'error' ? 'text-red-400' :
                                            log.type === 'complete' ? 'text-green-400' :
                                                'text-gray-300'
                                            }`}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && presentationData && (
                    /* Step 3: Completion */
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-4xl font-bold text-white mb-4">🎉 Presentation Ready!</h2>
                            <p className="text-xl text-gray-300 mb-8">
                                Your AI-powered presentation has been created successfully
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
                            <h3 className="text-2xl font-bold text-white mb-6">{presentationData.title}</h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400">{presentationData.total_slides}</div>
                                    <div className="text-gray-300 text-sm">Total Slides</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400">{presentationData.images_generated}</div>
                                    <div className="text-gray-300 text-sm">AI Images</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400">{presentationData.success_rate}%</div>
                                    <div className="text-gray-300 text-sm">Success Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-400">{presentationData.generation_time}</div>
                                    <div className="text-gray-300 text-sm">Generation Time</div>
                                </div>
                            </div>

                            {/* Embedded Presentation Viewer */}
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold text-white mb-4">📖 Preview Your Presentation</h4>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <iframe
                                        src={presentationData.presentation_embed_url}
                                        width="100%"
                                        height="400"
                                        frameBorder="0"
                                        allowFullScreen={true}
                                        mozAllowFullScreen={true}
                                        webkitAllowFullScreen={true}
                                        className="rounded-lg"
                                        title="Presentation Preview"
                                    ></iframe>
                                    <p className="text-gray-400 text-sm mt-2 text-center">
                                        Click on the presentation above to navigate through slides, or use the buttons below to open in Google Slides
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => window.open(presentationData.presentation_url, '_blank')}
                                    className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    🚀 Open in Google Slides
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(presentationData.presentation_url)}
                                    className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    📋 Copy Link
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
                                >
                                    ✨ Create New
                                </button>
                            </div>
                        </div>

                        {/* Final Slide Previews */}
                        {slidesPreviews.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {slidesPreviews.map((slide, index) => (
                                    slide && (
                                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                            <div className="aspect-video bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg mb-3 p-4 flex flex-col justify-center">
                                                <div className="text-white text-xs font-bold mb-2 opacity-80">
                                                    {slide.type === 'title' ? '📋 Title Slide' : `📄 Slide ${slide.slide_number + 1}`}
                                                </div>
                                                <div className="text-white text-sm font-semibold line-clamp-2 mb-2">
                                                    {slide.title}
                                                </div>
                                                {slide.points && slide.points.length > 0 && (
                                                    <div className="text-gray-300 text-xs">
                                                        {slide.points.slice(0, 2).map((point, i) => (
                                                            <div key={i} className="line-clamp-1">• {point}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-yellow-400 font-medium">
                                                    {slide.type === 'title' ? 'Title' : `Slide ${slide.slide_number + 1}`}
                                                </span>
                                                {slide.has_image && (
                                                    <span className="text-xs text-green-400">🖼️ Image</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StreamingPresentation;