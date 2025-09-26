import { NextRequest, NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

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

      const result = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt: welcomePrompt,
        temperature: 0.7,
      });

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
${conversationHistory?.map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n') || 'No previous conversation'}

CURRENT USER MESSAGE: ${message}

Please respond as the AI interviewer. Keep your response:
- Professional and engaging
- Relevant to the job role and candidate's background
- Concise (1-2 sentences max since this is a short interview)
- Natural and conversational
- Focused on assessing the candidate's skills and experience

Respond ONLY with your interviewer response, no additional formatting or labels.`;

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: systemPrompt,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      response: result.text.trim(),
    });

  } catch (error: any) {
    console.error('Error generating AI response:', error);
    
    // Check if it's a rate limit error
    if (error?.message?.includes('rate_limit') || error?.message?.includes('429')) {
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
      error: error?.message?.includes('rate_limit') ? 'rate_limit' : 'ai_error',
    });
  }
}
