# Viva — Product Requirements Spec (PRD)

## Last Updated: Saturday, February 14, 2026

---

## 1. Product Overview

### One-liner
**Viva** is your AI supervisor — bringing the 800-year-old Oxbridge tutorial system to anyone with a browser and a voice. Explain what you're learning, and Viva stress-tests your understanding against real sources, finds the cracks in your thinking, and coaches you through the gaps.

### Tagline
*"The Oxbridge tutorial, democratized. Your AI supervisor is ready."*

### Problem Statement Alignment
- **Primary:** PS3 — Amplify Human Judgment ("Build AI that makes learners dramatically more capable — without taking them out of the loop")
- **Secondary:** PS2 — Break the Barriers (democratize Socratic tutoring for self-learners who don't have access to tutors or study groups)

### Core Insight
For 800 years, the Oxbridge tutorial system (called "tutorials" at Oxford, "supervisions" at Cambridge) has been the gold standard of education. One student, one expert. You explain what you've learned, and the tutor listens, probes, finds the cracks in your thinking, and forces you to reason more rigorously. It produced Newton, Turing, Darwin, Hawking, and countless Nobel laureates. Professor Benjamin Jowett, who established the system at Oxford, built it explicitly on the Socratic method — his students said "his great skill consisted, like Socrates, in helping us to learn and think for ourselves."

But this method is locked behind the walls of two universities and costs tens of thousands of pounds per year, largely because it requires world-class academics giving one-on-one time. Viva democratizes it. Claude Opus becomes your AI supervisor — not just summarizing what you said, but *evaluating your understanding against real source material*, *autonomously finding evidence*, and *probing your weak points* with targeted Socratic questions. The same method. Available to anyone.

### Target Users
- Self-taught learners (developers, career changers, students)
- Auditory/verbal thinkers and people with ADHD who process better by talking than reading
- Anyone studying independently without access to tutors, coaches, or study groups

---

## 2. Judging Rubric (Hackathon Criteria)

Everything we build is optimized against these weights.

| Criterion | Weight | What Judges Want |
|---|---|---|
| **Demo** | 30% | Working, impressive, genuinely cool to watch. Holds up live. |
| **Creative Opus 4.6 Use** | 25% | Beyond basic integration. Capabilities that surprise. |
| **Impact** | 25% | Real-world potential. Clear users. Could become a real product. |
| **Depth & Execution** | 20% | Thoughtfully refined engineering. Real craft, not a quick hack. |

---

## 3. Core User Flow

### Design Philosophy: Dialogue, Not Reports

Based on how real Oxbridge tutorials work:
- The tutor picks **one weak point** and drills into it
- Exchanges are short: 10-60 seconds, then interruption
- "You said X. Why?" → student answers → "But what about Y?" → student revises
- One concept can be unpacked for 15 minutes
- It feels like a chess match — probing, forcing moves, positional pressure
- 60-70% dialogue, not monologue
- The tutor does NOT give a comprehensive grade or report — they go straight into questioning

**What Viva is NOT:** A grading rubric. A report card. A list of everything right and wrong.

**What Viva IS:** A real-time intellectual dialogue where your supervisor picks apart your weakest point and makes you defend it.

### Step 1: Topic + Source

Same as before — topic only, URL, or paste. "Topic only" proceeds instantly (Claude uses its knowledge during the dialogue).

### Step 2: Confidence Self-Assessment

Slider 1-10. Takes 5 seconds. Sets up the reveal at the end.

### Step 3: Voice Explanation (60 seconds max)

You explain. Messy is fine. While you talk, background analysis is running every 10 seconds so your supervisor is already forming an opinion.

### Step 4: The Tutorial (THE CORE EXPERIENCE)

This is a **conversation view** — like a chat, but voice-driven. No analysis dump. No report card.

**Round 1 — Supervisor's Opening Move:**
Claude has analyzed your explanation in the background. It picks the **single most important** thing to address — the weakest link, the most consequential error, or the most revealing gap — and responds conversationally:

> *"You said tourism is 'a priority for the Thai government.' That's vague. What specific policies or investments has Thailand made to back that up? And how did the industry actually recover post-COVID — you said 'reasonable comeback' but what does that mean in numbers?"*

This is ONE focused probe, not a laundry list. It sounds like a person, not a report.

**Round 2-5 — Back and Forth:**
- You answer by voice (10-30 seconds)
- Supervisor evaluates, then either:
  - Pushes deeper on the same point ("You mentioned TAT but what specifically did they do?")
  - Acknowledges progress and moves to the next weak point ("Good — that's much sharper. Now, you didn't mention source markets at all...")
  - Offers a correction with evidence ("Actually, arrivals dropped from 40 million to virtually zero — that's not a 'reasonable comeback,' that's a catastrophic collapse followed by a partial recovery")
- Each response is 2-4 sentences max, ending with a question

**The conversation is visible as a scrolling dialogue** — your words on one side, supervisor on the other. Like a tutorial transcript.

**Routing is implicit, not displayed.** Claude still internally decides its mode (gap fix, probe, level up, conflict) — but the user doesn't see a "Mode: Gap Fix" tag. They just experience the tutorial. The mode shows up later on the learning card as a retrospective label.

### Step 5: Learning Card (The Artifact)

After 3-5 rounds, the supervisor wraps up and generates the card. This is where the **full analysis lives** — but as a summary of what happened in the dialogue, not as a separate grading step.

| Card Field | Description |
|---|---|
| **Topic + Date** | What and when |
| **Confidence: Before vs. After** | The gap reveal |
| **What you nailed** | Brief list — "You correctly identified X, Y, Z" |
| **What got corrected** | The key corrections from the dialogue |
| **Key correction** | The single most important thing that changed |
| **One thing to remember** | If you remember nothing else from this session |
| **How you think** | Meta-learning insight about your explanation style |
| **Next session seed** | What to tackle next time |
| **Tutorial mode** | Retrospective label: what kind of tutorial this was |

The card is the **receipt**, not the **experience**. The experience is the dialogue.
| **Concepts mastered** | What you demonstrated solid understanding of |
| **Remaining gaps** | What's still fuzzy or missing |
| **Key correction** | The most important thing Claude fixed |
| **"One thing to remember"** | A single distilled sentence — if you remember nothing else, remember this |
| **Meta-learning insight** | How you tend to think/explain (analogies vs. definitions, etc.) |
| **Next session seed** | Auto-generated question or subtopic for next time |
| **Sources used** | URLs that Claude found or that you provided |

### Session History (The Product Story)

The session history page is the *home screen*, not an afterthought. Users see their cards first, and start a new session from there.

Each card in the list shows: topic, date, confidence badge (Low/Medium/High), and a tiny "Sessions this week: N" counter.

**Why this matters:** This is what tells judges "this is a product, not a conversation." The accumulation over time — the knowledge portfolio — is the long-term value proposition.

---

## 4. Agentic Behaviors Summary

Four distinct moments where Claude autonomously decides to seek external information:

| Moment | What Claude Does | When |
|---|---|---|
| **Source selection** | User says a topic name only → Claude searches the web, selects appropriate reference material | Step 0 |
| **Evidence grounding** | Claude cites specific passages from the source to support its analysis | Step 3 |
| **Rebuttal sourcing** | User contradicts the source → Claude searches for additional external evidence to surface the contradiction | Step 4 (Conflict Resolution mode) |
| **Gap filling** | User has gaps → Claude searches for supplementary beginner-friendly material and recommends it | Step 5 (during Socratic dialogue) |

These are all Claude tool use (web search) with the intelligence living in the prompt — Claude decides *when* and *what* to search based on its assessment of the user's understanding.

---

## 5. The Bigger Vision (Narrative Only — Not Built)

We frame these in the demo's final 20 seconds and in the submission write-up. The Supabase schema includes `group_id` on sessions to architecturally support this.

### Classroom Mode
A teacher assigns a topic. 30 students each do a Viva session. The teacher gets a dashboard: which concepts the class understands, where common gaps are, which students share the same misconception. Claude aggregates understanding across a group.

### Study Group Mode
Three people learning the same material. Each does their own session. Claude identifies where their understandings *diverge* and generates a discussion prompt to resolve it collaboratively.

### Longitudinal Curriculum Agent
Over many sessions, Claude notices you keep stumbling on the same type of concept. It proactively designs a micro-curriculum, pulling from external sources and scheduling review sessions with spaced repetition.

---

## 6. ADHD-Friendly Design Principles

These aren't features — they're constraints that apply to every design decision.

- **Minimal UI at every step.** No clutter, no multi-panel layouts during active use.
- **One action at a time.** A stepper/wizard flow: Explain → Review → Questions → Card. Never show all steps at once.
- **Big primary action.** The record button dominates the screen during recording. Everything else fades.
- **Short sessions.** Target 5-10 minute sessions. No pressure to do an hour-long study marathon.
- **Voice-first throughout.** Input is voice. Stretch goal: output is also voice (TTS for questions).
- **"Focus mode" as default.** The clean, single-action view is the default, not a toggle.

---

## 7. Demo Script (2-3 Minute Screencast)

### 0:00-0:15 — The Hook
Voiceover: *"For 800 years, the Oxbridge tutorial system has been the gold standard of education. One student, one expert — you explain, they probe, they find the cracks in your thinking. It produced Newton, Turing, Darwin, and Hawking. But it's locked behind the walls of two universities. Viva is your AI supervisor — bringing the Oxbridge tutorial to anyone with a browser and a voice."*

### 0:15-0:30 — Setup
Show the clean landing page with session history (pre-seeded with a few past cards to show accumulation). Click "New Session." Type a topic: "React useEffect hook." Paste a URL to the React docs. Confidence slider: "I'd say... 7 out of 10."

### 0:30-0:55 — The Messy Explanation
Hit the big record button. Talk for 20-25 seconds. Be intentionally messy: "So useEffect is like... it runs after the component renders, right? And you put stuff in the dependency array to control when it fires. I think an empty array means it only runs once. And there's a cleanup function... for like, unsubscribing from things?"

### 0:55-1:20 — The Transformation (Wow #1)
The structured analysis appears. Zoom in on screen. Point out: "It correctly identified that I nailed the cleanup function concept. But look — it caught that I was vague about the dependency array, and it flagged that I completely missed the difference between useEffect and useLayoutEffect, which the docs cover."

Show the confidence comparison: "I said 7/10. Claude assessed me at 4/10. That gap is the whole point."

### 1:20-1:35 — The Agentic Routing (Wow #2)
Point to the mode tag: "It chose 'Gap Fix' mode because I had major blind spots. And look — it explains why: 'You skipped how stale closures interact with the dependency array, which is the most common useEffect bug. Let's fix that first.'"

Show the 3-step plan it generated.

### 1:35-2:10 — The Socratic Loop (Wow #3)
Claude asks a targeted question: "You said an empty dependency array means it runs once. Can you explain *why* that's the case — what is React actually checking?"

Answer by voice (imperfectly). Claude responds: "Good — you're on the right track with reference comparison, but you missed that React uses Object.is, not deep equality. This matters when you pass objects. Here's what the docs say..." [shows source citation].

One more exchange where Claude adapts based on the answer.

### 2:10-2:35 — The Learning Card & History
End the session. Show the learning card: topic, confidence before/after, mastered concepts, remaining gaps, "one thing to remember," and the next session seed.

Flip to the history page: "Every session builds on the last. Over time, this becomes a map of what you truly know — not what you've read, but what you can actually explain."

### 2:35-2:50 — The Vision
*"Today this works for one learner. But the architecture supports classrooms — a teacher assigning a topic and getting a dashboard of where every student is stuck. We already store group IDs for that. Viva turns talking into thinking, and thinking into mastery."*

---

## 8. Hackathon Narrative: Claude Usage

### Claude Opus 4.6 (The Product)
Claude Opus is the core intelligence — not just answering questions, but:
- Evaluating human understanding against ground truth
- Making pedagogical routing decisions and explaining its reasoning
- Generating targeted Socratic questions based on gap analysis
- Autonomously searching the web when it needs evidence or supplementary material
- Evaluating spoken answers and adapting follow-ups in real time
- Generating meta-learning insights about how the user thinks

### Claude Code (The Build Process)
The entire app is built using Claude Code as the primary development tool. This is part of the hackathon story — demonstrating that Claude Code can scaffold, implement, and iterate on a full-stack app within a tight timeline.

### Claude Cowork (The Workflow)
Claude Cowork is used during the build process for:
- Generating and refining the system prompts for each step
- Iterating on the JSON schema for Claude's structured outputs
- Drafting the demo script and submission copy
- Managing the build plan and tracking what's done vs. remaining

This three-layer Claude usage (Opus as product brain, Code as builder, Cowork as workflow manager) is itself a compelling narrative for the "Creative Opus Use" criterion.

---

## 9. What's In vs. Out

### In (MVP for hackathon)
- Voice recording via Web Speech API (Chrome)
- Source ingestion: URL fetch + pasted text + topic-only with auto-search
- Confidence self-assessment (1-10 before explaining)
- Structured analysis with source comparison
- Visible agentic routing with mode tag + rationale + plan
- Socratic questioning loop (3-5 questions, voice answers)
- Agentic web search (source selection, rebuttal sourcing, gap filling)
- Learning card generation and persistence (Supabase)
- Session history page as home screen
- Clean, minimal, ADHD-friendly UI
- Pre-seeded demo data for session history

### Out (cut for time)
- PDF upload (say "coming soon")
- Full user authentication (anonymous sessions or single demo account)
- Complex session history filtering/search
- Multi-user / classroom features (narrative only, schema supports it)
- Sophisticated audio visualization during recording
- Mobile optimization

### Stretch Goals (if time permits)
- TTS for Claude's questions (voice-to-voice loop)
- Analogical reasoning in Socratic mode ("if indexes are like a book's table of contents...")
- "Re-explain just this gap" button on learning cards
- "Focus mode" toggle that strips UI to absolute minimum
