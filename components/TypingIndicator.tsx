import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => {
  const dotTransition = {
    repeat: Infinity,
    repeatType: "loop" as const, // Explicit cast for TS
    duration: 0.8,
    ease: "easeInOut" as const,
  };

  return (
    <div className="flex items-center space-x-1 p-4 bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none shadow-sm w-fit border border-gray-100 dark:border-gray-700">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ ...dotTransition, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ ...dotTransition, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ ...dotTransition, delay: 0.4 }}
      />
    </div>
  );
};

export default TypingIndicator;