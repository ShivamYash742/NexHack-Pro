"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export enum VoiceSessionState {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  PAUSED = "PAUSED",
}

export enum MessageSender {
  CLIENT = "CLIENT",
  AVATAR = "AVATAR",
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
}

interface VoiceInterviewContextProps {
  sessionState: VoiceSessionState;
  setSessionState: (s: VoiceSessionState) => void;
  isUserTalking: boolean;
  setIsUserTalking: (v: boolean) => void;
  isAvatarTalking: boolean;
  setIsAvatarTalking: (v: boolean) => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  messages: Message[];
  addMessage: (sender: MessageSender, content: string) => void;
  clearMessages: () => void;
}

const VoiceInterviewContext = createContext<VoiceInterviewContextProps>({
  sessionState: VoiceSessionState.INACTIVE,
  setSessionState: () => {},
  isUserTalking: false,
  setIsUserTalking: () => {},
  isAvatarTalking: false,
  setIsAvatarTalking: () => {},
  isMuted: false,
  setIsMuted: () => {},
  messages: [],
  addMessage: () => {},
  clearMessages: () => {},
});

export const VoiceInterviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionState, setSessionState] = useState(VoiceSessionState.INACTIVE);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((sender: MessageSender, content: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender, content }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <VoiceInterviewContext.Provider
      value={{
        sessionState,
        setSessionState,
        isUserTalking,
        setIsUserTalking,
        isAvatarTalking,
        setIsAvatarTalking,
        isMuted,
        setIsMuted,
        messages,
        addMessage,
        clearMessages,
      }}
    >
      {children}
    </VoiceInterviewContext.Provider>
  );
};

export const useVoiceInterviewContext = () => useContext(VoiceInterviewContext);
