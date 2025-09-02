import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const ImageTest = () => {
  // Test markdown with image
  const testMarkdown = `Here is a test response with an image:

![Generated Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)

This should show a small red pixel image above.`;

  const testMarkdownLong = `Using my FLUX AI model, I can generate a beautiful image for you. Here it is:

![Generated Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAJACAIAAACc94OCAAEAAE)

This is a test of the image rendering system.`;

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Image Rendering Test</h1>
      
      <div className="mb-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl mb-4">Test 1: Simple Base64 Image</h2>
        <MarkdownRenderer content={testMarkdown} />
      </div>
      
      <div className="mb-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl mb-4">Test 2: Longer Base64 (Truncated)</h2>
        <MarkdownRenderer content={testMarkdownLong} />
      </div>
      
      <div className="mb-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl mb-4">Test 3: Direct HTML Image</h2>
        <img 
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" 
          alt="Direct HTML Test"
          className="border border-gray-600 rounded"
        />
        <p className="mt-2 text-sm text-gray-400">This is a direct HTML img tag</p>
      </div>
    </div>
  );
};

export default ImageTest;