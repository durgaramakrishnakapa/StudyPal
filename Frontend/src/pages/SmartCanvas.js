import React, { useRef, useEffect, useState, useCallback } from 'react';
import { smartCanvasAPI, handleAPIError } from '../services/api';
import HealthCheck from '../components/HealthCheck';

const SmartCanvas = ({ onBack }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#ec4899');
  const [brushSize, setBrushSize] = useState(3);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // AI Solver states
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState(null);
  const [isAPIHealthy, setIsAPIHealthy] = useState(true);

  const colors = [
    { name: 'Pink', value: '#ec4899' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'White', value: '#ffffff' }
  ];

  const tools = [
    { name: 'pen', icon: '✏️', label: 'Pen' },
    { name: 'triangle', icon: '△', label: 'Triangle' },
    { name: 'circle', icon: '○', label: 'Circle' },
    { name: 'rectangle', icon: '▢', label: 'Rectangle' },
    { name: 'eraser', icon: '🧽', label: 'Eraser' }
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Set default styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Get mouse/touch position
  const getPosition = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const pos = getPosition(e);
    setLastPosition(pos);
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (currentTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [getPosition, currentTool]);

  // Draw
  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(e);

    if (currentTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize * 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    setLastPosition(pos);
  }, [isDrawing, getPosition, currentTool, currentColor, brushSize]);

  // Stop drawing
  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(e);

    // Draw shapes
    if (currentTool === 'triangle') {
      drawTriangle(ctx, lastPosition, pos);
    } else if (currentTool === 'circle') {
      drawCircle(ctx, lastPosition, pos);
    } else if (currentTool === 'rectangle') {
      drawRectangle(ctx, lastPosition, pos);
    }

    setIsDrawing(false);
  }, [isDrawing, getPosition, currentTool, lastPosition]);

  // Shape drawing functions
  const drawTriangle = (ctx, start, end) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2; // Fixed line width for shapes
    ctx.beginPath();
    
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    ctx.moveTo(start.x + width / 2, start.y);
    ctx.lineTo(start.x, end.y);
    ctx.lineTo(end.x, end.y);
    ctx.closePath();
    ctx.stroke();
  };

  const drawCircle = (ctx, start, end) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2; // Fixed line width for shapes
    
    const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    ctx.beginPath();
    ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawRectangle = (ctx, start, end) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2; // Fixed line width for shapes
    ctx.beginPath();
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.stroke();
  };

  // Clear everything - canvas and solution
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Reinitialize the canvas completely (same as the useEffect)
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Reset canvas size and scaling
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set default styles and fill with black
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear the solution sidebar
    setSolution(null);
    
    // Clear any errors
    setError(null);
    
    console.log('🧹 Canvas completely reinitialized!');
  };

  // Convert canvas to base64 for API
  const canvasToBase64 = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas.toDataURL('image/png');
  }, []);

  // Solve with AI
  const solveWithAI = async () => {
    setIsSolving(true);
    setError(null);
    setSolution(null);

    try {
      // Convert canvas to base64 image
      const base64Image = canvasToBase64();
      
      if (!base64Image) {
        throw new Error('Failed to capture canvas image');
      }

      console.log('Sending base64 image to backend...');
      
      // Send to backend API
      const result = await smartCanvasAPI.solveProblem(base64Image);
      
      if (result.success) {
        setSolution(result);
      } else {
        setError(result.error || 'Failed to solve problem');
      }
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
              <h1 className="text-3xl font-bold text-white">
                <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">
                  Smart Canvas
                </span>
              </h1>
              <div className="flex items-center justify-center space-x-4">
                <p className="text-gray-300 text-sm">Draw, create, and explore with AI</p>
                <HealthCheck onHealthChange={setIsAPIHealthy} />
              </div>
            </div>

            <button
              onClick={solveWithAI}
              disabled={isSolving || !isAPIHealthy}
              className={`px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg hover:opacity-90 transition-all duration-300 text-sm font-medium ${
                isSolving || !isAPIHealthy ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!isAPIHealthy ? 'AI service is offline' : 'Solve the problem using AI'}
            >
              {isSolving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Solving...</span>
                </div>
              ) : (
                'Solve 🧠'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-80px)]">
        {/* Toolbar */}
        <div className="w-20 bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col items-center py-6 space-y-4">
          {/* Tools */}
          <div className="space-y-3">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => setCurrentTool(tool.name)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-all duration-300 ${
                  currentTool === tool.name
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-8 h-px bg-white/20"></div>

          {/* Colors */}
          <div className="flex flex-col items-center">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setCurrentColor(color.value)}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-300 mb-2 ${
                  currentColor === color.value
                    ? 'border-white shadow-lg scale-110'
                    : 'border-white/30 hover:border-white/60 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-8 h-px bg-white/20"></div>

          {/* Brush Size */}
          <div className="flex flex-col items-center space-y-2">
            <div className="text-white/70 text-xs">Size</div>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-12 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(brushSize / 20) * 100}%, rgba(255,255,255,0.2) ${(brushSize / 20) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="text-white/70 text-xs">{brushSize}</div>
          </div>

          {/* Clear Button */}
          <button
            onClick={clearCanvas}
            className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300 flex items-center justify-center text-lg"
            title="Clear Canvas"
          >
            🗑️
          </button>
        </div>

        {/* Canvas Area */}
        <div className={`${solution ? 'flex-1' : 'flex-1'} relative`}>
          <canvas
            ref={canvasRef}
            className={`w-full h-full ${currentTool === 'eraser' ? 'cursor-eraser' : 'cursor-crosshair'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Solution Sidebar */}
        {solution && (
          <div className="w-96 bg-white/5 backdrop-blur-sm border-l border-white/10 overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">AI Solution</h2>
                <button
                  onClick={() => setSolution(null)}
                  className="text-white/70 hover:text-white transition-colors duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* HTML Content from Gemini */}
              <div 
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: solution.solution }}
              />
            </div>
          </div>
        )}
      </div>



      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-red-500/30 rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-red-300">Error</h2>
                <button
                  onClick={() => setError(null)}
                  className="text-white/70 hover:text-white transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 bg-red-500/10 rounded-lg p-4">
                  {error}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    solveWithAI();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg hover:opacity-90 transition-all duration-300 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCanvas;