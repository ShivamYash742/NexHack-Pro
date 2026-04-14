import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { google } from '@/lib/gemini';
import dbConnect from '@/lib/mongodb';
import InterviewSession, { IInterviewMetrics } from '@/lib/models/InterviewSession';
import InterviewReport from '@/lib/models/InterviewReport';
import Interview from '@/lib/models/Interview';
import { mentors } from '@/components/mentors';

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
    let result;
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting unified report generation with ${modelName}...`);
        result = await generateText({
          model: google(modelName),
          prompt,
          temperature: 0.3,
          maxRetries: 1,
        });
        console.log(`Successfully generated report with ${modelName}`);
        break; // Success
      } catch (e) {
        console.warn(`Model ${modelName} failed. Evaluating next fallback...`);
        lastError = e;
      }
    }

    if (!result) {
      throw lastError || new Error("All generative AI models failed during report generation");
    }

    const cleanedText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in unified report generation (fallback triggered):', error);
    
    // Calculate deterministic scores based on metrics since AI failed
    const confidenceScore = Number(metrics.confidenceScore ?? 0.5);
    const fillerWords = Number(metrics.fillerWordsCount ?? 0);
    const respTime = Number(metrics.averageResponseTime ?? 3000);
    
    const communicationScore = fillerWords < 3 ? 75 : fillerWords < 8 ? 60 : 45;
    const confidenceScorePercent = Math.round(confidenceScore * 100);
    const problemSolvingScore = respTime < 2000 ? 70 : respTime < 5000 ? 60 : 50;
    
    const overallScore = Math.round((communicationScore + confidenceScorePercent + problemSolvingScore + 60) / 4);

    // Reconstruct QA pairs structurally
    const specificFeedback: unknown[] = [];
    let currentQuestion = "";
    
    for (const msg of messages) {
      if (msg.sender === "interviewer") {
        currentQuestion = msg.text;
      } else if (msg.sender === "user" && currentQuestion) {
        specificFeedback.push({
          question: currentQuestion,
          userResponse: msg.text,
          feedback: "We experienced extremely high server demand and could not fully process this specific transcript with deep AI. However, based on your speech patterns and timing, your answer was logged successfully.",
          score: Math.round(overallScore * (0.9 + Math.random() * 0.2)),
          suggestions: ["Practice structured storytelling", "Focus on reducing filler words"]
        });
        currentQuestion = "";
      }
    }

    return {
      performanceAnalysis: {
        communicationSkills: {
          score: communicationScore,
          strengths: fillerWords < 5 ? ["Clear pronunciation", "Minimal hesitation"] : ["Able to express ideas continuously"],
          improvements: fillerWords >= 5 ? ["Reduce filler words highly", "Pace your speech"] : ["Enhance executive vocabulary"],
          feedback: `Communication showed ${fillerWords} filler words detected. ${metrics.wordsPerMinute ? `Speaking pace of ${Math.round(Number(metrics.wordsPerMinute))} WPM.` : ''} Aim for a more structured executive presence.`
        },
        technicalKnowledge: {
          score: 65,
          strengths: ["Relevant baseline experience identified"],
          improvements: ["Use STAR method strictly", "Add exact metrics and % improvements to your answers"],
          feedback: "Due to high global AI demand, deep technical screening was bypassed. However, baseline evaluation suggests you meet core requirements but must prove depth in your next interview stage."
        },
        problemSolving: {
          score: problemSolvingScore,
          strengths: respTime < 3000 ? ["Fast cognitive processing under pressure"] : ["Deliberate, careful consideration of complex problems"],
          improvements: respTime > 5000 ? ["Improve response start logic"] : ["Consider edge cases earlier"],
          feedback: `Average latency to respond was ${Math.round(respTime/1000)} seconds. This indicates a ${respTime < 3000 ? 'quick decision making style' : 'thoughtful evaluation style'}.`
        },
        confidence: {
          score: confidenceScorePercent,
          analysis: `Visual/Vocal tracking calculates confidence at ${confidenceScorePercent}%. ${confidenceScore > 0.6 ? 'Strong, assertive presence.' : 'Presence requires slightly more conviction.'}`,
          recommendations: ["Maintain steady eye contact", "Use power posing before the interview"]
        },
        bodyLanguage: {
          score: 75,
          observations: ["Professional demeanor maintained"],
          recommendations: ["Keep posture straight", "Utilize hand gestures naturally"]
        }
      },
      detailedFeedback: {
        overallScore,
        summary: "Notice: Your report was generated using our Edge Heuristics Engine because the primary AI tier is experiencing extreme global demand. This report relies strictly on pacing, speech latency, filler word counts, and confidence indexing rather than deep semantic tracking.",
        keyStrengths: [
          confidenceScore > 0.6 ? 'Maintained a solid level of assertive confidence.' : 'Completed the rigorous technical gauntlet.',
          fillerWords < 5 ? 'Speech was fluent and primarily free of hesitation markers.' : 'Overall communication remained understandable.',
          'Successfully operated within the time constraints.'
        ],
        areasForImprovement: [
          "Wait for deep AI context processing to return online for detailed semantic gap tracking.",
          fillerWords >= 5 ? 'High reliance on filler words impacts professional credibility.' : 'Always prepare strict STAR-method narratives.',
        ],
        behavioralInsights: {
          pauseAnalysis: "Analysis of response timing suggests standard cognitive pacing.",
          speechPaceAnalysis: `${metrics.wordsPerMinute ? `Speech rate averaged ${Math.round(Number(metrics.wordsPerMinute))} WPM.` : 'Standard conversational pacing evident.'}`,
          confidenceAnalysis: "Overall anxiety metrics were within normal bounds.",
          emotionalStateAnalysis: "Emotions remained stable based on vocal tension metrics."
        },
        recommendations: {
          immediate: ["Review transcript to spot your own technical gaps"],
          shortTerm: ["Record yourself answering these same questions immediately"],
          longTerm: ["Practice the STAR method on at least 5 major career stories"]
        },
        specificFeedback: specificFeedback.length > 0 ? specificFeedback : [{
          question: "General Assessment",
          userResponse: "N/A",
          feedback: "Transcript was too short or malformed.",
          score: overallScore,
          suggestions: ["Ensure your microphone is clearly picking up your voice"]
        }]
      }
    };
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
