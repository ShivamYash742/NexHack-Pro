import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dbConnect from '@/lib/mongodb';
import InterviewSession, { IInterviewMetrics } from '@/lib/models/InterviewSession';
import InterviewReport from '@/lib/models/InterviewReport';
import Interview from '@/lib/models/Interview';
import { mentors } from '@/components/mentors';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

async function generateUnifiedReport(
  messages: Array<{ sender: string; text: string }>,
  metrics: IInterviewMetrics,
  jobTitle: string,
  userSummary: string,
  jobSummary: string
) {
  const conversationText = messages
    .filter(msg => msg.sender !== 'system')
    .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
    .join('\n\n');

  const schemaInstruction = `
You are a world-class executive interview coach grading a candidate.
Return ONLY valid JSON matching this exact structure:
{
  "performanceAnalysis": {
    "communicationSkills": { "score": <0-100 number>, "strengths": ["string"], "improvements": ["string"], "feedback": "Detailed feedback string" },
    "technicalKnowledge": { "score": <0-100 number>, "strengths": ["string"], "improvements": ["string"], "feedback": "Detailed feedback string" },
    "problemSolving": { "score": <0-100 number>, "strengths": ["string"], "improvements": ["string"], "feedback": "Detailed feedback string" },
    "confidence": { "score": <0-100 number>, "analysis": "Detailed analysis string", "recommendations": ["string"] },
    "bodyLanguage": { "score": <0-100 number>, "observations": ["string"], "recommendations": ["string"] }
  },
  "detailedFeedback": {
    "overallScore": <0-100 number>,
    "summary": "Comprehensive executive summary",
    "keyStrengths": ["string"],
    "areasForImprovement": ["string"],
    "behavioralInsights": {
      "pauseAnalysis": "string",
      "speechPaceAnalysis": "string",
      "confidenceAnalysis": "string",
      "emotionalStateAnalysis": "string"
    },
    "recommendations": {
      "immediate": ["string"],
      "shortTerm": ["string"],
      "longTerm": ["string"]
    },
    "specificFeedback": [
       {
         "question": "The interviewer's question text",
         "userResponse": "The candidate's response text",
         "feedback": "Detailed critique of this specific answer",
         "score": <0-100 number>,
         "suggestions": ["string"]
       }
    ]
  }
}
`;

  const prompt = `
${schemaInstruction}

**CANDIDATE PROFILE:**
- Target Role: ${jobTitle}
- Background: ${userSummary}
- Role Requirements: ${jobSummary}

**BEHAVIORAL METRICS:**
- Speaking Time: ${Math.round(Number(metrics.userSpeakingTime ?? 0) / 1000)} seconds
- Speech Rate: ${Number(metrics.wordsPerMinute ?? 0)} WPM
- Fluency: ${Number(metrics.fillerWordsCount ?? 0)} filler words
- Confidence Index: ${Math.round(Number(metrics.confidenceScore ?? 0) * 100)}%

**INTERVIEW TRANSCRIPT:**
${conversationText}

Provide an extremely demanding, Fortune-500 level assessment. Read the complete transcript and match each interviewer question with the corresponding candidate response in the specificFeedback array. Ensure you ONLY output the valid JSON.
`;

  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
      temperature: 0.3,
    });

    const cleanedText = result.text.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in unified report generation:', error);
    throw new Error('Failed to parse AI response');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, sessionId } = await req.json();

    if (!interviewId || !sessionId) {
      return NextResponse.json(
        { error: 'Interview ID and Session ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const [interview, session] = await Promise.all([
      Interview.findById(interviewId),
      InterviewSession.findById(sessionId)
    ]);

    if (!interview || !session) {
      return NextResponse.json(
        { error: 'Interview or session not found' },
        { status: 404 }
      );
    }

    if (interview.userId !== userId || session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingReport = await InterviewReport.findOne({ interviewId });
    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: existingReport,
        message: 'Report already exists'
      });
    }

    const mentor = mentors.find(m => m.id === interview.mentorId);
    const mentorName = mentor ? mentor.name : 'AI Interviewer';

    // 1. Generate Unified Report using Gemini
    const aiAnalysis = await generateUnifiedReport(
      session.messages,
      session.metrics as IInterviewMetrics,
      interview.jobTitle,
      interview.userSummary,
      interview.jobSummary
    );

    // 2. Map QA specificFeedback to include unique IDs
    let qIdCounter = 1;
    const mappedSpecificFeedback = aiAnalysis.detailedFeedback.specificFeedback.map((fb: Record<string, unknown>) => ({
      ...fb,
      questionId: `q${qIdCounter++}`
    }));

    aiAnalysis.detailedFeedback.specificFeedback = mappedSpecificFeedback;

    // 3. Save to database
    const report = new InterviewReport({
      interviewId,
      sessionId,
      userId,
      jobTitle: interview.jobTitle,
      mentorName,
      performanceAnalysis: aiAnalysis.performanceAnalysis,
      detailedFeedback: aiAnalysis.detailedFeedback,
      interviewDuration: session.metrics.totalDuration || 0,
      generatedAt: new Date(),
      reportVersion: '3.0',
    });

    await report.save();

    await Promise.all([
      Interview.findByIdAndUpdate(interviewId, {
        reportId: report._id,
        status: 'completed'
      }),
      InterviewSession.findByIdAndUpdate(sessionId, {
        status: 'completed'
      })
    ]);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
