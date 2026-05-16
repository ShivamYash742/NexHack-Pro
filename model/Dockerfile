# MockMentor ML Sidecar — Docker runtime for Render
# Provides Mesa software GLES so MediaPipe can initialise on headless Linux.

FROM python:3.13-slim

# ── System deps (Mesa GLES + OpenCV runtime) ────────────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libgles2 libegl1 libgl1 \
      libglib2.0-0 libsm6 libxext6 libxrender1 && \
    rm -rf /var/lib/apt/lists/*

# ── Force Mesa software renderer (no GPU on Render free tier) ───────────────
ENV LIBGL_ALWAYS_SOFTWARE=1
ENV MESA_GL_VERSION_OVERRIDE=3.3
ENV EGL_PLATFORM=surfaceless
ENV PYTHONUNBUFFERED=1

# ── App code ────────────────────────────────────────────────────────────────
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injects $PORT at runtime (defaults to 10000)
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}
