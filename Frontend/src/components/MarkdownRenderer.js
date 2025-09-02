import React, { useState } from 'react';
import ImageRenderer from './ImageRenderer';

const MarkdownRenderer = ({ content }) => {
  const [copiedBlocks, setCopiedBlocks] = useState(new Set());

  const copyToClipboard = async (text, blockId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBlocks(prev => new Set([...prev, blockId]));
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(blockId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;

    console.log('🔍 Rendering markdown text:', text.substring(0, 200) + '...');
    console.log('📝 Full text length:', text.length);
    
    // Check if text contains image markdown
    if (text.includes('![Generated Image]')) {
      console.log('✅ Found image markdown in text');
    } else {
      console.log('❌ No image markdown found in text');
    }

    const lines = text.split('\n');
    const elements = [];
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    let inCodeBlock = false;
    let codeBlockId = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('![Generated Image]')) {
        console.log('Found image line:', trimmedLine.substring(0, 100) + '...');
      }

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          codeBlockId++;
          const blockId = `code-${codeBlockId}`;
          elements.push(
            <div key={`code-${index}`} className="relative group mb-4">
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-sm text-gray-400 font-mono">
                    {codeBlockLanguage || 'code'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeBlockContent, blockId)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    {copiedBlocks.has(blockId) ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="text-sm text-green-300 font-mono whitespace-pre">
                    {codeBlockContent}
                  </code>
                </pre>
              </div>
            </div>
          );
          codeBlockContent = '';
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          // Start of code block
          codeBlockLanguage = trimmedLine.slice(3).trim();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        return;
      }

      // Handle empty lines
      if (!trimmedLine) {
        elements.push(<div key={index} className="h-3"></div>);
        return;
      }

      // Handle headers
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.slice(2, -2);
        elements.push(
          <div key={index} className="font-bold text-cyan-400 text-xl mb-3 mt-4">
            {text}
          </div>
        );
        return;
      }

      // Handle bullet points
      if (trimmedLine.startsWith('* ')) {
        const text = trimmedLine.slice(2);
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="text-cyan-400 mr-3 mt-1">•</span>
            <span>{renderInlineMarkdown(text)}</span>
          </div>
        );
        return;
      }

      // Handle numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        const number = trimmedLine.match(/^\d+\./)[0];
        const text = trimmedLine.replace(/^\d+\.\s*/, '');
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="text-cyan-400 mr-3 font-semibold">{number}</span>
            <span>{renderInlineMarkdown(text)}</span>
          </div>
        );
        return;
      }

      // Handle images ![alt](src) - improved pattern matching
      if (trimmedLine.includes('![') && trimmedLine.includes('](')) {
        console.log('🔍 Processing potential image line:', trimmedLine.substring(0, 100) + '...');
        
        // More flexible regex to handle long base64 strings
        const imageMatch = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          const altText = imageMatch[1] || 'Generated Image';
          const imageSrc = imageMatch[2];
          
          console.log('🖼️ Image detected:', { 
            altText, 
            imageSrc: imageSrc.substring(0, 50) + '...', 
            fullLength: imageSrc.length,
            isBase64: imageSrc.startsWith('data:image/'),
            isUrl: imageSrc.startsWith('http')
          });
          
          // Validate image format (base64 or URL)
          const isValidBase64Image = imageSrc.startsWith('data:image/') && imageSrc.includes('base64,');
          const isValidImageUrl = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
          const isValidImage = isValidBase64Image || isValidImageUrl;
          
          if (isValidImage) {
            console.log('✅ Valid image detected, rendering...');
            elements.push(
              <ImageRenderer 
                key={index}
                src={imageSrc}
                alt={altText}
              />
            );
          } else {
            console.warn('⚠️ Invalid image format:', imageSrc.substring(0, 100));
          }
        } else {
          console.warn('⚠️ Image regex did not match:', trimmedLine.substring(0, 100));
        }
        return;
      }

      // Handle section headers (lines with colons)
      if (trimmedLine.includes(':') && trimmedLine.length < 100 && !trimmedLine.includes('http')) {
        elements.push(
          <div key={index} className="font-semibold text-cyan-300 mb-2 mt-3">
            {renderInlineMarkdown(trimmedLine)}
          </div>
        );
        return;
      }

      // Handle inline code
      if (trimmedLine.includes('`') && !trimmedLine.startsWith('```')) {
        elements.push(
          <div key={index} className="mb-2">
            {renderInlineMarkdown(trimmedLine)}
          </div>
        );
        return;
      }

      // Regular text
      elements.push(
        <div key={index} className="mb-2">
          {renderInlineMarkdown(trimmedLine)}
        </div>
      );
    });

    return <div className="space-y-1">{elements}</div>;
  };

  const renderInlineMarkdown = (text) => {
    // Check if text contains images - improved regex
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    // Test if images exist
    const hasImages = imageRegex.test(text);
    imageRegex.lastIndex = 0; // Reset regex
    
    if (hasImages) {
      console.log('🔍 Processing inline images in text:', text.substring(0, 100) + '...');
      
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = imageRegex.exec(text)) !== null) {
        // Add text before the image
        if (match.index > lastIndex) {
          const beforeText = text.slice(lastIndex, match.index);
          if (beforeText.trim()) {
            parts.push(
              <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatTextContent(beforeText) }} />
            );
          }
        }

        // Add the image
        const altText = match[1] || 'Generated Image';
        const imageSrc = match[2];
        
        console.log('🖼️ Inline image found:', { 
          altText, 
          srcLength: imageSrc.length,
          isBase64: imageSrc.startsWith('data:image/')
        });
        
        // Use ImageRenderer component for inline images too
        parts.push(
          <ImageRenderer 
            key={`img-${match.index}`}
            src={imageSrc}
            alt={altText}
            className="inline-block"
          />
        );

        lastIndex = imageRegex.lastIndex;
      }

      // Add remaining text after the last image
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        if (remainingText.trim()) {
          parts.push(
            <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatTextContent(remainingText) }} />
          );
        }
      }

      return <div>{parts}</div>;
    }

    // If no images, just format the text normally
    return <span dangerouslySetInnerHTML={{ __html: formatTextContent(text) }} />;
  };

  const formatTextContent = (text) => {
    // Handle bold text **text**
    let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-cyan-400 font-semibold">$1</strong>');

    // Handle inline code `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-800/60 px-2 py-1 rounded text-green-300 font-mono text-sm">$1</code>');

    // Handle links [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');

    return formatted;
  };

  return (
    <div className="markdown-content">
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;