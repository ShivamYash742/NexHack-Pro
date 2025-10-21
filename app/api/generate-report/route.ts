/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import dbConnect from '@/lib/mongodb';
import InterviewSession from '@/lib/models/InterviewSession';
import InterviewReport from '@/lib/models/InterviewReport';
import Interview from '@/lib/models/Interview';
import { mentors } from '@/components/mentors';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Helper function to analyze video emotions using Imentiv AI
async function analyzeVideoEmotions(videoUrl: string) {
  try {
    // Note: This is a placeholder for Imentiv AI integration
    // You'll need to sign up for Imentiv AI API and get your API key
    const imentivApiKey = process.env.IMENTIV_API_KEY;
    
    if (!imentivApiKey || !videoUrl) {
      return null;
    }

    const response = await fetch('https://api.imentiv.ai/v1/video-emotion-analysis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imentivApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_url: videoUrl,
        analysis_type: 'comprehensive',
        include_transcript: true,
        include_personality: true
      })
    });

    if (!response.ok) {
      console.error('Imentiv API error:', response.statusText);
      return null;
    }

    const emotionData = await response.json();
    
    return {
      emotionAnalysis: {
        dominantEmotions: emotionData.emotions || [],
        emotionTimeline: emotionData.timeline || [],
        valenceArousal: emotionData.valence_arousal || {},
        microExpressions: emotionData.micro_expressions || []
      },
      personalityInsights: {
        bigFive: emotionData.personality?.big_five || {},
        traits: emotionData.personality?.traits || [],
        workStyle: emotionData.personality?.work_style || ''
      },
      behavioralMetrics: {
        eyeContact: emotionData.behavior?.eye_contact || 0,
        facialExpressionVariety: emotionData.behavior?.expression_variety || 0,
        emotionalStability: emotionData.behavior?.emotional_stability || 0,
        authenticity: emotionData.behavior?.authenticity || 0
      }
    };
  } catch (error) {
    console.error('Error analyzing video emotions:', error);
    return null;
  }
}

// Enhanced function to generate synthetic video insights when video analysis isn't available
function generateSyntheticVideoInsights(metrics: any) {
  return {
    emotionAnalysis: {
      dominantEmotions: [
        { emotion: 'neutral', confidence: 0.4 },
        { emotion: metrics.confidenceScore > 0.7 ? 'confidence' : 'nervousness', confidence: 0.3 },
        { emotion: 'focus', confidence: 0.3 }
      ],
      emotionTimeline: [
        { timestamp: 0, emotion: 'neutral', intensity: 0.5 },
        { timestamp: 50, emotion: metrics.confidenceScore > 0.7 ? 'confidence' : 'nervousness', intensity: metrics.confidenceScore },
        { timestamp: 100, emotion: 'focus', intensity: 0.7 }
      ],
      valenceArousal: {
        valence: metrics.confidenceScore > 0.6 ? 0.6 : 0.4,
        arousal: metrics.fillerWordsCount > 5 ? 0.7 : 0.5
      }
    },
    personalityInsights: {
      bigFive: {
        openness: metrics.confidenceScore > 0.7 ? 0.7 : 0.6,
        conscientiousness: metrics.fillerWordsCount < 5 ? 0.8 : 0.6,
        extraversion: metrics.confidenceScore > 0.6 ? 0.7 : 0.5,
        agreeableness: 0.6,
        neuroticism: metrics.confidenceScore < 0.5 ? 0.7 : 0.3
      },
      traits: [
        metrics.confidenceScore > 0.7 ? 'confident' : 'developing-confidence',
        metrics.fillerWordsCount < 5 ? 'articulate' : 'needs-communication-practice',
        metrics.averageResponseTime < 3000 ? 'quick-thinking' : 'deliberate'
      ]
    },
    behavioralMetrics: {
      eyeContact: metrics.confidenceScore * 0.8,
      facialExpressionVariety: 0.6,
      emotionalStability: metrics.confidenceScore > 0.6 ? 0.8 : 0.6,
      authenticity: 0.75
    }
  };
}

