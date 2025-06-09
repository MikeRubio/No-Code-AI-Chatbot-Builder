import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps) {
  const baseClasses = "bg-gray-800 border border-gray-700 rounded-xl shadow-lg";
  const hoverClasses = hover
    ? "hover:shadow-xl hover:border-gray-600 transition-all duration-200 cursor-pointer"
    : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  const CardComponent = onClick ? motion.div : "div";
  const motionProps = onClick
    ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <CardComponent
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </CardComponent>
  );
}
