import React from "react";
import { motion } from "framer-motion";
import { BotForgeTheme } from "../types";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  theme: BotForgeTheme;
}

export const ChatButton: React.FC<ChatButtonProps> = ({
  onClick,
  isOpen,
  theme,
}) => {
  const size =
    theme.buttonSize === "small"
      ? "48px"
      : theme.buttonSize === "large"
      ? "64px"
      : "56px";

  const buttonStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: theme.primaryColor || "#3b82f6",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    color: "#ffffff",
    fontSize:
      theme.buttonSize === "small"
        ? "20px"
        : theme.buttonSize === "large"
        ? "28px"
        : "24px",
    outline: "none",
  };

  return (
    <motion.button
      onClick={onClick}
      style={buttonStyle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isOpen ? "×" : "💬"}
    </motion.button>
  );
};
