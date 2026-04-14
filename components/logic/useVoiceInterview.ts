"use client";

import { useCallback, useRef } from "react";
import { VoiceSessionState, MessageSender, useVoiceInterviewContext } from "./VoiceInterviewContext";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

export const useVoiceInterview = () => {
  const {
    sessionState,
    setSessionState,
    setIsUserTalking,
    setIsAvatarTalking,
    addMessage,
    clearMessages,
    messages
  } = useVoiceInterviewContext();

  const aiStateRef = useRef<{ kb: string, role: string, isProcessing: boolean, isPaused: boolean }>({ kb: "", role: "", isProcessing: false, isPaused: false });

  const handleUserSpeech = async (text: string) => {
    if (aiStateRef.current.isProcessing) return;
    
    if (text !== "[USER_PAUSED]") {
      addMessage(MessageSender.CLIENT, text);
    }
    stopListening();
    
    aiStateRef.current.isProcessing = true;
    
    try {
       // Convert UI messages to AI conversation history format
       const history = messages.map(m => ({
          sender: m.sender === MessageSender.CLIENT ? 'User' : 'Interviewer',
          text: m.content
       }));
       
       const context = aiStateRef.current;
       
       const response = await fetch('/api/ai-chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            message: text,
            conversationHistory: history,
            knowledgeBase: context.kb,
            interviewContext: { role: context.role, candidateBackground: "User", duration: "3 minutes" }
         })
       });
       
       const data = await response.json();
       if (data.success) {
          await speakMessage(data.response);
       }
    } catch (err) {
       console.error("AI chat error", err);
       await speakMessage("I'm sorry, I encountered an issue. Could you repeat that?");
    } finally {
       aiStateRef.current.isProcessing = false;
    }
  };

  const { startListening, stopListening, interimTranscript, isSupported: isSttSupported, error: sttError, isListening } = useSpeechToText({
    silenceTimeoutMs: 5000,
    onSilenceTimeout: (finalText) => {
      // User finished speaking a chunk or stayed silent for 5 seconds
      if (!finalText.trim()) {
        if (!aiStateRef.current.isProcessing && !aiStateRef.current.isPaused && sessionState === VoiceSessionState.CONNECTED) {
          handleUserSpeech("[USER_PAUSED]");
        } else if (!aiStateRef.current.isProcessing && !aiStateRef.current.isPaused) {
          startListening();
        }
        return;
      }
      setIsUserTalking(false);
      handleUserSpeech(finalText);
    }
  });

  const togglePause = useCallback(() => {
    if (sessionState === VoiceSessionState.PAUSED) {
      setSessionState(VoiceSessionState.CONNECTED);
      aiStateRef.current.isPaused = false;
      startListening();
    } else if (sessionState === VoiceSessionState.CONNECTED) {
      setSessionState(VoiceSessionState.PAUSED);
      aiStateRef.current.isPaused = true;
      stopListening();
    }
  }, [sessionState, setSessionState, startListening, stopListening]);

  const { speak, stop: stopTts, isSupported: isTtsSupported } = useTextToSpeech();

  const start = useCallback(
    async (knowledgeBase: string, role: string) => {
      if (!isSttSupported || !isTtsSupported) {
        console.error("Speech APIs not supported in this browser");
        // We'll let the user continue but voice won't work well
      }
      aiStateRef.current.kb = knowledgeBase;
      aiStateRef.current.role = role;
      
      setSessionState(VoiceSessionState.CONNECTING);
      
      // Simulate brief connection setup
      setTimeout(() => {
        setSessionState(VoiceSessionState.CONNECTED);
      }, 500);
    },
    [isSttSupported, isTtsSupported, setSessionState]
  );

  const stop = useCallback(() => {
    stopListening();
    stopTts();
    setSessionState(VoiceSessionState.INACTIVE);
    clearMessages();
  }, [stopListening, stopTts, setSessionState, clearMessages]);

  const speakMessage = useCallback(async (text: string) => {
    setIsAvatarTalking(true);
    addMessage(MessageSender.AVATAR, text);
    stopListening(); // Pause mic while AI speaks
    
    try {
      await speak(text);
    } catch (e) {
      console.warn("TTS Error", e);
    } finally {
      setIsAvatarTalking(false);
      // Restart listening for user response!
      setTimeout(() => {
        setIsUserTalking(true);
        startListening();
      }, 500);
    }
  }, [speak, setIsAvatarTalking, addMessage, stopListening, startListening, setIsUserTalking]);

  return {
    sessionState,
    start,
    stop,
    speakMessage,
    togglePause,
    interimTranscript,
    sttError,
    isListening,
  };
};
