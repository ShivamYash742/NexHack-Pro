import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    const { fileUrl, fileContent, fileName } = await req.json();

    if (!fileUrl || !fileContent) {
      return NextResponse.json(
        { error: 'File URL and content are required' },
        { status: 400 }
      );
    }

    let processedContent = fileContent;

    // If fileContent appears to be base64 PDF data, parse it
    if (fileContent.startsWith('data:application/pdf') || fileContent.startsWith('JVBER')) {
      try {
        // Remove data URL prefix if present
        let base64Data = fileContent;
        if (fileContent.startsWith('data:')) {
          base64Data = fileContent.split(',')[1];
        }
        
        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        
        // Parse PDF using dynamic import
        processedContent = await parsePDF(pdfBuffer);
        console.log('PDF parsed in process-resume, extracted text length:', processedContent.length);
      } catch (pdfError) {
        console.error('Error parsing PDF in process-resume:', pdfError);
        // Fall back to original content if parsing fails
        console.log('Falling back to original content');
      }
    }

    // Check if we have content
    if (!processedContent || processedContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content could be extracted from the file.' },
        { status: 400 }
      );
    }

    // Truncate file content to avoid API size limits (max ~8000 chars)
    const truncatedContent = processedContent.length > 8000 
      ? processedContent.substring(0, 8000) + '\n\n[Content truncated due to length]'
      : processedContent;

    // Generate resume summary using Gemini
    const { text: resumeSummary } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${truncatedContent}`,
    });

    console.log('resumeSummary', resumeSummary);

    // Connect to database and save/update user profile
    await dbConnect();

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        resumeUrl: fileUrl,
        resumeSummary,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      fileUrl,
      resumeSummary,
      userProfile,
      fileName,
      extractedTextLength: processedContent.length,
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}
