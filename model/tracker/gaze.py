"""Iris-based gaze tracking using MediaPipe face landmarks 468-477."""
from typing import Dict

# Iris centers (indices in 478-point mesh)
_IRIS_LEFT = 468
_IRIS_RIGHT = 473

# Eye corners
_LEFT_OUTER = 33
_LEFT_INNER = 133
_RIGHT_INNER = 362
_RIGHT_OUTER = 263

# Vertical eye edge midpoints for Y calibration
_LEFT_TOP = 159
_LEFT_BOT = 145
_RIGHT_TOP = 386
_RIGHT_BOT = 374


def _iris_offset(iris, outer, inner, top, bot):
    span_x = abs(outer.x - inner.x) + 1e-6
    span_y = abs(top.y - bot.y) + 1e-6
    cx = (outer.x + inner.x) / 2
    cy = (top.y + bot.y) / 2
    ox = (iris.x - cx) / span_x
    oy = (iris.y - cy) / span_y
    return ox, oy


def compute_gaze(landmarks) -> Dict:
    """
    Returns gaze dict: {x, y, looking_at_screen}.
    x/y are normalized offsets: 0 = center, ±1 = full edge.
    """
    try:
        iris_l = landmarks[_IRIS_LEFT]
        iris_r = landmarks[_IRIS_RIGHT]

        lx, ly = _iris_offset(
            iris_l,
            landmarks[_LEFT_OUTER], landmarks[_LEFT_INNER],
            landmarks[_LEFT_TOP], landmarks[_LEFT_BOT],
        )
        rx, ry = _iris_offset(
            iris_r,
            landmarks[_RIGHT_OUTER], landmarks[_RIGHT_INNER],
            landmarks[_RIGHT_TOP], landmarks[_RIGHT_BOT],
        )

        gaze_x = round((lx + rx) / 2, 4)
        gaze_y = round((ly + ry) / 2, 4)
        on_screen = abs(gaze_x) < 0.18 and abs(gaze_y) < 0.18

        return {"x": gaze_x, "y": gaze_y, "looking_at_screen": on_screen}
    except Exception:
        return {"x": 0.0, "y": 0.0, "looking_at_screen": True}