// Helper function to generate AI feedback for specific Q&A pairs
async function generateQAFeedback(
  question: string,
  userResponse: string,
  jobTitle: string,
  userSummary: string
) {
  const prompt = `
You are a senior executive interview coach with 15+ years of experience coaching candidates for ${jobTitle} positions at Fortune 500 companies. You have deep expertise in behavioral psychology, communication analysis, and industry-specific competency assessment.

**CONTEXT:**
- Job Title: ${jobTitle}
- Candidate Background: ${userSummary}
- Interview Question: "${question}"
- Candidate Response: "${userResponse}"

**ANALYSIS FRAMEWORK:**
Analyze this Q&A using the STAR method (Situation, Task, Action, Result) and behavioral competency frameworks. Evaluate:

1. **Content Quality (40%)**:
   - Relevance and directness to the question
   - Use of specific, quantifiable examples
   - Demonstration of required skills/competencies
   - Industry knowledge and terminology usage

2. **Communication Effectiveness (30%)**:
   - Clarity and logical structure
   - Storytelling ability and engagement
   - Confidence and assertiveness in delivery
   - Professional language and articulation

3. **Strategic Thinking (20%)**:
   - Problem-solving approach demonstrated
   - Strategic vs tactical thinking
   - Innovation and creativity shown
   - Business impact awareness

4. **Cultural Fit Indicators (10%)**:
   - Values alignment demonstration
   - Team collaboration examples
   - Leadership potential shown
   - Growth mindset evidence

**STRICT SCORING GUIDELINES:**
- 90-100: EXCEPTIONAL - Top 1% of candidates, ready for C-level roles
- 80-89: EXCELLENT - Top 5% of candidates, senior leadership material
- 70-79: GOOD - Top 15% of candidates, solid performer with growth potential
- 60-69: AVERAGE - Meets basic requirements but significant gaps exist
- 50-59: BELOW AVERAGE - Major improvement needed before hiring
- 0-49: POOR - Not suitable for role, fundamental skills missing

**CRITICAL EVALUATION CRITERIA:**
- Content must include specific metrics, numbers, and quantifiable results
- STAR method must be perfectly executed with clear S-T-A-R structure
- Industry terminology and advanced concepts must be demonstrated
- Leadership examples and strategic thinking must be evident
- Communication must be executive-level with zero filler words
- Problem-solving must show innovative and creative approaches

**PROVIDE DETAILED ANALYSIS IN JSON:**
{
  "overallScore": 0-100,
  "dimensionScores": {
    "contentQuality": 0-100,
    "communicationEffectiveness": 0-100,
    "strategicThinking": 0-100,
    "culturalFit": 0-100
  },
  "detailedFeedback": "Comprehensive 150-200 word analysis covering strengths, weaknesses, and specific observations about the response quality, structure, and relevance to the role",
  "keyStrengths": ["specific strength 1 with example", "specific strength 2 with example"],
  "criticalGaps": ["specific gap 1 with impact", "specific gap 2 with impact"],
  "improvementStrategy": {
    "immediate": ["actionable tip 1", "actionable tip 2"],
    "practice": ["specific practice exercise 1", "specific practice exercise 2"],
    "resources": ["recommended resource/framework 1", "recommended resource/framework 2"]
  },
  "benchmarkComparison": "How this response compares to typical ${jobTitle} candidates (top 10%, average, needs improvement)",
  "redFlags": ["any concerning patterns or responses that could hurt candidacy"],
  "starMethodAlignment": "Assessment of how well the response follows STAR methodology"
}

**SCORING REQUIREMENTS:**
- Be EXTREMELY strict and demanding in scoring
- Most candidates should score 50-70 range unless truly exceptional
- Only award 80+ for genuinely outstanding responses with perfect STAR structure, specific metrics, and executive-level insights
- Award 90+ only for responses that would impress Fortune 500 CEOs
- Be brutally honest about gaps and weaknesses
- Demand specific examples, quantifiable results, and strategic thinking
- No participation trophies - earn every point through excellence

Reference industry standards for ${jobTitle} roles and compare against top-tier candidates at leading companies.`;

  try {
    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.4,
    });

    const cleanedText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const feedback = JSON.parse(cleanedText);
    
    return {
      overallScore: feedback.overallScore || 55, // Much lower default
      dimensionScores: feedback.dimensionScores || {
        contentQuality: 50, // Strict scoring
        communicationEffectiveness: 60,
        strategicThinking: 45,
        culturalFit: 65
      },
      detailedFeedback: feedback.detailedFeedback || 'Response demonstrates basic understanding of the question with room for more specific examples and structured approach.',
      keyStrengths: feedback.keyStrengths || ['Clear communication', 'Relevant experience mentioned'],
      criticalGaps: feedback.criticalGaps || ['Lacks specific quantifiable examples', 'Could improve STAR method structure'],
      improvementStrategy: feedback.improvementStrategy || {
        immediate: ['Practice STAR method structure', 'Prepare specific metrics and examples'],
        practice: ['Record mock answers and review', 'Practice with industry-specific scenarios'],
        resources: ['STAR method framework', 'Industry competency guides']
      },
      benchmarkComparison: feedback.benchmarkComparison || 'Below average - significant improvement needed to compete with top candidates',
      redFlags: feedback.redFlags || [],
      starMethodAlignment: feedback.starMethodAlignment || 'Partial alignment with STAR methodology'
    };
  } catch (error) {
    console.error('Error generating Q&A feedback:', error);
    // Enhanced fallback feedback with strict scoring
    return {
      overallScore: 45, // Much stricter fallback
      dimensionScores: {
        contentQuality: 40,
        communicationEffectiveness: 50,
        strategicThinking: 35,
        culturalFit: 55
      },
      detailedFeedback: 'Your response demonstrates basic understanding of the question. To strengthen your answer, focus on providing specific, quantifiable examples using the STAR method (Situation, Task, Action, Result). Consider how your experience directly relates to the role requirements and articulate the business impact of your actions.',
      keyStrengths: ['Shows relevant experience', 'Communicates clearly'],
      criticalGaps: ['Needs more specific examples', 'Could improve structure using STAR method'],
      improvementStrategy: {
        immediate: ['Prepare 3-5 STAR stories for common questions', 'Practice quantifying achievements'],
        practice: ['Record yourself answering questions', 'Time your responses (aim for 2-3 minutes)'],
        resources: ['STAR method guide', 'Industry-specific interview preparation']
      },
      benchmarkComparison: 'Well below average - major gaps in preparation, structure, and executive presence',
      redFlags: ['Generic responses without specific examples'],
      starMethodAlignment: 'Limited structure - recommend practicing STAR methodology'
    };
  }
}

