import React, { useState, useEffect } from 'react';

const ContentGenerator = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [contentType, setContentType] = useState('study_notes');
  const [depth, setDepth] = useState('medium');
  const [targetAudience, setTargetAudience] = useState('student');
  const [includeExamples, setIncludeExamples] = useState(true);
  const [error, setError] = useState('');
  const [contentStats, setContentStats] = useState(null);

  // API Base URL
  const API_BASE = 'http://localhost:8009';

  const generateNotes = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first!');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setContentStats(null);
    
    try {
      const requestBody = {
        topic: topic.trim(),
        content_type: contentType,
        depth,
        format: 'html',
        include_examples: includeExamples,
        target_audience: targetAudience
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
        setNotes(data.content);
        setContentStats({
          wordCount: data.word_count,
          readingTime: data.reading_time_minutes,
          sections: data.sections
        });
        
        // Add to history
        const newEntry = {
          id: Date.now(),
          topic: topic,
          notes: data.content,
          contentType,
          timestamp: new Date().toLocaleString()
        };
        setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
      } else {
        setError(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to connect to the content generation service. Make sure the backend is running on port 8009.');
    } finally {
      setIsGenerating(false);
    }
  };



  const clearNotes = () => {
    setNotes('');
    setTopic('');
    setError('');
    setContentStats(null);
  };

  const loadFromHistory = (entry) => {
    setTopic(entry.topic);
    setNotes(entry.notes);
    setContentType(entry.contentType || 'study_notes');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

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
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">
                  Content Generator
                </span>
              </h1>
              <p className="text-gray-300">Generate study notes on any topic</p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate Notes
              </h2>
              
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Machine Learning, Photosynthesis, World War 2..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && generateNotes()}
                  />
                </div>
                
                {/* Content Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-400 transition-colors"
                  >
                    <option value="study_notes">📚 Study Notes</option>
                    <option value="summary">📝 Summary</option>
                    <option value="explanation">🔍 Explanation</option>
                    <option value="guide">📖 Guide</option>
                  </select>
                </div>

                {/* Depth and Audience */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Depth Level
                    </label>
                    <select
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 transition-colors"
                    >
                      <option value="basic">Basic</option>
                      <option value="medium">Medium</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Audience
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 transition-colors"
                    >
                      <option value="student">Student</option>
                      <option value="professional">Professional</option>
                      <option value="beginner">Beginner</option>
                    </select>
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="flex items-center text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={includeExamples}
                      onChange={(e) => setIncludeExamples(e.target.checked)}
                      className="mr-2 bg-white/5 border border-white/20 rounded"
                    />
                    Include Examples
                  </label>
                </div>
                
                <button
                  onClick={generateNotes}
                  disabled={!topic.trim() || isGenerating}
                  className="w-full py-3 px-6 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Notes
                    </>
                  )}
                </button>

                {notes && (
                  <button
                    onClick={clearNotes}
                    className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors duration-300"
                  >
                    Clear Notes
                  </button>
                )}
              </div>
            </div>

            {/* History Section */}
            {history.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Topics
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-200"
                    >
                      <div className="text-white font-medium text-sm">{entry.topic}</div>
                      <div className="text-gray-400 text-xs">{entry.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes Display Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 min-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generated Notes
                </h2>
                {notes && (
                  <button
                    onClick={() => navigator.clipboard.writeText(notes)}
                    className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors duration-200 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                )}
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 min-h-[500px]">
                {notes ? (
                  <div>
                    {/* Content Stats */}
                    {contentStats && (
                      <div className="mb-4 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                        <div className="flex gap-4 text-sm text-teal-300">
                          <span>📊 {contentStats.wordCount} words</span>
                          <span>⏱️ {contentStats.readingTime} min read</span>
                          <span>📑 {contentStats.sections?.length || 0} sections</span>
                        </div>
                      </div>
                    )}
                    {/* HTML Content Display */}
                    <div 
                      dangerouslySetInnerHTML={{ __html: notes }}
                      className="content-display"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Content Generated Yet</h3>
                    <p className="text-gray-500 max-w-md">
                      Enter a topic and configure options, then click "Generate Notes" to create beautifully formatted content.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContentGenerator;