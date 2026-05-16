"""Hand movement and fidget tracking."""
import numpy as np
from typing import Optional, Tuple, Dict
from .smoothing import WindowSmooth


def _centroid(landmarks) -> Tuple[float, float]:
    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    return float(np.mean(xs)), float(np.mean(ys))


def _dist(a: Optional[Tuple], b: Tuple) -> float:
    if a is None:
        return 0.0
    return float(np.linalg.norm(np.array(a) - np.array(b))) + 1e-6


class HandTracker:
    def __init__(self, smooth_window: int = 8):
        self._prev = [None, None]  # prev centroid per hand slot
        self._smoother = WindowSmooth(maxlen=smooth_window)

    def update(self, hand_landmarks_list) -> Dict:
        raw_movement = 0.0

        if hand_landmarks_list:
            for i, lms in enumerate(hand_landmarks_list[:2]):
                center = _centroid(lms)
                raw_movement += _dist(self._prev[i], center)
                self._prev[i] = center
            # Reset slots for absent hands
            for i in range(len(hand_landmarks_list), 2):
                self._prev[i] = None
        else:
            self._prev = [None, None]

        smoothed = self._smoother.update(raw_movement)
        fidget = _fidget_level(smoothed)

        return {
            "movement": round(smoothed, 5),
            "fidget_level": fidget,
        }

    def reset(self):
        self._prev = [None, None]
        self._smoother.reset()


def _fidget_level(movement: float) -> str:
    if movement < 0.003:
        return "still"
    if movement < 0.008:
        return "low"
    if movement < 0.018:
        return "medium"
    return "high"
