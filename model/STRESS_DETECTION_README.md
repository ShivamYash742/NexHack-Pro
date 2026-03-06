# Stress Detection Integration for NexHack-Pro

This module integrates real-time stress detection into the interview system, replacing the traditional camera-only approach with AI-powered behavioral analysis.

## Overview

The stress detection system analyzes facial expressions, body posture, and movement patterns in real-time during interviews to provide insights into candidate stress levels and behavior.

## Features

- **Real-time Analysis**: Processes video frames in real-time during interviews
- **Multiple Metrics**: Tracks eye movement, facial expressions, posture, and hand movements
- **WebSocket Communication**: Live data streaming between Python backend and React frontend
- **Visual Dashboard**: Real-time stress metrics display in the interview interface
- **Session Summaries**: Comprehensive analysis reports after interview completion

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   React App     │ ←──────────────→ │   FastAPI Server │
│   (Frontend)    │                 │   (Python)       │
└─────────────────┘                 └──────────────────┘
         │                                    │
         │                                    │
    ┌────▼────┐                          ┌────▼────┐
    │ Camera  │                          │MediaPipe│
    │ Stream  │                          │ + CV2   │
    └─────────┘                          └─────────┘
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd model
pip install -r requirements.txt
```

### 2. Start the Stress Detection API

**Option A: Using Python script**
```bash
python start_stress_api.py --install
```

**Option B: Using batch file (Windows)**
```bash
start_stress_api.bat
```

**Option C: Direct FastAPI**
```bash
python stress_api.py
```

### 3. Start the Next.js Application

```bash
npm run dev
```

The stress detection API will be available at `http://localhost:8001` and the WebSocket at `ws://localhost:8001/ws/stress-detection`.

## How It Works

### 1. Video Frame Capture
- The React frontend captures video frames from the user's camera
- Frames are converted to base64 and sent via WebSocket to the Python backend

### 2. AI Analysis
The Python backend uses MediaPipe and OpenCV to analyze:

- **Eye Metrics**:
  - Eye Aspect Ratio (EAR) - measures alertness
  - Blink frequency - indicates stress levels
  
- **Facial Expressions**:
  - Mouth Aspect Ratio (MAR) - speech patterns
  - Eyebrow distance - emotional state
  
- **Posture Analysis**:
  - Head tilt angle - confidence indicators
  - Shoulder alignment - stress posture
  
- **Movement Tracking**:
  - Hand movement patterns - fidgeting detection
  - Overall body movement - restlessness indicators

### 3. Real-time Feedback
- Processed metrics are sent back to the frontend via WebSocket
- The UI displays live stress indicators and behavioral insights
- Data is stored for post-interview analysis

## Metrics Explained

### Stress Score
A composite score (0-10) calculated from:
- Eye openness and blink patterns (40%)
- Facial tension and expressions (30%)
- Posture and head position (20%)
- Hand and body movement (10%)

### Individual Metrics

| Metric | Range | Interpretation |
|--------|-------|----------------|
| EAR (Eye Aspect Ratio) | 0.0-1.0 | Higher = more alert |
| Blinks/min | 0-60 | 10-30 normal, >30 stressed |
| Head Tilt | -45° to +45° | Closer to 0° = better posture |
| Movement Score | 0.0-1.0 | Higher = more fidgeting |
| Fidget Index | 0.0-1.0 | Sudden movement changes |

## API Endpoints

### WebSocket: `/ws/stress-detection`

**Send frame for analysis:**
```json
{
  "type": "frame",
  "data": "data:image/jpeg;base64,..."
}
```

**Receive metrics:**
```json
{
  "type": "metrics",
  "data": {
    "timestamp": "2024-01-01T12:00:00",
    "ear": 0.25,
    "blinks_per_min": 18.5,
    "stress_score": 2.3,
    ...
  }
}
```

**Request session summary:**
```json
{
  "type": "get_summary"
}
```

### HTTP Endpoints

- `GET /` - Health check
- `GET /health` - Server status and active connections

## Integration Points

### Frontend Components

1. **useStressDetection Hook** (`components/logic/useStressDetection.ts`)
   - Manages WebSocket connection
   - Handles frame capture and transmission
   - Processes incoming metrics

2. **StressMetricsDisplay Component** (`components/stress-metrics.tsx`)
   - Real-time metrics visualization
   - Stress level indicators
   - Historical data display

3. **Interview Component** (`components/interview.tsx`)
   - Integrated stress detection panel
   - Three-column layout: Interviewer | User | Stress Metrics

### Backend Services

1. **FastAPI Server** (`stress_api.py`)
   - WebSocket handler for real-time communication
   - MediaPipe integration for computer vision
   - Metrics calculation and aggregation

2. **StressDetector Class**
   - Frame processing pipeline
   - Metric calculation algorithms
   - Session data management

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the Python API is running on port 8001
   - Check firewall settings
   - Verify CORS configuration

2. **Camera Access Denied**
   - Grant camera permissions in browser
   - Check if camera is being used by another application
   - Try refreshing the page

3. **High CPU Usage**
   - Reduce frame processing rate in `useStressDetection.ts`
   - Lower video resolution
   - Check MediaPipe model complexity

4. **Inaccurate Metrics**
   - Ensure good lighting conditions
   - Position camera at eye level
   - Avoid background movement

### Performance Optimization

- Frame processing rate: 5 FPS (adjustable)
- Video resolution: 640x480 (recommended)
- WebSocket message size: ~50KB per frame
- Memory usage: ~200MB for Python process

## Environment Variables

Create a `.env.local` file in the model directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Future Enhancements

- [ ] Voice stress analysis integration
- [ ] Machine learning model for personalized baselines
- [ ] Advanced emotion recognition
- [ ] Multi-person interview support
- [ ] Cloud deployment options
- [ ] Mobile device compatibility

## Support

For issues or questions:
1. Check the console logs in both browser and Python terminal
2. Verify all dependencies are installed correctly
3. Ensure camera permissions are granted
4. Test with different browsers if needed

## License

This stress detection module is part of the NexHack-Pro interview system.
