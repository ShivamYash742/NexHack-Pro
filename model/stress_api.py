import cv2
import mediapipe as mp
import numpy as np
import time
import json
import base64
from datetime import datetime
from statistics import mean
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import asyncio
import uvicorn
from groq import Groq
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv('.env.local')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
holistic = mp_holistic.Holistic(refine_face_landmarks=True)

# Eye landmark indices
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [263, 387, 385, 362, 380, 373]

class StressDetector:
    def __init__(self):
        self.blink_counter = 0
        self.start_time = time.time()
        self.prev_left_hand = None
        self.prev_right_hand = None
        self.prev_movement_score = 0.0
        self.data_collection = []
        self.last_save_time = time.time()
        self.save_interval = 5  # seconds (reduced for web)
        
    def reset(self):
        """Reset detector state for new session"""
        self.blink_counter = 0
        self.start_time = time.time()
        self.prev_left_hand = None
        self.prev_right_hand = None
        self.prev_movement_score = 0.0
        self.data_collection = []
        self.last_save_time = time.time()

    def eye_aspect_ratio(self, landmarks, eye_indices):
        p1 = np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y])
        p2 = np.array([landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y])
        p3 = np.array([landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y])
        p4 = np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y])
        p5 = np.array([landmarks[eye_indices[4]].x, landmarks[eye_indices[4]].y])
        p6 = np.array([landmarks[eye_indices[5]].x, landmarks[eye_indices[5]].y])

        vertical = np.linalg.norm(p2 - p6) + np.linalg.norm(p3 - p5)
        horizontal = np.linalg.norm(p1 - p4)
        return vertical / (2.0 * horizontal)

    def mouth_aspect_ratio(self, landmarks):
        top_lip = np.array([landmarks[13].x, landmarks[13].y])
        bottom_lip = np.array([landmarks[14].x, landmarks[14].y])
        left = np.array([landmarks[78].x, landmarks[78].y])
        right = np.array([landmarks[308].x, landmarks[308].y])

        vertical = np.linalg.norm(top_lip - bottom_lip)
        horizontal = np.linalg.norm(left - right)
        return vertical / horizontal

    def eyebrow_distance(self, landmarks):
        left_brow = np.array([landmarks[105].x, landmarks[105].y])
        right_brow = np.array([landmarks[334].x, landmarks[334].y])
        return np.linalg.norm(left_brow - right_brow)

    def get_hand_center(self, hand_landmarks):
        xs = [lm.x for lm in hand_landmarks.landmark]
        ys = [lm.y for lm in hand_landmarks.landmark]
        return np.mean(xs), np.mean(ys)

    def process_frame(self, frame):
        """Process a single frame and return stress metrics"""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(frame_rgb)
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'ear': None,
            'blinks_per_min': None,
            'mar': None,
            'eyebrow_dist': None,
            'shoulder_diff': None,
            'nose_z': None,
            'head_tilt': None,
            'movement_score': 0.0,
            'fidget_index': 0.0,
            'stress_score': 0.0
        }

        # --------------- Facial Metrics ----------------
        if results.face_landmarks:
            lm = results.face_landmarks.landmark

            # Eye openness & blinks
            left_ear = self.eye_aspect_ratio(lm, LEFT_EYE)
            right_ear = self.eye_aspect_ratio(lm, RIGHT_EYE)
            ear = (left_ear + right_ear) / 2.0
            metrics['ear'] = ear

            if ear < 0.22:  # blink threshold
                self.blink_counter += 1

            elapsed = time.time() - self.start_time
            blinks_per_min = self.blink_counter / (elapsed / 60) if elapsed > 0 else 0
            metrics['blinks_per_min'] = blinks_per_min

            # Mouth aspect ratio
            mar = self.mouth_aspect_ratio(lm)
            metrics['mar'] = mar

            # Eyebrow distance
            brow_dist = self.eyebrow_distance(lm)
            metrics['eyebrow_dist'] = brow_dist

        # --------------- Posture Metrics ----------------
        if results.pose_landmarks:
            lm_pose = results.pose_landmarks.landmark
            left_shoulder = lm_pose[mp_holistic.PoseLandmark.LEFT_SHOULDER.value]
            right_shoulder = lm_pose[mp_holistic.PoseLandmark.RIGHT_SHOULDER.value]
            nose = lm_pose[mp_holistic.PoseLandmark.NOSE.value]

            shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
            nose_z = nose.z
            head_tilt = np.degrees(np.arctan2(right_shoulder.y - left_shoulder.y,
                                              right_shoulder.x - left_shoulder.x))

            metrics['shoulder_diff'] = shoulder_diff
            metrics['nose_z'] = nose_z
            metrics['head_tilt'] = head_tilt

        # --------------- Hand Movement ----------------
        movement_score = 0.0
        if results.left_hand_landmarks:
            left_center = self.get_hand_center(results.left_hand_landmarks)
            if self.prev_left_hand is not None:
                movement_score += np.linalg.norm(np.array(left_center) - np.array(self.prev_left_hand))
            self.prev_left_hand = left_center

        if results.right_hand_landmarks:
            right_center = self.get_hand_center(results.right_hand_landmarks)
            if self.prev_right_hand is not None:
                movement_score += np.linalg.norm(np.array(right_center) - np.array(self.prev_right_hand))
            self.prev_right_hand = right_center

        metrics['movement_score'] = movement_score

        # Fidgeting index
        fidget_index = abs(movement_score - self.prev_movement_score)
        self.prev_movement_score = movement_score
        metrics['fidget_index'] = fidget_index

        # --------------- Stress Score ----------------
        # Calculate stress score based on available metrics
        stress_score = 0.0
        if metrics['ear'] is not None:
            stress_score += (1 - metrics['ear']) * 2
        if metrics['blinks_per_min'] is not None:
            stress_score += metrics['blinks_per_min'] * 0.05
        if metrics['head_tilt'] is not None:
            stress_score += abs(metrics['head_tilt']) * 0.01
        stress_score += movement_score * 5
        
        metrics['stress_score'] = stress_score

        # Collect data
        self.data_collection.append(metrics)

        return metrics

    def get_session_summary(self):
        """Get summary of collected data"""
        if not self.data_collection:
            return {}
        
        return {
            'avg_ear': mean([d.get('ear', 0) for d in self.data_collection if d.get('ear') is not None]),
            'avg_blinks_per_min': mean([d.get('blinks_per_min', 0) for d in self.data_collection if d.get('blinks_per_min') is not None]),
            'avg_mar': mean([d.get('mar', 0) for d in self.data_collection if d.get('mar') is not None]),
            'avg_eyebrow_dist': mean([d.get('eyebrow_dist', 0) for d in self.data_collection if d.get('eyebrow_dist') is not None]),
            'avg_shoulder_diff': mean([d.get('shoulder_diff', 0) for d in self.data_collection if d.get('shoulder_diff') is not None]),
            'avg_nose_z': mean([d.get('nose_z', 0) for d in self.data_collection if d.get('nose_z') is not None]),
            'avg_head_tilt': mean([d.get('head_tilt', 0) for d in self.data_collection if d.get('head_tilt') is not None]),
            'avg_movement_score': mean([d.get('movement_score', 0) for d in self.data_collection if d.get('movement_score') is not None]),
            'avg_fidget_index': mean([d.get('fidget_index', 0) for d in self.data_collection if d.get('fidget_index') is not None]),
            'avg_stress_score': mean([d.get('stress_score', 0) for d in self.data_collection if d.get('stress_score') is not None]),
            'total_data_points': len(self.data_collection),
            'session_duration': time.time() - self.start_time
        }

