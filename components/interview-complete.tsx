import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, sessionId }),
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/20 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-64 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-64 left-1/2 w-96 h-96 bg-green-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <Card className="max-w-xl w-full border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="p-8 sm:p-12 space-y-10">
          
          {/* Success Icon and Title */}
          <div
            className={`text-center space-y-6 transition-all duration-1000 ease-out transform ${
              showAnimation ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
            }`}
          >
            <div className="flex justify-center relative">
               <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
               <div className="p-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 relative z-10 shadow-lg shadow-green-500/30">
                 <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
               </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Mission Accomplished
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                You&apos;ve successfully completed your mock interview. The data has been captured and is ready for analysis.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex flex-col sm:flex-row justify-center items-center gap-4 transition-all duration-1000 delay-300 ease-out transform ${
              showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {!reportGenerated && interviewId && sessionId && (
              <Button 
                size="lg" 
                onClick={generateReport}
                disabled={generatingReport}
                className="w-full sm:w-auto h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 transition-all active:scale-95 group relative overflow-hidden"
              >
                {generatingReport ? (
                  <>
                     <Loader2 className="mr-3 w-5 h-5 animate-spin" />
                     Synthesizing Insights...
                  </>
                ) : (
                  <>
                     <Sparkles className="mr-3 w-5 h-5 group-hover:animate-pulse" />
                     Generate Detailed Report
                  </>
                )}
                {/* Shine effect inside button */}
                <div className="absolute inset-0 -translate-x-[150%] bg-white/20 skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-out]" />
              </Button>
            )}
            
            {reportGenerated && (
              <Button 
                size="lg" 
                asChild 
                className="w-full sm:w-auto h-14 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-emerald-500/25 transition-all active:scale-95 group"
              >
                <Link href={`/report/${interviewId}`}>
                  View Intelligence Report
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
            
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-14 px-8 border-border/60 hover:bg-muted/50 backdrop-blur-sm transition-all active:scale-95">
              <Link href="/interview/new">
                Back to Dashboard
              </Link>
            </Button>
          </div>

        </div>
      </Card>
    </div>
  );
};

export default InterviewComplete;
