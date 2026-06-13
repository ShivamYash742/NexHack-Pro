import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';
import UserProfile from '@/lib/models/User';
import GuestUser from '@/lib/models/GuestUser';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { jobTitle, jobDescription, jobSummary, mentorId, guestId, resumeSummary } = body;

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jobTitle || !jobSummary) {
      return NextResponse.json(
        {
          error: 'Job title and job summary are required',
        },
        { status: 400 }
      );
    }

    if (guestId && !resumeSummary) {
      return NextResponse.json(
        {
          error: 'Resume summary is required for guest users',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    let userSummary: string;

    if (guestId) {
      const guestUser = await GuestUser.findOne({ guestId });
      if (!guestUser) {
        return NextResponse.json(
          { error: 'Guest user not found' },
          { status: 404 }
        );
      }

      if (guestUser.interviewCount >= 1) {
        return NextResponse.json(
          { error: 'Guest users can only take one interview. Please sign up for more.' },
          { status: 403 }
        );
      }

      userSummary = resumeSummary;
    } else {
      if (resumeSummary) {
        userSummary = resumeSummary;
      } else {
        const userProfile = await UserProfile.findOne({ userId }).exec();

        if (!userProfile || !userProfile.resumeSummary) {
          return NextResponse.json(
            {
              error: 'User profile with resume summary not found',
            },
            { status: 404 }
          );
        }

        userSummary = userProfile.resumeSummary;
      }
    }

    const interview = new Interview({
      userId,
      guestId,
      jobTitle,
      jobDescription,
      userSummary,
      jobSummary,
      mentorId,
      status: 'scheduled',
    });

    await interview.save();

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}