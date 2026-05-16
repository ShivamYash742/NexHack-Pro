"""Canonical output schema for a single processed frame."""
from dataclasses import dataclass, field, asdict
from typing import Dict


@dataclass
class FrameResult:
    ts: float = 0.0
    face_detected: bool = False

    # 7-class emotion probability distribution
    emotions: Dict[str, float] = field(default_factory=lambda: {
        "happy": 0.0, "sad": 0.0, "angry": 0.0,
        "surprised": 0.0, "fear": 0.0, "disgust": 0.0, "neutral": 1.0,
    })
    dominant: str = "neutral"

    # Head orientation in degrees
    head_pose: Dict[str, float] = field(default_factory=lambda: {"yaw": 0.0, "pitch": 0.0, "roll": 0.0})

    # Iris gaze offset
    gaze: Dict = field(default_factory=lambda: {"x": 0.0, "y": 0.0, "looking_at_screen": True})

    # Eye / blink stats
    eye: Dict = field(default_factory=lambda: {"ear": 0.3, "blink_count": 0, "blinks_per_min": 0.0})

    # Hand movement
    hands: Dict = field(default_factory=lambda: {"movement": 0.0, "fidget_level": "still"})

    # Body posture
    posture: Dict = field(default_factory=lambda: {"shoulder_tilt": 0.0, "lean": "upright"})

    # Meta-signals (all 0–1, stress 0–10)
    stress_score: float = 0.0
    engagement: float = 1.0
    confidence: float = 1.0
    attention: float = 1.0

    def to_dict(self) -> dict:
        return asdict(self)
