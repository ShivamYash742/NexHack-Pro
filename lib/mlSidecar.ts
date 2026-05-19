// ML sidecar types — used by frontend components.
// The face tracking now runs CLIENT-SIDE via @mediapipe/tasks-vision.
// The external Python sidecar server is no longer needed.

// Keep for backward compatibility — no longer imported by useFaceTracker.
// @deprecated Face tracking now runs directly in the browser.
export const ML_BASE_URL = '';
/** @deprecated Face tracking now runs directly in the browser. */
export const ML_WS_BASE = '';

export interface FaceEmotions {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fear: number;
  disgust: number;
  neutral: number;
}

export interface HeadPoseResult {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface GazeResult {
  x: number;
  y: number;
  looking_at_screen: boolean;
}

export interface EyeResult {
  ear: number;
  blink_count: number;
  blinks_per_min: number;
}

export interface HandResult {
  movement: number;
  fidget_level: string;
}

export interface PostureResult {
  shoulder_tilt: number;
  lean: string;
}

export interface FaceResult {
  ts: number;
  face_detected: boolean;
  emotions: FaceEmotions;
  dominant: string;
  head_pose: HeadPoseResult;
  gaze: GazeResult;
  eye: EyeResult;
  hands: HandResult;
  posture: PostureResult;
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
