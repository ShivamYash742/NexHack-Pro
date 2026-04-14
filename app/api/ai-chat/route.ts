import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, knowledgeBase, interviewContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Handle special cases
    if (message === 'START_INTERVIEW') {
      const welcomePrompt = `${knowledgeBase}

You are starting a mock interview for: ${interviewContext?.role || 'a position'}

Generate a professional, warm welcome message to start the interview. Keep it:
- Welcoming and professional
- Brief (1-2 sentences)
- Encouraging
- Relevant to the role

Respond ONLY with your welcome message, no additional formatting.`;

      const result = await generateWithFallback(welcomePrompt);

      return NextResponse.json({
        success: true,
        response: result.text.trim(),
      });
    }

    // Build conversation context for regular responses
    const systemPrompt = `${knowledgeBase}

CONVERSATION CONTEXT:
${interviewContext ? `Interview for: ${interviewContext.role}
Candidate Background: ${interviewContext.candidateBackground}
Interview Duration: ${interviewContext.duration || '3 minutes'}` : ''}

CONVERSATION HISTORY:
${conversationHistory?.map((msg: { sender: string; text: string }) => `${msg.sender}: ${msg.text}`).join('\n') || 'No previous conversation'}

CURRENT USER MESSAGE: ${message}

${message === '[USER_PAUSED]' ? 
`The user has been silent for 5 seconds. As the AI interviewer, please gently check in with them, offer encouragement, or ask if they need you to repeat the last question. Keep it very short.` 
: 
`Please respond as the AI interviewer. Keep your response:
- Professional and engaging
- Concise (1-2 sentences max since this is a short interview)
- Natural and conversational
- ALWAYS reply directly to what the user just said, and then ALWAYS ask a relevant follow-up question to keep the interview moving.`}

Respond ONLY with your interviewer response, no additional formatting or labels.`;

    const result = await generateWithFallback(systemPrompt);

    return NextResponse.json({
      success: true,
      response: result.text.trim(),
    });

  } catch (error: unknown) {
    console.error('Error generating AI response:', error);
    
    // Check if it's a rate limit error
    if ((error as Error)?.message?.includes('rate_limit') || (error as Error)?.message?.includes('429')) {
      console.log('Rate limit hit, using fallback response');
    }
    
    // Fallback to a generic response if AI fails
    const fallbackResponses = [
      "That's interesting. Can you tell me more about your experience with that?",
      "I see. How would you handle a challenging situation in this role?",
      "Thank you for sharing. What do you think is your greatest strength?",
      "Can you give me a specific example of how you've applied that skill?",
      "That's valuable experience. How do you see yourself growing in this position?",
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      fallback: true,
      error: (error as Error)?.message?.includes('rate_limit') ? 'rate_limit' : 'ai_error',
    });
  }
}
