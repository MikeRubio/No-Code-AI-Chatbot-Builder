// Main entry point for the BotForge widget package
export { BotForgeWidget } from './components/BotForgeWidget';
export { BotForgeProvider } from './components/BotForgeProvider';
export { useBotForge } from './hooks/useBotForge';
export { initBotForge } from './vanilla/init';
export type { 
  BotForgeConfig, 
  BotForgeTheme, 
  BotForgePosition,
  BotForgeMessage,
  BotForgeUser,
  BotForgeEvents
} from './types';