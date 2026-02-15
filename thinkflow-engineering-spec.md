# Viva — Engineering Spec

## Last Updated: Saturday, February 14, 2026

---

## 1. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend** | React 18 + Vite | Builder knows it well, fast scaffold, hot reload |
| **Styling** | Tailwind CSS | Minimal, utility-first, fast iteration, ADHD-friendly clean aesthetic |
| **Voice Input** | Web Speech API (SpeechRecognition) | Browser-native, zero dependencies, Chrome-only is fine for hackathon |
| **Voice Output** | Web Speech Synthesis API (stretch) | Browser TTS for Claude's questions. Stretch goal. |
| **AI** | Claude Opus 4.6 via Anthropic SDK | Required by hackathon. Deep reasoning for evaluation + Socratic + routing |
| **Web Search** | Claude tool use (web_search) | Agentic source finding, rebuttal sourcing, gap-filling |
| **Backend/DB** | Supabase (Postgres + JS client) | Session persistence, future group support, fast setup |
| **Hosting** | Vercel | One-click deploy from repo, preview URLs |
| **Build Tool** | Claude Code | Primary development tool — part of hackathon narrative |
| **Workflow** | Claude Cowork | Prompt iteration, planning, submission copy |

### Browser Requirement
Chrome only. Display a friendly banner for other browsers: "Viva uses Chrome's speech recognition. Please open in Chrome for the best experience."

---

## 2. Project Structure

```
thinkflow/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── claude.js          # All Anthropic API calls
│   │   ├── supabase.js        # Supabase client + all DB calls
│   │   └── web-search.js      # Web fetch for URL ingestion
│   ├── components/
│   │   ├── Layout.jsx          # App shell, nav
│   │   ├── SessionWizard.jsx   # Stepper: Source → Confidence → Record → Analysis → Questions → Card
│   │   ├── SourceInput.jsx     # URL / paste / topic-only input
│   │   ├── ConfidenceSlider.jsx # Pre-session 1-10 confidence
│   │   ├── VoiceRecorder.jsx   # Record button + Web Speech API
│   │   ├── AnalysisView.jsx    # Structured analysis display
│   │   ├── AgentStatus.jsx     # Mode tag + rationale + plan display
│   │   ├── SocraticLoop.jsx    # Question display + voice answer + evaluation
│   │   ├── LearningCard.jsx    # Final session card
│   │   ├── SessionHistory.jsx  # Home screen — list of past cards
│   │   └── ui/                 # Small reusable bits (Badge, ScoreBar, Button, etc.)
│   ├── services/
│   │   ├── analysisService.js  # Parse Claude analysis response → structured data
│   │   ├── routingService.js   # Interpret routing decision from Claude response
│   │   ├── sessionService.js   # Session state management (create, update, complete)
│   │   └── speechService.js    # Web Speech API wrapper (start, stop, transcript)
│   ├── store/
│   │   └── sessionStore.js     # Zustand store for current session state
│   ├── prompts/
│   │   ├── analyzeExplanation.js   # System prompt for Step 3 (analysis)
│   │   ├── socraticQuestions.js     # System prompt for Step 5 (questioning)
│   │   └── evaluateAnswer.js       # System prompt for evaluating spoken answers
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── CLAUDE.md                   # Project conventions for Claude Code
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

### Architecture Rules (per user preferences)
- No file over 300 lines — split immediately if exceeded
- Components contain UI only — no business logic, no API calls
- Services are pure functions — no React imports, no database imports
- All database calls centralized in `api/`
- All Anthropic API calls centralized in `api/claude.js`
- Zustand for state management

---

## 3. Supabase Schema

```sql
-- Sessions table: one row per Viva session
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Input
  topic TEXT NOT NULL,
  source_url TEXT,
  source_text TEXT,
  source_was_auto_searched BOOLEAN DEFAULT false,
  confidence_before INTEGER CHECK (confidence_before BETWEEN 1 AND 10),
  
  -- User's explanation
  transcript TEXT,
  recording_duration_seconds INTEGER,
  
  -- Claude's analysis (stored as JSON)
  analysis JSONB,
  
  -- Routing decision
  routing_mode TEXT,  -- 'gap_fix' | 'socratic_probe' | 'level_up' | 'conflict_resolution'
  routing_rationale TEXT,
  routing_plan JSONB,  -- Array of step strings
  
  -- Socratic Q&A (stored as JSON array)
  questions JSONB,  -- [{question, intent, user_answer, evaluation, sources_cited}]
  
  -- Learning card output
  confidence_after INTEGER CHECK (confidence_after BETWEEN 1 AND 10),
  concepts_mastered JSONB,  -- Array of strings
  remaining_gaps JSONB,     -- Array of strings
  key_correction TEXT,
  one_thing_to_remember TEXT,
  meta_learning_insight TEXT,
  next_session_seed TEXT,
  sources_used JSONB,       -- Array of {url, title, why_used}
  
  -- Future group support (narrative, not used in MVP)
  group_id UUID,
  user_display_name TEXT DEFAULT 'Learner'
);

-- Index for session history queries
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
```

**No auth for MVP.** Sessions are anonymous. We use a `localStorage` device ID to associate sessions with a browser, or we just show all sessions (single demo account). Judges don't care about OAuth.

---

## 4. Claude API: Structured Outputs

### 4.1 Analysis Call (Step 3)

**When:** After user finishes voice explanation  
**Input:** User transcript + source material  
**Claude tools available:** `web_search` (for when source is topic-only)

```javascript
// api/claude.js — analyzeExplanation()

const systemPrompt = `You are Viva, an AI learning companion that evaluates a learner's 
understanding using the Feynman Technique. You have been given source material and a learner's 
verbal explanation of the topic.

Your job is NOT to summarize. Your job is to EVALUATE how well the learner understands the 
topic by comparing their explanation against the source material.

You must respond with a JSON object matching this exact schema:
{
  "key_concepts": ["concept1", "concept2", ...],
  "solid_understanding": [
    {"concept": "...", "evidence": "the learner said '...' which correctly captures..."}
  ],
  "fuzzy_areas": [
    {"concept": "...", "issue": "the learner mentioned this but was vague about..."}
  ],
  "factual_errors": [
    {"learner_said": "...", "source_says": "...", "why_it_matters": "..."}
  ],
  "blind_spots": [
    {"concept": "...", "source_reference": "the source explains that..."}
  ],
  "confidence_assessment": 1-10,
  "meta_learning_insight": "One sentence about how the learner thinks/explains",
  "routing_decision": {
    "mode": "gap_fix|socratic_probe|level_up|conflict_resolution",
    "rationale": "One sentence explaining why this mode was chosen",
    "plan": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
  }
}

Rules:
- Be specific. Reference the learner's actual words.
- Compare against the source material explicitly.
- If the learner is confidently wrong, prioritize fixing foundational errors first.
- The routing decision should follow logically from the analysis.
- If you need to search the web for additional context (e.g., user provided topic only), do so.`;

// Message structure
const messages = [
  {
    role: "user",
    content: `## Source Material
${sourceText}

## Learner's Verbal Explanation (transcript)
${transcript}

## Learner's Self-Assessed Confidence: ${confidenceBefore}/10

Analyze this explanation against the source material. Return JSON only.`
  }
];

// Tools available
const tools = [
  {
    type: "web_search_20250305",
    name: "web_search"
  }
];
```

### 4.2 Socratic Questions Call (Step 5)

**When:** After analysis, based on routing decision  
**Input:** Analysis results + source material + routing mode

```javascript
// api/claude.js — generateSocraticQuestions()

const systemPrompt = `You are Viva in Socratic questioning mode. Based on the analysis 
of the learner's explanation, generate targeted questions to close their understanding gaps.

Current mode: {{mode}}
Rationale: {{rationale}}

Generate 3-5 questions as a JSON array:
{
  "questions": [
    {
      "question": "The actual question text",
      "intent": "fix_misconception|deepen_understanding|test_transfer|connect_concepts",
      "target_gap": "Which specific gap or error this addresses",
      "good_answer_includes": "Key points a good answer would cover"
    }
  ]
}

Rules:
- Questions must target SPECIFIC gaps from the analysis, not generic "explain more."
- If in conflict_resolution mode, present the source's position and ask the learner to reconcile.
- If in gap_fix mode, consider using an analogy from a different domain to test transfer.
- If the learner seems to rely on analogies, ask them to state the formal definition instead.
- Each question should build on the previous one.
- Use web_search if you need to find an analogy or supplementary explanation.`;
```

### 4.3 Answer Evaluation Call (Step 5, per question)

**When:** After user answers a Socratic question by voice  
**Input:** The question, the user's spoken answer, the source material, the analysis context

```javascript
// api/claude.js — evaluateAnswer()

const systemPrompt = `You are Viva evaluating a learner's answer to a Socratic question.

You have:
- The original analysis of their understanding
- The question that was asked and its intent
- Their spoken answer (transcript)
- The source material

Respond with JSON:
{
  "gap_closed": true|false,
  "evaluation": "1-2 sentence assessment of their answer",
  "correction": "If wrong, what they should understand (with source reference). Null if correct.",
  "follow_up_needed": true|false,
  "follow_up_question": "If needed, a follow-up question. Null if not needed.",
  "sources_cited": ["URLs if web search was used"]
}

Rules:
- Be encouraging but honest. Don't say "great job" if they're still wrong.
- If they're struggling, simplify. Consider offering an analogy.
- If they contradicted the source, search for additional evidence to present the contradiction clearly.
- Reference the source material specifically when correcting.`;
```

### 4.4 Learning Card Generation Call (Step 6)

**When:** After Socratic loop completes  
**Input:** Full session data (analysis + all Q&A)

```javascript
// api/claude.js — generateLearningCard()

const systemPrompt = `You are Viva generating a final learning card for a completed session.

Given the full session data (analysis, questions asked, answers given, evaluations), 
produce a concise learning card:

{
  "confidence_after": 1-10,
  "concepts_mastered": ["concept1", "concept2"],
  "remaining_gaps": ["gap1", "gap2"],
  "key_correction": "The single most important thing that was corrected in this session",
  "one_thing_to_remember": "If you remember nothing else from this session, remember: ...",
  "meta_learning_insight": "One sentence about how the learner thinks and how they could improve",
  "next_session_seed": "A question or subtopic to tackle in the next session"
}

Rules:
- Be specific and concise.
- The "one thing to remember" should be a single, memorable sentence.
- The "next session seed" should naturally follow from remaining gaps.
- confidence_after should reflect improvement (or lack thereof) from the Socratic dialogue.`;
```

---

## 5. Agentic Web Search Integration

Claude's web search tool is available in Steps 0, 3, 4, and 5. The agentic behavior comes from Claude *deciding when to use it* based on the situation.

| Scenario | Claude's Decision | Search Intent |
|---|---|---|
| User provides topic only, no source | "I need reference material to evaluate against" | Find a good primer/documentation for the topic |
| User contradicts the source | "I need additional evidence to present this contradiction convincingly" | Find a corroborating source that agrees with the original source |
| User has gaps and is struggling | "I need a simpler explanation or analogy to help them" | Find a beginner-friendly article or explanation |
| Socratic question needs an analogy | "I need a different-domain example to test transfer" | Find an analogy from an unrelated field |

**Implementation:** All of these are handled by including `web_search` in Claude's tool list and instructing it in the system prompt when to use it. No separate orchestration needed — Claude decides autonomously.

---

## 6. Web Speech API Integration

```javascript
// services/speechService.js

// Start recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// Key events
recognition.onresult = (event) => { /* accumulate transcript */ };
recognition.onerror = (event) => { /* handle errors gracefully */ };
recognition.onend = () => { /* auto-restart if still recording, or finalize */ };
```

**Fallback:** A "Having mic issues?" link reveals a textarea where users can type or paste their explanation. This protects the demo if speech recognition fails.

**TTS (stretch goal):**
```javascript
// For Claude's questions
const utterance = new SpeechSynthesisUtterance(questionText);
utterance.rate = 0.95;  // Slightly slower for clarity
window.speechSynthesis.speak(utterance);
```

---

## 7. State Management (Zustand)

```javascript
// store/sessionStore.js

const useSessionStore = create((set, get) => ({
  // Current session state
  step: 'source',  // 'source' | 'confidence' | 'recording' | 'analyzing' | 'analysis' | 'socratic' | 'card'
  
  // Input
  topic: '',
  sourceUrl: '',
  sourceText: '',
  sourceWasAutoSearched: false,
  confidenceBefore: null,
  
  // Recording
  isRecording: false,
  transcript: '',
  recordingDuration: 0,
  
  // Analysis
  analysis: null,
  routingMode: null,
  routingRationale: '',
  routingPlan: [],
  
  // Socratic
  questions: [],
  currentQuestionIndex: 0,
  answers: [],       // [{questionIndex, transcript, evaluation}]
  
  // Learning card
  learningCard: null,
  
  // Session history
  sessions: [],      // Past sessions from Supabase
  
  // Actions
  setStep: (step) => set({ step }),
  setTopic: (topic) => set({ topic }),
  setSourceText: (sourceText) => set({ sourceText }),
  // ... etc
  
  // Reset for new session
  resetSession: () => set({
    step: 'source',
    topic: '',
    sourceUrl: '',
    sourceText: '',
    sourceWasAutoSearched: false,
    confidenceBefore: null,
    isRecording: false,
    transcript: '',
    recordingDuration: 0,
    analysis: null,
    routingMode: null,
    routingRationale: '',
    routingPlan: [],
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    learningCard: null,
  }),
}));
```

---

## 8. Key UI States (Session Wizard Flow)

The session is a wizard/stepper. Each step is a distinct, minimal screen. Never show all steps at once (ADHD-friendly).

```
┌─────────────────────────────────────────────────┐
│ Step 1: SOURCE                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ What are you learning?                      │ │
│ │ [Topic name input]                          │ │
│ │                                             │ │
│ │ Optional: paste a source                    │ │
│ │ [URL input] or [Paste text]                 │ │
│ │                                             │ │
│ │ Or just enter a topic and I'll find sources │ │
│ │                                             │ │
│ │           [Next →]                          │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 2: CONFIDENCE                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ Before you explain...                       │ │
│ │ How confident are you? (1-10)               │ │
│ │                                             │ │
│ │ ●──────────○─────── 7                       │ │
│ │                                             │ │
│ │           [Start Explaining →]              │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 3: RECORD                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │        Explain: "React useEffect"           │ │
│ │                                             │ │
│ │              🔴 2:34                        │ │
│ │           [Stop Recording]                  │ │
│ │                                             │ │
│ │   (mic issues? type instead)                │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 4: ANALYSIS                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Your Understanding of "React useEffect"     │ │
│ │                                             │ │
│ │ Confidence: You said 7 │ Actual: 4          │ │
│ │                                             │ │
│ │ ✅ Solid: cleanup functions, basic syntax   │ │
│ │ 🟡 Fuzzy: dependency array behavior         │ │
│ │ ❌ Missed: stale closures, useLayoutEffect  │ │
│ │ ⚡ Error: "runs before paint" — source says │ │
│ │          it runs AFTER paint                │ │
│ │                                             │ │
│ │ 💡 "You explain via analogies but skip      │ │
│ │     formal definitions"                     │ │
│ │                                             │ │
│ │ ┌───────────────────────────────────────┐   │ │
│ │ │ 🤖 Mode: Gap Fix                     │   │ │
│ │ │ "You skipped stale closures, which is │   │ │
│ │ │  the #1 useEffect bug. Fixing that    │   │ │
│ │ │  first."                              │   │ │
│ │ │ Plan: 1. Clarify stale closures       │   │ │
│ │ │       2. Test with scenario            │   │ │
│ │ │       3. Connect to dependency array   │   │ │
│ │ └───────────────────────────────────────┘   │ │
│ │                                             │ │
│ │        [Start Questions →]                  │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 5: SOCRATIC                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Question 1 of 3 — Fix misconception         │ │
│ │                                             │ │
│ │ "You said useEffect runs before the         │ │
│ │  browser paints. The React docs say it      │ │
│ │  runs AFTER. Why do you think that          │ │
│ │  distinction matters for performance?"      │ │
│ │                                             │ │
│ │              🎤 Answer                      │ │
│ │                                             │ │
│ │ [Previous evaluation shown if not Q1]       │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Step 6: LEARNING CARD                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ Session Complete ✓                          │ │
│ │                                             │ │
│ │ React useEffect — Feb 14, 2026              │ │
│ │ Confidence: 7 → 6 (honest improvement!)     │ │
│ │                                             │ │
│ │ ✅ Mastered: cleanup, basic syntax, deps    │ │
│ │ 🔲 Remaining: stale closures edge cases     │ │
│ │                                             │ │
│ │ 🔑 Key correction: useEffect runs AFTER     │ │
│ │    paint, not before.                       │ │
│ │                                             │ │
│ │ 💡 Remember: "The dependency array doesn't  │ │
│ │    control IF the effect runs — it controls  │ │
│ │    WHEN it re-runs."                        │ │
│ │                                             │ │
│ │ 📝 Next time: "How do stale closures cause  │ │
│ │    bugs with setInterval inside useEffect?" │ │
│ │                                             │ │
│ │ [Back to History]  [Start Next Session →]   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 9. Build Plan

### Saturday Evening (3-4 hours)
**Goal: End-to-end "talk → see structured analysis" working.**

1. Scaffold with Vite + React + Tailwind (Claude Code: `npm create vite@latest thinkflow -- --template react`)
2. Set up Supabase project + run migration
3. Create CLAUDE.md with project conventions
4. Build `speechService.js` — Web Speech API wrapper
5. Build `api/claude.js` — analysis call with structured output
6. Build minimal `VoiceRecorder` → `AnalysisView` flow
7. Verify: talk into mic → see structured JSON analysis on screen

**Checkpoint:** Can you talk and see a structured analysis? If yes, Saturday is a success.

### Sunday Morning (4-5 hours)
**Goal: Full session flow with agentic routing and Socratic loop.**

1. Source ingestion (URL fetch, paste, topic-only with web search)
2. Confidence slider component
3. Agentic routing: parse Claude's `routing_decision`, render mode tag + rationale + plan
4. Socratic loop: questions display → voice answer → evaluation → next question
5. Agentic search during Socratic (rebuttal sourcing, gap filling)

**Checkpoint:** Can you complete a full session from source → analysis → questions → answers?

### Sunday Afternoon (4-5 hours)
**Goal: Learning card, persistence, session history, UI polish.**

1. Learning card generation call + component
2. Save complete session to Supabase
3. Session history page (home screen) — load past sessions, display cards
4. Pre-seed 3-4 demo sessions in Supabase for the screencast
5. UI polish pass: consistent styling, spacing, typography, transitions
6. Stepper/wizard flow refinement
7. "Chrome only" banner for other browsers
8. Fallback textarea for mic issues

**Checkpoint:** Can you complete a session AND see it in history? Does it look clean?

### Monday (3-4 hours) — POLISH AND DEMO ONLY
**No new features. If you're still coding core features, cut scope.**

1. Record the screencast (follow the demo script from the PRD)
2. Fix any visual rough edges discovered during recording
3. Write submission copy (title, description, problem statement alignment)
4. Deploy to Vercel
5. Final test of deployed version
6. Submit

---

## 10. CLAUDE.md (Project Conventions for Claude Code)

This file goes in the project root so Claude Code understands the codebase conventions.

