import React, { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const Chatbot = ({ onBack }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "**Welcome to StudyPal AI Assistant!** 🎓✨\n\nI'm your personalized learning companion with advanced capabilities:\n\n**🧠 Memory & Personalization:**\n* Remember our entire conversation\n* Use your name and personal details\n* Build upon previous explanations\n* Understand follow-up questions with 'that', 'it', 'this topic'\n\n**🌐 Real-time Capabilities:**\n* Internet access via Tavily search tool\n* Current information and latest updates\n* Real-time data and news\n\n**💻 Advanced Formatting:**\n* Code blocks with syntax highlighting\n* Copy buttons for easy code sharing\n* Proper markdown formatting\n* Mathematical notation support\n\n**What's your name, and what would you like to learn today?** I'll remember everything we discuss and provide personalized help! 🚀",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null); // "searching", "complete", null
  const [sessionId, setSessionId] = useState(null);

  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const autoSendTimerRef = useRef(null);
  const lastTranscriptRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // All formatting is now handled by MarkdownRenderer component

  // Session management functions
  const createNewSession = async () => {
    try {
      const response = await fetch('http://localhost:8012/session/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'default'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        console.log('New session created:', data.session_id);
      } else {
        console.error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const clearCurrentSession = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`http://localhost:8012/session/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Create a new session and reset messages
        await createNewSession();
        setMessages([
          {
            id: 1,
            type: 'bot',
            content: "I've cleared our conversation history. Let's start fresh! How can I help you today?",
            timestamp: new Date()
          }
        ]);
        console.log('Session cleared and new session created');
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on component mount
    inputRef.current?.focus();
    
    // Create a new session when component mounts
    createNewSession();

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      console.log('Speech recognition initialized');

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        let isFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        console.log('Speech recognition result:', transcript, 'isFinal:', isFinal);
        setInputMessage(transcript);
        lastTranscriptRef.current = transcript;

        // Reset auto-send timer on new speech input
        if (transcript.trim() && transcript !== lastTranscriptRef.current) {
          resetAutoSendTimer();
        }

        // If we get a final result, start the auto-send timer
        if (isFinal && transcript.trim()) {
          console.log('Final result received, starting auto-send timer');
          resetAutoSendTimer();
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);

        // If we have a message and recognition ended naturally, start auto-send timer
        const currentMessage = lastTranscriptRef.current || inputMessage;
        if (currentMessage && currentMessage.trim()) {
          console.log('Recognition ended with message, starting auto-send timer');
          resetAutoSendTimer();
        } else {
          // Clear auto-send timer when recognition ends without message
          if (autoSendTimerRef.current) {
            clearTimeout(autoSendTimerRef.current);
            autoSendTimerRef.current = null;
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        // Show user-friendly error message
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected. Please try again.');
        } else if (event.error === 'network') {
          alert('Network error. Please check your internet connection.');
        }
      };
    } else {
      console.log('Speech recognition not supported in this browser');
    }

    // Cleanup function
    return () => {
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    };
  }, [selectedLanguage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Create a placeholder bot message for streaming
    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
    setStreamingMessageId(botMessageId);

    try {
      // Call the streaming chatbot API with session ID
      const response = await fetch('http://localhost:8012/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          session_id: sessionId,
          user_id: 'default'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      setIsTyping(false); // Stop typing indicator as we start streaming

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.done) {
                // Streaming complete - scroll to bottom one final time
                setStreamingMessageId(null);
                setSearchStatus(null);
                setTimeout(() => scrollToBottom(), 100);
                break;
              }

              // Handle session data
              if (data.type === "session") {
                if (data.session_id && !sessionId) {
                  setSessionId(data.session_id);
                }
              }

              // Handle status messages
              if (data.type === "status") {
                if (data.status === "search_start") {
                  setSearchStatus("searching");
                } else if (data.status === "search_complete") {
                  setSearchStatus("complete");
                  setTimeout(() => setSearchStatus(null), 1000); // Hide after 1 second
                } else if (data.status === "response_start") {
                  setSearchStatus(null);
                }
              }

              // Handle image generation status
              if (data.type === "image_start") {
                setSearchStatus("generating_image");
              }
              
              if (data.type === "image_complete") {
                setSearchStatus("image_complete");
                setTimeout(() => setSearchStatus(null), 1000);
              }

              // Handle follow-up questions
              if (data.type === "followup_questions") {
                const followupData = data.data;
                const followupContent = followupData.response || "I need more information to help you better.";
                const questions = followupData.followup_questions || [];
                
                // Create content with follow-up questions
                let questionContent = followupContent + "\n\n";
                questions.forEach((question, index) => {
                  questionContent += `**${index + 1}.** ${question}\n\n`;
                });
                
                // Update the bot message with follow-up questions
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { 
                      ...msg, 
                      content: questionContent,
                      followupQuestions: questions,
                      needsFollowup: true
                    }
                    : msg
                ));
                
                setStreamingMessageId(null);
                setSearchStatus(null);
                setTimeout(() => scrollToBottom(), 100);
                return;
              }

              // Handle content
              if (data.content || (data.type === "content" && data.content)) {
                const content = data.content || "";
                accumulatedContent += content;

                // Update the bot message with accumulated content
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));

                // Auto-scroll as content streams in
                scrollToBottom();
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error calling streaming chatbot API:', error);

      // Update the bot message with error
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? {
            ...msg,
            content: "I'm sorry, I'm having trouble connecting to the server right now. Please make sure the chatbot backend is running on port 8012 and try again."
          }
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleFollowupQuestion = (question) => {
    setInputMessage(question);
    // Auto-send the follow-up question
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
        console.log('Speech recognition started');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    // Clear auto-send timer when manually stopping
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
  };

  const resetAutoSendTimer = () => {
    // Clear existing timer
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    console.log('Setting auto-send timer for 0.8 seconds');

    // Set new timer for 0.8 seconds
    autoSendTimerRef.current = setTimeout(() => {
      const currentMessage = lastTranscriptRef.current || inputMessage;
      console.log('Auto-send timer triggered. Current message:', currentMessage);

      if (currentMessage && currentMessage.trim()) {
        console.log('Auto-sending message after 0.8 seconds of silence');

        // Stop listening first
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }

        // Send the message
        setInputMessage(currentMessage);

        // Trigger send after a brief delay to ensure state is updated
        setTimeout(async () => {
          if (currentMessage.trim()) {
            const userMessage = {
              id: Date.now(),
              type: 'user',
              content: currentMessage,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, userMessage]);
            setInputMessage('');
            setIsTyping(true);
            lastTranscriptRef.current = '';

            // Create a placeholder bot message for streaming
            const botMessageId = Date.now() + 1;
            const botMessage = {
              id: botMessageId,
              type: 'bot',
              content: '',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setStreamingMessageId(botMessageId);

            try {
              // Call the streaming chatbot API with session ID
              const response = await fetch('http://localhost:8012/chat/stream', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: currentMessage,
                  session_id: sessionId,
                  user_id: 'default'
                })
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let accumulatedContent = '';

              setIsTyping(false); // Stop typing indicator as we start streaming

              while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));

                      if (data.error) {
                        throw new Error(data.error);
                      }

                      if (data.done) {
                        // Streaming complete - scroll to bottom one final time
                        setStreamingMessageId(null);
                        setSearchStatus(null);
                        setTimeout(() => scrollToBottom(), 100);
                        break;
                      }

                      // Handle session data
                      if (data.type === "session") {
                        if (data.session_id && !sessionId) {
                          setSessionId(data.session_id);
                        }
                      }

                      // Handle status messages
                      if (data.type === "status") {
                        if (data.status === "search_start") {
                          setSearchStatus("searching");
                        } else if (data.status === "search_complete") {
                          setSearchStatus("complete");
                          setTimeout(() => setSearchStatus(null), 1000); // Hide after 1 second
                        } else if (data.status === "response_start") {
                          setSearchStatus(null);
                        }
                      }

                      // Handle image generation status
                      if (data.type === "image_start") {
                        setSearchStatus("generating_image");
                      }
                      
                      if (data.type === "image_complete") {
                        setSearchStatus("image_complete");
                        setTimeout(() => setSearchStatus(null), 1000);
                      }

                      // Handle content
                      if (data.content || (data.type === "content" && data.content)) {
                        const content = data.content || "";
                        accumulatedContent += content;

                        // Update the bot message with accumulated content
                        setMessages(prev => prev.map(msg =>
                          msg.id === botMessageId
                            ? { ...msg, content: accumulatedContent }
                            : msg
                        ));

                        // Auto-scroll as content streams in
                        scrollToBottom();
                      }
                    } catch (parseError) {
                      console.error('Error parsing streaming data:', parseError);
                    }
                  }
                }
              }

            } catch (error) {
              console.error('Error calling streaming chatbot API:', error);

              // Update the bot message with error
              setMessages(prev => prev.map(msg =>
                msg.id === botMessageId
                  ? {
                    ...msg,
                    content: "I'm sorry, I'm having trouble connecting to the server right now. Please make sure the chatbot backend is running on port 8012 and try again."
                  }
                  : msg
              ));
            } finally {
              setIsTyping(false);
            }
          }
        }, 100);
      }
    }, 800);
  };

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'nl-NL', name: 'Dutch' },
    { code: 'sv-SE', name: 'Swedish' },
    { code: 'da-DK', name: 'Danish' },
    { code: 'no-NO', name: 'Norwegian' },
    { code: 'fi-FI', name: 'Finnish' },
    { code: 'pl-PL', name: 'Polish' },
    { code: 'tr-TR', name: 'Turkish' }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Clean Chat Interface */}
      <div className="relative z-10 h-screen flex flex-col max-w-5xl mx-auto">
        {/* Header with Back Button and Assistant Info */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[17px] font-medium">Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" opacity="0.8" />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7V5M12 19V17M17 12H19M5 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1.5" />
                <path d="M8.5 8.5L7 7M16.5 8.5L18 7M16.5 15.5L18 17M8.5 15.5L7 17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
            <h2 className="text-white text-[23px] font-semibold">StudyPal Assistant</h2>
          </div>

          <div className="w-20"></div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              {message.type === 'bot' ? (
                <div className="text-gray-100 text-[19px] leading-relaxed max-w-4xl">
                  <div className="formatted-response">
                    <MarkdownRenderer content={message.content} />
                    {streamingMessageId === message.id && (
                      <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse"></span>
                    )}
                    
                    {/* Follow-up Questions */}
                    {message.followupQuestions && message.followupQuestions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-cyan-400 font-medium text-sm mb-3">
                          💭 Click a question to continue:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.followupQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleFollowupQuestion(question)}
                              className="bg-gray-700/50 hover:bg-cyan-600/20 border border-gray-600 hover:border-cyan-400/50 text-gray-200 hover:text-cyan-300 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left max-w-xs"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="bg-gray-700 text-white px-4 py-3 rounded-2xl max-w-md text-[19px] leading-relaxed">
                    {message.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-gray-400 text-[17px]">StudyPal is thinking...</span>
            </div>
          )}

          {searchStatus === "searching" && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-cyan-400 text-[17px] font-medium">Searching the web...</span>
              </div>
            </div>
          )}

          {searchStatus === "generating_image" && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-purple-400 text-[17px] font-medium">Generating image with FLUX AI...</span>
              </div>
            </div>
          )}

          {searchStatus === "image_complete" && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-400 text-[17px] font-medium">Image generated successfully!</span>
              </div>
            </div>
          )}

          {searchStatus === "complete" && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-400 text-[17px] font-medium">Search completed</span>
              </div>
            </div>
          )}

          {sessionId && messages.length > 2 && (
            <div className="flex items-center space-x-3 mb-4 opacity-70">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-purple-400 text-[15px] font-medium">Memory Active - I remember our conversation</span>
              </div>
            </div>
          )}

          {/* Center Microphone Animation Overlay */}
          {isListening && (
            <div className="fixed inset-0 flex items-end justify-center pb-32 z-50 pointer-events-none">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/30 to-cyan-500/40 backdrop-blur-sm border border-cyan-400/30 flex items-center justify-center mic-center-overlay">
                  <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm0 12c2.76 0 5.3-2.24 5.3-5H19c0 3.53-2.61 6.43-6 6.92V21h-2v-5.08c-3.39-.49-6-3.39-6-6.92h1.7c0 2.76 2.54 5 5.3 5z" />
                  </svg>
                </div>
                <div className="mt-4 text-cyan-400 text-lg font-medium">Listening...</div>
                <div className="mt-1 text-gray-400 text-sm">{languages.find(lang => lang.code === selectedLanguage)?.name}</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-700/30">
          {/* Language Selector and Memory Controls */}
          <div className="mb-3 flex items-center justify-between">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-800/60 text-white text-sm border border-gray-700/50 rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-3">
              {sessionId && (
                <span className="text-xs text-gray-400">
                  Session: {sessionId.slice(0, 8)}...
                </span>
              )}
              <button
                onClick={clearCurrentSession}
                className="bg-gray-700/60 hover:bg-gray-600/60 text-white text-sm px-3 py-1 rounded-lg border border-gray-600/50 transition-colors duration-200 flex items-center space-x-1"
                title="Clear conversation memory and start fresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Memory</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-gray-800/60 rounded-2xl p-3 border border-gray-700/50">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
              className={`p-2 transition-all duration-300 rounded-lg ${isListening
                ? 'text-cyan-400 bg-cyan-400/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                } ${!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
                }`}
              title={
                !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
                  ? 'Voice recognition not supported in this browser'
                  : isListening
                    ? 'Stop listening'
                    : 'Start voice input'
              }
            >
              {isListening ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your question or describe what you'd like help with..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-[19px] py-2"
              maxLength={500}
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-700/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 animate-pulse"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/3 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};

export default Chatbot;