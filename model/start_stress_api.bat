@echo off
echo Starting NexHack-Pro Stress Detection API...
echo.
echo This will start the Python FastAPI server for real-time stress detection.
echo Make sure you have Python installed and the required packages.
echo.
echo Server will be available at: http://localhost:8001
echo WebSocket endpoint: ws://localhost:8001/ws/stress-detection
echo.
echo Press Ctrl+C to stop the server when running.
echo.
pause

cd /d "%~dp0"
python start_stress_api.py --install
pause
