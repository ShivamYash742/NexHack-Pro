import cv2
import numpy as np
import time
import os
import urllib.request
from collections import deque
import mediapipe as mp

# ============================================================
# MediaPipe Tasks API (for mediapipe >= 0.10.14)
# ============================================================
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# ============================================================
# Download model files if not present
# ============================================================
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODELS = {
    "face_landmarker.task": "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    "hand_landmarker.task": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    "pose_landmarker_lite.task": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
}

for name, url in MODELS.items():
    path = os.path.join(MODEL_DIR, name)
    if not os.path.exists(path):
        print(f"Downloading {name}...")
        urllib.request.urlretrieve(url, path)
        print(f"Downloaded {name}")

# ============================================================
# Drawing connections (for manual landmark rendering)
# ============================================================
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (0, 17), (17, 18), (18, 19), (19, 20),
]

POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10), (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21),
    (17, 19), (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28),
    (27, 29), (28, 30), (29, 31), (30, 32),
]

# ============================================================
# Settings
# ============================================================
EYE_THRESHOLD = 0.22
CALIBRATION_FRAMES = 80
SMOOTHING = 5

# ============================================================
# State variables
# ============================================================
blink_counter = 0
start_time = time.time()
EYE_CLOSED = False

prev_left_hand = None
prev_right_hand = None

baseline_ear = None
baseline_movement = None
frame_count = 0

movement_history = deque(maxlen=SMOOTHING)
ear_history = deque(maxlen=SMOOTHING)

# ============================================================
# Helper functions
# ============================================================
def safe_distance(a, b):
    return np.linalg.norm(np.array(a) - np.array(b)) + 1e-6


# Eye landmark indices (same as the 478 face mesh model)
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [263, 387, 385, 362, 380, 373]


def eye_aspect_ratio(landmarks, eye_indices):
    """Calculate eye aspect ratio from face landmarks list."""
    try:
        p1 = [landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y]
        p2 = [landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y]
        p3 = [landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y]
        p4 = [landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y]
        p5 = [landmarks[eye_indices[4]].x, landmarks[eye_indices[4]].y]
        p6 = [landmarks[eye_indices[5]].x, landmarks[eye_indices[5]].y]

        vertical = safe_distance(p2, p6) + safe_distance(p3, p5)
        horizontal = safe_distance(p1, p4)
        return vertical / (2.0 * horizontal)
    except Exception:
        return 0.3


def get_hand_center(landmarks):
    """Get the centroid of hand landmarks."""
    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    return np.mean(xs), np.mean(ys)


def draw_landmarks_on_frame(frame, landmarks, connections=None,
                             color=(0, 255, 0), thickness=1, circle_radius=1):
    """Draw landmarks and optional connections on a frame."""
    h, w = frame.shape[:2]
    points = []
    for lm in landmarks:
        x, y = int(lm.x * w), int(lm.y * h)
        points.append((x, y))
        cv2.circle(frame, (x, y), circle_radius, color, -1)
    if connections:
        for start_idx, end_idx in connections:
            if start_idx < len(points) and end_idx < len(points):
                cv2.line(frame, points[start_idx], points[end_idx], color, thickness)


# ============================================================
# Create MediaPipe landmarker instances (VIDEO mode)
# ============================================================
face_options = FaceLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=os.path.join(MODEL_DIR, "face_landmarker.task")
    ),
    running_mode=VisionRunningMode.VIDEO,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
face_landmarker = FaceLandmarker.create_from_options(face_options)

hand_options = HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=os.path.join(MODEL_DIR, "hand_landmarker.task")
    ),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
hand_landmarker = HandLandmarker.create_from_options(hand_options)

pose_options = PoseLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=os.path.join(MODEL_DIR, "pose_landmarker_lite.task")
    ),
    running_mode=VisionRunningMode.VIDEO,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
pose_landmarker = PoseLandmarker.create_from_options(pose_options)

# ============================================================
# Camera setup
# ============================================================
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

timestamp_ms = 0

