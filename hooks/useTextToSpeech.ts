"use client";

import { useState, useEffect, useCallback } from "react";

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (!selectedVoice && availableVoices.length > 0) {
        // Try to pick a good English voice
        const englishVoices = availableVoices.filter(v => v.lang.startsWith("en"));
        
        // Priority: Google/Premium US female/male -> any English -> any
        const preferredVoice = 
          englishVoices.find(v => v.name.includes("Google") && v.name.includes("US")) || 
          englishVoices.find(v => v.name.includes("Premium") || v.name.includes("Enhanced")) ||
          englishVoices[0] ||
          availableVoices[0];
        
        setSelectedVoice(preferredVoice || null);
      }
    };

    // The voices load asynchronously in some browsers
    loadVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const setVoiceByName = useCallback((name: string) => {
    const voice = voices.find((v) => v.name === name);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, [voices]);

  const setVoiceURI = useCallback((uri: string) => {
     const voice = voices.find((v) => v.voiceURI === uri);
     if (voice) {
       setSelectedVoice(voice);
     }
  }, [voices]);

  const speak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error("Speech synthesis not supported"));
          return;
        }

        // Must cancel previous speech before starting new one safely
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        utterance.rate = options?.rate || 1.0;
        utterance.pitch = options?.pitch || 1.0;
        utterance.volume = options?.volume || 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = (e) => {
          setIsSpeaking(false);
          if (e.error === 'interrupted') {
            resolve();
          } else {
            console.warn("Speech synthesis error:", e.error || 'unknown', e);
            reject(e);
          }
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [isSupported, selectedVoice]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setVoiceByName,
    setVoiceURI,
    speak,
    stop,
  };
};
