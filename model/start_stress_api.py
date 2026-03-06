#!/usr/bin/env python3
"""
Startup script for the Stress Detection API
This script starts the FastAPI server for real-time stress detection during interviews.
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required packages from requirements.txt"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    if requirements_file.exists():
        print("Installing requirements...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)])
        print("Requirements installed successfully!")
    else:
        print("Warning: requirements.txt not found!")

def start_server():
    """Start the FastAPI server"""
    print("Starting Stress Detection API server...")
    print("Server will be available at: http://localhost:8001")
    print("WebSocket endpoint: ws://localhost:8001/ws/stress-detection")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Change to the model directory
    model_dir = Path(__file__).parent
    os.chdir(model_dir)
    
    # Start the server with uvicorn
    subprocess.run([sys.executable, "-m", "uvicorn", "stress_api:app", "--host", "0.0.0.0", "--port", "8001"])

if __name__ == "__main__":
    try:
        # Check if we should install requirements
        if len(sys.argv) > 1 and sys.argv[1] == "--install":
            install_requirements()
        
        start_server()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
