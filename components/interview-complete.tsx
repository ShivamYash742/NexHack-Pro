import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface InterviewCompleteProps {
  interviewId?: string;
  sessionId?: string | null;
}

const InterviewComplete: React.FC<InterviewCompleteProps> = ({ interviewId, sessionId }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const generateReport = async () => {
    if (!interviewId || !sessionId) return;
    
    setGeneratingReport(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReportGenerated(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Icon and Title */}
        <div
          className={`text-center space-y-4 transition-all duration-1000 ${
            showAnimation
              ? 'translate-y-0 opacity-100'
              : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Interview Completed!
            </h1>
            <p className="text-lg text-muted-foreground">
              Great job! You&apos;ve successfully completed your mock interview.
            </p>
          </div>
        </div>

        {/* Email Notification */}
        <div
          className={`text-center transition-all duration-1000 delay-300 ${
            showAnimation
              ? 'translate-y-0 opacity-100'
              : 'translate-y-10 opacity-0'
          }`}
        >
          <p className="text-muted-foreground">
            You will receive detailed feedback on your email soon
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className={`flex flex-col sm:flex-row justify-center gap-4 transition-all duration-1000 delay-500 ${
            showAnimation
              ? 'translate-y-0 opacity-100'
              : 'translate-y-10 opacity-0'
          }`}
        >
          {!reportGenerated && interviewId && sessionId && (
            <Button 
              size="lg" 
              onClick={generateReport}
              disabled={generatingReport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generatingReport ? 'Generating Report...' : 'Generate Detailed Report'}
            </Button>
          )}
          
          {reportGenerated && (
            <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
              <Link href={`/report/${interviewId}`}>
                View Report
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          )}
          
          <Button size="lg" variant="outline" asChild>
            <Link href="/interview/new">
              Take New Interview
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Motivational Message */}
        <div
          className={`text-center transition-all duration-1000 delay-700 ${
            showAnimation
              ? 'translate-y-0 opacity-100'
              : 'translate-y-10 opacity-0'
          }`}
        >
          <p className="text-sm text-muted-foreground italic">
            &quot;Success is where preparation and opportunity meets.&quot;
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewComplete;
