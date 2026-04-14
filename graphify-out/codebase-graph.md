# 🧠 NexHack-Pro — Codebase Knowledge Graph

> **Project:** MockMentor AI Interview Platform  
> **Stack:** Next.js 15 · TypeScript · MongoDB Atlas · Appwrite · Clerk Auth · Gemini AI  
> **Generated:** 2026-04-14

---

## 📐 System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer (Browser)"]
        P["Landing Page\n/app/page.tsx"]
        PI["Interview Setup\n/app/interview/new"]
        IV["Live Interview\n/app/interview/[id]"]
        RP["Report Viewer\n/app/report/[id]"]
        TS["Speech Test\n/app/test-speech"]
    end

    subgraph Components["⚛️ React Components"]
        HeroS["HeroSection"]
        Ment["Mentors"]
        FeatS["FeaturesSection"]
        DemoS["DemosSection"]

        IntComp["Interview\n(Main UI)"]
        IntCmplt["InterviewComplete"]
        IntRpt["InterviewReport"]
        LoadSkel["LoadingSkeleton"]
        Navbar["Navbar"]
    end

    subgraph Logic["🧠 Logic Layer"]
        VIC["VoiceInterviewContext\n(React Context)"]
        UVI["useVoiceInterview\n(Orchestrator Hook)"]
        STT["useSpeechToText\n(Browser Web Speech API)"]
        TTS["useTextToSpeech\n(Browser SpeechSynthesis)"]
    end

    subgraph API["🔌 API Routes (Next.js)"]
        A_CHAT["/api/ai-chat\nInterview Q&A"]
        A_RPT["/api/generate-report\nAI Analysis"]
        A_JOB["/api/process-job\nJob Description AI"]
        A_RES["/api/process-resume\nResume AI"]
        A_UPRES["/api/upload-resume\nFile Upload"]
        A_CINT["/api/create-interview\nDB Write"]
        A_SESS["/api/interview-session\nSession State"]
        A_INT["/api/interview\nInterview DB Read"]
        A_UPROF["/api/user-profile\nUser Data"]
    end

    subgraph External["☁️ External Services"]
        GEM["Google Gemini AI\ngemini-2.5-flash\ngemini-2.0-flash\ngemini-1.5-pro"]
        MONGO["MongoDB Atlas\n(Primary DB)"]
        CLERK["Clerk Auth\n(Identity)"]
        APPW["Appwrite Storage\n(Resume PDFs)"]
    end

    subgraph Models["📦 DB Models (Mongoose)"]
        M_INT["Interview\n(job, role, mentorId,\nuserSummary, jobSummary)"]
        M_SESS["InterviewSession\n(messages[],\nmetrics{})"]
        M_RPT["InterviewReport\n(performanceAnalysis,\ndetailedFeedback)"]
        M_USR["User\n(clerkId, profile)"]
    end

    P --> HeroS & Ment & FeatS & DemoS & Navbar
    PI --> A_CINT & A_UPRES & A_JOB & A_RES
    IV --> IntComp
    IntComp --> VIC & UVI
    UVI --> STT & TTS & A_CHAT
    VIC --> UVI
    IntComp --> A_SESS
    IntCmplt --> A_RPT
    RP --> IntRpt
    IntRpt --> A_INT & A_RPT

    A_CHAT --> GEM
    A_RPT --> GEM
    A_JOB --> GEM
    A_RES --> GEM
    A_UPRES --> APPW

    A_CINT --> MONGO
    A_SESS --> MONGO
    A_RPT --> MONGO
    A_INT --> MONGO
    A_UPROF --> MONGO

    MONGO --> M_INT & M_SESS & M_RPT & M_USR
    CLERK --> A_CHAT & A_RPT & A_CINT & A_UPROF
```

---

## 🔄 Full Interview Data Flow

```mermaid
sequenceDiagram
    actor User
    participant Page as Interview Setup Page
    participant ChatAPI as /api/ai-chat
    participant GeminiAI as Gemini AI
    participant SessionAPI as /api/interview-session
    participant ReportAPI as /api/generate-report
    participant MongoDB

    User->>Page: Upload Resume + Job URL
    Page->>+/api/upload-resume: PDF → Appwrite Storage
    /api/upload-resume-->>-Page: fileId
    Page->>+/api/process-resume: fileId → extract text
    /api/process-resume->>GeminiAI: Summarize Resume
    GeminiAI-->>+/api/process-resume: userSummary
    /api/process-resume-->>-Page: userSummary
    Page->>+/api/process-job: Job URL/desc
    /api/process-job->>GeminiAI: Summarize Job
    GeminiAI-->>+/api/process-job: jobSummary
    /api/process-job-->>-Page: jobSummary
    Page->>+/api/create-interview: role + summaries
    /api/create-interview->>MongoDB: Save Interview doc
    MongoDB-->>+/api/create-interview: interviewId
    /api/create-interview-->>-Page: interviewId

    User->>Page: Start Interview
    Page->>SessionAPI: POST action=start
    SessionAPI->>MongoDB: Create InterviewSession
    Page->>ChatAPI: START_INTERVIEW message
    ChatAPI->>GeminiAI: Generate welcome prompt
    GeminiAI-->>ChatAPI: Welcome message
    ChatAPI-->>Page: speakMessage()

    loop Each Q&A Round
        User->>Page: Speaks via mic (STT → text)
        Page->>ChatAPI: user text + conversation history
        ChatAPI->>GeminiAI: Next interview question
        GeminiAI-->>ChatAPI: question text
        ChatAPI-->>Page: TTS speaks question
        Page->>SessionAPI: POST action=add_message
        SessionAPI->>MongoDB: Append to messages[]
    end

    User->>Page: End Interview
    Page->>SessionAPI: POST action=end with metrics
    SessionAPI->>MongoDB: Save metrics{}
    Page->>ReportAPI: POST interviewId + sessionId
    ReportAPI->>MongoDB: Fetch Interview + Session
    ReportAPI->>GeminiAI: Full transcript + metrics → JSON analysis
    GeminiAI-->>ReportAPI: PerformanceAnalysis JSON
    ReportAPI->>MongoDB: Save InterviewReport
    ReportAPI-->>Page: Report data
    Page->>User: Show Report Viewer
```

---

## ⚛️ Component Hierarchy

```mermaid
graph TD
    subgraph Pages
        LP["/ (Landing)"]
        NP["/interview/new (Setup)"]
        IP["/interview/[id] (Live)"]
        RPP["/report/[id] (Report)"]
    end

    subgraph Landing["Landing Sections"]
        LP --> Navbar
        LP --> HeroSection
        LP --> Mentors
        LP --> FeaturesSection
        LP --> DemosSection
        LP --> Footer
    end

    subgraph Live["Live Interview Stack"]
        IP --> Interview
        Interview --> LoadingSkeleton
        Interview --> VoiceInterviewContext
        VoiceInterviewContext --> useVoiceInterview
        useVoiceInterview --> useSpeechToText
        useVoiceInterview --> useTextToSpeech
        Interview --> InterviewComplete
    end

    subgraph ReportViewer["Report"]
        RPP --> InterviewReport
        InterviewReport --> UI_Card["Card, Badge, Progress,\nScrollArea (Radix UI)"]
    end

    subgraph UIKit["shadcn/ui Kit"]
        Button
        Input
        Badge
        Card
        Progress
        ScrollArea
        AlertDialog
        Avatar
        Separator
    end
```

---

## 🤖 AI Pipeline & Fallback Strategy

```mermaid
flowchart TD
    REQ["API Request"] --> TRY1

    subgraph FallbackChain["Gemini Model Fallback Chain"]
        TRY1["Try: gemini-2.5-flash"] -->|"✅ Success"| DONE
        TRY1 -->|"❌ 429 / 503"| TRY2
        TRY2["Try: gemini-2.0-flash"] -->|"✅ Success"| DONE
        TRY2 -->|"❌ Fail"| TRY3
        TRY3["Try: gemini-1.5-pro"] -->|"✅ Success"| DONE
        TRY3 -->|"❌ All Failed"| FALLBACK
    end

    DONE["Return AI Analysis JSON"]
    FALLBACK["🔧 Heuristic Fallback Engine\n(Deterministic scoring\nfrom speech metrics)"]
    FALLBACK --> FALLBACK_RPT["Return Edge Heuristics Report\n(WPM + Filler Words + Confidence Index)"]
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    INTERVIEW {
        ObjectId _id
        string userId
        string jobTitle
        string jobDescription
        string jobSummary
        string userSummary
        string resumeFileId
        string mentorId
        string role
        string status
        ObjectId reportId
        Date createdAt
    }

    INTERVIEW_SESSION {
        ObjectId _id
        ObjectId interviewId
        string userId
        string status
        Message_Array messages
        IInterviewMetrics metrics
        Date startTime
        Date endTime
    }

    INTERVIEW_REPORT {
        ObjectId _id
        ObjectId interviewId
        ObjectId sessionId
        string userId
        string jobTitle
        string mentorName
        PerformanceAnalysis performanceAnalysis
        DetailedFeedback detailedFeedback
        number interviewDuration
        Date generatedAt
        string reportVersion
    }

    USER {
        ObjectId _id
        string clerkId
        string email
        string name
    }

    INTERVIEW ||--o| INTERVIEW_SESSION : "has one"
    INTERVIEW ||--o| INTERVIEW_REPORT : "generates"
    USER ||--o{ INTERVIEW : "owns many"
```

---

## ⚡ State Machine — Voice Interview

```mermaid
stateDiagram-v2
    [*] --> INACTIVE : Page Load

    INACTIVE --> CONNECTING : User clicks Start Interview
    CONNECTING --> CONNECTED : 500ms setup delay

    CONNECTED --> CONNECTED : User speaks → STT → AI responds → TTS
    CONNECTED --> PAUSED : User clicks Pause

    PAUSED --> CONNECTED : User clicks Resume

    CONNECTED --> INACTIVE : User ends / 3-min timer expires
    PAUSED --> INACTIVE : User ends

    INACTIVE --> [*] : InterviewComplete rendered
```

---

## 🏗️ Project File Map

```
NexHack-Pro/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout (Clerk, Theme)
│   ├── globals.css                   # TailwindCSS v4 styles
│   ├── interview/
│   │   ├── new/                      # Interview setup wizard
│   │   └── [id]/                     # Live interview room
│   ├── report/                       # Report viewer page
│   ├── test-speech/                  # Speech API debug tool
│   └── api/
│       ├── ai-chat/                  # 🤖 Live interview Q&A (Gemini)
│       ├── generate-report/          # 📊 Post-interview AI analysis
│       ├── process-job/              # 💼 Job description summarizer
│       ├── process-resume/           # 📄 Resume text extractor
│       ├── upload-resume/            # 📁 PDF → Appwrite Storage
│       ├── create-interview/         # 🗃️ Interview DB creation
│       ├── interview/                # 🔍 Interview DB read
│       ├── interview-session/        # 💾 Session state management
│       └── user-profile/             # 👤 User data CRUD
│
├── components/
│   ├── interview.tsx                 # ⭐ Main live interview UI (567 lines)
│   ├── interview-complete.tsx        # Post-interview transition screen
│   ├── interview-report.tsx          # Full report visualization
│   ├── hero-section.tsx              # Landing hero with grid background
│   ├── mentors.tsx                   # AI mentor profiles & data
│   ├── features-section.tsx          # Feature showcase section
│   ├── demos-section.tsx             # Demo preview section
│   ├── loading-skeleton.tsx          # Shimmer loading state
│   ├── navbar.tsx                    # Navigation bar
│   ├── footer.tsx                    # Footer
│   ├── logic/
│   │   ├── VoiceInterviewContext.tsx # 🧠 Global AI state (Context + Provider)
│   │   ├── useVoiceInterview.ts      # 🎙️ Core orchestrator (STT+TTS+AI integration)
│   │   └── index.ts                  # Barrel exports
│   ├── ui/                           # shadcn/ui components (Radix primitives)
│   │   └── button, input, badge, card, progress,
│   │       avatar, scroll-area, separator, alert-dialog
│   └── magicui/                      # Animated UI utilities
│
├── hooks/
│   ├── useSpeechToText.ts            # 🎤 Web Speech API STT (5s silence timeout)
│   └── useTextToSpeech.ts            # 🔊 SpeechSynthesis TTS
│
├── lib/
│   ├── mongodb.ts                    # 🔌 Mongoose connection (globally cached)
│   ├── appwrite.ts                   # 📦 Appwrite Storage client
│   ├── appConfig.ts                  # App title / metadata
│   ├── utils.ts                      # Tailwind cn() merge utility
│   └── models/
│       ├── Interview.ts              # Mongoose schema
│       ├── InterviewSession.ts       # Mongoose schema + IInterviewMetrics
│       ├── InterviewReport.ts        # Mongoose schema (full AI output)
│       └── User.ts                   # Mongoose schema (Clerk integration)
│
├── model/                            # Python ML pipeline (standalone)
│   ├── new.py                        # Independent analysis script
│   ├── data/ & models/
│   └── requirements.txt
│
└── middleware.ts                     # Clerk Auth guard (protects all routes)
```

---

## 🔑 External Integrations

| Service | Purpose | SDK / Package |
|---|---|---|
| **Google Gemini AI** | Interview Q&A, report generation, resume/job summarization | `@ai-sdk/google`, `@google/generative-ai` |
| **Clerk** | Authentication, user management, JWT sessions | `@clerk/nextjs` |
| **MongoDB Atlas** | Primary persistent database (interviews, sessions, reports) | `mongoose` |
| **Appwrite Storage** | PDF resume file storage & retrieval | `appwrite` |
| **Browser Web Speech API** | Speech-to-Text (zero latency, no external API key) | native browser |
| **Browser SpeechSynthesis** | Text-to-Speech (zero latency, no external API key) | native browser |

---

## ⚡ Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Browser-native STT/TTS** | Zero-latency voice loop — no network round-trip to cloud speech APIs |
| **Gemini 3-model fallback chain** | Handles 429/503 rate limit errors gracefully without user-visible failures |
| **Heuristic fallback engine** | Last-resort deterministic report (WPM, filler words, confidence) when ALL Gemini models fail |
| **MongoDB mid-interview buffering** | Each message is persisted as it arrives — no data loss on crash or timeout |
| **Clerk server-side middleware guard** | All `/api/*` and `/interview/*` routes are protected at the edge |
| **VoiceInterviewContext decoupling** | AI state lives in context — `Interview.tsx` only reads, `useVoiceInterview.ts` writes |
| **Single unified Gemini prompt** | `generate-report` sends the full transcript + metrics in ONE request to avoid Vercel's 60s timeout |
| **`ahooks/useUnmount`** | Ensures camera tracks and voice sessions are properly torn down on component unmount |
