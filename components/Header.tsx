import React from 'react';
import { Moon, Sun, Sparkles, Mic, MicOff, Radio, Menu } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLiveActive: boolean;
  toggleLive: () => void;
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, isLiveActive, toggleLive, onOpenSidebar }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-16 flex items-center justify-between px-4 md:px-8 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Sparkles size={24} />
          <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Friday
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Live Voice Toggle */}
        <button
          onClick={toggleLive}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 relative overflow-hidden
            ${isLiveActive 
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          aria-label={isLiveActive ? "Stop Voice Mode" : "Start Voice Mode"}
        >
          <div className="relative z-10 flex items-center gap-2">
            {isLiveActive ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="text-sm">Live</span>
                </>
            ) : (
                <>
                 <Mic size={18} />
                 <span className="hidden md:inline text-sm">Voice</span>
                </>
            )}
          </div>
          {isLiveActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-90"></div>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;