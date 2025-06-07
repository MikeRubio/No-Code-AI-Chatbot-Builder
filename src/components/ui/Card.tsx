import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      className={`bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg ${hover ? 'hover:shadow-xl' : ''} transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}