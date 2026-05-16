"""Head pose (yaw/pitch/roll) and body posture from MediaPipe landmarks."""
import numpy as np
from typing import Dict


def decompose_head_pose(matrix_flat) -> Dict:
    """
    Extract yaw, pitch, roll in degrees from 4×4 facial transformation matrix.
    Matrix is row-major from MediaPipe (16 floats).
    """
    try:
        M = np.array(matrix_flat, dtype=float).reshape(4, 4)
        R = M[:3, :3]

        # XYZ Euler decomposition
        pitch = float(np.degrees(np.arctan2(-R[2, 1], R[2, 2])))
        yaw   = float(np.degrees(np.arcsin(np.clip(R[2, 0], -1.0, 1.0))))
        roll  = float(np.degrees(np.arctan2(-R[1, 0], R[0, 0])))

        return {
            "yaw":   round(yaw, 2),
            "pitch": round(pitch, 2),
            "roll":  round(roll, 2),
        }
    except Exception:
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}


def compute_posture(pose_landmarks) -> Dict:
    """
    Shoulder tilt + lean from pose landmarks.
    Pose landmark indices: 0=nose, 11=left shoulder, 12=right shoulder.
    """
    try:
        lms = pose_landmarks[0]
        ls = lms[11]  # left shoulder
        rs = lms[12]  # right shoulder
        nose = lms[0]

        shoulder_tilt = round(abs(ls.y - rs.y) * 100, 2)

        mid_x = (ls.x + rs.x) / 2
        dx = nose.x - mid_x

        if abs(dx) < 0.05:
            lean = "upright"
        elif dx < 0:
            lean = "left"
        else:
            lean = "right"

        return {"shoulder_tilt": shoulder_tilt, "lean": lean}
    except Exception:
        return {"shoulder_tilt": 0.0, "lean": "unknown"}
