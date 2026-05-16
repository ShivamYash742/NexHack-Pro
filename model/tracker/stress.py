"""Compute stress, engagement, confidence, and attention meta-signals."""
from typing import Dict, Tuple


def compute_meta_signals(
    ear: float,
    blinks_per_min: float,
    hand_movement: float,
    baseline_ear: float,
    baseline_movement: float,
    emotions: Dict[str, float],
    gaze: Dict,
    head_pose: Dict,
) -> Tuple[float, float, float, float]:
    """
    Returns: (stress_score, engagement, confidence, attention)
    All values in [0, 1] except stress_score which is [0, 10].
    """
    ear_drop = max(0.0, baseline_ear - ear)
    movement_excess = max(0.0, hand_movement - baseline_movement)

    # --- Stress (0–10) ---
    stress = (
        ear_drop * 8.0 +
        min(blinks_per_min, 40.0) * 0.03 +
        min(movement_excess, 0.02) * 200.0 +
        emotions.get("fear", 0.0) * 3.0 +
        emotions.get("angry", 0.0) * 2.5 +
        emotions.get("disgust", 0.0) * 1.5 +
        emotions.get("sad", 0.0) * 1.0
    )
    stress = round(min(stress, 10.0), 3)

    # --- Head distraction: penalise large yaw/pitch ---
    yaw = abs(head_pose.get("yaw", 0.0))
    pitch = abs(head_pose.get("pitch", 0.0))
    head_distract = min(1.0, (yaw / 35.0 + pitch / 25.0) / 2.0)

    # --- Engagement [0, 1] ---
    on_screen = gaze.get("looking_at_screen", True)
    base_engage = 1.0
    if not on_screen:
        base_engage -= 0.35
    if emotions.get("neutral", 0.0) > 0.85:
        base_engage -= 0.15
    base_engage -= head_distract * 0.2
    base_engage += emotions.get("happy", 0.0) * 0.1
    engagement = round(max(0.0, min(1.0, base_engage)), 3)

    # --- Confidence [0, 1] ---
    confidence = round(max(0.0, min(1.0,
        1.0 - stress / 12.0
        + emotions.get("happy", 0.0) * 0.2
        - emotions.get("fear", 0.0) * 0.2
        - head_distract * 0.1
    )), 3)

    # --- Attention [0, 1] ---
    attention = round(max(0.0, min(1.0,
        (engagement + (1.0 if on_screen else 0.0)) / 2.0
        - head_distract * 0.15
    )), 3)

    return stress, engagement, confidence, attention
