import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Image as ImageIcon, X, Mic, Paperclip, FileText, MicOff } from 'lucide-react';
import { FileAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, image?: string, file?: FileAttachment) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, disabled }) => {
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState(''); // Visual feedback for incomplete sentences
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, interimInput]);

  const handleSend = () => {
    if ((input.trim() || selectedImage || selectedFile) && !isLoading && !disabled) {
      onSendMessage(input.trim(), selectedImage || undefined, selectedFile || undefined);
      setInput('');
      setInterimInput('');
      setSelectedImage(null);
      setSelectedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedFile(null);
      };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: base64Data
        });
        setSelectedImage(null);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
          recognitionRef.current.stop();
      } catch (e) {
          // ignore
      }
    }
    setIsListening(false);
    setInterimInput('');
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Dictation is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'en-US';
      recognition.interimResults = true; 
      recognition.continuous = true; 
      recognition.maxAlternatives = 1;
      
      setIsListening(true);
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
            setInput((prev) => {
                const needsSpace = prev.length > 0 && !prev.endsWith(' ');
                return prev + (needsSpace ? ' ' : '') + finalTranscript;
            });
        }
        setInterimInput(currentInterim);
      };
      
      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        if (event.error === 'network') {
             stopListening();
             return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("Microphone access denied.");
            stopListening();
            return;
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setInterimInput('');
        recognitionRef.current = null;
      };
      
      recognition.start();
    } catch (e) {
      console.error("Failed to start dictation", e);
      setIsListening(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Previews */}
      {selectedImage && (
        <div className="relative w-fit mb-2 ml-4 group">
          <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-blue-500 shadow-lg" />
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="relative w-fit mb-2 ml-4 group">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
             <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                <FileText size={20} className="text-blue-600 dark:text-blue-300" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[150px]">{selectedFile.name}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{selectedFile.type.split('/')[1] || 'FILE'}</span>
             </div>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 p-2 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 transition-all focus-within:ring-2 focus-within:ring-blue-500/50">
        
        {/* Image Upload */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all mb-1"
          title="Upload Image"
        >
          <ImageIcon size={20} />
        </button>
        <input 
          type="file" 
          ref={imageInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          className="hidden" 
        />

        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all mb-1"
          title="Attach File"
        >
          <Paperclip size={20} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".pdf,.txt,.csv,.json,.doc,.docx" 
          className="hidden" 
        />

        <div className="relative flex-1 min-w-0">
            <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : (selectedImage ? "Describe this image..." : selectedFile ? "Ask about this file..." : "Ask Friday anything...")}
            className="w-full max-h-[120px] py-3 px-2 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 resize-none placeholder-gray-400 dark:placeholder-gray-500 overflow-y-auto"
            rows={1}
            disabled={disabled}
            />
            {/* Overlay for interim results */}
            {interimInput && (
                <div className="absolute top-0 left-0 py-3 px-2 pointer-events-none text-gray-400 select-none truncate w-full">
                    <span className="invisible">{input}</span>
                    <span>{interimInput}</span>
                </div>
            )}
        </div>

        <button
           onClick={toggleListening}
           disabled={disabled}
           className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 mb-1
             ${isListening 
               ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400/50' 
               : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
             } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
           title="Dictate"
        >
           {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={handleSend}
          disabled={(!input.trim() && !selectedImage && !selectedFile) || disabled}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 mb-1
            ${(input.trim() || selectedImage || selectedFile) && !isLoading 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transform hover:scale-105 active:scale-95' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;