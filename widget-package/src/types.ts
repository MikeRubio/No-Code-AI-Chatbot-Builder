export interface BotForgeConfig {
  chatbotId: string;
  apiUrl?: string;
  theme?: BotForgeTheme;
  position?: BotForgePosition;
  autoOpen?: boolean;
  showBranding?: boolean;
  customCSS?: string;
  user?: BotForgeUser;
  events?: BotForgeEvents;
}

export interface BotForgeTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  buttonSize?: "small" | "medium" | "large";
  chatHeight?: string;
  chatWidth?: string;
  shadow?: boolean;
  animation?: string;
}

export interface BotForgePosition {
  bottom?: string;
  right?: string;
  left?: string;
  top?: string;
}

export interface BotForgeUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface BotForgeMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "image" | "file" | "quick_reply";
  metadata?: Record<string, unknown>;
}

export interface BotForgeEvents {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: BotForgeMessage) => void;
  onUserMessage?: (message: BotForgeMessage) => void;
  onBotMessage?: (message: BotForgeMessage) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

export interface BotForgeAPI {
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (message: string) => void;
  setUser: (user: BotForgeUser) => void;
  destroy: () => void;
  isOpen: () => boolean;
}
