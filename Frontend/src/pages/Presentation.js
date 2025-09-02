import React, { useState } from 'react';

const Presentation = ({ onBack }) => {
    const [currentStep, setCurrentStep] = useState(1); // 1: Setup, 2: Generating, 3: Preview
    const [formData, setFormData] = useState({
        prompt: '',
        slideCount: 6,
        theme: 'modern',
        tone: 'professional',
        audience: 'general',
        language: 'english'
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSlides, setGeneratedSlides] = useState([]);
    const [selectedSlide, setSelectedSlide] = useState(null);
    const [presentationUrl, setPresentationUrl] = useState('');
    const [error, setError] = useState('');

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
        { value: 'academic', label: 'Academic', icon: '🎓' },
        { value: 'creative', label: 'Creative', icon: '🎨' },
        { value: 'persuasive', label: 'Persuasive', icon: '🎯' },
        { value: 'informative', label: 'Informative', icon: '📊' }
    ];

    const audiences = [
        { value: 'general', label: 'General Audience', description: 'Mixed background and expertise' },
        { value: 'executives', label: 'Executives', description: 'C-level and senior management' },
        { value: 'students', label: 'Students', description: 'Educational and learning focused' },
        { value: 'technical', label: 'Technical Team', description: 'Engineers and developers' },
        { value: 'sales', label: 'Sales Team', description: 'Revenue and growth focused' },
        { value: 'investors', label: 'Investors', description: 'Financial and strategic focus' }
    ];

    const audiences = [
        { value: 'general', label: 'General Audience', description: 'Mixed background and expertise' },
        { value: 'executives', label: 'Executives', description: 'C-level and senior management' },
        { value: 'students', label: 'Students', description: 'Educational and learning focused' },
        { value: 'technical', label: 'Technical Team', description: 'Engineers and developers' },
        { value: 'sales', label: 'Sales Team', description: 'Revenue and growth focused' },
        { value: 'investors', label: 'Investors', description: 'Financial and strategic focus' }
    ];

    const handleGeneratePresentation = async () => {
        if (!formData.prompt.trim()) {
            alert('Please enter a prompt for your presentation');
            return;
        }

        setIsGenerating(true);
        setCurrentStep(2);
        setError('');

        try {
            const response = await fetch('http://localhost:8002/api/create-presentation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: formData.prompt,
                    slideCount: formData.slideCount,
                    tone: formData.tone
                })
            });

            const data = await response.json();

            if (data.success) {
                // Create mock slides for preview (since we don't get slide content back from API)
                const mockSlides = Array.from({ length: formData.slideCount }, (_, i) => ({
                    id: i + 1,
                    title: i === 0 ? data.title : `${formData.prompt} - Section ${i}`,
                    content: i === 0
                        ? `Welcome to this presentation about ${formData.prompt}. Let's explore this topic together.`
                        : `This slide covers key aspects of ${formData.prompt}. Here we dive deep into important concepts and insights that will help you understand the subject better.`,
                    type: i === 0 ? 'title' : i === formData.slideCount - 1 ? 'conclusion' : 'content',
                    theme: formData.theme
                }));

                setGeneratedSlides(mockSlides);
                setPresentationUrl(data.presentation_url);
                setCurrentStep(3);
            } else {
                throw new Error(data.error || 'Failed to create presentation');
            }
        } catch (error) {
            console.error('Error creating presentation:', error);
            setError(error.message || 'Failed to create presentation. Please try again.');
            setCurrentStep(1);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const resetForm = () => {
        setCurrentStep(1);
        setGeneratedSlides([]);
        setSelectedSlide(null);
        setPresentationUrl('');
        setError('');
        setFormData({
            prompt: '',
            slideCount: 6,
            theme: 'modern',
            tone: 'professional',
            audience: 'general',
            language: 'english'
        });
    };

    const openPresentation = () => {
        if (presentationUrl) {
            window.open(presentationUrl, '_blank');
        }
    };

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
                            <p className="text-xl text-gray-300">Describe your topic and let AI build your slides</p>
                        </div>

                        <div className="space-y-10">
                            {/* Main Layout Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Left Column - All Configuration Options */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Number of slides */}
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
                                        <div className="grid grid-cols-1 gap-3">
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

                                    {/* Theme Selection */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                        <label className="block text-white font-medium mb-4">Choose Theme</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {themes.map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => handleInputChange('theme', theme.id)}
                                                    className={`relative p-4 rounded-xl border transition-all duration-300 ${formData.theme === theme.id
                                                            ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                                                            : 'border-white/20 hover:border-white/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className="w-12 h-12 rounded-lg flex-shrink-0"
                                                            style={{ background: theme.preview }}
                                                        ></div>
                                                        <div className="flex-1 text-left">
                                                            <div className="text-white font-medium text-sm">{theme.name}</div>
                                                            <div className="text-gray-400 text-xs mt-1">{theme.description}</div>
                                                        </div>
                                                    </div>
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

                                    {/* Target Audience */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                        <label className="block text-white font-medium mb-4">Target Audience</label>
                                        <select
                                            value={formData.audience}
                                            onChange={(e) => handleInputChange('audience', e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                                        >
                                            {audiences.map((audience) => (
                                                <option key={audience.value} value={audience.value} className="bg-gray-800">
                                                    {audience.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mt-2 text-sm text-gray-400">
                                            {audiences.find(a => a.value === formData.audience)?.description}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Main Prompt */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 h-full">
                                        <label className="block text-white font-semibold text-lg mb-6">
                                            What's your presentation about? ✨
                                        </label>
                                        <textarea
                                            value={formData.prompt}
                                            onChange={(e) => handleInputChange('prompt', e.target.value)}
                                            placeholder="e.g., 'Create a presentation about sustainable energy solutions for corporate executives, focusing on cost savings and environmental impact'"
                                            className="w-full h-64 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                                        />
                                        <div className="mt-4 text-sm text-gray-400">
                                            💡 Be specific about your topic, audience, and key points you want to cover
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="text-center">
                                <button
                                    onClick={handleGeneratePresentation}
                                    disabled={!formData.prompt.trim() || isGenerating}
                                    className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Presentation ✨'}
                                </button>
                                <p className="text-gray-400 text-sm mt-3">
                                    This will create a real Google Slides presentation with AI-generated content and images
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
                    /* Step 2: Generating */
                    <div className="max-w-2xl mx-auto text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Creating your presentation...</h2>
                        <p className="text-gray-300 text-lg mb-8">
                            AI is generating {formData.slideCount} slides with images and uploading to Google Slides
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <div className="space-y-3 text-sm text-gray-300">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                    <span>Generating content with Gemini AI...</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                    <span>Creating images with FLUX AI...</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                    <span>Building Google Slides presentation...</span>
                                </div>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 mt-4">
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                This may take 1-2 minutes depending on the number of slides and images
                            </p>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    /* Step 3: Preview Generated Slides */
                    <div className="space-y-6">
                        {/* Header with actions */}
                        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Your Presentation is Ready! 🎉</h2>
                                <p className="text-gray-300">
                                    {generatedSlides.length} slides • {formData.theme} theme • {formData.tone} tone
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                                >
                                    Create New
                                </button>
                                <button
                                    onClick={openPresentation}
                                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                                >
                                    Open in Google Slides 🚀
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(presentationUrl)}
                                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                                >
                                    Copy Link 📋
                                </button>
                            </div>
                        </div>

                        {/* Slides Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {generatedSlides.map((slide) => (
                                <div
                                    key={slide.id}
                                    onClick={() => setSelectedSlide(slide)}
                                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-yellow-400/50 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
                                >
                                    {/* Slide Preview */}
                                    <div className="aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg mb-4 p-4 flex flex-col justify-center">
                                        <div className="text-white text-xs font-bold mb-2 opacity-80">
                                            {slide.type === 'title' ? '📋 Title Slide' : slide.type === 'conclusion' ? '🎯 Conclusion' : '📄 Content'}
                                        </div>
                                        <div className="text-white text-sm font-semibold line-clamp-2 mb-2">
                                            {slide.title}
                                        </div>
                                        <div className="text-gray-300 text-xs line-clamp-3">
                                            {slide.content}
                                        </div>
                                    </div>

                                    {/* Slide Info */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-yellow-400 font-medium">Slide {slide.id}</span>
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-white/60 hover:text-white transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button className="text-white/60 hover:text-white transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Slide Button */}
                        <div className="text-center">
                            <button className="px-8 py-4 bg-white/10 border-2 border-dashed border-white/30 text-white rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-300 font-medium">
                                + Add More Slides
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Slide Detail Modal */}
            {selectedSlide && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-white/20 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Slide {selectedSlide.id} - Edit</h3>
                            <button
                                onClick={() => setSelectedSlide(null)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-8 mb-6 flex flex-col justify-center">
                                <h4 className="text-2xl font-bold text-white mb-4">{selectedSlide.title}</h4>
                                <p className="text-gray-300 text-lg leading-relaxed">{selectedSlide.content}</p>
                            </div>
                            <div className="flex space-x-4">
                                <button className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                                    Save Changes
                                </button>
                                <button className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium">
                                    Duplicate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Presentation;