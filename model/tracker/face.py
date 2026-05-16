"""MediaPipe FaceLandmarker wrapper with blendshapes + head pose enabled."""
import mediapipe as mp

BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [263, 387, 385, 362, 380, 373]

import numpy as np


def _safe_dist(a, b) -> float:
    return float(np.linalg.norm(np.array(a) - np.array(b))) + 1e-6


def eye_aspect_ratio(landmarks, eye_indices) -> float:
    try:
        pts = [[landmarks[i].x, landmarks[i].y] for i in eye_indices]
        vertical = _safe_dist(pts[1], pts[5]) + _safe_dist(pts[2], pts[4])
        horizontal = _safe_dist(pts[0], pts[3])
        return vertical / (2.0 * horizontal)
    except Exception:
        return 0.3


class FaceTracker:
    def __init__(self, model_path: str):
        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=VisionRunningMode.VIDEO,
            num_faces=1,
            min_face_detection_confidence=0.6,
            min_face_presence_confidence=0.6,
            min_tracking_confidence=0.6,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
        )
        self._lm = FaceLandmarker.create_from_options(options)

    def detect(self, mp_image, timestamp_ms: int):
        return self._lm.detect_for_video(mp_image, timestamp_ms)

    def close(self):
        self._lm.close()
