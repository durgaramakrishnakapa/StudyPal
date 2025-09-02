import React, { useState, useRef, useEffect } from 'react';

const NewPresentationUI = ({ onBack }) => {
    const [formData, setFormData] = useState({
        prompt: '',
        slideCount: 6,
        theme: 'modern',
        tone: 'professional'
    });

    // Streaming states
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamingProgress, setStreamingProgress] = useState(0);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [streamingLogs, setStreamingLogs] = useState([]);
    const [presentationData, setPresentationData] = useState(null);
    const [error, setError] = useState('');
    const [websocket, setWebsocket] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [realTimeImages, setRealTimeImages] = useState([]);
    const [slidesPreviews, setSlidesPreviews] = useState([]);

    const websocketRef = useRef(null);

    // Slide count options
    const slideOptions = [4, 6, 8, 10];
    
    // Tone & Style options
    const toneOptions = [
        { id: 'professional', name: 'Professional', icon: '💼' },
        { id: 'creative', name: 'Creative', icon: '🎨' },
        { id: 'academic', name: 'Academic', icon: '📚' },
        { id: 'tech-friendly', name: 'friendly', icon: '💻' }
    ];

    // Theme colors (Original from reference image)
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
            description: 'Dark and sophisticated'
        },
        {
            id: 'academic',
            name: 'Academic',
            preview: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            description: 'Scholarly and professional'
        }
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
                setStreamingLogs(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    message: message.data.message,
                    type: 'info'
                }]);
                break;
                
            case 'image_status':
                if (message.data.status === 'completed' && message.data.thumbnail) {
                    setRealTimeImages(prev => [...prev, {
                        slide_number: message.data.slide_number,
                        thumbnail: message.data.thumbnail,
                        status: 'completed'
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
                
            case 'presentation_created':
                // Set presentation URL early for live streaming button
                setPresentationData(prev => ({
                    ...prev,
                    presentation_url: message.data.presentation_url,
                    title: message.data.title
                }));
                break;
                
            case 'completed':
                setPresentationData({
                    title: message.data.title,
                    presentation_url: message.data.presentation_url,
                    presentation_embed_url: message.data.presentation_embed_url,
                    total_slides: message.data.total_slides
                });
                setIsGenerating(false);
                setStreamingProgress(100);
                break;
                
            case 'error':
                setError(message.data.message);
                setIsGenerating(false);
                break;
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

        setIsGenerating(true);
        setStreamingProgress(0);
        setStreamingMessage('');
        setStreamingLogs([]);
        setPresentationData(null);
        setRealTimeImages([]);
        setSlidesPreviews([]);
        setError('');

        try {
            websocket.send(JSON.stringify({
                type: 'start_presentation',
                data: {
                    topic: formData.prompt,
                    slideCount: formData.slideCount,
                    tone: formData.tone,
                    theme: formData.theme
                }
            }));

            setStreamingLogs([{
                timestamp: new Date().toLocaleTimeString(),
                message: '🚀 Starting real-time presentation generation...',
                type: 'info'
            }]);

        } catch (error) {
            console.error('Error:', error);
            setError(`Error starting presentation generation: ${error.message}`);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={onBack}
                            className="text-white/70 hover:text-white transition-colors duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-white">AI Presentation Maker</h1>
                        </div>
                        <div className="text-sm text-white/60">
                            Real-time streaming 
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
                    
                    {/* Left Panel - Controls (Wider) */}
                    <div className="col-span-4 space-y-4">
                        
                        {/* Slides Section */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-3">Slides</h3>
                            <div className="flex space-x-3">
                                {slideOptions.map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setFormData(prev => ({ ...prev, slideCount: count }))}
                                        className={`flex-1 h-10 rounded-lg border-2 font-semibold transition-all ${
                                            formData.slideCount === count
                                                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                                                : 'border-white/30 bg-white/10 text-white hover:border-white/50'
                                        }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tone & Style Section */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-3">Tone & Style</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {toneOptions.map((tone) => (
                                    <button
                                        key={tone.id}
                                        onClick={() => setFormData(prev => ({ ...prev, tone: tone.id }))}
                                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all text-center ${
                                            formData.tone === tone.id
                                                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                                                : 'border-white/30 bg-white/10 text-white hover:border-white/50'
                                        }`}
                                    >
                                        <div className="text-lg mb-1">{tone.icon}</div>
                                        <div className="leading-tight">{tone.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Choose Theme Section */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-3">Choose Theme</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                                        className={`relative p-2 rounded-lg border-2 transition-all text-center ${
                                            formData.theme === theme.id
                                                ? 'border-yellow-400 ring-2 ring-yellow-400/30'
                                                : 'border-white/20 hover:border-white/40'
                                        }`}
                                    >
                                        {/* Theme Preview */}
                                        <div 
                                            className="w-full h-12 rounded-md mb-2 relative overflow-hidden"
                                            style={{ background: theme.preview }}
                                        >
                                            {formData.theme === theme.id && (
                                                <div className="absolute top-1 right-1">
                                                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Theme Info */}
                                        <div>
                                            <h4 className="text-white font-semibold text-xs">{theme.name}</h4>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Panel - Main Input */}
                    <div className="col-span-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 h-full flex flex-col">
                            
                            {!isGenerating && !presentationData ? (
                                <>
                                    {/* Input Section */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-bold text-white mb-4">
                                                What's your project about?
                                            </h2>
                                            <p className="text-white/70">
                                                Start by entering your topic or idea
                                            </p>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <textarea
                                                    value={formData.prompt}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                                                    placeholder="Enter your presentation topic here..."
                                                    className="w-full h-32 p-4 bg-white/10 border border-white/30 rounded-lg resize-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg text-white placeholder-white/50"
                                                    disabled={isGenerating}
                                                />
                                            </div>

                                            {error && (
                                                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                                    <p className="text-red-300 text-sm">{error}</p>
                                                </div>
                                            )}

                                            {/* WebSocket Status */}
                                            <div className="flex items-center justify-center space-x-2 text-sm">
                                                <div className={`w-2 h-2 rounded-full ${websocket ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                <span className="text-white/60">
                                                    {websocket ? 'Real-time connection active' : 'Connecting...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    <div className="pt-6 border-t border-white/20">
                                        <button
                                            onClick={handleGeneratePresentation}
                                            disabled={!formData.prompt.trim() || isGenerating || !websocket}
                                            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 text-lg"
                                        >
                                            {isGenerating ? 'Generating...' : 'Generate Presentation ✨'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* Generation Progress */
                                <div className="flex-1 flex flex-col">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            Generating Your Presentation
                                        </h2>
                                        <p className="text-white/70">{streamingMessage}</p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-8">
                                        <div className="flex justify-between text-sm text-white/70 mb-2">
                                            <span>Progress</span>
                                            <span>{Math.round(streamingProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-3">
                                            <div 
                                                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${streamingProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Live Streaming Button in Center Panel - Shows during generation */}
                                    {isGenerating && presentationData && presentationData.presentation_url && (
                                        <div className="mb-8 text-center">
                                            <a
                                                href={presentationData.presentation_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-lg">Watch Live Streaming</span>
                                                </div>
                                            </a>
                                            <p className="text-white/60 text-sm mt-3">
                                                Click to watch real-time generation in Google Slides
                                            </p>
                                        </div>
                                    )}

                                    {/* Completion - Show simple message, PPT moved to right panel */}
                                    {presentationData && !isGenerating && (
                                        <div className="text-center">
                                            <div className="mb-8">
                                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-3">Presentation Ready!</h3>
                                                <p className="text-white/70 text-lg mb-8">{presentationData.title}</p>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => {
                                                        setIsGenerating(false);
                                                        setPresentationData(null);
                                                        setStreamingProgress(0);
                                                        setFormData(prev => ({ ...prev, prompt: '' }));
                                                        setRealTimeImages([]);
                                                        setSlidesPreviews([]);
                                                        setStreamingLogs([]);
                                                    }}
                                                    className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 text-lg"
                                                >
                                                    Create Another Presentation ✨
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Streaming Area / PPT Display */}
                    <div className="col-span-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {presentationData && !isGenerating ? 'Your Presentation' : 'Streaming for PPT'}
                                </h3>
                            </div>
                            
                            {/* Show PPT Embed after completion */}
                            {presentationData && !isGenerating ? (
                                <div className="space-y-4">
                                    {/* PPT Embed in Right Panel */}
                                    <div className="mb-4">
                                        <iframe
                                            src={presentationData.presentation_embed_url}
                                            width="100%"
                                            height="300"
                                            className="rounded-lg border border-white/20"
                                            allowFullScreen={true}
                                            mozallowfullscreen="true"
                                            webkitallowfullscreen="true"
                                        ></iframe>
                                    </div>
                                    
                                    {/* Open in Google Slides Button */}
                                    <a
                                        href={presentationData.presentation_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center"
                                    >
                                        Open in Google Slides
                                    </a>
                                    
                                    {/* Show Generation Summary */}
                                    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                                        <h4 className="text-white font-semibold text-sm mb-2">Generation Complete</h4>
                                        <p className="text-white/60 text-xs">
                                            ✅ {presentationData.total_slides || formData.slideCount} slides created<br/>
                                            ✅ Images generated and uploaded<br/>
                                            ✅ Presentation ready for viewing
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Show Generation Logs during generation only */
                                streamingLogs.length > 0 && isGenerating ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {streamingLogs.map((log, index) => (
                                            <div key={index} className="text-sm">
                                                <div className="flex items-start space-x-3">
                                                    <span className="text-white/40 text-xs mt-0.5 min-w-[70px] flex-shrink-0">
                                                        {log.timestamp}
                                                    </span>
                                                    <span className={`flex-1 leading-relaxed ${
                                                        log.type === 'error' ? 'text-red-400' : 
                                                        log.type === 'success' ? 'text-green-400' : 
                                                        'text-white/80'
                                                    }`}>
                                                        {log.message}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-64 text-white/40">
                                        <div className="text-center">
                                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                            <p className="text-sm">Generation logs will appear here</p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPresentationUI;