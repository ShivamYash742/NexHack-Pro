"""
MockMentor ML Sidecar — FastAPI WebSocket server.
Phase 2: browser sends JPEG frames as base64 JSON, server responds with FrameResult JSON.

Start: python server.py  (or uvicorn server:app --port 8001)
Env:   ML_PORT (default 8001), ML_ALLOWED_ORIGIN (default *)
"""
import asyncio
import base64
import os
import time

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from tracker import Pipeline
from storage import SessionStorage

ALLOWED_ORIGIN = os.environ.get("ML_ALLOWED_ORIGIN", "*")

app = FastAPI(title="MockMentor ML Sidecar", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# One shared pipeline (single-process, single GPU context)
_pipeline: Pipeline | None = None


def get_pipeline() -> Pipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline()
    return _pipeline


@app.get("/health")
async def health():
    return {"status": "ok", "ts": time.time()}


@app.websocket("/ws/{session_id}")
async def ws_endpoint(websocket: WebSocket, session_id: str):
    """
    Protocol (JSON messages):
      Client → Server: {"frame": "<base64 JPEG>", "ts": 1234567890.123}
      Server → Client: <FrameResult JSON>

    Special client messages:
      {"cmd": "reset"}      — reset blink / calibration for new question
      {"cmd": "summary"}    — return session aggregate + clear buffer
    """
    await websocket.accept()
    pipeline = get_pipeline()
    storage = SessionStorage()
    storage.session_id = session_id

    try:
        while True:
            data = await websocket.receive_json()

            cmd = data.get("cmd")
            if cmd == "reset":
                pipeline.reset_session()
                storage.clear()
                await websocket.send_json({"cmd": "reset", "ok": True})
                continue

            if cmd == "summary":
                summary = storage.aggregate()
                await websocket.send_json({"cmd": "summary", "data": summary})
                continue

            # Normal frame processing
            frame_b64 = data.get("frame")
            if not frame_b64:
                continue

            jpg_bytes = base64.b64decode(frame_b64)
            np_arr = np.frombuffer(jpg_bytes, np.uint8)
            frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame_bgr is None:
                await websocket.send_json({"error": "invalid frame"})
                continue

            ts = data.get("ts", time.time())
            result = pipeline.process(frame_bgr, ts)
            result_dict = result.to_dict()
            storage.push(result_dict)

            await websocket.send_json(result_dict)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"error": str(exc)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("ML_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
