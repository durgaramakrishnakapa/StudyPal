import React, { useState, useEffect, useRef } from 'react';
import './IntelligentChat.css';

const IntelligentChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message = inputMessage, isFollowUp = false) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      isFollowUp
    };

    setMessages(prev => [...prev, userMessage]);
    if (!isFollowUp) {
      setInputMessage('');
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat/intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          user_id: 'user_123',
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update session ID if provided
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Create bot response message
      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        analysis: data.analysis,
        followUpQuestions: data.follow_up_questions || [],
        needsClarification: data.needs_clarification,
        responseType: data.response_type,
        confidence: data.confidence,
        taskType: data.task_type,
        imageData: data.image_data,
        searchResults: data.search_results
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentAnalysis(data.analysis);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpClick = (question) => {
    sendMessage(question.question, true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    if (message.sender === 'user') {
      return (
        <div key={message.id} className={`message user-message ${message.isFollowUp ? 'follow-up' : ''}`}>
          <div className="message-content">
            <div className="message-text">{message.text}</div>
            <div className="message-time">{message.timestamp}</div>
            {message.isFollowUp && <div className="follow-up-indicator">Follow-up</div>}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`message bot-message ${message.isError ? 'error' : ''}`}>
        <div className="message-content">
          <div className="message-text">{message.text}</div>
          
          {/* Analysis Display */}
          {message.analysis && (
            <div className="analysis-panel">
              <h4>🧠 Analysis</h4>
              <div className="analysis-grid">
                <div className="analysis-item">
                  <span className="label">Task Type:</span>
                  <span className="value">{message.taskType}</span>
                </div>
                <div className="analysis-item">
                  <span className="label">Confidence:</span>
                  <span className="value">{(message.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="analysis-item">
                  <span className="label">Response Type:</span>
                  <span className="value">{message.responseType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {message.followUpQuestions && message.followUpQuestions.length > 0 && (
            <div className="follow-up-questions">
              <h4>💭 I need more information:</h4>
              <div className="questions-grid">
                {message.followUpQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="follow-up-button"
                    onClick={() => handleFollowUpClick(question)}
                  >
                    <span className="question-icon">❓</span>
                    {question.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Display */}
          {message.imageData && (
            <div className="image-container">
              <h4>🖼️ Generated Image</h4>
              <img 
                src={`data:image/png;base64,${message.imageData}`} 
                alt="Generated content"
                className="generated-image"
              />
            </div>
          )}

          {/* Search Results */}
          {message.searchResults && (
            <div className="search-results">
              <h4>🔍 Web Search Results</h4>
              <div className="search-content">
                {message.searchResults}
              </div>
            </div>
          )}

          <div className="message-time">{message.timestamp}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="intelligent-chat-container">
      <div className="chat-header">
        <h2>🧠 Intelligent StudyPal</h2>
        <p>I ask smart questions when I need more info and continue our conversation seamlessly!</p>
        {currentAnalysis && (
          <div className="session-info">
            Session: {sessionId?.substring(0, 8)}... | 
            Last Task: {currentAnalysis.task_type}
          </div>
        )}
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>👋 Welcome to Intelligent StudyPal!</h3>
            <p>I'm your smart AI assistant that:</p>
            <ul>
              <li>🤔 Asks clarifying questions when your request needs more details</li>
              <li>🧠 Remembers our entire conversation</li>
              <li>🔄 Continues tasks from where we left off</li>
              <li>📊 Provides confidence scores and analysis</li>
              <li>🎯 Gives you exactly what you need</li>
            </ul>
            <p><strong>Try asking:</strong> "Create an image" or "Help me with a presentation"</p>
          </div>
        )}

        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="loading-message">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>Analyzing your request...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything! I'll ask follow-up questions if I need more details..."
            className="message-input"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default IntelligentChat;