# Global detector instance
detector = StressDetector()

# Store active WebSocket connections
active_connections: List[WebSocket] = []

async def connect_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

def disconnect_websocket(websocket: WebSocket):
    if websocket in active_connections:
        active_connections.remove(websocket)

@app.websocket("/ws/stress-detection")
async def websocket_endpoint(websocket: WebSocket):
    await connect_websocket(websocket)
    detector.reset()  # Reset detector for new session
    
    try:
        while True:
            # Receive frame data from client
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            if frame_data.get('type') == 'frame':
                # Decode base64 image
                image_data = base64.b64decode(frame_data['data'].split(',')[1])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    # Process frame and get metrics
                    metrics = detector.process_frame(frame)
                    
                    # Send metrics back to client
                    await websocket.send_text(json.dumps({
                        'type': 'metrics',
                        'data': metrics
                    }))
            
            elif frame_data.get('type') == 'get_summary':
                # Send session summary
                summary = detector.get_session_summary()
                await websocket.send_text(json.dumps({
                    'type': 'summary',
                    'data': summary
                }))
                
    except WebSocketDisconnect:
        disconnect_websocket(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        disconnect_websocket(websocket)

@app.get("/")
async def root():
    return {"message": "Stress Detection API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "active_connections": len(active_connections)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
