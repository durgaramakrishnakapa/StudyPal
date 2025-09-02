import { useState } from 'react';

const ExamPreparation = ({ onBack }) => {
  const [examTopic, setExamTopic] = useState('');
  const [preparationType, setPreparationType] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [specificAreas, setSpecificAreas] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  const preparationTypes = [
    { value: 'cheat-sheet', label: 'Cheat Sheet', description: 'AI-generated quick reference with key formulas and concepts' },
    { value: 'practice-questions', label: 'Practice Questions', description: 'AI-generated sample questions with detailed answers' },
    { value: 'study-material', label: 'Study Material', description: 'Comprehensive AI-generated study guide' }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Basic concepts and fundamentals' },
    { value: 'intermediate', label: 'Intermediate', description: 'Standard level with moderate complexity' },
    { value: 'advanced', label: 'Advanced', description: 'Complex topics and advanced applications' }
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!examTopic.trim() || !preparationType) return;

    setIsGenerating(true);
    
    try {
      // Call the SOS backend API
      const response = await fetch('http://localhost:8007/api/exam/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: examTopic,
          preparation_type: preparationType,
          difficulty: difficulty,
          specific_areas: specificAreas ? specificAreas.split(',').map(area => area.trim()).filter(area => area) : []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        // Use the enhanced API response directly
        setGeneratedContent({
          title: data.title,
          content: data.content,
          studyTips: data.study_tips || [],
          estimatedTime: data.estimated_study_time || 'Variable',
          generationTime: data.generation_time || null
        });
      } else {
        console.error('API Error:', data.error);
        // Fallback to mock content if API fails
        const selectedType = preparationTypes.find(type => type.value === preparationType);
        const mockContent = generateMockContent(examTopic, selectedType);
        setGeneratedContent(mockContent);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Fallback to mock content if API fails
      const selectedType = preparationTypes.find(type => type.value === preparationType);
      const mockContent = generateMockContent(examTopic, selectedType);
      setGeneratedContent(mockContent);
    } finally {
      setIsGenerating(false);
    }
  };

  // Transform API response to match frontend format
  const transformApiContent = (apiContent) => {
    return {
      title: apiContent.title,
      content: apiContent.content,
      contentType: apiContent.content_type,
      estimatedTime: apiContent.estimated_study_time,
      keyPoints: apiContent.key_points
    };
  };

  // Handle copying content to clipboard
  const handleCopyContent = async () => {
    if (!generatedContent) return;
    
    try {
      let textContent = `${generatedContent.title}\n\n`;
      
      if (Array.isArray(generatedContent.content)) {
        if (preparationType === 'cheat-sheet') {
          generatedContent.content.forEach(section => {
            textContent += `${section.section}:\n`;
            section.items.forEach(item => {
              textContent += `• ${item}\n`;
            });
            textContent += '\n';
          });
        } else if (preparationType === 'practice-questions') {
          generatedContent.content.forEach((qa, index) => {
            textContent += `Q${index + 1}: ${qa.question}\n`;
            textContent += `Answer: ${qa.answer}\n\n`;
          });
        }
      } else {
        textContent += generatedContent.content;
      }
      
      await navigator.clipboard.writeText(textContent);
      console.log('Content copied to clipboard');
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  // Handle downloading content as text file
  const handleDownloadContent = () => {
    if (!generatedContent) return;
    
    let textContent = `${generatedContent.title}\n${'='.repeat(generatedContent.title.length)}\n\n`;
    
    if (Array.isArray(generatedContent.content)) {
      if (preparationType === 'cheat-sheet') {
        generatedContent.content.forEach(section => {
          textContent += `${section.section}:\n${'-'.repeat(section.section.length)}\n`;
          section.items.forEach(item => {
            textContent += `• ${item}\n`;
          });
          textContent += '\n';
        });
      } else if (preparationType === 'practice-questions') {
        generatedContent.content.forEach((qa, index) => {
          textContent += `Question ${index + 1}:\n${qa.question}\n\n`;
          textContent += `Answer:\n${qa.answer}\n\n`;
          textContent += '-'.repeat(50) + '\n\n';
        });
      }
    } else {
      textContent += generatedContent.content;
    }
    
    if (generatedContent.keyPoints && generatedContent.keyPoints.length > 0) {
      textContent += '\n\nKey Points:\n';
      generatedContent.keyPoints.forEach(point => {
        textContent += `• ${point}\n`;
      });
    }
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examTopic.replace(/\s+/g, '_')}_${preparationType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMockContent = (topic, type) => {
    switch (type.value) {
      case 'cheat-sheet':
        return {
          title: `${topic} - Cheat Sheet`,
          content: [
            { section: 'Key Formulas', items: [`Formula 1 for ${topic}`, `Formula 2 for ${topic}`, `Formula 3 for ${topic}`] },
            { section: 'Important Concepts', items: [`Concept A in ${topic}`, `Concept B in ${topic}`, `Concept C in ${topic}`] },
            { section: 'Quick Tips', items: [`Remember to ${topic.toLowerCase()}`, `Always check ${topic.toLowerCase()}`, `Don't forget ${topic.toLowerCase()}`] }
          ]
        };
      case 'practice-questions':
        return {
          title: `${topic} - Practice Questions`,
          content: [
            { question: `What is the main principle of ${topic}?`, answer: `The main principle involves understanding the core concepts of ${topic}.` },
            { question: `How do you apply ${topic} in real scenarios?`, answer: `${topic} can be applied by following the standard methodology.` },
            { question: `What are the key benefits of ${topic}?`, answer: `Key benefits include improved efficiency and better results.` }
          ]
        };
      case 'summary':
        return {
          title: `${topic} - Summary`,
          content: `${topic} is a comprehensive subject that covers multiple important areas. The key aspects include fundamental principles, practical applications, and advanced concepts. Understanding these elements is crucial for exam success. Main topics to focus on are the theoretical foundation, real-world examples, and problem-solving techniques.`
        };
      default:
        return {
          title: `${topic} - ${type.label}`,
          content: `Generated ${type.label.toLowerCase()} content for ${topic}. This includes all the essential information you need to know for your exam preparation.`
        };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cheat-sheet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'practice-questions':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'flashcards':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400/20 rounded-full animate-particle-float"
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
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                  SOS Exam Preparation
                </span>
              </h1>
              <p className="text-gray-300 mt-2">Emergency exam prep and quick reviews</p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
          {/* Left Sidebar - Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Emergency Prep
              </h2>
              
              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
                    Enter your exam topic
                  </label>
                  <input
                    type="text"
                    id="topic"
                    value={examTopic}
                    onChange={(e) => setExamTopic(e.target.value)}
                    placeholder="e.g., Calculus, Physics, Chemistry..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                    Select preparation type
                  </label>
                  <select
                    id="type"
                    value={preparationType}
                    onChange={(e) => setPreparationType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800">Select type...</option>
                    {preparationTypes.map((type) => (
                      <option key={type.value} value={type.value} className="bg-gray-800">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty level
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                  >
                    {difficultyLevels.map((level) => (
                      <option key={level.value} value={level.value} className="bg-gray-800">
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="areas" className="block text-sm font-medium text-gray-300 mb-2">
                    Specific areas (optional)
                  </label>
                  <input
                    type="text"
                    id="areas"
                    value={specificAreas}
                    onChange={(e) => setSpecificAreas(e.target.value)}
                    placeholder="e.g., derivatives, integrals, limits"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate multiple areas with commas</p>
                </div>

                {preparationType && (
                  <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <p className="text-sm text-red-300">
                      {preparationTypes.find(type => type.value === preparationType)?.description}
                    </p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={!examTopic.trim() || !preparationType || isGenerating}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-400 to-red-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </div>
                  ) : (
                    'Generate SOS Material'
                  )}
                </button>
              </form>

              {/* Quick Access */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Access</h3>
                <div className="space-y-2">
                  {preparationTypes.slice(0, 4).map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPreparationType(type.value)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 flex items-center space-x-2"
                    >
                      {getTypeIcon(type.value)}
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Generated Material */}
          <div className="lg:col-span-3">
            {!generatedContent && !isGenerating && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
                <div className="w-24 h-24 bg-red-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Emergency Exam Preparation</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Enter your exam topic and select the type of preparation material you need for last-minute studying.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Cheat Sheets</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Practice Questions</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Flashcards</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Quick Notes</span>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">Generating Emergency Material...</h3>
                <p className="text-gray-300">Creating {preparationTypes.find(type => type.value === preparationType)?.label.toLowerCase()} for {examTopic}</p>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {generatedContent.title}
                    </h2>
                    {generatedContent.estimatedTime && (
                      <p className="text-sm text-gray-400 mt-1">
                        📚 Estimated study time: {generatedContent.estimatedTime}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleCopyContent()}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                      title="Copy to clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDownloadContent()}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                      title="Download as text"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line">{generatedContent.content}</div>
                  </div>
                </div>

                {/* Study Tips Section */}
                {generatedContent.studyTips && generatedContent.studyTips.length > 0 && (
                  <div className="bg-blue-400/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
                    <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Study Tips
                    </h3>
                    <ul className="space-y-2">
                      {generatedContent.studyTips.map((tip, index) => (
                        <li key={index} className="text-gray-300 flex items-start space-x-2">
                          <span className="text-blue-400 mt-1">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Points Section */}
                {generatedContent.keyPoints && generatedContent.keyPoints.length > 0 && (
                  <div className="bg-red-400/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/20">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Key Points to Remember
                    </h3>
                    <ul className="space-y-2">
                      {generatedContent.keyPoints.map((point, index) => (
                        <li key={index} className="text-gray-300 flex items-start space-x-2">
                          <span className="text-red-400 mt-1">★</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300"
                  >
                    Generate New
                  </button>
                  <button className="px-6 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1">
                    Save Material
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPreparation;