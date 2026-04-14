# Graph Report - .  (2026-04-14)

## Corpus Check
- Large corpus: 79 files · ~1,057,205 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 171 nodes · 129 edges · 62 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Route Handlers|API Route Handlers]]
- [[_COMMUNITY_Project Assets & Setup Docs|Project Assets & Setup Docs]]
- [[_COMMUNITY_Interview Setup Wizard|Interview Setup Wizard]]
- [[_COMMUNITY_Speech Test Page|Speech Test Page]]
- [[_COMMUNITY_Interview Session UI|Interview Session UI]]
- [[_COMMUNITY_CV Stress Tracker (Python)|CV Stress Tracker (Python)]]
- [[_COMMUNITY_Radix UI Primitives|Radix UI Primitives]]
- [[_COMMUNITY_Scoring & Report Analytics|Scoring & Report Analytics]]
- [[_COMMUNITY_Python CV Dependencies|Python CV Dependencies]]
- [[_COMMUNITY_Avatar UI Component|Avatar UI Component]]
- [[_COMMUNITY_Card UI Component|Card UI Component]]
- [[_COMMUNITY_Theme System|Theme System]]
- [[_COMMUNITY_Voice Interview Context|Voice Interview Context]]
- [[_COMMUNITY_Scroll Area Component|Scroll Area Component]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Interview Session Page|Interview Session Page]]
- [[_COMMUNITY_Report Viewer Page|Report Viewer Page]]
- [[_COMMUNITY_Demos Section|Demos Section]]
- [[_COMMUNITY_Features Section|Features Section]]
- [[_COMMUNITY_Hero Section|Hero Section]]
- [[_COMMUNITY_Interview Completion Flow|Interview Completion Flow]]
- [[_COMMUNITY_Interview Report Display|Interview Report Display]]
- [[_COMMUNITY_Mentors Showcase|Mentors Showcase]]
- [[_COMMUNITY_Navigation Bar|Navigation Bar]]
- [[_COMMUNITY_Section Heading|Section Heading]]
- [[_COMMUNITY_Voice Interview Hook|Voice Interview Hook]]
- [[_COMMUNITY_Marquee Animation|Marquee Animation]]
- [[_COMMUNITY_Badge Component|Badge Component]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Separator Component|Separator Component]]
- [[_COMMUNITY_MongoDB Connection|MongoDB Connection]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Speech-to-Text Hook|Speech-to-Text Hook]]
- [[_COMMUNITY_Text-to-Speech Hook|Text-to-Speech Hook]]
- [[_COMMUNITY_HR Mentor Avatars|HR Mentor Avatars]]
- [[_COMMUNITY_IT Mentor Avatars|IT Mentor Avatars]]
- [[_COMMUNITY_TypeScript Global Types|TypeScript Global Types]]
- [[_COMMUNITY_Next.js Middleware|Next.js Middleware]]
- [[_COMMUNITY_Next Environment Config|Next Environment Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Footer Component|Footer Component]]
- [[_COMMUNITY_Loading Skeleton|Loading Skeleton]]
- [[_COMMUNITY_Library Index|Library Index]]
- [[_COMMUNITY_Input Component|Input Component]]
- [[_COMMUNITY_Progress Component|Progress Component]]
- [[_COMMUNITY_Appwrite App Config|Appwrite App Config]]
- [[_COMMUNITY_Appwrite Client|Appwrite Client]]
- [[_COMMUNITY_Interview Mongoose Model|Interview Mongoose Model]]
- [[_COMMUNITY_Report Mongoose Model|Report Mongoose Model]]
- [[_COMMUNITY_Session Mongoose Model|Session Mongoose Model]]
- [[_COMMUNITY_User Mongoose Model|User Mongoose Model]]
- [[_COMMUNITY_Demo User Aditya|Demo User Aditya]]
- [[_COMMUNITY_Demo User Arjun|Demo User Arjun]]
- [[_COMMUNITY_Demo User Dinojan|Demo User Dinojan]]
- [[_COMMUNITY_Demo User Issac|Demo User Issac]]
- [[_COMMUNITY_Demo User Jaffar|Demo User Jaffar]]
- [[_COMMUNITY_Demo User Jonathan|Demo User Jonathan]]
- [[_COMMUNITY_Demo User Nehtteen|Demo User Nehtteen]]
- [[_COMMUNITY_Demo User Sai|Demo User Sai]]
- [[_COMMUNITY_Demo User Shivam|Demo User Shivam]]
- [[_COMMUNITY_Teacher Mentor Avatar|Teacher Mentor Avatar]]

## God Nodes (most connected - your core abstractions)
1. `NexHack Pro Project` - 10 edges
2. `POST()` - 9 edges
3. `addLog()` - 7 edges
4. `analyzeConversationWithAI()` - 4 edges
5. `GET()` - 4 edges
6. `Groq LLaMA 3.1 AI Service` - 4 edges
7. `Python Stress Tracker (CV)` - 4 edges
8. `Interview Performance Report` - 4 edges
9. `parsePDF()` - 3 edges
10. `handleNextStep()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `NexHack Pro Cover/Hero Image` --conceptually_related_to--> `NexHack Pro Project`  [INFERRED]
  public/cover.png → README.md
- `MockMentor Demo Animation` --conceptually_related_to--> `NexHack Pro Project`  [INFERRED]
  public/mockmentor.gif → README.md
- `Mentor Bryan (IT Professional)` --conceptually_related_to--> `NexHack Pro Project`  [INFERRED]
  public/mentors/Bryan_IT_Sitting_public.webp → README.md
- `Google Gemini API Integration` --semantically_similar_to--> `Groq LLaMA 3.1 AI Service`  [INFERRED] [semantically similar]
  GEMINI_SETUP.md → README.md
- `FastAPI Python Package` --conceptually_related_to--> `Python Stress Tracker (CV)`  [INFERRED]
  model/requirements.txt → README.md

## Hyperedges (group relationships)
- **AI Interview Pipeline** — readme_groq_llama, readme_star_method, readme_interview_report [INFERRED 0.85]
- **Voice Interview Interface** — readme_web_speech_api, speech_test_tts, speech_test_stt [EXTRACTED 0.90]

## Communities

### Community 0 - "API Route Handlers"
Cohesion: 0.16
Nodes (6): analyzeConversationWithAI(), analyzeVideoEmotions(), generateSyntheticVideoInsights(), GET(), parsePDF(), POST()

### Community 1 - "Project Assets & Setup Docs"
Cohesion: 0.13
Nodes (16): NexHack Pro Cover/Hero Image, @ai-sdk/google Package, Google Gemini API Integration, Mentor Bryan (IT Professional), MockMentor Demo Animation, Appwrite File Storage, Clerk Authentication, Groq LLaMA 3.1 AI Service (+8 more)

### Community 2 - "Interview Setup Wizard"
Cohesion: 0.32
Nodes (3): handleNextStep(), processJobDetails(), uploadResume()

### Community 3 - "Speech Test Page"
Cohesion: 0.46
Nodes (7): addLog(), async(), handleClearLogs(), handleStartSTT(), handleStopSTT(), handleTestTTS(), testMicrophone()

### Community 4 - "Interview Session UI"
Cohesion: 0.32
Nodes (3): analyzeFillerWords(), calculateWPM(), exitInterview()

### Community 5 - "CV Stress Tracker (Python)"
Cohesion: 0.29
Nodes (7): draw_landmarks_on_frame(), eye_aspect_ratio(), get_hand_center(), Get the centroid of hand landmarks., Draw landmarks and optional connections on a frame., Calculate eye aspect ratio from face landmarks list., safe_distance()

### Community 6 - "Radix UI Primitives"
Cohesion: 0.29
Nodes (0): 

### Community 7 - "Scoring & Report Analytics"
Cohesion: 0.33
Nodes (6): Behavioral Analysis Insights, Enhanced Personality Profiling, Big Five Personality Profiling, Interview Performance Report, STAR Method Scoring, Strict Scoring Rubric Update

### Community 8 - "Python CV Dependencies"
Cohesion: 0.4
Nodes (5): MediaPipe Face/Hand/Pose CV, Python Stress Tracker (CV), FastAPI Python Package, MediaPipe Python Package, OpenCV Python Library

### Community 9 - "Avatar UI Component"
Cohesion: 0.5
Nodes (0): 

### Community 10 - "Card UI Component"
Cohesion: 0.5
Nodes (0): 

### Community 11 - "Theme System"
Cohesion: 0.67
Nodes (0): 

### Community 12 - "Voice Interview Context"
Cohesion: 0.67
Nodes (0): 

### Community 13 - "Scroll Area Component"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Landing Page"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Interview Session Page"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Report Viewer Page"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Demos Section"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Features Section"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Hero Section"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Interview Completion Flow"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Interview Report Display"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Mentors Showcase"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Navigation Bar"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Section Heading"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Voice Interview Hook"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Marquee Animation"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Badge Component"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Button Component"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Separator Component"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "MongoDB Connection"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Utility Functions"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Speech-to-Text Hook"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Text-to-Speech Hook"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "HR Mentor Avatars"
Cohesion: 1.0
Nodes (2): June (HR Mentor), Silas (HR Mentor)

### Community 36 - "IT Mentor Avatars"
Cohesion: 1.0
Nodes (2): Elenora (IT Mentor), Wayne (Tech Mentor)

### Community 37 - "TypeScript Global Types"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Next.js Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Next Environment Config"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Footer Component"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Loading Skeleton"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Library Index"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Input Component"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Progress Component"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Appwrite App Config"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Appwrite Client"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Interview Mongoose Model"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Report Mongoose Model"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Session Mongoose Model"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "User Mongoose Model"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Demo User Aditya"
Cohesion: 1.0
Nodes (1): Demo User: Aditya

### Community 53 - "Demo User Arjun"
Cohesion: 1.0
Nodes (1): Demo User: Arjun

### Community 54 - "Demo User Dinojan"
Cohesion: 1.0
Nodes (1): Demo User: Dinojan

### Community 55 - "Demo User Issac"
Cohesion: 1.0
Nodes (1): Demo User: Issac

### Community 56 - "Demo User Jaffar"
Cohesion: 1.0
Nodes (1): Demo User: Jaffar

### Community 57 - "Demo User Jonathan"
Cohesion: 1.0
Nodes (1): Demo User: Jonathan

### Community 58 - "Demo User Nehtteen"
Cohesion: 1.0
Nodes (1): Demo User: Nehtteen

### Community 59 - "Demo User Sai"
Cohesion: 1.0
Nodes (1): Demo User: Sai

### Community 60 - "Demo User Shivam"
Cohesion: 1.0
Nodes (1): Demo User: Shivam

### Community 61 - "Teacher Mentor Avatar"
Cohesion: 1.0
Nodes (1): Judy (Teacher Mentor)

## Knowledge Gaps
- **32 isolated node(s):** `Calculate eye aspect ratio from face landmarks list.`, `Get the centroid of hand landmarks.`, `Draw landmarks and optional connections on a frame.`, `Next.js 15 App Router`, `Clerk Authentication` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Landing Page`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Interview Session Page`** (2 nodes): `page.tsx`, `InterviewPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Report Viewer Page`** (2 nodes): `page.tsx`, `ReportPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demos Section`** (2 nodes): `demos-section.tsx`, `DemoCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Features Section`** (2 nodes): `features-section.tsx`, `FeatureCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero Section`** (2 nodes): `hero-section.tsx`, `RetroGrid()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Interview Completion Flow`** (2 nodes): `interview-complete.tsx`, `generateReport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Interview Report Display`** (2 nodes): `interview-report.tsx`, `InterviewReport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mentors Showcase`** (2 nodes): `mentors.tsx`, `MentorCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navigation Bar`** (2 nodes): `navbar.tsx`, `Navbar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Section Heading`** (2 nodes): `section-heading.tsx`, `SectionHeading()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Interview Hook`** (2 nodes): `useVoiceInterview.ts`, `useVoiceInterview()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Marquee Animation`** (2 nodes): `marquee.tsx`, `Marquee()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge Component`** (2 nodes): `Badge()`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button Component`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Separator Component`** (2 nodes): `separator.tsx`, `Separator()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MongoDB Connection`** (2 nodes): `mongodb.ts`, `dbConnect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility Functions`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Speech-to-Text Hook`** (2 nodes): `useSpeechToText.ts`, `useSpeechToText()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Text-to-Speech Hook`** (2 nodes): `useTextToSpeech.ts`, `useTextToSpeech()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HR Mentor Avatars`** (2 nodes): `June (HR Mentor)`, `Silas (HR Mentor)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `IT Mentor Avatars`** (2 nodes): `Elenora (IT Mentor)`, `Wayne (Tech Mentor)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TypeScript Global Types`** (1 nodes): `global.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Middleware`** (1 nodes): `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Environment Config`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Footer Component`** (1 nodes): `footer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Loading Skeleton`** (1 nodes): `loading-skeleton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Library Index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input Component`** (1 nodes): `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progress Component`** (1 nodes): `progress.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Appwrite App Config`** (1 nodes): `appConfig.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Appwrite Client`** (1 nodes): `appwrite.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Interview Mongoose Model`** (1 nodes): `Interview.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Report Mongoose Model`** (1 nodes): `InterviewReport.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Mongoose Model`** (1 nodes): `InterviewSession.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Mongoose Model`** (1 nodes): `User.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Aditya`** (1 nodes): `Demo User: Aditya`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Arjun`** (1 nodes): `Demo User: Arjun`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Dinojan`** (1 nodes): `Demo User: Dinojan`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Issac`** (1 nodes): `Demo User: Issac`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Jaffar`** (1 nodes): `Demo User: Jaffar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Jonathan`** (1 nodes): `Demo User: Jonathan`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Nehtteen`** (1 nodes): `Demo User: Nehtteen`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Sai`** (1 nodes): `Demo User: Sai`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo User Shivam`** (1 nodes): `Demo User: Shivam`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Teacher Mentor Avatar`** (1 nodes): `Judy (Teacher Mentor)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NexHack Pro Project` connect `Project Assets & Setup Docs` to `Python CV Dependencies`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Groq LLaMA 3.1 AI Service` connect `Project Assets & Setup Docs` to `Scoring & Report Analytics`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Interview Performance Report` connect `Scoring & Report Analytics` to `Project Assets & Setup Docs`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `NexHack Pro Project` (e.g. with `NexHack Pro Cover/Hero Image` and `MockMentor Demo Animation`) actually correct?**
  _`NexHack Pro Project` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Calculate eye aspect ratio from face landmarks list.`, `Get the centroid of hand landmarks.`, `Draw landmarks and optional connections on a frame.` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Assets & Setup Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._