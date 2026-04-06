"use client";

import { LiveAvatarSession, SessionEvent, SessionState, AgentEventsEnum } from "@heygen/liveavatar-web-sdk";
import { useCallback } from "react";
import { LiveAvatarSessionState, MessageSender, useLiveAvatarContext } from "./context";

export const useLiveAvatarSession = () => {
  const {
    sessionRef,
    sessionState,
    setSessionState,
    setIsUserTalking,
    setIsAvatarTalking,
    setIsMuted,
    addMessage,
    clearMessages,
  } = useLiveAvatarContext();

  const start = useCallback(
    async (avatarId?: string) => {
      if (sessionState !== LiveAvatarSessionState.INACTIVE) {
        throw new Error("There is already an active session");
      }

      setSessionState(LiveAvatarSessionState.CONNECTING);

      try {
        // 1. Fetch session token from our backend
        const tokenRes = await fetch("/api/liveavatar-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarId }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.json().catch(() => ({}));
          throw new Error(err.error || `Token request failed: ${tokenRes.status}`);
        }

        const { sessionToken } = await tokenRes.json();

        if (!sessionToken) {
          throw new Error("No session token received from server");
        }

        // 2. Create LiveAvatarSession with voice chat enabled
        const session = new LiveAvatarSession(sessionToken, {
          voiceChat: true,
        });

        sessionRef.current = session;

        // 3. Bind events
        session.on(SessionEvent.SESSION_STATE_CHANGED, (state: SessionState) => {
          if (state === SessionState.CONNECTED) {
            setSessionState(LiveAvatarSessionState.CONNECTED);
          } else if (state === SessionState.DISCONNECTED) {
            setSessionState(LiveAvatarSessionState.DISCONNECTED);
          } else if (state === SessionState.CONNECTING) {
            setSessionState(LiveAvatarSessionState.CONNECTING);
          }
        });

        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          setSessionState(LiveAvatarSessionState.INACTIVE);
        });

        session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
          setIsUserTalking(true);
        });

        session.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
          setIsUserTalking(false);
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
          setIsAvatarTalking(true);
        });

        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
          setIsAvatarTalking(false);
        });

        session.on(AgentEventsEnum.USER_TRANSCRIPTION, (event) => {
          addMessage(MessageSender.CLIENT, event.text);
        });

        session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (event) => {
          addMessage(MessageSender.AVATAR, event.text);
        });

        // 4. Start the session
        await session.start();

        return session;
      } catch (error) {
        setSessionState(LiveAvatarSessionState.INACTIVE);
        throw error;
      }
    },
    [sessionState, sessionRef, setSessionState, setIsUserTalking, setIsAvatarTalking, addMessage]
  );

  const stop = useCallback(async () => {
    if (!sessionRef.current) return;
    clearMessages();
    setIsUserTalking(false);
    setIsAvatarTalking(false);
    try {
      await sessionRef.current.stop();
    } catch (e) {
      console.error("Error stopping session:", e);
    }
    sessionRef.current = null;
    setSessionState(LiveAvatarSessionState.INACTIVE);
  }, [sessionRef, setSessionState, clearMessages, setIsUserTalking, setIsAvatarTalking]);

  const attach = useCallback(
    (element: HTMLMediaElement) => {
      if (!sessionRef.current) return;
      sessionRef.current.attach(element);
    },
    [sessionRef]
  );

  const speakMessage = useCallback(
    (text: string) => {
      if (!sessionRef.current) return;
      sessionRef.current.repeat(text);
    },
    [sessionRef]
  );

  const interrupt = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.interrupt();
  }, [sessionRef]);

  const muteVoice = useCallback(async () => {
    if (!sessionRef.current) return;
    await sessionRef.current.voiceChat.mute();
    setIsMuted(true);
  }, [sessionRef, setIsMuted]);

  const unmuteVoice = useCallback(async () => {
    if (!sessionRef.current) return;
    await sessionRef.current.voiceChat.unmute();
    setIsMuted(false);
  }, [sessionRef, setIsMuted]);

  return {
    sessionRef,
    sessionState,
    start,
    stop,
    attach,
    speakMessage,
    interrupt,
    muteVoice,
    unmuteVoice,
  };
};
