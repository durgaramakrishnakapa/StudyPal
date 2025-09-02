import React, { useState, useEffect } from 'react';
import { smartCanvasAPI } from '../services/api';

const HealthCheck = ({ onHealthChange }) => {
  const [isHealthy, setIsHealthy] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true);
      try {
        const healthy = await smartCanvasAPI.checkHealth();
        setIsHealthy(healthy);
        if (onHealthChange) {
          onHealthChange(healthy);
        }
      } catch (error) {
        setIsHealthy(false);
        if (onHealthChange) {
          onHealthChange(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [onHealthChange]);

  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 text-yellow-400 text-sm">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span>Checking AI service...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${
      isHealthy ? 'text-green-400' : 'text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isHealthy ? 'bg-green-400' : 'bg-red-400'
      }`}></div>
      <span>
        {isHealthy ? 'AI service online' : 'AI service offline'}
      </span>
    </div>
  );
};

export default HealthCheck;