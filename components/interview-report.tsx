'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Brain,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Download,
  Share2,
  BarChart3,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface InterviewReportProps {
  interviewId: string;
  onBack?: () => void;
}

interface PerformanceScore {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

interface ReportData {
  _id: string;
  jobTitle: string;
  mentorName: string;
  interviewDuration: number;
  generatedAt: string;
  performanceAnalysis: {
    communicationSkills: PerformanceScore;
    technicalKnowledge: PerformanceScore;
    problemSolving: PerformanceScore;
    confidence: {
      score: number;
      analysis: string;
      recommendations: string[];
    };
    bodyLanguage: {
      score: number;
      observations: string[];
      recommendations: string[];
    };
  };
  detailedFeedback: {
    overallScore: number;
    summary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    specificFeedback: Array<{
      questionId: string;
      question: string;
      userResponse: string;
      feedback: string;
      score: number;
      suggestions: string[];
    }>;
    behavioralInsights: {
      pauseAnalysis: string;
      speechPaceAnalysis: string;
      confidenceAnalysis: string;
      emotionalStateAnalysis: string;
    };
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  };
}

const InterviewReport: React.FC<InterviewReportProps> = ({ interviewId, onBack }) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [interviewId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/generate-report?interviewId=${interviewId}`);
      const data = await response.json();

      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to fetch report');
      }
    } catch (err) {
      setError('Failed to fetch report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your interview report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Report Not Available</h2>
          <p className="text-muted-foreground">{error || 'Report not found'}</p>
          <Button onClick={onBack || (() => window.history.back())}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Interview Report</h1>
            <p className="text-muted-foreground">
              Detailed analysis of your {report.jobTitle} interview
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Interview Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Interviewer</p>
                  <p className="font-medium">{report.mentorName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(report.interviewDuration)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <Badge 
                    variant={getScoreBadgeVariant(report.detailedFeedback.overallScore)}
                    className="font-bold"
                  >
                    {report.detailedFeedback.overallScore}/100
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Performance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {report.detailedFeedback.summary}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Key Strengths
                </h4>
                <ul className="space-y-1">
                  {report.detailedFeedback.keyStrengths.map((strength, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-700 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {report.detailedFeedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Communication Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Communication Skills</h4>
                <Badge variant={getScoreBadgeVariant(report.performanceAnalysis.communicationSkills.score)}>
                  {report.performanceAnalysis.communicationSkills.score}/100
                </Badge>
              </div>
              <Progress value={report.performanceAnalysis.communicationSkills.score} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {report.performanceAnalysis.communicationSkills.feedback}
              </p>
            </div>

            <Separator />

            {/* Technical Knowledge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Technical Knowledge</h4>
                <Badge variant={getScoreBadgeVariant(report.performanceAnalysis.technicalKnowledge.score)}>
                  {report.performanceAnalysis.technicalKnowledge.score}/100
                </Badge>
              </div>
              <Progress value={report.performanceAnalysis.technicalKnowledge.score} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {report.performanceAnalysis.technicalKnowledge.feedback}
              </p>
            </div>

            <Separator />

            {/* Problem Solving */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Problem Solving</h4>
                <Badge variant={getScoreBadgeVariant(report.performanceAnalysis.problemSolving.score)}>
                  {report.performanceAnalysis.problemSolving.score}/100
                </Badge>
              </div>
              <Progress value={report.performanceAnalysis.problemSolving.score} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {report.performanceAnalysis.problemSolving.feedback}
              </p>
            </div>

            <Separator />

            {/* Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Confidence</h4>
                <Badge variant={getScoreBadgeVariant(report.performanceAnalysis.confidence.score)}>
                  {report.performanceAnalysis.confidence.score}/100
                </Badge>
              </div>
              <Progress value={report.performanceAnalysis.confidence.score} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {report.performanceAnalysis.confidence.analysis}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Behavioral Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Pause Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {report.detailedFeedback.behavioralInsights.pauseAnalysis}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Speech Pace</h4>
                <p className="text-sm text-muted-foreground">
                  {report.detailedFeedback.behavioralInsights.speechPaceAnalysis}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Confidence Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {report.detailedFeedback.behavioralInsights.confidenceAnalysis}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Emotional State</h4>
                <p className="text-sm text-muted-foreground">
                  {report.detailedFeedback.behavioralInsights.emotionalStateAnalysis}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-blue-700 mb-3">Immediate Actions</h4>
                <ul className="space-y-2">
                  {report.detailedFeedback.recommendations.immediate.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <ArrowRight className="w-3 h-3 mt-1 mr-2 text-blue-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-700 mb-3">Short-term Goals</h4>
                <ul className="space-y-2">
                  {report.detailedFeedback.recommendations.shortTerm.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <ArrowRight className="w-3 h-3 mt-1 mr-2 text-orange-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-700 mb-3">Long-term Development</h4>
                <ul className="space-y-2">
                  {report.detailedFeedback.recommendations.longTerm.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <ArrowRight className="w-3 h-3 mt-1 mr-2 text-green-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-6">
          <Button size="lg" asChild>
            <Link href="/interview/new">
              Take Another Interview
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={onBack || (() => window.history.back())}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;
