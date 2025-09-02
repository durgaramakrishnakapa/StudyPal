import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SplashScreen = ({ onComplete }) => {
  const containerRef = useRef();
  const booksRef = useRef();
  const particlesRef = useRef();
  const titleRef = useRef();
  const subtitleRef = useRef();
  const progressRef = useRef();
  const floatingElementsRef = useRef();

  useEffect(() => {
    console.log('BLACK AND WHITE SPLASH SCREEN LOADING!');
    
    const tl = gsap.timeline();
    
    // Set initial states
    gsap.set([titleRef.current, subtitleRef.current], { opacity: 0, y: 100, rotationX: -90 });
    gsap.set(booksRef.current, { opacity: 0, scale: 0, rotation: -180 });
    gsap.set(progressRef.current, { opacity: 0, scaleX: 0 });
    gsap.set('.floating-element', { opacity: 0, scale: 0 });
    gsap.set('.particle', { opacity: 0, scale: 0 });
    gsap.set('.book-page', { rotationY: 0 });

    // Main animation sequence
    tl.to('.particle', {
      opacity: 1,
      scale: 1,
      duration: 0.1,
      stagger: 0.02,
      ease: "back.out(1.7)"
    })
    .to(booksRef.current, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 1.5,
      ease: "elastic.out(1, 0.5)"
    }, 0.5)
    .to('.book-page', {
      rotationY: 180,
      duration: 0.8,
      stagger: 0.3,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    }, 1)
    .to(titleRef.current, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      ease: "back.out(1.7)"
    }, 1.5)
    .to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1,
      ease: "back.out(1.7)"
    }, 2)
    .to('.floating-element', {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "elastic.out(1, 0.3)"
    }, 2.5)
    .to(progressRef.current, {
      opacity: 1,
      scaleX: 1,
      duration: 2,
      ease: "power2.out"
    }, 3)
    .call(() => {
      // Complete after 6 seconds
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
    }, null, 5);

    // Continuous animations
    gsap.to('.particle', {
      y: "random(-20, 20)",
      x: "random(-20, 20)",
      rotation: "random(-360, 360)",
      duration: "random(2, 4)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.1
    });

    gsap.to('.floating-element', {
      y: "random(-30, 30)",
      rotation: "random(-15, 15)",
      duration: "random(3, 5)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.3
    });

    // Book stack animation
    gsap.to('.book-stack', {
      rotationY: 360,
      duration: 8,
      repeat: -1,
      ease: "none"
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {/* Debug indicator */}
      <div className="absolute top-4 left-4 text-white text-xs">BLACK & WHITE v3.0</div>
      {/* Animated Matrix-like Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-white/30 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Geometric Background Patterns */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 border border-white/10 rounded-full animate-rotate-slow"></div>
        <div className="absolute w-80 h-80 border border-white/20 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse' }}></div>
        <div className="absolute w-64 h-64 border border-white/30 rounded-full animate-rotate-slow"></div>
        <div className="absolute w-48 h-48 border border-white/40 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse' }}></div>
      </div>

      {/* Animated Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(10)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px h-full bg-white animate-pulse"
            style={{
              left: `${i * 10}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px bg-white animate-pulse"
            style={{
              top: `${i * 10}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Animated Logo/Icon */}
        <div ref={booksRef} className="mb-8 animate-splash-logo">
          <div className="relative">
            {/* Modern Book Stack Animation */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                {/* Book 1 - Black with white accent */}
                <div className="book-page w-16 h-20 bg-gradient-to-r from-gray-800 to-black rounded-r-lg shadow-2xl transform rotate-12 animate-book-flip border-l-4 border-white">
                  <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-800 rounded-r-lg"></div>
                </div>
                {/* Book 2 - White with black accent */}
                <div className="book-page absolute -left-4 top-2 w-16 h-20 bg-gradient-to-r from-white to-gray-100 rounded-r-lg shadow-2xl transform -rotate-6 animate-book-flip border-l-4 border-black" style={{ animationDelay: '0.5s' }}>
                  <div className="w-full h-full bg-gradient-to-r from-gray-100 to-white rounded-r-lg"></div>
                </div>
                {/* Book 3 - Gray gradient */}
                <div className="book-page absolute -left-8 top-4 w-16 h-20 bg-gradient-to-r from-gray-600 to-gray-700 rounded-r-lg shadow-2xl transform rotate-3 animate-book-flip border-l-4 border-gray-300" style={{ animationDelay: '1s' }}>
                  <div className="w-full h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-r-lg"></div>
                </div>
              </div>
            </div>

            {/* Floating Study Icons with enhanced animations */}
            <div className="absolute -top-8 -left-8 text-2xl animate-particle-float filter grayscale" style={{ animationDelay: '0.5s' }}>
              🎓
            </div>
            <div className="absolute -top-4 -right-8 text-2xl animate-particle-float filter grayscale" style={{ animationDelay: '1s' }}>
              📚
            </div>
            <div className="absolute -bottom-4 -left-6 text-2xl animate-particle-float filter grayscale" style={{ animationDelay: '1.5s' }}>
              💡
            </div>
            <div className="absolute -bottom-8 -right-6 text-2xl animate-particle-float filter grayscale" style={{ animationDelay: '2s' }}>
              🧠
            </div>

            {/* Additional floating elements */}
            <div className="absolute -top-12 left-0 w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute -bottom-12 right-0 w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '1.2s' }}></div>
          </div>
        </div>

        {/* App Title with Enhanced Effects */}
        <div className="mb-6">
          <h1 ref={titleRef} className="text-6xl md:text-7xl font-bold mb-2 animate-splash-text">
            <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent animate-scale-pulse">
              StudyPal
            </span>
          </h1>
          <div className="overflow-hidden">
            <p ref={subtitleRef} className="text-xl md:text-2xl text-gray-300 font-light animate-typewriter whitespace-nowrap border-r-2 border-white/70">
              Your AI-Powered Learning Companion
            </p>
          </div>
        </div>

        {/* Enhanced Loading Animation */}
        <div className="mb-8 animate-splash-text" style={{ animationDelay: '1s' }}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-400 text-sm animate-pulse">Initializing your learning experience...</p>
        </div>

        {/* Stylized Progress Bar */}
        <div className="w-80 mx-auto mb-8">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <div ref={progressRef} className="h-full bg-gradient-to-r from-white via-gray-300 to-white rounded-full animate-progress-fill shadow-lg"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Loading...</span>
            <span>100%</span>
          </div>
        </div>

        {/* Enhanced Floating Elements */}
        <div className="absolute top-1/4 left-1/4 text-4xl animate-slide-in-left opacity-20 filter grayscale floating-element" style={{ animationDelay: '2s' }}>
          📖
        </div>
        <div className="absolute top-1/3 right-1/4 text-4xl animate-slide-in-right opacity-20 filter grayscale floating-element" style={{ animationDelay: '2.5s' }}>
          ✏️
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-4xl animate-slide-in-left opacity-20 filter grayscale floating-element" style={{ animationDelay: '3s' }}>
          🔬
        </div>
        <div className="absolute bottom-1/3 right-1/3 text-4xl animate-slide-in-right opacity-20 filter grayscale floating-element" style={{ animationDelay: '3.5s' }}>
          🎯
        </div>

        {/* Additional animated elements */}
        <div className="absolute top-10 left-1/2 w-2 h-2 bg-white rounded-full animate-ping floating-element" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-1 h-1 bg-gray-400 rounded-full animate-ping floating-element" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-10 w-3 h-3 bg-white rounded-full animate-ping floating-element" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Monochrome Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/15 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide-up" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}></div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 animate-pulse"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
    </div>
  );
};

export default SplashScreen;