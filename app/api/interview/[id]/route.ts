import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Interview, { IInterview } from '@/lib/models/Interview';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    const guestId = req.nextUrl.searchParams.get('guestId');

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const interview = (await Interview.findById(id)) as IInterview | null;

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview
    const isOwner = (userId && interview.userId === userId) || (guestId && interview.guestId === guestId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if interview is in-progress and startDateTime is older than 5 minutes
    if (interview.status === 'in-progress' && interview.startDateTime) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (interview.startDateTime < fiveMinutesAgo) {
        // Mark as completed if it's been more than 5 minutes
        interview.status = 'completed';
        await interview.save();
      }
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    const body = await req.json();
    const { status, guestId } = body;

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !status ||
      !['scheduled', 'in-progress', 'completed'].includes(status)
    ) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();

    const interview = (await Interview.findById(id)) as IInterview | null;

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview
    const isOwner = (userId && interview.userId === userId) || (guestId && interview.guestId === guestId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update status and set startDateTime if starting interview
    interview.status = status;
    if (status === 'in-progress') {
      interview.startDateTime = new Date();
    }

    await interview.save();

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}