```markdown
# CLAUDE.md — Viva Project Conventions

## Architecture
- Layered: Components (UI) → Store (Zustand) → Services (pure functions) → API (all external calls)
- Components contain NO business logic
- Services are pure functions with NO React or database imports
- All Anthropic API calls in `src/api/claude.js`
- All Supabase calls in `src/api/supabase.js`
- All prompts in `src/prompts/` as exported template strings

## File Rules
- No file over 300 lines — split immediately
- One component per file
- Use named exports for services, default exports for components

## Styling
- Tailwind CSS only — no CSS files, no styled-components
- ADHD-friendly: minimal, high contrast, one action per screen, big primary buttons
- No visual clutter — when in doubt, remove it

## State
- Zustand store in `src/store/sessionStore.js`
- No prop drilling deeper than 2 levels — use the store

## Claude API Calls
- Always use structured JSON output
- Always include `web_search` in tools list
- Always wrap in try/catch with user-friendly fallback
- Parse JSON defensively: strip markdown fences, validate shape

## Testing
- After changes: run `npm run build` to verify no build errors
- Manual test the full flow: source → confidence → record → analysis → questions → card

## Git
- Commit after each working checkpoint
- Commit message format: "feat: description" or "fix: description"
```

---

## 11. Risk Mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| Web Speech API flaky | Medium | Fallback textarea. Lock to Chrome. Test early. |
| Claude returns malformed JSON | Medium | Try/catch + JSON.parse with fence stripping. Retry once. Show friendly error. |
| Claude latency makes demo drag | Medium | Show "Analyzing your understanding..." with progress steps. Edit out waits in screencast. |
| PDF parsing rabbit hole | High | **Cut entirely.** URL + paste + topic-only. |
| Auth complexity | High | **Cut entirely.** Anonymous sessions. |
| Supabase schema issues | Low | Simple schema, test migration early Saturday. |
| Scope creep on Sunday | High | Checkpoints in build plan. If Sunday AM checkpoint missed, cut Socratic loop to 2 questions max and skip TTS. |
| Source URL fetch fails (CORS) | Medium | Server-side fetch via Supabase Edge Function, or use Claude's web_search as fallback to summarize the URL content. |

---

## 12. Claude Code Session Strategy

Use Claude Code in focused sessions aligned with the build plan:

**Session 1 (Saturday):** "Scaffold the project. Set up Vite + React + Tailwind + Supabase. Create the file structure from the engineering spec. Implement speechService.js and the first Claude API call. Get voice → analysis working."

**Session 2 (Sunday AM):** "Add source ingestion (URL fetch, paste, topic-only with web search). Add confidence slider. Implement agentic routing display. Build the Socratic questioning loop."

**Session 3 (Sunday PM):** "Learning card generation. Supabase persistence. Session history page. UI polish pass. Pre-seed demo data."

**Session 4 (Monday):** "Fix visual issues found during demo recording. Deploy to Vercel. Final build verification."

Between Claude Code sessions, use **Claude Cowork** for:
- Iterating on system prompts (analysis, Socratic, evaluation)
- Refining the demo script
- Writing submission copy
- Planning and tracking progress

---

## 13. Demo Data (Pre-seed in Supabase)

For the screencast, pre-seed 3-4 past sessions so the history page looks populated:

1. **"JavaScript Closures"** — 3 days ago, confidence 5→7, mastered scope chain, gap on memory leaks
2. **"CSS Flexbox vs Grid"** — 5 days ago, confidence 8→8, nailed it, leveled up to responsive patterns
3. **"SQL Joins"** — 1 week ago, confidence 4→6, fixed inner vs outer confusion, gap on self-joins
4. **"React State Management"** — 2 weeks ago, confidence 6→5 (confidence dropped = honest!), fuzzy on when to use context vs. Zustand

These show:
- Accumulation over time (product, not one-off)
- Different confidence trajectories (realistic, not always improving)
- Different topics (versatile tool)
- The "next session seed" feature working across sessions
