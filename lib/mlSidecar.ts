// ML sidecar config + shared types for browser ↔ Python WS bridge

export const ML_BASE_URL = (
  process.env.NEXT_PUBLIC_ML_SIDECAR_URL ?? 'http://localhost:8001'
).replace(/\/$/, '');

export const ML_WS_BASE = ML_BASE_URL.replace(/^http/, 'ws');

export interface FaceEmotions {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fear: number;
  disgust: number;
  neutral: number;
}

export interface FaceResult {
  ts: number;
  face_detected: boolean;
  emotions: FaceEmotions;
  dominant: string;
  head_pose: { yaw: number; pitch: number; roll: number };
  gaze: { x: number; y: number; looking_at_screen: boolean };
  eye: { ear: number; blink_count: number; blinks_per_min: number };
  hands: { movement: number; fidget_level: string };
  posture: { shoulder_tilt: number; lean: string };
  stress_score: number;
  engagement: number;
  confidence: number;
  attention: number;
}

export interface FaceSummary {
  session_id: string | null;
  duration_s: number;
  frame_count: number;
  emotions_avg: FaceEmotions;
  dominant_histogram: Record<string, number>;
  stress_avg: number;
  stress_peak: number;
  engagement_avg: number;
  confidence_avg: number;
  attention_avg: number;
  attention_on_screen_frac: number;
  total_blinks: number;
  blinks_per_min_avg: number;
}
