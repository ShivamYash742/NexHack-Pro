import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateWithGroq } from '@/lib/groq';
import { parsePDF, truncateForAI } from '@/lib/pdf';
import dbConnect from '@/lib/mongodb';
import UserProfile from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, fileContent, fileName } = body;
    
    console.log('process-resume called with:', { 
      fileUrl, 
      fileName,
      fileContentType: typeof fileContent,
      fileContentLength: fileContent?.length,
      isBase64PDF: fileContent?.startsWith('data:application/pdf')
    });

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
        console.log('Detected PDF data, starting parse...');
        
        // Remove data URL prefix if present
        let base64Data = fileContent;
        if (fileContent.startsWith('data:')) {
          base64Data = fileContent.split(',')[1];
        }
        
        console.log('Base64 data length:', base64Data.length);
        
        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        console.log('PDF buffer created, size:', pdfBuffer.length);
        
        // Parse PDF using shared utility
        processedContent = await parsePDF(pdfBuffer);
        console.log('PDF parsed in process-resume, extracted text length:', processedContent.length);
      } catch (pdfError) {
        console.error('Error parsing PDF in process-resume:', pdfError);
        console.error('PDF error stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace');
        
        // Return error instead of falling back
        return NextResponse.json(
          { 
            error: 'Failed to parse PDF file', 
            details: pdfError instanceof Error ? pdfError.message : String(pdfError)
          },
          { status: 400 }
        );
      }
    }

    // Check if we have content
    if (!processedContent || processedContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content could be extracted from the file.' },
        { status: 400 }
      );
    }

    // Truncate file content to avoid API size limits
    const truncatedContent = truncateForAI(processedContent);

    // Generate resume summary using Groq (with automatic model fallback)
    const { text: resumeSummary } = await generateWithGroq(
      `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${truncatedContent}`
    );

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
    console.error('Error processing resume - FULL ERROR:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
