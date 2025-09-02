import React, { useState, useEffect } from 'react';

const CodeGenerator = ({ onBack }) => {
  const [requirement, setRequirement] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [framework, setFramework] = useState('');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState({});
  const [error, setError] = useState('');

  // API Base URL
  const API_BASE = 'http://localhost:8001';

  // Fetch supported languages on component mount
  useEffect(() => {
    fetchSupportedLanguages();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch(`${API_BASE}/languages`);
      if (response.ok) {
        const data = await response.json();
        setSupportedLanguages(data);
      }
    } catch (error) {
      console.error('Error fetching supported languages:', error);
    }
  };

  const generateCode = async () => {
    if (!requirement.trim()) {
      setError('Please describe your programming requirement first!');
      return;
    }

    setIsGenerating(true);
    setError('');
    setExplanation('');
    setSuggestions([]);
    
    try {
      const requestBody = {
        requirement: requirement.trim(),
        language,
        framework: framework || undefined,
        style: 'clean',
        include_comments: includeComments,
        include_tests: includeTests
      };

      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedCode(data.generated_code);
        setExplanation(data.explanation);
        setSuggestions(data.suggestions || []);
      } else {
        setError(data.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setError('Failed to connect to the code generation service. Make sure the backend is running on port 8001.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearAll = () => {
    setRequirement('');
    setGeneratedCode('');
    setCopySuccess(false);
    setExplanation('');
    setSuggestions([]);
    setError('');
  };

  const explainCode = async () => {
    if (!generatedCode.trim()) {
      setError('No code to explain!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: generatedCode })
      });

      const data = await response.json();
      
      if (data.success) {
        setExplanation(data.explanation);
      } else {
        setError(data.error || 'Failed to explain code');
      }
    } catch (error) {
      console.error('Error explaining code:', error);
      setError('Failed to explain code');
    }
  };

  const improveCode = async (type = 'general') => {
    if (!generatedCode.trim()) {
      setError('No code to improve!');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`${API_BASE}/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: generatedCode,
          type 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedCode(data.improved_code);
      } else {
        setError(data.error || 'Failed to improve code');
      }
    } catch (error) {
      console.error('Error improving code:', error);
      setError('Failed to improve code');
    } finally {
      setIsGenerating(false);
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
                <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                  Code Generator
                </span>
              </h1>
              <p className="text-gray-300 text-sm">Describe your needs, get instant code</p>
            </div>

            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:opacity-90 transition-all duration-300 text-sm font-medium"
            >
              Clear All 🗑️
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-160px)]">
          
          {/* Input Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Describe Your Requirement
            </h2>
            


            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Language and Framework Selection */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Programming Language</label>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setFramework(''); // Reset framework when language changes
                  }}
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  {supportedLanguages.languages?.map(lang => (
                    <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Framework (Optional)</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  <option value="">No Framework</option>
                  {supportedLanguages.frameworks?.[language]?.map(fw => (
                    <option key={fw} value={fw}>{fw.charAt(0).toUpperCase() + fw.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center text-white/70 text-sm">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="mr-2 bg-black/50 border border-white/20 rounded"
                />
                Include Comments
              </label>
              <label className="flex items-center text-white/70 text-sm">
                <input
                  type="checkbox"
                  checked={includeTests}
                  onChange={(e) => setIncludeTests(e.target.checked)}
                  className="mr-2 bg-black/50 border border-white/20 rounded"
                />
                Include Tests
              </label>
            </div>

            {/* Requirement Input */}
            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-2">What do you want to build?</label>
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder={`Example: Create a ${language} function that calculates the sum of numbers in an array...`}
                className="w-full h-48 bg-black/50 border border-white/20 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCode}
              disabled={isGenerating}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                isGenerating
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-400 to-orange-500 hover:opacity-90 transform hover:-translate-y-1'
              } text-white`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Code...
                </span>
              ) : (
                'Generate Code ⚡'
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">💻</span>
                Generated Code
              </h2>
              
              {generatedCode && (
                <div className="flex gap-2">
                  <button
                    onClick={explainCode}
                    className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all duration-300"
                  >
                    🔍 Explain
                  </button>
                  <button
                    onClick={() => improveCode('general')}
                    className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-all duration-300"
                    disabled={isGenerating}
                  >
                    ✨ Improve
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      copySuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {copySuccess ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                </div>
              )}
            </div>

            {/* Code Output */}
            <div className="relative">
              {generatedCode ? (
                <div className="space-y-4">
                  {/* Generated Code */}
                  <div className="bg-black/70 border border-white/20 rounded-lg p-4 h-64 overflow-auto">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {generatedCode}
                    </pre>
                  </div>
                  
                  {/* Explanation */}
                  {explanation && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                        <span className="mr-2">📝</span>
                        Code Explanation
                      </h3>
                      <p className="text-blue-100 text-sm leading-relaxed">{explanation}</p>
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <h3 className="text-yellow-300 font-semibold mb-2 flex items-center">
                        <span className="mr-2">💡</span>
                        Suggestions
                      </h3>
                      <ul className="text-yellow-100 text-sm space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 text-yellow-400">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-black/30 border border-white/10 rounded-lg p-8 h-[calc(100vh-320px)] flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <div className="text-6xl mb-4">🤖</div>
                    <p className="text-lg mb-2">Ready to generate code!</p>
                    <p className="text-sm">Describe your programming requirement to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;