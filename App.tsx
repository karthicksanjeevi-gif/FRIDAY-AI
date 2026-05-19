import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import { geminiService } from './services/geminiService';
import { liveService } from './services/liveService';
import { Message, Sender, GroundingChunk, FileAttachment } from './types';
import { Sparkles, AlertTriangle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { firebaseService } from './services/firebaseService';
import { User } from 'firebase/auth';
import VoiceAgentOverlay from './components/VoiceAgentOverlay';

const App: React.FC = () => {
  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    liveService.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    liveService.setSpeaker(isSpeakerOn);
  }, [isSpeakerOn]);
  
  // Sidebar & Auth State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string>(uuidv4());

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleNewChat = () => {
    setCurrentChatId(uuidv4());
    setMessages([]);
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    if (currentUser) {
      setIsLoading(true);
      const hist = await firebaseService.getChatMessages(currentUser.uid, chatId);
      setMessages(hist);
      setIsLoading(false);
    }
  };
  
  // Track live transcription buffers
  const userTranscriptRef = useRef("");
  const botTranscriptRef = useRef("");
  const userActiveMessageIdRef = useRef<string | null>(null);
  const botActiveMessageIdRef = useRef<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    geminiService.initChat();
  }, []);

  const toggleLive = async () => {
    if (isLiveActive) {
      await liveService.disconnect();
      setIsLiveActive(false);
    } else {
      setError(null); // Clear previous errors
      try {
        setIsMuted(false);
        setIsSpeakerOn(true);
        await liveService.connect(
          (active) => setIsLiveActive(active),
          (err) => {
              console.debug("Async Live Error:", err);
              setError(err.message || "An error occurred with the live session.");
              setIsLiveActive(false);
          },
          (text, isUser, isTurnComplete) => {
             // Handle Transcription
             if (isTurnComplete) {
                userTranscriptRef.current = "";
                botTranscriptRef.current = "";
                if (userActiveMessageIdRef.current) {
                  setMessages(prev => prev.map(m => m.id === userActiveMessageIdRef.current ? { ...m, isStreaming: false } : m));
                  userActiveMessageIdRef.current = null;
                }
                if (botActiveMessageIdRef.current) {
                  setMessages(prev => prev.map(m => m.id === botActiveMessageIdRef.current ? { ...m, isStreaming: false } : m));
                  botActiveMessageIdRef.current = null;
                }
                return;
             }

             if (isUser) {
                userTranscriptRef.current += text;
                
                setMessages(prev => {
                    // Check if last message is our active live user message
                    const lastMsg = prev[prev.length - 1];
                    if (userActiveMessageIdRef.current && lastMsg?.id === userActiveMessageIdRef.current) {
                        return prev.map(m => m.id === userActiveMessageIdRef.current ? { ...m, content: userTranscriptRef.current } : m);
                    } else {
                        const newId = uuidv4();
                        userActiveMessageIdRef.current = newId;
                        return [...prev, {
                            id: newId,
                            role: Sender.User,
                            content: userTranscriptRef.current,
                            timestamp: Date.now(),
                            isStreaming: true // Keep it pulsing while live
                        }];
                    }
                });
             } else {
                botTranscriptRef.current += text;
                
                setMessages(prev => {
                    // Check if last message is our active live bot message
                    const lastMsg = prev[prev.length - 1];
                    if (botActiveMessageIdRef.current && lastMsg?.id === botActiveMessageIdRef.current) {
                        return prev.map(m => m.id === botActiveMessageIdRef.current ? { ...m, content: botTranscriptRef.current } : m);
                    } else {
                        const newId = uuidv4();
                        botActiveMessageIdRef.current = newId;
                        return [...prev, {
                            id: newId,
                            role: Sender.Bot,
                            content: botTranscriptRef.current,
                            timestamp: Date.now(),
                            isStreaming: true // Keep it pulsing while live
                        }];
                    }
                });
             }
          }
        );
      } catch (e: any) {
        console.debug("Live Connection Error:", e);
        if (e.message && e.message.includes("Quota")) {
             setError("Voice Unavailable: API Quota Exceeded. Please try again later.");
        } else if (e.message && e.message.includes("Connection failed")) {
             setError(e.message);
        } else {
             setError("Could not access microphone or connect to Friday Live. Check permissions.");
        }
        setIsLiveActive(false);
      }
    }
  };

  const handleSendMessage = async (text: string, image?: string, file?: FileAttachment) => {
    setError(null);
    setIsLoading(true);

    const userMsg: Message = {
      id: uuidv4(),
      role: Sender.User,
      content: text,
      image: image,
      file: file,
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMsg];
      if (currentUser) {
        firebaseService.saveChatSession(currentUser.uid, currentChatId, newMessages);
      }
      return newMessages;
    });

    try {
      const botMsgId = uuidv4();
      const initialBotMsg: Message = {
        id: botMsgId,
        role: Sender.Bot,
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, initialBotMsg]);

      let fullResponse = "";
      let collectedGroundingChunks: GroundingChunk[] = [];
      
      let imagePayload;
      if (image) {
          const match = image.match(/^data:(.*);base64,/);
          const mimeType = match ? match[1] : 'image/jpeg';
          imagePayload = { data: image, mimeType };
      }

      const stream = geminiService.sendMessageStream(text, imagePayload, file);
      
      for await (const data of stream) {
        if (data.text) {
          fullResponse += data.text;
        }
        
        if (data.groundingChunks) {
          data.groundingChunks.forEach((chunk: GroundingChunk) => {
             const isDuplicate = collectedGroundingChunks.some(c => c.web?.uri === chunk.web?.uri);
             if (!isDuplicate) collectedGroundingChunks.push(chunk);
          });
        }

        setMessages((prev) => prev.map((msg) => 
          msg.id === botMsgId 
            ? { 
                ...msg, 
                content: fullResponse, 
                groundingChunks: collectedGroundingChunks.length > 0 ? collectedGroundingChunks : undefined 
              } 
            : msg
        ));
      }
      
      setMessages((prev) => {
        const updated = prev.map((msg) => 
          msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
        );
        if (currentUser) {
          firebaseService.saveChatSession(currentUser.uid, currentChatId, updated);
        }
        return updated;
      });

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Something went wrong.";
      setError(errorMessage);
      
      setMessages((prev) => [
        ...prev, 
        { 
          id: uuidv4(), 
          role: Sender.Bot, 
          content: errorMessage, 
          timestamp: Date.now(),
          isError: true 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        user={currentUser}
        currentChatId={currentChatId}
      />
      
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        isLiveActive={isLiveActive} 
        toggleLive={toggleLive}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      <main className="flex-1 overflow-y-auto pt-20 pb-4 px-4 md:px-0">
        <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
          
          {messages.length === 0 && !isLiveActive && (
             <div className="flex flex-col items-center justify-center flex-1 opacity-50 mb-12">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl">
                   <Sparkles size={32} />
                </div>
                <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
                <p className="text-sm text-center max-w-xs">
                  Ask me anything, upload a photo, or start a voice conversation.
                </p>
             </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && !messages[messages.length - 1]?.isStreaming && (
            <div className="mb-6">
               <TypingIndicator />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 mx-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
               <AlertTriangle size={16} />
               <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={isLiveActive} />
      </div>

      {isLiveActive && (
        <VoiceAgentOverlay
          messages={messages}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          toggleLive={toggleLive}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isSpeakerOn={isSpeakerOn}
          setIsSpeakerOn={setIsSpeakerOn}
        />
      )}
    </div>
  );
};

export default App;