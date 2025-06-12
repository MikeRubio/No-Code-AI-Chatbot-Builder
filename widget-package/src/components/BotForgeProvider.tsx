import React, { createContext, useContext, ReactNode } from 'react';
import { BotForgeConfig } from '../types';

interface BotForgeContextValue extends BotForgeConfig {
  // Add any global state or methods here
}

const BotForgeContext = createContext<BotForgeContextValue | null>(null);

interface BotForgeProviderProps extends BotForgeConfig {
  children: ReactNode;
}

export const BotForgeProvider: React.FC<BotForgeProviderProps> = ({
  children,
  ...config
}) => {
  return (
    <BotForgeContext.Provider value={config}>
      {children}
    </BotForgeContext.Provider>
  );
};

export const useBotForgeContext = () => {
  const context = useContext(BotForgeContext);
  if (!context) {
    throw new Error('useBotForgeContext must be used within a BotForgeProvider');
  }
  return context;
};