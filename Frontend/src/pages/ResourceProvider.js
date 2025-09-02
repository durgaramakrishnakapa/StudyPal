import { useState } from 'react';

const ResourceProvider = ({ onBack }) => {
  const [learningTopic, setLearningTopic] = useState('');
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!learningTopic.trim()) return;

    setIsLoading(true);
    
    try {
      // Call the backend API
      const response = await fetch('http://localhost:8004/api/resources/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: learningTopic,
          difficulty: 'All Levels',
          resource_types: ['Books', 'Courses', 'Websites', 'YouTube'],
          max_results: 8
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResources(data.resources);
      } else {
        console.error('API Error:', data.error);
        // Fallback to mock data if API fails
        setResources(generateFallbackResources(learningTopic));
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to mock data if API fails
      setResources(generateFallbackResources(learningTopic));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bookmarking a resource
  const handleBookmarkResource = (resource) => {
    // Store in localStorage for now (you can enhance this with a backend)
    const bookmarks = JSON.parse(localStorage.getItem('studypal_bookmarks') || '[]');
    const isBookmarked = bookmarks.some(b => b.id === resource.id);
    
    if (!isBookmarked) {
      bookmarks.push(resource);
      localStorage.setItem('studypal_bookmarks', JSON.stringify(bookmarks));
      console.log(`Bookmarked: ${resource.title}`);
      // You could add a toast notification here
    } else {
      console.log('Resource already bookmarked');
    }
  };

  // Handle watching a YouTube video
  const handleWatchVideo = (resource) => {
    if (resource.type === 'YouTube' && resource.url) {
      // Open YouTube video in new tab
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      console.log(`Watching video: ${resource.title}`);
    }
  };

  // Handle web search test
  const handleWebSearch = async () => {
    if (!learningTopic.trim()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8004/api/resources/web-search/${encodeURIComponent(learningTopic)}?resource_type=Websites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.resources.length > 0) {
        console.log('Web search results:', data.resources);
        
        // Show results in a simple alert (you can enhance this with a modal)
        const resultText = data.resources.map(r => `${r.title}\n${r.url}`).join('\n\n');
        alert(`Found ${data.resources.length} web resources:\n\n${resultText}`);
      } else {
        console.log('No web resources found');
        alert('No web resources found for this topic.');
      }
    } catch (error) {
      console.error('Error in web search:', error);
      alert('Error performing web search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  // Handle accessing a resource
  const handleAccessResource = (resource) => {
    // Generate appropriate URLs based on resource type and source
    let url = resource.url;
    
    // If URL is just '#', generate a realistic URL based on the resource type and source
    if (url === '#' || !url || url === 'https://example.com/resource-link') {
      url = generateResourceUrl(resource);
    }
    
    // Open the resource in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Optional: Track resource access
    console.log(`Accessing resource: ${resource.title} (${resource.type})`);
  };

  // Generate realistic URLs for different resource types
  const generateResourceUrl = (resource) => {
    const topic = learningTopic.toLowerCase().replace(/\s+/g, '-');
    const title = resource.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    
    switch (resource.type) {
      case 'Books':
        if (resource.source.includes('O\'Reilly')) {
          return `https://www.oreilly.com/library/view/${title}/`;
        } else if (resource.source.includes('Packt')) {
          return `https://www.packtpub.com/product/${title}/`;
        } else if (resource.source.includes('Manning')) {
          return `https://www.manning.com/books/${title}`;
        }
        return `https://www.amazon.com/s?k=${encodeURIComponent(resource.title)}`;
        
      case 'Courses':
        if (resource.source.includes('Udemy')) {
          return `https://www.udemy.com/course/${title}/`;
        } else if (resource.source.includes('Coursera')) {
          return `https://www.coursera.org/learn/${topic}`;
        } else if (resource.source.includes('edX')) {
          return `https://www.edx.org/search?q=${encodeURIComponent(topic)}`;
        } else if (resource.source.includes('Pluralsight')) {
          return `https://www.pluralsight.com/search?q=${encodeURIComponent(topic)}`;
        }
        return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(topic)}`;
        
      case 'Websites':
        if (resource.source.includes('MDN')) {
          return `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`;
        } else if (resource.source.includes('W3Schools')) {
          return `https://www.w3schools.com/${topic}/`;
        } else if (resource.source.includes('FreeCodeCamp')) {
          return `https://www.freecodecamp.org/learn/`;
        } else if (resource.source.includes('Official Docs')) {
          return `https://docs.${topic}.org/` || `https://www.google.com/search?q=${encodeURIComponent(topic + ' official documentation')}`;
        }
        return `https://www.google.com/search?q=${encodeURIComponent(topic + ' tutorial')}`;
        
      case 'YouTube':
        if (resource.source.includes('freeCodeCamp')) {
          return `https://www.youtube.com/@freecodecamp/search?query=${encodeURIComponent(topic)}`;
        } else if (resource.source.includes('Traversy Media')) {
          return `https://www.youtube.com/@TraversyMedia/search?query=${encodeURIComponent(topic)}`;
        }
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.title)}`;
        
      case 'Podcasts':
        return `https://www.google.com/search?q=${encodeURIComponent(resource.title + ' podcast')}`;
        
      case 'Tools':
        if (resource.source.includes('GitHub')) {
          return `https://github.com/search?q=${encodeURIComponent(topic)}`;
        } else if (resource.source.includes('VS Code')) {
          return `https://marketplace.visualstudio.com/search?term=${encodeURIComponent(topic)}`;
        }
        return `https://www.google.com/search?q=${encodeURIComponent(resource.title)}`;
        
      default:
        return `https://www.google.com/search?q=${encodeURIComponent(resource.title)}`;
    }
  };

  // Fallback function for when API is unavailable
  const generateFallbackResources = (topic) => {
    return [
      {
        id: 1,
        title: `${topic}: The Complete Guide`,
        type: 'Books',
        source: 'O\'Reilly Media',
        difficulty: 'Beginner',
        duration: '400 pages',
        description: `Comprehensive book covering all aspects of ${topic} from basics to advanced concepts.`,
        url: '#',
        rating: 4.8,
        reviews: 1250,
        tags: [topic.toLowerCase(), 'beginner', 'comprehensive'],
        price: '$39.99',
        language: 'English'
      },
      {
        id: 2,
        title: `Complete ${topic} Bootcamp`,
        type: 'Courses',
        source: 'Udemy',
        difficulty: 'Beginner',
        duration: '40 hours',
        description: `Comprehensive course covering ${topic} from zero to hero with hands-on projects.`,
        url: '#',
        rating: 4.7,
        reviews: 15420,
        tags: [topic.toLowerCase(), 'bootcamp', 'hands-on'],
        price: '$49.99',
        language: 'English'
      },
      {
        id: 3,
        title: `${topic} Documentation`,
        type: 'Websites',
        source: 'Official Docs',
        difficulty: 'All Levels',
        duration: 'Reference',
        description: `Official documentation and guides for ${topic} with examples and tutorials.`,
        url: '#',
        rating: 4.5,
        reviews: 2340,
        tags: [topic.toLowerCase(), 'documentation', 'reference'],
        price: 'Free',
        language: 'English'
      },
      {
        id: 4,
        title: `${topic} Crash Course`,
        type: 'YouTube',
        source: 'freeCodeCamp',
        difficulty: 'Beginner',
        duration: '4 hours',
        description: `Complete crash course covering ${topic} fundamentals in one comprehensive video.`,
        url: '#',
        rating: 4.9,
        reviews: 45000,
        tags: [topic.toLowerCase(), 'crash-course', 'video'],
        price: 'Free',
        language: 'English'
      }
    ];
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-400/10';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'Advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Books':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'Courses':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'Websites':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case 'YouTube':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Books': return 'text-blue-400 bg-blue-400/20';
      case 'Courses': return 'text-purple-400 bg-purple-400/20';
      case 'Websites': return 'text-green-400 bg-green-400/20';
      case 'YouTube': return 'text-red-400 bg-red-400/20';
      default: return 'text-emerald-400 bg-emerald-400/20';
    }
  };

  const filteredResources = activeFilter === 'All' 
    ? resources 
    : resources.filter(resource => resource.type === activeFilter);

  const filterTabs = ['All', 'Books', 'Courses', 'Websites', 'YouTube'];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/20 rounded-full animate-particle-float"
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
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                  Resource Provider
                </span>
              </h1>
              <p className="text-gray-300 mt-2">Discover curated learning resources</p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
          {/* Left Sidebar - Topic Input */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Recommended Resources
              </h2>
              
              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
                    Enter your learning topic
                  </label>
                  <input
                    type="text"
                    id="topic"
                    value={learningTopic}
                    onChange={(e) => setLearningTopic(e.target.value)}
                    placeholder="e.g., Machine Learning, React.js, Python..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!learningTopic.trim() || isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </div>
                  ) : (
                    'Search Resources'
                  )}
                </button>
              </form>



              {/* Web Search Test */}
              {learningTopic && (
                <div className="mt-6">
                  <button
                    onClick={handleWebSearch}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Web Search Test</span>
                  </button>
                </div>
              )}

              {/* Quick Topics */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Popular Topics</h3>
                <div className="space-y-2">
                  {['JavaScript', 'Python', 'Data Science', 'Web Development', 'Machine Learning'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setLearningTopic(topic);
                        // Auto-search when clicking quick topics
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) {
                            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                          }
                        }, 100);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Resources */}
          <div className="lg:col-span-3">
            {!resources.length && !isLoading && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
                <div className="w-24 h-24 bg-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Recommended Resources</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Enter a topic in the search box to discover recommended learning resources.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Books</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Courses</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span>Websites</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                    </svg>
                    <span>YouTube</span>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">Finding Resources...</h3>
                <p className="text-gray-300">Searching for the best learning materials on {learningTopic}</p>
              </div>
            )}

            {resources.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    Recommended Resources for "{learningTopic}"
                  </h2>
                  <span className="text-sm text-gray-400">
                    {filteredResources.length} resources found
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                        activeFilter === tab
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {tab}
                      {tab !== 'All' && (
                        <span className="ml-2 text-xs opacity-70">
                          ({resources.filter(r => r.type === tab).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6">
                  {filteredResources.map((resource, index) => (
                    <div
                      key={resource.id}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1 animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-emerald-400">
                            {getTypeIcon(resource.type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center">
                              {resource.title}
                              {resource.type === 'YouTube' && resource.url && resource.url !== '#' && (
                                <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                                  LIVE
                                </span>
                              )}
                              {resource.url && resource.url !== '#' && resource.type !== 'YouTube' && (
                                <span className="ml-2 px-2 py-1 bg-emerald-600 text-white text-xs rounded-full">
                                  VERIFIED
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>{resource.source}</span>
                              <span>•</span>
                              <span>{resource.duration}</span>
                              {resource.price && resource.price !== 'Free' && (
                                <span>•</span>
                              )}
                              {resource.price && resource.price !== 'Free' && (
                                <span className="text-emerald-400">{resource.price}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                            {resource.difficulty}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                            {resource.type}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{resource.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{resource.reviews.toLocaleString()} reviews</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleBookmarkResource(resource)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                            title="Bookmark this resource"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                          {resource.type === 'YouTube' && (
                            <button 
                              onClick={() => handleWatchVideo(resource)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <span>Watch Video</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleAccessResource(resource)}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1"
                          >
                            Access Resource
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceProvider;