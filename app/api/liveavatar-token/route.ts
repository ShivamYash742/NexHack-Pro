export async function POST(request: Request) {
  try {
    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

    if (!HEYGEN_API_KEY) {
      return Response.json(
        { error: "HEYGEN_API_KEY is missing from .env.local" },
        { status: 500 }
      );
    }

    // Parse optional body for avatar configuration
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, use defaults
    }
    
    // LiveAvatar uses 'avatar_id', so we'll remove the camelCase one to avoid 422 Strict Validation errors
    const avatarId = body.avatarId || "6e32f90a-f566-45be-9ec7-a5f6999ee606";
    if ('avatarId' in body) delete body.avatarId;

    const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "x-api-key": HEYGEN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        mode: "FULL",
        interactivity_type: "CONVERSATIONAL",
        avatar_persona: {
          language: "en"
        },
        video_settings: {
          quality: "low",
          encoding: "H264"
        },
        ...body,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("LiveAvatar token API error:", res.status, errorData);
      return Response.json(
        {
          error: `LiveAvatar API returned ${res.status}`,
          details: errorData,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json({
      sessionToken: data.data?.session_token || data.session_token || data.data,
    });
  } catch (error) {
    console.error("Error generating LiveAvatar session token:", error);
    return Response.json(
      { error: "Failed to generate session token" },
      { status: 500 }
    );
  }
}