// Helper function to analyze conversation with AI (enhanced with video insights)
async function analyzeConversationWithAI(
  messages: any[],
  metrics: any,
  jobTitle: string,
  userSummary: string,
  jobSummary: string,
  videoUrl?: string
) {
  // Analyze video emotions if video URL is provided
  const videoInsights = videoUrl ? 
    await analyzeVideoEmotions(videoUrl) : 
    generateSyntheticVideoInsights(metrics);
  const conversationText = messages
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n');

  const prompt = `
You are a world-class executive interview coach and industrial psychologist with expertise in behavioral assessment, communication analysis, and talent evaluation for ${jobTitle} positions. You've coached thousands of candidates and have deep insights into what makes successful hires.

**CANDIDATE PROFILE:**
- Target Role: ${jobTitle}
- Background: ${userSummary}
- Role Requirements: ${jobSummary}

**INTERVIEW TRANSCRIPT:**
${conversationText}

**BEHAVIORAL METRICS:**
- Interview Duration: ${Math.round(metrics.totalDuration / 1000 / 60)} minutes
- Speaking Time: ${Math.round(metrics.userSpeakingTime / 1000)} seconds (${Math.round((metrics.userSpeakingTime / metrics.totalDuration) * 100)}% of total)
- Pause Analysis: ${metrics.totalPauses} pauses, avg ${metrics.averagePauseLength}ms, longest ${metrics.longestPause}ms
- Response Latency: ${metrics.averageResponseTime}ms average
- Speech Rate: ${metrics.wordsPerMinute} WPM
- Fluency: ${metrics.fillerWordsCount} filler words detected
- Confidence Index: ${Math.round(metrics.confidenceScore * 100)}%

**VIDEO EMOTION ANALYSIS:**
${videoInsights ? `
- Dominant Emotions: ${videoInsights.emotionAnalysis.dominantEmotions.map(e => `${e.emotion} (${Math.round(e.confidence * 100)}%)`).join(', ')}
- Emotional Valence: ${Math.round((videoInsights.emotionAnalysis.valenceArousal?.valence || 0.5) * 100)}% (positive/negative sentiment)
- Emotional Arousal: ${Math.round((videoInsights.emotionAnalysis.valenceArousal?.arousal || 0.5) * 100)}% (energy/activation level)
- Eye Contact Quality: ${Math.round((videoInsights.behavioralMetrics?.eyeContact || 0.5) * 100)}%
- Emotional Stability: ${Math.round((videoInsights.behavioralMetrics?.emotionalStability || 0.5) * 100)}%
- Authenticity Index: ${Math.round((videoInsights.behavioralMetrics?.authenticity || 0.5) * 100)}%
- Personality Traits: ${videoInsights.personalityInsights?.traits?.join(', ') || 'Not available'}
- Big Five Personality:
  * Openness: ${Math.round((videoInsights.personalityInsights?.bigFive?.openness || 0.5) * 100)}%
  * Conscientiousness: ${Math.round((videoInsights.personalityInsights?.bigFive?.conscientiousness || 0.5) * 100)}%
  * Extraversion: ${Math.round((videoInsights.personalityInsights?.bigFive?.extraversion || 0.5) * 100)}%
  * Agreeableness: ${Math.round((videoInsights.personalityInsights?.bigFive?.agreeableness || 0.5) * 100)}%
  * Neuroticism: ${Math.round((videoInsights.personalityInsights?.bigFive?.neuroticism || 0.5) * 100)}%` : '- Video analysis not available, using behavioral inference from audio metrics'}

**ANALYSIS FRAMEWORK:**
Use advanced psychological assessment principles including:
- Big Five personality traits analysis (enhanced with video emotion data)
- Emotional intelligence indicators (facial expression analysis)
- Cognitive load assessment (pause patterns + micro-expressions)
- Communication competency evaluation (verbal + non-verbal alignment)
- Leadership potential markers (confidence + authenticity metrics)
- Cultural fit predictors (emotional stability + social cues)
- Micro-expression analysis for authenticity assessment
- Valence-arousal emotional mapping for stress response
- Eye contact and facial expression variety for engagement assessment

**PROVIDE COMPREHENSIVE ANALYSIS:**

{
  "performanceAnalysis": {
    "communicationSkills": {
      "score": 0-100,
      "strengths": ["specific strength with evidence", "specific strength with evidence"],
      "improvements": ["specific improvement with rationale", "specific improvement with rationale"],
      "feedback": "Detailed 100+ word analysis of communication effectiveness, clarity, persuasiveness, and professional presence",
      "subScores": {
        "clarity": 0-100,
        "structure": 0-100,
        "engagement": 0-100,
        "professionalism": 0-100
      }
    },
    "technicalKnowledge": {
      "score": 0-100,
      "strengths": ["specific technical strength demonstrated", "specific technical strength demonstrated"],
      "improvements": ["specific technical gap identified", "specific technical gap identified"],
      "feedback": "Detailed analysis of technical competency, industry knowledge, and role-specific expertise demonstrated",
      "depthAssessment": "Assessment of technical depth vs breadth for the role level",
      "industryAlignment": "How well technical knowledge aligns with industry standards"
    },
    "problemSolving": {
      "score": 0-100,
      "strengths": ["specific problem-solving approach shown", "specific analytical skill demonstrated"],
      "improvements": ["specific thinking process to improve", "specific analytical skill to develop"],
      "feedback": "Analysis of logical reasoning, creativity, systematic thinking, and solution quality",
      "cognitiveLoad": "Assessment of how well candidate handles complex problems under pressure",
      "innovationIndex": "Evidence of creative and innovative thinking"
    },
    "emotionalIntelligence": {
      "score": 0-100,
      "selfAwareness": 0-100,
      "socialSkills": 0-100,
      "empathy": 0-100,
      "feedback": "Assessment of emotional maturity, interpersonal skills, and relationship management",
      "leadershipPotential": "Evidence of leadership qualities and team management capability"
    },
    "confidence": {
      "score": 0-100,
      "analysis": "Psychological analysis of confidence levels, authenticity vs overconfidence, and presence",
      "recommendations": ["specific confidence-building strategy", "specific presence improvement"],
      "authenticityIndex": "Assessment of genuine vs projected confidence"
    },
    "adaptability": {
      "score": 0-100,
      "evidence": ["specific example of adaptability", "specific example of learning agility"],
      "growthMindset": "Assessment of learning orientation and resilience"
    }
  },
  "detailedFeedback": {
    "overallScore": 0-100,
    "hiringRecommendation": "Strong Hire / Hire / Maybe / No Hire with detailed rationale",
    "summary": "Comprehensive 200+ word executive summary of performance, potential, and fit",
    "keyStrengths": ["strength with specific evidence and impact", "strength with specific evidence and impact", "strength with specific evidence and impact"],
    "criticalConcerns": ["concern with specific evidence and impact", "concern with specific evidence and impact"],
    "personalityProfile": {
      "bigFiveAssessment": {
        "openness": "Assessment based on responses",
        "conscientiousness": "Assessment based on responses",
        "extraversion": "Assessment based on responses",
        "agreeableness": "Assessment based on responses",
        "neuroticism": "Assessment based on responses"
      },
      "workStyle": "Predicted work style and team dynamics",
      "motivationDrivers": ["key motivator 1", "key motivator 2"]
    },
    "behavioralInsights": {
      "cognitiveProcessing": "Analysis of thinking speed, complexity handling, and mental agility based on response times and pauses",
      "stressResponse": "How candidate handles pressure based on speech patterns and response quality",
      "communicationStyle": "Detailed analysis of communication patterns, influence style, and interpersonal approach",
      "decisionMaking": "Assessment of decision-making process, risk tolerance, and judgment quality"
    },
    "competencyGaps": [
      {
        "competency": "specific competency",
        "currentLevel": "assessment",
        "requiredLevel": "requirement",
        "developmentPath": "specific development recommendation"
      }
    ],
    "recommendations": {
      "immediate": ["specific action with timeline and expected outcome", "specific action with timeline and expected outcome"],
      "shortTerm": ["30-90 day development goal with metrics", "30-90 day development goal with metrics"],
      "longTerm": ["6-12 month strategic development area", "6-12 month strategic development area"]
    },
    "interviewerNotes": "What a hiring manager should know about this candidate's potential, risks, and onboarding needs"
  }
}

**CRITICAL ANALYSIS REQUIREMENTS:**
1. **Evidence-Based Assessment**: Every score and observation must be backed by specific examples from the transcript
2. **Psychological Depth**: Go beyond surface-level observations to understand underlying personality, motivation, and capability
3. **Predictive Insights**: Assess likely job performance, team fit, and growth potential
4. **Actionable Intelligence**: Provide specific, measurable recommendations with clear development paths
5. **Industry Context**: Reference ${jobTitle} role requirements and industry standards
6. **Behavioral Patterns**: Identify consistent patterns in responses that indicate deeper traits
7. **Risk Assessment**: Identify potential performance risks and mitigation strategies
8. **Competitive Benchmarking**: Compare against TOP-TIER candidates at Fortune 500 companies

**EXTREMELY STRICT SCORING STANDARDS:**
- 90-100: EXCEPTIONAL - Would be hired immediately at Google, McKinsey, Goldman Sachs
- 80-89: EXCELLENT - Top 5% of all candidates, ready for senior roles
- 70-79: GOOD - Above average but still has notable gaps
- 60-69: AVERAGE - Meets minimum requirements but significant improvement needed
- 50-59: BELOW AVERAGE - Major concerns about job readiness
- 0-49: POOR - Not suitable for professional roles

**DEMAND EXCELLENCE:**
- Responses must include specific metrics, percentages, dollar amounts
- Perfect STAR method execution required for high scores
- Must demonstrate strategic thinking and business impact
- Communication must be polished and executive-level
- No generic or vague responses accepted

**RESPONSE REQUIREMENTS:**
- Be BRUTALLY honest and extremely demanding in scoring
- Most candidates should score 40-65 unless truly exceptional
- Only award 70+ for genuinely impressive responses
- Award 80+ only for responses that would impress Fortune 500 executives
- Award 90+ only for world-class, CEO-level responses
- Provide specific examples and evidence for all assessments
- Include quantitative analysis where possible
- Reference psychological and behavioral frameworks
- Consider cultural and organizational fit factors
- Provide clear development roadmap
- Assess both current capability and growth potential
- NO PARTICIPATION TROPHIES - every point must be earned through excellence

Return comprehensive JSON analysis with STRICT scoring that reflects real-world hiring standards.`;

  try {
    const fullPrompt = `You are an expert interview coach. Provide detailed, constructive feedback in valid JSON format only.

${prompt}

IMPORTANT: Return ONLY valid JSON, no additional text or formatting.`;

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: fullPrompt,
      temperature: 0.3,
    });

    const analysisText = result.text;
    
    if (!analysisText) {
      throw new Error('No analysis generated');
    }

    // Clean the response and parse JSON
    const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedText);
    return analysis;
  } catch (error) {
    console.error('Error analyzing conversation with AI:', error);
    
    // Generate a more dynamic fallback based on actual metrics with STRICT scoring
    const avgScore = Math.round(
      (metrics.confidenceScore * 60 + // Much lower multiplier
       (metrics.fillerWordsCount < 3 ? 65 : 35) + // Stricter filler word penalty
       (metrics.averageResponseTime < 2000 ? 60 : 40)) / 3 // Stricter response time requirements
    );

    return {
      performanceAnalysis: {
        communicationSkills: {
          score: metrics.fillerWordsCount < 3 ? 55 : 35, // Much stricter scoring
          strengths: metrics.fillerWordsCount < 3 ? 
            ['Minimal hesitation in speech', 'Basic professional language'] : 
            ['Understandable communication', 'Shows effort to communicate'],
          improvements: metrics.fillerWordsCount >= 3 ? 
            ['Eliminate filler words completely', 'Practice executive-level communication', 'Develop confident speaking presence'] : 
            ['Add specific quantifiable examples', 'Develop persuasive storytelling', 'Practice advanced communication techniques'],
          feedback: `Communication shows ${metrics.fillerWordsCount < 3 ? 'basic competency but lacks executive polish' : 'significant room for improvement'} with ${metrics.fillerWordsCount} filler words detected. ${metrics.wordsPerMinute ? `Speaking pace of ${metrics.wordsPerMinute} WPM ${metrics.wordsPerMinute > 150 ? 'may be too fast for executive presence' : metrics.wordsPerMinute < 120 ? 'is too slow for professional settings' : 'is adequate but needs more confidence'}.` : 'Needs significant improvement in delivery and presence.'}`,
          subScores: {
            clarity: metrics.fillerWordsCount < 2 ? 60 : 40,
            structure: 45, // Much lower default
            engagement: metrics.confidenceScore > 0.8 ? 55 : 35,
            professionalism: 50 // Stricter professional standards
          }
        },
        technicalKnowledge: {
          score: avgScore,
          strengths: ['Demonstrates relevant industry awareness', 'Shows understanding of role requirements'],
          improvements: ['Provide more specific technical examples', 'Deepen industry-specific knowledge'],
          feedback: 'Technical competency appears adequate for the role level, though more specific examples and deeper technical discussions would strengthen the assessment.',
          depthAssessment: 'Moderate technical depth - suitable for role but could benefit from more specialized knowledge',
          industryAlignment: 'Aligns with basic industry standards, room for advanced specialization'
        },
        problemSolving: {
          score: metrics.averageResponseTime < 2000 ? 55 : 40, // Much stricter timing requirements
          strengths: metrics.averageResponseTime < 3000 ? 
            ['Quick analytical processing', 'Efficient problem approach'] : 
            ['Thoughtful consideration of problems', 'Deliberate analysis approach'],
          improvements: metrics.averageResponseTime > 5000 ? 
            ['Improve response speed through practice', 'Develop faster problem-solving frameworks'] : 
            ['Enhance solution creativity', 'Develop more structured problem-solving approach'],
          feedback: `Problem-solving approach shows ${metrics.averageResponseTime < 3000 ? 'quick analytical thinking' : 'careful deliberation'} with average response time of ${Math.round(metrics.averageResponseTime / 1000)} seconds. This indicates ${metrics.averageResponseTime < 3000 ? 'strong cognitive agility' : 'thorough but potentially slow processing'}.`,
          cognitiveLoad: metrics.averageResponseTime < 3000 ? 'Handles complexity well under pressure' : 'May need more time for complex problem processing',
          innovationIndex: 'Limited evidence of innovative thinking - recommend developing creative problem-solving skills'
        },
        emotionalIntelligence: {
          score: Math.round(metrics.confidenceScore * 60), // Much lower multiplier
          selfAwareness: Math.round(metrics.confidenceScore * 55),
          socialSkills: 45, // Lower baseline
          empathy: 40, // Stricter empathy assessment
          feedback: 'Emotional intelligence appears developing with room for growth in self-awareness and interpersonal skills.',
          leadershipPotential: metrics.confidenceScore > 0.7 ? 'Shows potential leadership qualities' : 'Leadership potential needs development'
        },
        confidence: {
          score: Math.round(metrics.confidenceScore * 100),
          analysis: `Confidence assessment reveals ${metrics.confidenceScore > 0.8 ? 'strong self-assurance and executive presence' : metrics.confidenceScore > 0.6 ? 'moderate confidence with room for growth' : 'developing confidence that needs strengthening'}. Pause patterns and response timing suggest ${metrics.longestPause > 5000 ? 'some hesitation under pressure' : 'reasonable composure'}.`,
          recommendations: metrics.confidenceScore < 0.7 ? 
            ['Practice power posing and confidence-building exercises', 'Work on reducing long pauses through preparation'] : 
            ['Maintain authentic confidence while avoiding overconfidence', 'Continue building executive presence'],
          authenticityIndex: 'Appears genuine - confidence seems authentic rather than projected'
        },
        adaptability: {
          score: 45, // Much lower baseline
          evidence: ['Shows openness to feedback', 'Demonstrates learning orientation'],
          growthMindset: 'Appears to have growth mindset but needs more evidence of adaptability in challenging situations'
        }
      },
      detailedFeedback: {
        overallScore: avgScore,
        hiringRecommendation: `${avgScore > 80 ? 'Strong Hire' : avgScore > 70 ? 'Hire' : avgScore > 60 ? 'Maybe' : 'No Hire'} - ${avgScore > 70 ? 'Candidate shows potential but needs significant development' : avgScore > 50 ? 'Major improvement required before hiring consideration' : 'Not suitable for role at current skill level'}`,
        summary: `Interview performance demonstrates ${avgScore > 80 ? 'strong competency' : avgScore > 70 ? 'adequate capability' : 'developing skills'} for the ${jobTitle} role. Key observations include ${metrics.confidenceScore > 0.7 ? 'confident presentation' : 'developing confidence'}, ${metrics.fillerWordsCount < 5 ? 'clear communication' : 'communication that needs refinement'}, and ${metrics.averageResponseTime < 3000 ? 'quick analytical processing' : 'thoughtful but slower response patterns'}. The candidate shows ${avgScore > 70 ? 'promise' : 'potential'} but would benefit from targeted development in specific areas to reach full effectiveness in the role.`,
        keyStrengths: [
          `${metrics.confidenceScore > 0.7 ? 'Strong executive presence and confidence' : 'Professional demeanor and basic competency'}`,
          `${metrics.fillerWordsCount < 5 ? 'Clear, articulate communication with minimal hesitation' : 'Understandable communication with room for improvement'}`,
          `${metrics.averageResponseTime < 3000 ? 'Quick analytical thinking and problem-solving agility' : 'Thoughtful, deliberate approach to complex questions'}`
        ],
        criticalConcerns: [
          metrics.fillerWordsCount >= 8 ? 'High filler word usage may impact professional credibility' : null,
          metrics.averageResponseTime > 8000 ? 'Slow response times may indicate processing challenges under pressure' : null,
          metrics.confidenceScore < 0.5 ? 'Low confidence may impact leadership effectiveness and team influence' : null
        ].filter(Boolean),
        personalityProfile: {
          bigFiveAssessment: {
            openness: metrics.confidenceScore > 0.7 ? 'High - shows curiosity and openness to new experiences' : 'Moderate - some openness but may prefer familiar approaches',
            conscientiousness: avgScore > 75 ? 'High - demonstrates preparation and attention to detail' : 'Moderate - shows basic organization but could improve preparation',
            extraversion: metrics.confidenceScore > 0.6 ? 'Moderate to High - comfortable in social interactions' : 'Low to Moderate - may prefer smaller group interactions',
            agreeableness: 'Moderate - appears collaborative but needs more evidence',
            neuroticism: metrics.confidenceScore > 0.7 ? 'Low - appears emotionally stable' : 'Moderate - some signs of stress under pressure'
          },
          workStyle: `Likely ${metrics.averageResponseTime < 3000 ? 'fast-paced, decisive' : 'deliberate, thorough'} work style with ${metrics.confidenceScore > 0.6 ? 'collaborative' : 'independent'} tendencies`,
          motivationDrivers: ['Professional growth and development', 'Achievement and recognition']
        },
        behavioralInsights: {
          cognitiveProcessing: `Analysis of ${metrics.totalPauses} pauses (avg ${metrics.averagePauseLength}ms, max ${Math.round(metrics.longestPause/1000)}s) and ${Math.round(metrics.averageResponseTime/1000)}s average response time suggests ${metrics.averageResponseTime < 3000 ? 'strong cognitive agility and quick processing' : 'careful, methodical thinking that may slow decision-making'}`,
          stressResponse: `${metrics.longestPause > 5000 ? 'Shows some stress indicators with longer pauses under pressure' : 'Maintains composure well under interview pressure'}. Filler word usage (${metrics.fillerWordsCount}) ${metrics.fillerWordsCount > 5 ? 'indicates nervousness or lack of preparation' : 'shows good self-control and preparation'}`,
          communicationStyle: `${metrics.wordsPerMinute ? `Speaking rate of ${metrics.wordsPerMinute} WPM suggests ${metrics.wordsPerMinute > 150 ? 'energetic, fast-paced communication' : metrics.wordsPerMinute < 120 ? 'deliberate, measured communication' : 'balanced communication pace'}` : 'Communication pace appears measured and professional'}`,
          decisionMaking: `${metrics.averageResponseTime < 3000 ? 'Quick decision-making style that may favor speed over thorough analysis' : 'Deliberate decision-making approach that prioritizes thoroughness over speed'}`
        },
        competencyGaps: [
          {
            competency: 'Communication Excellence',
            currentLevel: metrics.fillerWordsCount < 5 ? 'Proficient' : 'Developing',
            requiredLevel: 'Expert',
            developmentPath: 'Practice structured storytelling, reduce filler words, enhance executive presence'
          },
          {
            competency: 'Technical Expertise',
            currentLevel: 'Adequate',
            requiredLevel: 'Advanced',
            developmentPath: 'Deepen technical knowledge, prepare specific examples, study industry trends'
          }
        ],
        recommendations: {
          immediate: [
            `${metrics.fillerWordsCount >= 5 ? 'Practice 2-minute elevator pitches daily to reduce filler words and improve fluency' : 'Prepare 5-7 STAR method stories with quantifiable results'}`,
            `${metrics.averageResponseTime > 5000 ? 'Practice rapid-fire interview questions to improve response speed (target <3 seconds)' : 'Focus on adding more specific metrics and business impact to responses'}`
          ],
          shortTerm: [
            `${metrics.confidenceScore < 0.7 ? '30-day confidence building program: daily power posing, mock interviews, public speaking practice' : '60-day technical skill enhancement: complete 2-3 relevant certifications or courses'}`,
            'Join professional associations and practice networking to build industry presence and knowledge'
          ],
          longTerm: [
            '6-month leadership development program focusing on executive presence and strategic thinking',
            'Build personal brand through thought leadership content and speaking opportunities'
          ]
        },
        interviewerNotes: `Candidate shows ${avgScore > 75 ? 'strong potential' : 'developing capability'} for ${jobTitle} role. ${metrics.confidenceScore > 0.7 ? 'High confidence and presence' : 'Confidence needs development'}. ${metrics.fillerWordsCount < 5 ? 'Strong communicator' : 'Communication skills need refinement'}. Recommend ${avgScore > 75 ? 'standard onboarding with focus on technical depth' : 'extended onboarding with communication coaching and confidence building'}. Risk factors: ${metrics.averageResponseTime > 8000 ? 'slow decision-making under pressure' : 'minimal risks identified'}.`
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

    // Get interview and session data
    const [interview, session] = await Promise.all([
      Interview.findById(interviewId).exec(),
      InterviewSession.findById(sessionId).exec()
    ]);

    if (!interview || !session) {
      return NextResponse.json(
        { error: 'Interview or session not found' },
        { status: 404 }
      );
    }

    // Verify user owns this interview
    if (interview.userId !== userId || session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if report already exists
    const existingReport = await (InterviewReport.findOne({ interviewId }) as any).exec();
    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: existingReport,
        message: 'Report already exists'
      });
    }

    // Get mentor name
    const mentor = mentors.find(m => m.id === interview.mentorId);
    const mentorName = mentor ? mentor.name : 'AI Interviewer';

    // Generate AI analysis with video insights
    const aiAnalysis = await analyzeConversationWithAI(
      session.messages,
      session.metrics,
      interview.jobTitle,
      interview.userSummary,
      interview.jobSummary,
      session.videoUrl // Pass video URL if available
    );

    // Create detailed feedback with AI analysis for each question
    const specificFeedback = await Promise.all(
      session.messages
        .filter(msg => msg.sender === 'interviewer')
        .slice(0, 5) // Analyze first 5 questions
        .map(async (question, index) => {
          const userResponse = session.messages.find(
            (msg, msgIndex) => 
              msg.sender === 'user' && 
              msgIndex > session.messages.indexOf(question)
          );

          // Generate AI feedback for this specific Q&A pair
          const qaFeedback = await generateQAFeedback(
            question.text,
            userResponse?.text || 'No response recorded',
            interview.jobTitle,
            interview.userSummary
          );

          return {
            questionId: `q${index + 1}`,
            question: question.text,
            userResponse: userResponse?.text || 'No response recorded',
            overallScore: qaFeedback.overallScore,
            dimensionScores: qaFeedback.dimensionScores,
            detailedFeedback: qaFeedback.detailedFeedback,
            keyStrengths: qaFeedback.keyStrengths,
            criticalGaps: qaFeedback.criticalGaps,
            improvementStrategy: qaFeedback.improvementStrategy,
            benchmarkComparison: qaFeedback.benchmarkComparison,
            redFlags: qaFeedback.redFlags,
            starMethodAlignment: qaFeedback.starMethodAlignment
          };
        })
    );

    // Map enhanced AI analysis to database schema
    const mappedPerformanceAnalysis = {
      communicationSkills: {
        score: aiAnalysis.performanceAnalysis.communicationSkills.score,
        strengths: aiAnalysis.performanceAnalysis.communicationSkills.strengths,
        improvements: aiAnalysis.performanceAnalysis.communicationSkills.improvements,
        feedback: aiAnalysis.performanceAnalysis.communicationSkills.feedback
      },
      technicalKnowledge: {
        score: aiAnalysis.performanceAnalysis.technicalKnowledge.score,
        strengths: aiAnalysis.performanceAnalysis.technicalKnowledge.strengths,
        improvements: aiAnalysis.performanceAnalysis.technicalKnowledge.improvements,
        feedback: aiAnalysis.performanceAnalysis.technicalKnowledge.feedback
      },
      problemSolving: {
        score: aiAnalysis.performanceAnalysis.problemSolving.score,
        strengths: aiAnalysis.performanceAnalysis.problemSolving.strengths,
        improvements: aiAnalysis.performanceAnalysis.problemSolving.improvements,
        feedback: aiAnalysis.performanceAnalysis.problemSolving.feedback
      },
      confidence: {
        score: aiAnalysis.performanceAnalysis.confidence.score,
        analysis: aiAnalysis.performanceAnalysis.confidence.analysis,
        recommendations: aiAnalysis.performanceAnalysis.confidence.recommendations
      },
      bodyLanguage: {
        score: aiAnalysis.performanceAnalysis.adaptability?.score || 75,
        observations: aiAnalysis.performanceAnalysis.adaptability?.evidence || ['Professional demeanor maintained'],
        recommendations: ['Continue professional presentation', 'Focus on confident body language']
      }
    };

    // Map enhanced specific feedback to old format for database compatibility
    const mappedSpecificFeedback = specificFeedback.map(item => ({
      questionId: item.questionId,
      question: item.question,
      userResponse: item.userResponse,
      feedback: item.detailedFeedback,
      score: item.overallScore,
      suggestions: item.improvementStrategy?.immediate || ['Practice more', 'Improve structure']
    }));

    const mappedDetailedFeedback = {
      overallScore: aiAnalysis.detailedFeedback.overallScore,
      summary: aiAnalysis.detailedFeedback.summary,
      keyStrengths: aiAnalysis.detailedFeedback.keyStrengths,
      areasForImprovement: aiAnalysis.detailedFeedback.criticalConcerns?.length > 0 ? 
        aiAnalysis.detailedFeedback.criticalConcerns : 
        ['Continue developing skills', 'Practice interview techniques'],
      specificFeedback: mappedSpecificFeedback,
      behavioralInsights: {
        pauseAnalysis: aiAnalysis.detailedFeedback.behavioralInsights.cognitiveProcessing,
        speechPaceAnalysis: aiAnalysis.detailedFeedback.behavioralInsights.communicationStyle,
        confidenceAnalysis: aiAnalysis.detailedFeedback.behavioralInsights.stressResponse,
        emotionalStateAnalysis: aiAnalysis.detailedFeedback.behavioralInsights.decisionMaking
      },
      recommendations: aiAnalysis.detailedFeedback.recommendations
    };

    // Create the report
    const report = new InterviewReport({
      interviewId,
      sessionId,
      userId,
      jobTitle: interview.jobTitle,
      mentorName,
      performanceAnalysis: mappedPerformanceAnalysis,
      detailedFeedback: mappedDetailedFeedback,
      interviewDuration: session.metrics.totalDuration || 0,
      generatedAt: new Date(),
      reportVersion: '2.0', // Updated version to reflect enhanced insights
    });

    await report.save();

    // Update interview and session
    await Promise.all([
      (Interview.findByIdAndUpdate(interviewId, {
        reportId: report._id,
        reportGenerated: true,
      }) as any).exec(),
      (InterviewSession.findByIdAndUpdate(sessionId, {
        reportGenerated: true,
      }) as any).exec()
    ]);

    return NextResponse.json({
      success: true,
      report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    console.error('Error generating interview report:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview report' },
      { status: 500 }
    );
  }
}

// Get existing report
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');
    const reportId = searchParams.get('reportId');

    if (!interviewId && !reportId) {
      return NextResponse.json(
        { error: 'Interview ID or Report ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let report;
    if (reportId) {
      report = await (InterviewReport.findById(reportId) as any).exec();
    } else {
      report = await (InterviewReport.findOne({ interviewId }) as any).exec();
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Verify user owns this report
    if (report.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error fetching interview report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview report' },
      { status: 500 }
    );
  }
}