print("Starting Interview Stress Tracker...")
print("Press ESC to quit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Create MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    timestamp_ms += 33  # ~30 fps

    # Run all three detectors
    face_result = face_landmarker.detect_for_video(mp_image, timestamp_ms)
    hand_result = hand_landmarker.detect_for_video(mp_image, timestamp_ms)
    pose_result = pose_landmarker.detect_for_video(mp_image, timestamp_ms)

    # ---- Draw landmarks ----
    if face_result.face_landmarks:
        draw_landmarks_on_frame(frame, face_result.face_landmarks[0],
                                 color=(0, 255, 0), circle_radius=1)

    for hand_lms in hand_result.hand_landmarks:
        draw_landmarks_on_frame(frame, hand_lms, HAND_CONNECTIONS,
                                 color=(255, 0, 0), thickness=2, circle_radius=2)

    if pose_result.pose_landmarks:
        draw_landmarks_on_frame(frame, pose_result.pose_landmarks[0],
                                 POSE_CONNECTIONS, color=(0, 255, 255),
                                 thickness=2, circle_radius=3)

    # ============================================================
    # Face metrics (EAR + blink detection)
    # ============================================================
    ear = 0.3
    if face_result.face_landmarks:
        lm = face_result.face_landmarks[0]

        left_ear_val = eye_aspect_ratio(lm, LEFT_EYE)
        right_ear_val = eye_aspect_ratio(lm, RIGHT_EYE)
        ear = (left_ear_val + right_ear_val) / 2.0

        ear_history.append(ear)
        ear = np.mean(ear_history)

        # Proper blink detection (count on eye re-open)
        if ear < EYE_THRESHOLD and not EYE_CLOSED:
            EYE_CLOSED = True
        elif ear >= EYE_THRESHOLD and EYE_CLOSED:
            blink_counter += 1
            EYE_CLOSED = False

    # ============================================================
    # Hand movement tracking
    # ============================================================
    movement_score = 0.0

    if hand_result.hand_landmarks:
        for i, hand_lm in enumerate(hand_result.hand_landmarks):
            center = get_hand_center(hand_lm)
            if i == 0:  # first detected hand
                if prev_left_hand is not None:
                    movement_score += safe_distance(center, prev_left_hand)
                prev_left_hand = center
            elif i == 1:  # second detected hand
                if prev_right_hand is not None:
                    movement_score += safe_distance(center, prev_right_hand)
                prev_right_hand = center

    movement_history.append(movement_score)
    movement_score = np.mean(movement_history)

    # ============================================================
    # Calibration phase
    # ============================================================
    frame_count += 1

    if frame_count < CALIBRATION_FRAMES:
        if baseline_ear is None:
            baseline_ear = ear
        else:
            baseline_ear = 0.9 * baseline_ear + 0.1 * ear

        if baseline_movement is None:
            baseline_movement = movement_score
        else:
            baseline_movement = 0.9 * baseline_movement + 0.1 * movement_score

        cv2.putText(frame, "Calibrating... Sit naturally", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        cv2.imshow("Interview Stress Tracker", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break
        continue

    # ============================================================
    # Compute stress metrics
    # ============================================================
    elapsed = time.time() - start_time
    blinks_per_min = blink_counter / (elapsed / 60 + 1e-6)

    ear_drop = max(0, baseline_ear - ear)
    movement_change = max(0, movement_score - baseline_movement)

    # Normalized stress score
    stress_score = (
        ear_drop * 8 +
        min(blinks_per_min, 40) * 0.03 +
        min(movement_change, 0.02) * 200
    )

    # ============================================================
    # Display on frame
    # ============================================================
    cv2.putText(frame, f"EAR: {ear:.3f}", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.putText(frame, f"Blinks/min: {blinks_per_min:.1f}", (20, 95),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.putText(frame, f"Movement: {movement_score:.4f}", (20, 130),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

    cv2.putText(frame, f"Stress Score: {stress_score:.2f}", (20, 170),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    # Stress state label
    state = "RELAXED"
    if stress_score > 4:
        state = "SLIGHTLY NERVOUS"
    if stress_score > 7:
        state = "STRESSED"

    cv2.putText(frame, f"STATE: {state}", (20, 210),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

    cv2.imshow("Interview Stress Tracker", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

# ============================================================
# Cleanup
# ============================================================
face_landmarker.close()
hand_landmarker.close()
pose_landmarker.close()
cap.release()
cv2.destroyAllWindows()
