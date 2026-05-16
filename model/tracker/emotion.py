"""
Rule-based 7-class emotion classifier from MediaPipe blendshapes.
Weighted contribution per blendshape → normalized emotion scores.
"""
from typing import Dict, List

# ARKit blendshape → emotion weights (positive contribution)
_WEIGHTS: Dict[str, Dict[str, float]] = {
    "happy": {
        "mouthSmileLeft": 1.2,
        "mouthSmileRight": 1.2,
        "cheekSquintLeft": 0.6,
        "cheekSquintRight": 0.6,
        "mouthDimpleLeft": 0.4,
        "mouthDimpleRight": 0.4,
    },
    "sad": {
        "mouthFrownLeft": 1.0,
        "mouthFrownRight": 1.0,
        "browInnerUp": 0.7,
        "mouthStretchLeft": 0.4,
        "mouthStretchRight": 0.4,
        "mouthShrugLower": 0.3,
    },
    "angry": {
        "browDownLeft": 1.2,
        "browDownRight": 1.2,
        "noseSneerLeft": 0.8,
        "noseSneerRight": 0.8,
        "mouthPressLeft": 0.5,
        "mouthPressRight": 0.5,
        "eyeSquintLeft": 0.4,
        "eyeSquintRight": 0.4,
    },
    "surprised": {
        "jawOpen": 1.2,
        "eyeWideLeft": 1.0,
        "eyeWideRight": 1.0,
        "browOuterUpLeft": 0.8,
        "browOuterUpRight": 0.8,
        "mouthFunnel": 0.3,
    },
    "fear": {
        "browInnerUp": 0.9,
        "eyeWideLeft": 0.9,
        "eyeWideRight": 0.9,
        "mouthStretchLeft": 0.7,
        "mouthStretchRight": 0.7,
        "mouthShrugUpper": 0.4,
    },
    "disgust": {
        "noseSneerLeft": 1.2,
        "noseSneerRight": 1.2,
        "mouthLowerDownLeft": 0.5,
        "mouthLowerDownRight": 0.5,
        "mouthUpperUpLeft": 0.4,
        "mouthUpperUpRight": 0.4,
        "mouthPucker": 0.3,
    },
}

_WEIGHT_SUMS = {emotion: sum(w.values()) for emotion, w in _WEIGHTS.items()}

EMOTIONS = ["happy", "sad", "angry", "surprised", "fear", "disgust", "neutral"]


def blendshapes_to_dict(blendshape_list) -> Dict[str, float]:
    """Convert MediaPipe blendshape result list to {name: score} dict."""
    return {bs.category_name: float(bs.score) for bs in blendshape_list}


def classify_emotions(blendshape_list) -> Dict[str, float]:
    """
    Returns normalized probability dict over 7 emotions.
    Each raw score = weighted sum of relevant blendshapes / sum_of_weights.
    Neutral = residual after sigmoid-like compression.
    """
    bs = blendshapes_to_dict(blendshape_list)

    raw: Dict[str, float] = {}
    for emotion, weights in _WEIGHTS.items():
        score = sum(bs.get(name, 0.0) * w for name, w in weights.items())
        raw[emotion] = score / _WEIGHT_SUMS[emotion]

    # Boost separation: square root amplifies weak signals
    import math
    boosted = {e: math.sqrt(max(0.0, v)) for e, v in raw.items()}

    total_non_neutral = sum(boosted.values())

    if total_non_neutral < 0.4:
        # All emotions weak → mostly neutral
        neutral = 1.0 - total_non_neutral * 0.8
    else:
        neutral = max(0.0, 1.0 - total_non_neutral)

    boosted["neutral"] = neutral
    grand_total = sum(boosted.values()) + 1e-9

    result = {e: round(boosted.get(e, 0.0) / grand_total, 4) for e in EMOTIONS}

    return result


def dominant_emotion(scores: Dict[str, float]) -> str:
    return max(scores, key=scores.__getitem__)
