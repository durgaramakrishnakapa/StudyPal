// Simple API service for Smart Canvas
export const smartCanvasAPI = {
  // Solve problem from base64 image
  solveProblem: async (base64Image) => {
    console.log('🚀 Sending request to backend...');
    console.log('📏 Image data length:', base64Image.length);
    
    const response = await fetch('http://localhost:8000/solve-problem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      }),
    });

    console.log('📡 Response status:', response.status);
    const result = await response.json();
    console.log('📦 Response data:', result);
    
    return result;
  },

  // Health check
  checkHealth: async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
};

// Simple error handler
export const handleAPIError = (error) => {
  return error.message || 'Something went wrong. Please try again.';
};

export default smartCanvasAPI;