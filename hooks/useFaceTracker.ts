'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ML_WS_BASE, FaceResult, FaceSummary } from '@/lib/mlSidecar';

const FRAME_INTERVAL_MS = 250; // 4 fps — sufficient for expression analysis
const JPEG_QUALITY = 0.55;
const CANVAS_W = 320;
const CANVAS_H = 240;

export function useFaceTracker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  sessionId: string | null,
  enabled: boolean = true,
) {
  const [lastFrame, setLastFrame] = useState<FaceResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSidecarAvailable, setIsSidecarAvailable] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const summaryResolvers = useRef<Array<(s: FaceSummary) => void>>([]);

  // Lazily create off-screen canvas (SSR safe)
  const getCanvas = useCallback((): HTMLCanvasElement => {
    if (!canvasRef.current) {
      const c = document.createElement('canvas');
      c.width = CANVAS_W;
      c.height = CANVAS_H;
      canvasRef.current = c;
    }
    return canvasRef.current;
  }, []);

  const sendFrame = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const video = videoRef.current;
    if (!video || !video.srcObject || video.paused || video.videoWidth === 0) return;

    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1];

    ws.send(JSON.stringify({ frame: base64, ts: Date.now() / 1000 }));
  }, [videoRef, getCanvas]);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${ML_WS_BASE}/ws/${encodeURIComponent(sessionId)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsSidecarAvailable(true);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as Record<string, unknown>;

        if (data.cmd === 'summary') {
          const resolvers = summaryResolvers.current;
          summaryResolvers.current = [];
          resolvers.forEach((resolve) => resolve(data.data as FaceSummary));
          return;
        }
        if (data.error) return;

        setLastFrame(data as unknown as FaceResult);
      } catch {
        // malformed JSON — ignore
      }
    };

    ws.onclose = () => setIsConnected(false);

    ws.onerror = () => {
      setIsConnected(false);
      setIsSidecarAvailable(false); // sidecar not reachable
    };
  }, [sessionId, enabled]);

  // Start/stop capture interval based on connection status
  useEffect(() => {
    if (isConnected) {
      intervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, sendFrame]);

  // Connect/disconnect lifecycle
  useEffect(() => {
    if (sessionId && enabled) connect();
    return () => {
      wsRef.current?.close();
    };
  }, [sessionId, enabled, connect]);

  const requestSummary = useCallback((): Promise<FaceSummary | null> => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.resolve(null);

    return new Promise<FaceSummary>((resolve) => {
      summaryResolvers.current.push(resolve);
      ws.send(JSON.stringify({ cmd: 'summary' }));
    });
  }, []);

  const resetSession = useCallback(() => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ cmd: 'reset' }));
  }, []);

  return { lastFrame, isConnected, isSidecarAvailable, requestSummary, resetSession };
}
