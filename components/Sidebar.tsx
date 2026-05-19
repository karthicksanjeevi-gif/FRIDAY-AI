import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  LogOut, 
  LogIn, 
  X,
  History
} from 'lucide-react';
import { ChatSession } from '../types';
import { firebaseService } from '../services/firebaseService';
import { User } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  user: User | null;
  currentChatId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat,
  onSelectChat,
  user,
  currentChatId
}) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      // Fetch chat history when sidebar opens
      firebaseService.getUserChatHistory(user.uid).then(setChatHistory);
    }
  }, [user, isOpen]);

  const handleLogin = async () => {
    try {
      await firebaseService.signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Friday Menu
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              >
                <X size={20} />
              </button>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md shadow-blue-600/20"
              >
                <Plus size={20} />
                New Chat
              </button>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                <History size={14} />
                Recent Chats
              </div>
              
              {!user ? (
                <div className="text-sm text-gray-500 px-2 py-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  Login to see your history
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-sm text-gray-500 px-2">No history yet.</div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentChatId === chat.id ? 'bg-gray-100 dark:bg-gray-800 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'}`}
                    >
                      <MessageSquare size={16} className="opacity-70 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Auth */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {user.displayName || 'User'}
                    </span>
                  </div>
                  <button 
                    onClick={() => firebaseService.logout()}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  <LogIn size={18} />
                  Sign In / Login
                </button>
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
