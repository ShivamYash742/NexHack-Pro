"use client";

import { useState, useEffect } from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

export default function TestSpeechPage() {
  const [testText, setTestText] = useState(
    "Hello! This is a test of the text to speech system. Can you hear me clearly?"
  );
  const [sttResult, setSttResult] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  // Initialize TTS
  const {
    isSpeaking,
    isSupported: ttsSupported,
    voices,
    selectedVoice,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech();

  // Initialize STT
  const {
    isListening,
    transcript,
    interimTranscript,
    error: sttError,
    isSupported: sttSupported,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechToText({
    lang: "en-US",
    continuous: true,
    interimResults: true,
    onSilenceTimeout: (finalText: string) => {
      addLog(`🔕 Silence detected. Final text: "${finalText}"`);
      setSttResult(finalText);
    },
    silenceTimeoutMs: 3000,
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addLog("🚀 Speech Test Page Loaded");
    addLog(`🎤 STT Supported: ${sttSupported}`);
    addLog(`🔊 TTS Supported: ${ttsSupported}`);
  }, [sttSupported, ttsSupported]);

  useEffect(() => {
    if (voices.length > 0) {
      addLog(`🎵 Loaded ${voices.length} voices`);
      if (selectedVoice) {
        addLog(`✅ Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      }
    }
  }, [voices, selectedVoice]);

  useEffect(() => {
    if (transcript) {
      addLog(`📝 Transcript updated: "${transcript}"`);
    }
  }, [transcript]);

  useEffect(() => {
    if (sttError) {
      addLog(`❌ STT Error: ${sttError}`);
    }
  }, [sttError]);

  const handleTestTTS = async () => {
    try {
      addLog(`🔊 Starting TTS: "${testText}"`);
      await speak(testText);
      addLog("✅ TTS completed successfully");
    } catch (error) {
      addLog(`❌ TTS Error: ${error}`);
    }
  };

  const handleStartSTT = () => {
    addLog("🎤 Starting STT listening...");
    clearTranscript();
    setSttResult("");
    startListening();
  };

  const handleStopSTT = () => {
    addLog("⏹️ Stopping STT listening...");
    stopListening();
    if (transcript) {
      setSttResult(transcript);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog("🧹 Logs cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎤 Speech API Test Page
          </h1>
          <p className="text-slate-300">
            Test Speech-to-Text (STT) and Text-to-Speech (TTS) functionality
          </p>
        </div>

        {/* Support Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div
            className={`p-6 rounded-lg ${
              ttsSupported ? "bg-green-900/30" : "bg-red-900/30"
            } border ${
              ttsSupported ? "border-green-500" : "border-red-500"
            }`}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              🔊 Text-to-Speech
            </h3>
            <p className="text-slate-300">
              Status:{" "}
              <span
                className={`font-bold ${
                  ttsSupported ? "text-green-400" : "text-red-400"
                }`}
              >
                {ttsSupported ? "✅ Supported" : "❌ Not Supported"}
              </span>
            </p>
            {ttsSupported && (
              <>
                <p className="text-slate-300 mt-2">
                  Voices: {voices.length} available
                </p>
                <p className="text-slate-300">
                  Selected: {selectedVoice?.name || "None"}
                </p>
                <p className="text-slate-300">
                  Speaking: {isSpeaking ? "🔊 Yes" : "🔇 No"}
                </p>
              </>
            )}
          </div>

          <div
            className={`p-6 rounded-lg ${
              sttSupported ? "bg-green-900/30" : "bg-red-900/30"
            } border ${
              sttSupported ? "border-green-500" : "border-red-500"
            }`}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              🎤 Speech-to-Text
            </h3>
            <p className="text-slate-300">
              Status:{" "}
              <span
                className={`font-bold ${
                  sttSupported ? "text-green-400" : "text-red-400"
                }`}
              >
                {sttSupported ? "✅ Supported" : "❌ Not Supported"}
              </span>
            </p>
            {sttSupported && (
              <>
                <p className="text-slate-300 mt-2">
                  Listening: {isListening ? "🎤 Active" : "⏸️ Inactive"}
                </p>
                {sttError && (
                  <p className="text-red-400 mt-2">Error: {sttError}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* TTS Test Section */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            🔊 Test Text-to-Speech
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2">
                Text to speak:
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-purple-500"
                rows={3}
                placeholder="Enter text to convert to speech..."
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleTestTTS}
                disabled={!ttsSupported || isSpeaking}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {isSpeaking ? "🔊 Speaking..." : "▶️ Speak Text"}
              </button>
              <button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                ⏹️ Stop
              </button>
            </div>
          </div>
        </div>

        {/* STT Test Section */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            🎤 Test Speech-to-Text
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={handleStartSTT}
                disabled={!sttSupported || isListening}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {isListening ? "🎤 Listening..." : "🎙️ Start Listening"}
              </button>
              <button
                onClick={handleStopSTT}
                disabled={!isListening}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                ⏹️ Stop Listening
              </button>
              <button
                onClick={() => {
                  clearTranscript();
                  setSttResult("");
                }}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
              >
                🧹 Clear
              </button>
            </div>

            {/* Real-time interim transcript */}
            {isListening && interimTranscript && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">
                  Interim (real-time):
                </p>
                <p className="text-yellow-300 italic">{interimTranscript}</p>
              </div>
            )}

            {/* Current transcript */}
            {transcript && (
              <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">
                  Current transcript:
                </p>
                <p className="text-white">{transcript}</p>
              </div>
            )}

            {/* Final result after silence */}
            {sttResult && (
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-500">
                <p className="text-slate-400 text-sm mb-1">
                  ✅ Final result (after silence):
                </p>
                <p className="text-green-300 font-semibold">{sttResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Combined Test */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            🔄 Combined Test (TTS → STT)
          </h2>
          <p className="text-slate-300 mb-4">
            This will speak the text above and then immediately start listening.
            The system should recognize its own speech.
          </p>
          <button
            onClick={async () => {
              addLog("🔄 Starting combined test...");
              clearTranscript();
              setSttResult("");
              try {
                await speak(testText);
                addLog("✅ TTS completed, starting STT...");
                setTimeout(() => {
                  startListening();
                }, 500);
              } catch (error) {
                addLog(`❌ Combined test error: ${error}`);
              }
            }}
            disabled={!sttSupported || !ttsSupported || isListening || isSpeaking}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            🔄 Run Combined Test
          </button>
        </div>

        {/* Logs */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">📋 Activity Logs</h2>
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-slate-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="text-slate-300 py-1 border-b border-slate-800 last:border-0"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Browser Info */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-sm">
            <strong>Browser:</strong> {navigator.userAgent}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            <strong>Note:</strong> For best results, use Chrome or Edge. Safari
            and Firefox have limited Web Speech API support. Make sure to allow
            microphone permissions when prompted.
          </p>
        </div>
      </div>
    </div>
  );
}
