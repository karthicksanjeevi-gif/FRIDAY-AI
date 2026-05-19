import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Message, Sender } from '../types';
import { User, Bot, AlertCircle, Globe, ExternalLink, FileText, Copy, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Sender.User;
  const isError = message.isError;
  const hasGrounding = message.groundingChunks && message.groundingChunks.length > 0;
  
  const [isCopied, setIsCopied] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm 
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : isError 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {isUser ? <User size={16} /> : isError ? <AlertCircle size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble Group */}
        <div className="flex flex-col gap-1 overflow-hidden">
          
          {/* Image Attachment */}
          {message.image && (
            <div className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 max-w-xs ${isUser ? 'ml-auto rounded-tr-none' : 'mr-auto rounded-tl-none'}`}>
              <img src={message.image} alt="User upload" className="w-full h-auto" />
            </div>
          )}

          {/* File Attachment */}
          {message.file && (
             <div className={`p-3 rounded-xl flex items-center gap-3 mb-1 shadow-sm border
               ${isUser 
                 ? 'bg-blue-700 border-blue-600 text-white ml-auto' 
                 : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
               }`}
             >
                <div className="p-2 bg-white/10 rounded-lg">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate max-w-[150px]">{message.file.name}</span>
                  <span className="text-[10px] opacity-70 uppercase">{message.file.type.split('/')[1] || 'FILE'}</span>
                </div>
             </div>
          )}

          {/* Text Bubble */}
          {(message.content || isError) && (
            <div
              className={`relative px-4 py-3 shadow-sm text-sm md:text-base leading-relaxed group
                ${isUser
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                  : isError
                    ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200 rounded-2xl'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none'
                }
              `}
            >
              {isError ? (
                <div>
                  <p className="font-semibold mb-1">Error</p>
                  {message.content}
                </div>
              ) : (
                <div className={`markdown-body ${isUser ? 'text-white' : ''}`}>
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')
                        const codeId = Math.random().toString(36).substring(7);
                        
                        return match ? (
                          <div className="rounded-lg bg-gray-900 my-4 overflow-hidden border border-gray-700">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400 text-xs font-mono border-b border-gray-700">
                              <span>{match[1]}</span>
                              <button
                                onClick={() => handleCopyCode(codeString, codeId)}
                                className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none"
                              >
                                {copiedCodeId === codeId ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedCodeId === codeId ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <div className="p-4 overflow-x-auto text-gray-100 text-sm">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </div>
                          </div>
                        ) : (
                          <code className={`${isUser ? 'bg-blue-700' : 'bg-gray-100 dark:bg-gray-700'} rounded px-1 py-0.5 text-xs`} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Citations / Grounding Chunks */}
              {hasGrounding && !isUser && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">
                    <Globe size={12} />
                    <span>Search Results & Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.groundingChunks?.map((chunk, idx) => (
                      chunk.web && (
                        <a 
                          key={idx}
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-medium border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                        >
                          <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                          <ExternalLink size={10} className="flex-shrink-0" />
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2 pt-1">
                 {!isUser && !isError && (
                    <button 
                      onClick={handleCopyMessage}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                      title="Copy message"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                 )}
                 <div className={`text-[10px] opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-400'} ml-auto`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
