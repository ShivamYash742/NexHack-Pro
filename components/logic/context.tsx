"use client";

import React, { useRef, useState, useCallback, createContext, useContext } from "react";
import type { LiveAvatarSession } from "@heygen/liveavatar-web-sdk";

// ── Session state enum (mirrors SDK SessionState) ──
export enum LiveAvatarSessionState {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTING = "DISCONNECTING",
  DISCONNECTED = "DISCONNECTED",
}

// ── Message types kept for chat panel compatibility ──
export enum MessageSender {
  CLIENT = "CLIENT",
  AVATAR = "AVATAR",
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
}

// ── Context shape ──
interface LiveAvatarContextProps {
  sessionRef: React.MutableRefObject<LiveAvatarSession | null>;

  sessionState: LiveAvatarSessionState;
  setSessionState: (s: LiveAvatarSessionState) => void;

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

const LiveAvatarContext = createContext<LiveAvatarContextProps>({
  sessionRef: { current: null },
  sessionState: LiveAvatarSessionState.INACTIVE,
  setSessionState: () => {},
  isUserTalking: false,
  setIsUserTalking: () => {},
  isAvatarTalking: false,
  setIsAvatarTalking: () => {},
  isMuted: true,
  setIsMuted: () => {},
  messages: [],
  addMessage: () => {},
  clearMessages: () => {},
});

// ── Provider ──
export const LiveAvatarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const sessionRef = useRef<LiveAvatarSession | null>(null);

  const [sessionState, setSessionState] = useState<LiveAvatarSessionState>(
    LiveAvatarSessionState.INACTIVE
  );
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((sender: MessageSender, content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender, content },
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <LiveAvatarContext.Provider
      value={{
        sessionRef,
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
    </LiveAvatarContext.Provider>
  );
};

export const useLiveAvatarContext = () => useContext(LiveAvatarContext);
