"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Add TypeScript definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor | undefined;
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
  }
}

// Basic type definitions for Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export const useSpeechToText = (options?: {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onSilenceTimeout?: (finalTranscript: string) => void;
  silenceTimeoutMs?: number;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef(""); // Keep track in a ref for the timeout closure
  const isIntentionallyStopped = useRef(false);

  const lang = options?.lang || "en-US";
  const continuous = options?.continuous ?? true;
  const interimResults = options?.interimResults ?? true;
  const onSilenceTimeout = options?.onSilenceTimeout;
  const silenceTimeoutMs = options?.silenceTimeoutMs || 3000;

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterim = "";
      let currentFinal = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(currentInterim);
      if (currentFinal) {
        setTranscript((prev) => {
          const newTranscript = prev + (prev && currentFinal.trim() ? " " : "") + currentFinal.trim();
          return newTranscript;
        });
      }

      // Silence detection logic
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      if (onSilenceTimeout) {
        silenceTimeoutRef.current = setTimeout(() => {
          const combinedReady = transcriptRef.current + (transcriptRef.current && currentFinal.trim() ? " " : "") + currentFinal.trim();
          if (combinedReady.trim().length > 0) {
            onSilenceTimeout(combinedReady.trim());
          }
        }, silenceTimeoutMs);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') {
        // 'aborted' is expected when we call stop() manually
        setIsListening(false);
        return;
      }
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please enable it in your browser settings.");
      } else {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if it ended naturally but we wanted it continuous
      if (!isIntentionallyStopped.current && continuous) {
        try {
          recognitionRef.current?.start();
        } catch {
          // Ignore invalid state
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isIntentionallyStopped.current = true;
        recognitionRef.current.abort();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [lang, continuous, interimResults, onSilenceTimeout, silenceTimeoutMs]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
    isIntentionallyStopped.current = false;
    
    try {
      recognitionRef.current?.start();
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'InvalidStateError') {
         console.warn("Could not start recognition:", e);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!isSupported) return;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    isIntentionallyStopped.current = true;
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.warn("Could not stop recognition:", e);
    }
    setIsListening(false);
  }, [isSupported]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
  };
};
