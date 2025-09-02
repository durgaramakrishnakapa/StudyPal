import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';
import SectionIcons from './SectionIcons';
import Chatbot from './pages/Chatbot';
import ResourceProvider from './pages/ResourceProvider';
import SmartCanvas from './pages/SmartCanvas';
import CodeGenerator from './pages/CodeGenerator';
import ContentGenerator from './pages/ContentGenerator';
import StreamingPresentation from './pages/StreamingPresentation';
import NewPresentationUI from './pages/NewPresentationUI';

import Robot3DScene from './components/Robot3D';

// Helper component to render icons
const IconRenderer = ({ iconName, className }) => {
  const IconComponent = SectionIcons[iconName];
  if (!IconComponent) {
    return <div className={`bg-white/20 rounded-lg flex items-center justify-center text-white text-xs ${className}`}>Icon</div>;
  }
  return <IconComponent className={className} />;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'dashboard', or specific page

  useEffect(() => {
    // Start fade out after 4.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      setIsTransitioning(true);
    }, 4500);

    // Hide splash screen after fade completes
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 5500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleDashboardClick = () => {
    setCurrentView('dashboard');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleSectionClick = (sectionId) => {
    setCurrentView(sectionId);
  };

  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Overview of your learning progress and activities',
      iconComponent: 'dashboard',
      accentColor: 'from-blue-400 to-blue-500',
      hoverGlow: 'hover:shadow-blue-400/20'
    },
    {
      id: 'smart-canvas',
      title: 'Smart Canvas',
      description: 'Interactive whiteboard for visual learning',
      iconComponent: 'smartCanvas',
      accentColor: 'from-pink-400 to-pink-500',
      hoverGlow: 'hover:shadow-pink-400/20'
    },
    {
      id: 'presentation',
      title: 'AI Presentation Generator',
      description: 'Create professional presentations with AI',
      iconComponent: 'presentation',
      accentColor: 'from-yellow-400 to-orange-400',
      hoverGlow: 'hover:shadow-yellow-400/20'
    },
    {
      id: 'resource-provider',
      title: 'Resource Provider',
      description: 'Access curated study materials and resources',
      iconComponent: 'resourceProvider',
      accentColor: 'from-emerald-400 to-emerald-500',
      hoverGlow: 'hover:shadow-emerald-400/20'
    },
    {
      id: 'content-generator',
      title: 'Content Generator',
      description: 'Create study notes and summaries',
      iconComponent: 'contentGenerator',
      accentColor: 'from-teal-400 to-teal-500',
      hoverGlow: 'hover:shadow-teal-400/20'
    },
    {
      id: 'code-generator',
      title: 'Code Generator',
      description: 'Generate code snippets and examples',
      iconComponent: 'codeGenerator',
      accentColor: 'from-orange-400 to-orange-500',
      hoverGlow: 'hover:shadow-orange-400/20'
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      description: 'Get instant help with your studies',
      iconComponent: 'chatbot',
      accentColor: 'from-purple-400 to-purple-500',
      hoverGlow: 'hover:shadow-purple-400/20'
    }
  ];

  if (showSplash || isTransitioning) {
    return (
      <div className="min-h-screen bg-black">
        <div className={fadeOut ? 'animate-fade-out' : ''}>
          <SplashScreen onComplete={() => setShowSplash(false)} />
        </div>
      </div>
    );
  }

  // Landing Page - Only Dashboard
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden" style={{ animation: 'fadeIn 0.8s ease-in-out' }}>
        {/* Animated Background Particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-particle-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Geometric Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 border border-white/5 rounded-full animate-rotate-slow"></div>
          <div className="absolute w-80 h-80 border border-white/10 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse' }}></div>
        </div>

        {/* Header */}
        <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
              <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                StudyPal
              </span>
            </h1>
            <p className="text-xl text-gray-300 font-light animate-slide-up">
              Your AI-Powered Learning Companion
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          {/* 3D Robot Scene with Enter Dashboard Overlay */}
          <div className="mb-16 animate-slide-up relative">
            <div className="max-w-6xl mx-auto relative">
              <Robot3DScene />

              {/* Enter Dashboard Overlay positioned over the robot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="px-12 py-8 transform hover:scale-105 transition-all duration-300 group cursor-pointer"
                  onClick={handleDashboardClick}
                >
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">Enter Dashboard</h4>
                    <p className="text-gray-300 mb-52 leading-relaxed text-sm max-w-xs drop-shadow-md">
                      Access all your learning tools and AI-powered study resources
                    </p>
                    <button className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:opacity-90 font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wide text-sm">
                      Get Started Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {sections.filter(section => section.id !== 'dashboard').map((section, index) => (
              <div
                key={section.id}
                className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 animate-slide-up group hover:bg-white/10`}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  <div className="mr-4 group-hover:scale-110 transition-transform duration-300">
                    <IconRenderer iconName={section.iconComponent} className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{section.title}</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{section.description}</p>
              </div>
            ))}
          </div>

          {/* What Makes StudyPal Special */}
          <div className="mb-20 animate-slide-up" style={{ animationDelay: '1.2s' }}>
            <h3 className="text-3xl font-bold text-white text-center mb-12">What Makes StudyPal Special?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Lightning Fast AI</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Get instant answers, generate content, and receive personalized study recommendations powered by advanced AI technology.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">All-in-One Platform</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  From resource management to exam preparation, everything you need for successful learning is integrated in one seamless platform.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Smart Learning</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Adaptive learning algorithms that understand your pace, strengths, and areas for improvement to optimize your study sessions.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Student-Centered</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Designed with students in mind, featuring intuitive interfaces, personalized experiences, and tools that actually help you succeed.
                </p>
              </div>
            </div>
          </div>



          {/* Call to Action */}
          <div className="text-center animate-slide-up" style={{ animationDelay: '1.6s' }}>
            <h3 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Learning?</h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who have already revolutionized their study experience with StudyPal's AI-powered learning tools.
            </p>
          </div>
        </main>

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 animate-pulse"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

        {/* Glowing Orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/3 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>
    );
  }

  // Individual Section Pages
  if (currentView === 'chatbot') {
    return <Chatbot onBack={handleBackToDashboard} />;
  }

  if (currentView === 'resource-provider') {
    return <ResourceProvider onBack={handleBackToDashboard} />;
  }

  if (currentView === 'smart-canvas') {
    return <SmartCanvas onBack={handleBackToDashboard} />;
  }

  if (currentView === 'code-generator') {
    return <CodeGenerator onBack={handleBackToDashboard} />;
  }

  if (currentView === 'content-generator') {
    return <ContentGenerator onBack={handleBackToDashboard} />;
  }

  if (currentView === 'presentation') {
    return <NewPresentationUI onBack={handleBackToDashboard} />;
  }

  // Dashboard View - All Sections (excluding Dashboard itself)
  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{ animation: 'fadeIn 0.8s ease-in-out' }}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Geometric Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 border border-white/5 rounded-full animate-rotate-slow"></div>
        <div className="absolute w-80 h-80 border border-white/10 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToLanding}
              className="text-white/70 hover:text-white transition-colors duration-300 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-fade-in">
                <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                  StudyPal Dashboard
                </span>
              </h1>
              <p className="text-lg text-gray-300 font-light animate-slide-up">
                Choose your learning tool
              </p>
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.filter(section => section.id !== 'dashboard').map((section, index) => (
            <div
              key={section.id}
              className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl hover:shadow-2xl ${section.hoverGlow} transform hover:-translate-y-3 hover:scale-105 transition-all duration-300 border border-white/20 group animate-slide-up hover:bg-white/15`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="mb-6 text-center group-hover:animate-bounce-gentle flex justify-center">
                <IconRenderer iconName={section.iconComponent} className="w-16 h-16" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                {section.title}
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-center mb-8 leading-relaxed">
                {section.description}
              </p>

              {/* Button - with subtle accent colors */}
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`w-full py-4 px-6 bg-gradient-to-r ${section.accentColor} text-white hover:opacity-90 font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wide text-sm`}
              >
                Open {section.title}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 animate-pulse"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/3 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}

export default App;