import React, { useState } from 'react';

const ImageRenderer = ({ src, alt = 'Generated Image', className = '' }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [error, setError] = useState(null);

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully');
    setImageStatus('loaded');
  };

  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', e);
    setImageStatus('error');
    setError('Failed to load image');
  };

  // Validate image format (base64 or URL)
  const isValidBase64Image = src && src.startsWith('data:image/') && src.includes('base64,');
  const isValidImageUrl = src && (src.startsWith('http://') || src.startsWith('https://'));
  const isValidImage = isValidBase64Image || isValidImageUrl;

  if (!isValidImage) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 my-4">
        <p className="text-red-400 text-center">⚠️ Invalid image format</p>
        <p className="text-red-300 text-sm text-center mt-2">
          Expected: URL (http://...) or base64 (data:image/...;base64,...)
        </p>
        <p className="text-red-300 text-sm text-center">
          Got: {src ? src.substring(0, 50) + '...' : 'null'}
        </p>
      </div>
    );
  }

  if (imageStatus === 'error') {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 my-4">
        <p className="text-red-400 text-center">❌ Failed to load generated image</p>
        <p className="text-red-300 text-sm text-center mt-2">
          Image size: {src.length} characters
        </p>
        <button 
          onClick={() => {
            setImageStatus('loading');
            setError(null);
          }}
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`my-6 flex justify-center ${className}`}>
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          {imageStatus === 'loading' && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-cyan-400">Loading image...</span>
            </div>
          )}
          
          <img 
            src={src} 
            alt={alt}
            className={`w-full h-auto rounded-lg border border-gray-600 shadow-lg ${
              imageStatus === 'loading' ? 'hidden' : ''
            }`}
            style={{ maxHeight: '500px', objectFit: 'contain' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {imageStatus === 'loaded' && (
            <p className="text-sm text-gray-400 mt-2 italic text-center">
              {alt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageRenderer;