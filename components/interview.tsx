
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MessageSquare,
  Phone,
  Clock,
  X,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from './ui/input';
import { useMemoizedFn, useUnmount } from 'ahooks';
import {
  LiveAvatarSessionState,
} from './logic';
import { useLiveAvatarSession } from './logic';
import LoadingSkeleton from './loading-skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { mentors } from './mentors';
import InterviewComplete from './interview-complete';

const Interview = ({
  interviewId,
  knowledgeBase,
  role,
  mentorId,
}: {
  interviewId: string;
  knowledgeBase: string;
  role: string;
  mentorId: string;
}) => {
  const { sessionState, start, stop, attach, speakMessage } = useLiveAvatarSession();

  const mediaStream = useRef<HTMLVideoElement>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exitLoading, setExitLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [conversationMetrics, setConversationMetrics] = useState({
    totalPauses: 0,
    totalPauseTime: 0,
    longestPause: 0,
    userSpeakingTime: 0,
    fillerWordsCount: 0,
    wordsSpoken: 0,
  });
  interface ChatMessage {
    id: string;
    sender: 'user' | 'interviewer';
    text: string;
    timestamp: Date;
    pauseBefore?: number;
    duration?: number;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Timer state
  const [startTime, setStartTime] = useState(new Date());
  const [remainingTime, setRemainingTime] = useState(180); // 3 minutes in seconds

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Timer effect - countdown from 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );
      const remaining = Math.max(0, 180 - elapsed); // 180 seconds = 3 minutes
      setRemainingTime(remaining);

      // Auto-exit when time is up
      if (remaining === 0) {
        exitInterview();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]);

  // Initialize interview session
  useEffect(() => {
    if (interviewId && !sessionId) {
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/interview-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          action: 'start',
        }),
      });

      const data = await response.json();
      if (data.success && data.session) {
        setSessionId(data.session.id);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const saveMessageToSession = useCallback(async (messageData: Record<string, unknown>) => {
    if (!sessionId) return;

    try {
      await fetch('/api/interview-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          action: 'add_message',
          messageData,
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [sessionId, interviewId]);


  // Analyze speech for filler words
  const analyzeFillerWords = (text: string): number => {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
    let count = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (fillerWords.includes(word.replace(/[^a-z]/g, ''))) {
        count++;
      }
    });
    
    return count;
  };

  // Calculate words per minute
  const calculateWPM = (text: string, durationMs: number): number => {
    const words = text.split(/\s+/).length;
    const minutes = durationMs / 60000;
    return minutes > 0 ? Math.round(words / minutes) : 0;
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Get user media
  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: isMicOn })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => console.log('Error accessing media devices:', err));
    } else if (!isCameraOn && videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [isCameraOn, isMicOn]);

  useEffect(() => {
    console.log('Session state changed:', sessionState);
    if (sessionState === LiveAvatarSessionState.INACTIVE) {
      startSessionV2();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasWelcomed = useRef(false);

  useEffect(() => {
    if (sessionState === LiveAvatarSessionState.CONNECTED) {
      if (mediaStream.current) {
        attach(mediaStream.current);
      }
      
      setLoading(false);
      setStartTime(new Date());

      if (!hasWelcomed.current) {
        hasWelcomed.current = true;
        // Generate and speak AI welcome message
        setTimeout(async () => {
          try {
            console.log('Generating AI welcome message...');
            
            const response = await fetch('/api/ai-chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'START_INTERVIEW',
                conversationHistory: [],
                knowledgeBase,
                interviewContext: {
                  role,
                  candidateBackground: 'New candidate joining the interview',
                  duration: '3 minutes',
                },
              }),
            });

            const data = await response.json();
            
            if (data.success) {
              const welcomeMessage = data.response;
              console.log('AI welcome message:', welcomeMessage);
              speakMessage(welcomeMessage);
              
              // Add welcome message to chat
              const welcomeMsg = {
                id: 'welcome-1',
                sender: 'interviewer' as const,
                text: welcomeMessage,
                timestamp: new Date(),
              };
              setMessages([welcomeMsg]);
              saveMessageToSession(welcomeMsg);
            } else {
              // Fallback welcome message
              const fallbackWelcome = "Hello! Welcome to your mock interview. I'm excited to speak with you today.";
              speakMessage(fallbackWelcome);
              
              const welcomeMsg = {
                id: 'welcome-1',
                sender: 'interviewer' as const,
                text: fallbackWelcome,
                timestamp: new Date(),
              };
              setMessages([welcomeMsg]);
              saveMessageToSession(welcomeMsg);
            }
          } catch (error) {
            console.error('Error generating welcome message:', error);
            
            // Fallback welcome message
            const fallbackWelcome = "Hello! Welcome to your mock interview. I'm excited to speak with you today.";
            speakMessage(fallbackWelcome);
            
            const welcomeMsg = {
              id: 'welcome-1',
              sender: 'interviewer' as const,
              text: fallbackWelcome,
              timestamp: new Date(),
            };
              setMessages([welcomeMsg]);
            saveMessageToSession(welcomeMsg);
          }
        }, 1000); // Wait 1 second after starting
      }
    }
  }, [sessionState, attach, role, knowledgeBase, speakMessage, saveMessageToSession]);

  const startSessionV2 = useMemoizedFn(async () => {
    try {
      setLoading(true);
      await start(mentorId);
    } catch (error) {
      console.error('Error starting avatar session:', error);
      setLoading(false);
    }
  });

  useUnmount(() => {
    // Stop all media tracks (camera/microphone)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (sessionState !== LiveAvatarSessionState.INACTIVE) {
      stop();
    }
  });

  // The media stream is handled by attaching to the ref in useEffect


  // Function to get mentor name by ID
  // Handle real-time user speech messages
  // Handle complete user message and generate AI response

  const getMentorName = (id: string) => {
    const mentor = mentors.find(
      (mentor) => mentor.id === id || mentor.id.trim() === id.trim()
    );
    return mentor ? mentor.name : 'AI Interviewer';
  };

  const mentorName = getMentorName(mentorId);

  //

  const formatTime = (seconds: number) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (message.trim()) {
      const currentTime = Date.now();
      const pauseBefore = pauseStartTime ? currentTime - pauseStartTime : 0;
      
      // Analyze message for metrics
      const fillerCount = analyzeFillerWords(message);
      const wordCount = message.split(/\s+/).length;
      
      const newMessage = {
        id: (messages.length + 1).toString(),
        sender: 'user' as const,
        text: message,
        timestamp: new Date(),
        pauseBefore,
        duration: speechStartTime ? currentTime - speechStartTime : 0,
      };
      
      setMessages([...messages, newMessage]);
      
      // Update conversation metrics
      setConversationMetrics(prev => ({
        ...prev,
        fillerWordsCount: prev.fillerWordsCount + fillerCount,
        wordsSpoken: prev.wordsSpoken + wordCount,
        totalPauses: pauseBefore > 1000 ? prev.totalPauses + 1 : prev.totalPauses,
        totalPauseTime: prev.totalPauseTime + (pauseBefore > 1000 ? pauseBefore : 0),
        longestPause: Math.max(prev.longestPause, pauseBefore),
        userSpeakingTime: prev.userSpeakingTime + (speechStartTime ? currentTime - speechStartTime : 0),
      }));
      
      // Save message to session
      saveMessageToSession({
        ...newMessage,
        confidence: Math.random() * 0.3 + 0.7, // Simulated confidence score
        emotion: 'neutral',
      });
      
      setMessage('');
      setPauseStartTime(currentTime);
      setSpeechStartTime(null);

      // Note: AI responses are now handled through voice chat events
      // The handleUserMessageComplete function processes voice input and generates AI responses
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exitInterview = async () => {
    setExitLoading(true);

    // Calculate final metrics
    const totalDuration = Date.now() - startTime.getTime();
    const averagePauseLength = conversationMetrics.totalPauses > 0 
      ? conversationMetrics.totalPauseTime / conversationMetrics.totalPauses 
      : 0;
    const wordsPerMinute = calculateWPM(
      messages.filter(m => m.sender === 'user').map(m => m.text).join(' '),
      conversationMetrics.userSpeakingTime
    );
    
    const finalMetrics = {
      totalDuration,
      userSpeakingTime: conversationMetrics.userSpeakingTime,
      interviewerSpeakingTime: totalDuration - conversationMetrics.userSpeakingTime,
      totalPauses: conversationMetrics.totalPauses,
      averagePauseLength,
      longestPause: conversationMetrics.longestPause,
      averageResponseTime: averagePauseLength,
      wordsPerMinute,
      interruptionCount: 0, // Could be calculated from overlap detection
      fillerWordsCount: conversationMetrics.fillerWordsCount,
      confidenceScore: Math.max(0.3, 1 - (conversationMetrics.fillerWordsCount / Math.max(1, conversationMetrics.wordsSpoken))),
      emotionalTone: {
        positive: 0.6,
        neutral: 0.3,
        negative: 0.1,
        confident: 0.7,
        nervous: 0.3,
      },
    };

    // End session and update metrics
    if (sessionId) {
      try {
        await fetch('/api/interview-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interviewId,
            action: 'end',
            metricsData: finalMetrics,
          }),
        });
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }

    // Stop all media tracks (camera/microphone)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      videoRef.current.srcObject = null;
    }

    await stop();
    setIsInterviewComplete(true);
  };

  // Show InterviewComplete component if interview is complete
  if (isInterviewComplete) {
    return <InterviewComplete interviewId={interviewId} sessionId={sessionId} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col px-4">
      {loading && <LoadingSkeleton />}
      <div className="flex flex-row items-center gap-2 py-4">
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
        </div>
        <h1 className="text-md font-semibold overflow-hidden whitespace-nowrap text-ellipsis">
          {role || ''} Interview{' '}
        </h1>
        {!loading && (
          <Badge
            variant={remainingTime <= 30 ? 'destructive' : 'secondary'}
            className="flex items-center space-x-1 shrink-0"
          >
            <Clock className="w-3 h-3" />
            <span>{formatTime(remainingTime)}</span>
          </Badge>
        )}
      </div>
      {/* Main Content */}
      <div className="flex flex-1 max-w-7xl mx-auto">
        {/* Video Section */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isChatOpen ? 'lg:pr-2' : ''
          }`}
        >
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 no-h-[calc(100vh-140px)]">
            {/* Interviewer Video */}
            <div className="relative overflow-hidden rounded-lg border">
              <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-white text-sm font-medium">
                  {mentorName}
                </span>
              </div>
              <div className="relative h-full bg-muted">
                {sessionState !== LiveAvatarSessionState.INACTIVE ? (
                  <video
                    playsInline
                    ref={mediaStream}
                    autoPlay
                    className="w-full h-full object-cover"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarFallback className="text-lg">AI</AvatarFallback>
                      </Avatar>
                      <p className="text-muted-foreground">
                        AI Interviewer joining soon...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Video */}
            <div className="relative overflow-hidden rounded-lg border">
              <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-white text-sm font-medium">You</span>
              </div>
              <div className="relative h-full bg-muted">
                {isCameraOn ? (
                  <video
                    playsInline
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <CameraOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={`flex flex-col pl-2 transition-all duration-300 ${
            isChatOpen ? 'w-full lg:w-96 bg-muted lg:bg-background' : 'w-0'
          } ${
            isChatOpen
              ? 'fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto'
              : 'hidden'
          }`}
        >
          <div className="bg-muted/30 h-full flex flex-col rounded-none lg:rounded-lg lg:border">
            <div className="flex items-center justify-between py-2 px-3 border-b">
              <div className="text-lg flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Interview Chat</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col flex-1 pt-2">
              {/* Messages */}
              <ScrollArea
                className="px-4 flex flex-1 flex-col"
                ref={chatScrollRef}
              >
                <div className="space-y-4 pb-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          msg.sender === 'user' ? 'order-2' : 'order-1'
                        }`}
                      >
                        <div
                          className={`border rounded-lg px-3 py-2 text-sm ${
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {/* Message Input */}
              <div className="border-t p-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (!speechStartTime && e.target.value.length === 1) {
                        setSpeechStartTime(Date.now());
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                      if (!speechStartTime) {
                        setSpeechStartTime(Date.now());
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="py-4 flex justify-center space-x-4">
        {/* <Button
          onClick={() => {
            startSessionV2(true);
          }}
        >
          Start
        </Button> */}
        <Button
          variant={isCameraOn ? 'default' : 'secondary'}
          size="icon"
          onClick={() => setIsCameraOn(!isCameraOn)}
          className="rounded-full"
        >
          {isCameraOn ? <Camera /> : <CameraOff />}
        </Button>
        <Button
          variant={isMicOn ? 'default' : 'secondary'}
          size="icon"
          onClick={() => setIsMicOn(!isMicOn)}
          className="rounded-full"
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </Button>
        {/* <Button
          variant={isChatOpen ? 'default' : 'secondary'}
          size="icon"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="rounded-full"
        >
          <MessageSquare />
        </Button> */}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="destructive"
              // onClick={exitInterview}
              className="rounded-full"
            >
              <Phone />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to exit the Interview?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={exitLoading} onClick={exitInterview}>
                Exit Interview
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Interview;
