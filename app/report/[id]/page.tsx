'use client';

import { useParams } from 'next/navigation';
import InterviewReport from '@/components/interview-report';

export default function ReportPage() {
  const params = useParams();
  const interviewId = params.id as string;

  return <InterviewReport interviewId={interviewId} />;
}
