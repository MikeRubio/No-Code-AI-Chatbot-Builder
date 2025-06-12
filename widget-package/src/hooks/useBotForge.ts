import { useRef, useCallback } from 'react';
import { BotForgeAPI, BotForgeConfig } from '../types';

export const useBotForge = (config: BotForgeConfig) => {
  const widgetRef = useRef<BotForgeAPI>(null);

  const open = useCallback(() => {
    widgetRef.current?.open();
  }, []);

  const close = useCallback(() => {
    widgetRef.current?.close();
  }, []);

  const toggle = useCallback(() => {
    widgetRef.current?.toggle();
  }, []);

  const sendMessage = useCallback((message: string) => {
    widgetRef.current?.sendMessage(message);
  }, []);

  const setUser = useCallback((user: any) => {
    widgetRef.current?.setUser(user);
  }, []);

  const isOpen = useCallback(() => {
    return widgetRef.current?.isOpen() || false;
  }, []);

  return {
    widgetRef,
    open,
    close,
    toggle,
    sendMessage,
    setUser,
    isOpen,
  };
};