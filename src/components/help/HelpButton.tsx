import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageCircle } from 'lucide-react';
import { HelpChatbot } from './HelpChatbot';

export function HelpButton() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      {/* Help Button */}
      <motion.button
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="relative">
          <HelpCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Need help? Ask me anything!
          <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </motion.button>

      {/* Help Chatbot */}
      <HelpChatbot 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />
    </>
  );
}