import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage, BUCKET_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});
import { generateText } from 'ai';
import dbConnect from '@/lib/mongodb';
import UserProfile from '@/lib/models/User';

// Dynamic import for pdf-parse to avoid ESM issues
async function parsePDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

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
        // Parse PDF to extract text using dynamic import
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

    // Truncate file content to avoid API size limits (max ~8000 chars)
    const truncatedContent = fileContent.length > 8000 
      ? fileContent.substring(0, 8000) + '\n\n[Content truncated due to length]'
      : fileContent;

    // Generate resume summary using Gemini
    const { text: resumeSummary } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${truncatedContent}`,
    });

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
