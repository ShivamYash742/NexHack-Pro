import { NextRequest, NextResponse } from 'next/server';
import { generateWithGroq } from '@/lib/groq';
import { getInterviewWelcomePrompt, getInterviewConversationPrompt } from '@/lib/promptHelper';

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
      const welcomePrompt = getInterviewWelcomePrompt(knowledgeBase, interviewContext?.role || 'a position');
      const result = await generateWithGroq(welcomePrompt);

      return NextResponse.json({
        success: true,
        response: result.text.trim(),
      });
    }

    // Build conversation context for regular responses
    const conversationHistoryText = conversationHistory?.map((msg: { sender: string; text: string }) => `${msg.sender}: ${msg.text}`).join('\n') || 'No previous conversation';
    
    const systemPrompt = getInterviewConversationPrompt({
      knowledgeBase,
      role: interviewContext?.role || 'a position',
      candidateBackground: interviewContext?.candidateBackground || 'User',
      duration: interviewContext?.duration || '3 minutes',
      conversationHistory: conversationHistoryText,
      message,
      isUserPaused: message === '[USER_PAUSED]'
    });

    const result = await generateWithGroq(systemPrompt);

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
