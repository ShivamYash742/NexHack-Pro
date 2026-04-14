import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage, BUCKET_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { generateWithGroq } from '@/lib/groq';
import { parsePDF, truncateForAI } from '@/lib/pdf';
import dbConnect from '@/lib/mongodb';
import UserProfile from '@/lib/models/User';
import { getResumeSummaryPrompt } from '@/lib/promptHelper';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file to Appwrite
    const fileId = ID.unique();
    await storage.createFile(BUCKET_ID, fileId, file);

    // Get file URL
    const fileUrl = storage.getFileView(BUCKET_ID, fileId);

    // Read file content for AI processing
    const fileBuffer = await file.arrayBuffer();
    let fileContent = '';

    // Check if it's a PDF file
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Parse PDF using shared utility
        fileContent = await parsePDF(Buffer.from(fileBuffer));
        console.log('PDF parsed successfully, extracted text length:', fileContent.length);
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        return NextResponse.json(
          { error: 'Failed to parse PDF file. Please ensure the file is a valid PDF.' },
          { status: 400 }
        );
      }
    } else {
      // For text files, convert buffer to string
      fileContent = Buffer.from(fileBuffer).toString('utf-8');
    }

    // Check if we extracted any content
    if (!fileContent || fileContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content could be extracted from the file. The PDF may be scanned images or empty.' },
        { status: 400 }
      );
    }

    // Truncate file content to avoid API size limits
    const truncatedContent = truncateForAI(fileContent);

    // Generate resume summary using Groq (with automatic model fallback)
    const prompt = getResumeSummaryPrompt(truncatedContent);
    const { text: resumeSummary } = await generateWithGroq(prompt);

    // Connect to database and save/update user profile
    await dbConnect();

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        resumeUrl: fileUrl.toString(),
        resumeSummary,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl.toString(),
      resumeSummary,
      userProfile,
      extractedTextLength: fileContent.length,
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}
