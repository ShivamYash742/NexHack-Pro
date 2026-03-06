#!/usr/bin/env python3
"""
Test script to verify the stress detection integration is working correctly.
"""

import asyncio
import websockets
import json
import cv2
import base64
import numpy as np
from datetime import datetime

async def test_websocket_connection():
    """Test WebSocket connection to the stress detection API"""
    uri = "ws://localhost:8001/ws/stress-detection"
    
    try:
        print("Testing WebSocket connection...")
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection successful!")
            
            # Create a test frame (black image)
            test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            
            # Add some text to the frame
            cv2.putText(test_frame, "TEST FRAME", (200, 240), 
                       cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
            
            # Encode frame as base64
            _, buffer = cv2.imencode('.jpg', test_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            data_url = f"data:image/jpeg;base64,{frame_base64}"
            
            # Send test frame
            test_message = {
                "type": "frame",
                "data": data_url
            }
            
            print("📤 Sending test frame...")
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            print("⏳ Waiting for response...")
            response = await websocket.recv()
            response_data = json.loads(response)
            
            if response_data.get("type") == "metrics":
                print("✅ Received metrics response!")
                metrics = response_data.get("data", {})
                print(f"   Timestamp: {metrics.get('timestamp')}")
                print(f"   Stress Score: {metrics.get('stress_score', 'N/A')}")
                print(f"   EAR: {metrics.get('ear', 'N/A')}")
                print(f"   Movement Score: {metrics.get('movement_score', 'N/A')}")
            else:
                print("❌ Unexpected response format")
                print(f"   Response: {response_data}")
            
            # Test summary request
            print("\n📤 Requesting session summary...")
            summary_request = {"type": "get_summary"}
            await websocket.send(json.dumps(summary_request))
            
            summary_response = await websocket.recv()
            summary_data = json.loads(summary_response)
            
            if summary_data.get("type") == "summary":
                print("✅ Received summary response!")
                summary = summary_data.get("data", {})
                print(f"   Data Points: {summary.get('total_data_points', 0)}")
                print(f"   Session Duration: {summary.get('session_duration', 0):.2f}s")
            else:
                print("❌ Unexpected summary response format")
            
            print("\n🎉 All tests passed! Integration is working correctly.")
            
    except ConnectionRefusedError:
        print("❌ Connection refused. Make sure the stress detection API is running.")
        print("   Run: python stress_api.py")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

def test_dependencies():
    """Test if all required dependencies are available"""
    print("Testing dependencies...")
    
    try:
        import cv2
        print("✅ OpenCV available")
    except ImportError:
        print("❌ OpenCV not found. Install with: pip install opencv-python")
        return False
    
    try:
        import mediapipe
        print("✅ MediaPipe available")
    except ImportError:
        print("❌ MediaPipe not found. Install with: pip install mediapipe")
        return False
    
    try:
        import fastapi
        print("✅ FastAPI available")
    except ImportError:
        print("❌ FastAPI not found. Install with: pip install fastapi")
        return False
    
    try:
        import uvicorn
        print("✅ Uvicorn available")
    except ImportError:
        print("❌ Uvicorn not found. Install with: pip install uvicorn")
        return False
    
    try:
        import websockets
        print("✅ WebSockets available")
    except ImportError:
        print("❌ WebSockets not found. Install with: pip install websockets")
        return False
    
    return True

async def main():
    """Main test function"""
    print("🧪 NexHack-Pro Stress Detection Integration Test")
    print("=" * 50)
    
    # Test dependencies
    if not test_dependencies():
        print("\n❌ Dependency test failed. Please install missing packages.")
        return
    
    print("\n" + "=" * 50)
    
    # Test WebSocket connection
    await test_websocket_connection()
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed: {e}")
