import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import InterviewSession from '@/lib/models/InterviewSession';
import Interview from '@/lib/models/Interview';

async function getAuthIdentifiers(req: NextRequest) {
  const { userId } = await auth();
  const body = await req.json().catch(() => ({}));
  const { guestId } = body;

  return { userId, guestId };
}

// Create or update interview session
export async function POST(req: NextRequest) {
  try {
    const { userId, guestId } = await getAuthIdentifiers(req);

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { interviewId, action, messageData, metricsData } = body;

    if (!interviewId || !action) {
      return NextResponse.json(
        { error: 'Interview ID and action are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let session;

    switch (action) {
      case 'start':
        session = new InterviewSession({
          interviewId,
          userId,
          guestId,
          messages: [],
          startTime: new Date(),
          status: 'active',
        });
        await session.save();

        await Interview.findByIdAndUpdate(interviewId, {
          status: 'in-progress',
          startDateTime: new Date(),
          sessionId: session._id,
        });
        break;

      case 'add_message':
        if (!messageData) {
          return NextResponse.json(
            { error: 'Message data is required' },
            { status: 400 }
          );
        }

        session = await InterviewSession.findOne({
          interviewId,
          status: 'active',
        });

        if (!session) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        session.messages.push({
          id: messageData.id || Date.now().toString(),
          sender: messageData.sender,
          text: messageData.text,
          timestamp: new Date(messageData.timestamp || Date.now()),
          duration: messageData.duration,
          pauseBefore: messageData.pauseBefore,
          confidence: messageData.confidence,
          emotion: messageData.emotion,
          volume: messageData.volume,
        });

        await session.save();
        break;

      case 'add_messages_batch':
        const { messagesData } = body;
        if (!messagesData || !Array.isArray(messagesData) || messagesData.length === 0) {
          return NextResponse.json(
            { error: 'messagesData array is required for batch insert' },
            { status: 400 }
          );
        }

        const batchSession = await InterviewSession.findOne({
          interviewId,
          status: 'active',
        });

        if (!batchSession) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        await InterviewSession.findByIdAndUpdate(batchSession._id, {
          $push: {
            messages: {
              $each: messagesData.map((msg: Record<string, unknown>) => ({
                id: (msg.id as string) || Date.now().toString(),
                sender: msg.sender,
                text: msg.text,
                timestamp: new Date((msg.timestamp as string) || Date.now()),
                duration: msg.duration,
                pauseBefore: msg.pauseBefore,
                confidence: msg.confidence,
                emotion: msg.emotion,
                volume: msg.volume,
              })),
            },
          },
        });

        session = batchSession;
        break;

      case 'update_metrics':
        if (!metricsData) {
          return NextResponse.json(
            { error: 'Metrics data is required' },
            { status: 400 }
          );
        }

        session = await InterviewSession.findOne({
          interviewId,
          status: 'active',
        });

        if (!session) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        session.metrics = { ...session.metrics, ...metricsData };
        await session.save();
        break;

      case 'end':
        session = await InterviewSession.findOne({
          interviewId,
          status: 'active',
        });

        if (!session) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        session.endTime = new Date();
        session.status = 'completed';

        if (metricsData) {
          session.metrics = { ...session.metrics, ...metricsData };
        }

        await session.save();

        await Interview.findByIdAndUpdate(interviewId, {
          status: 'completed',
          endDateTime: new Date(),
        });

        if (guestId) {
          await import('@/lib/models/GuestUser').then(({ default: GuestUser }) => {
            GuestUser.findOneAndUpdate(
              { guestId },
              { $inc: { interviewCount: 1 }, lastInterviewAt: new Date() }
            );
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      session: session ? {
        id: session._id,
        status: session.status,
        messageCount: session.messages?.length || 0,
      } : null,
    });
  } catch (error) {
    console.error('Error managing interview session:', error);
    return NextResponse.json(
      { error: 'Failed to manage interview session' },
      { status: 500 }
    );
  }
}

// Get interview session data
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get('guestId');
    const interviewId = searchParams.get('interviewId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!interviewId && !sessionId) {
      return NextResponse.json(
        { error: 'Interview ID or Session ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let session;
    if (sessionId) {
      session = await InterviewSession.findById(sessionId);
    } else {
      session = await InterviewSession.findOne({ interviewId });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const isOwner = (userId && session.userId === userId) || (guestId && session.guestId === guestId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching interview session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview session' },
      { status: 500 }
    );
  }
}