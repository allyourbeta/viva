# Viva — User Paths & Test Scenarios

## Path 1: Happy Path — Topic Only (THE DEMO PATH)
**Priority: P0 — Must work for submission**
1. Home screen → Click "New Session"
2. Type topic (e.g., "database indexing") → Select "Just a topic" → Click Next
3. Confidence slider → Set to 6 → Click "Start Explaining"
4. Click mic → Speak for 20-30 seconds → Click stop
5. Transcript appears → Click "Submit to Your Supervisor"
6. Loading screen ("Your supervisor is reviewing...")
7. Analysis view: confidence comparison, solid/fuzzy/errors/blind spots, routing decision with mode tag + rationale + plan
8. Click "Start Questions"
9. Question 1 appears → Click mic → Answer → Submit → See evaluation
10. Repeat for remaining questions
11. Click "Finish Session" → Loading
12. Learning card: confidence before/after, mastered, gaps, key correction, "one thing to remember", next seed
13. Click "Back to Sessions" → Session appears in history list

## Path 2: Happy Path — Paste Source Material
**Priority: P0**
1. Home → New Session
2. Type topic → Select "Paste text" → Paste a paragraph of notes → Click Next
3. Confidence slider → Start Explaining
4. Record explanation → Submit
5. Analysis compares explanation against pasted source (should quote specific discrepancies)
6. Socratic loop → Learning card → History

## Path 3: Happy Path — URL Source
**Priority: P1 — Nice to have for demo**
1. Home → New Session
2. Type topic → Select "URL" → Paste a URL → Click Next
3. (URL stored as source_text reference — analysis uses Claude's knowledge of that URL)
4. Rest of flow same as Path 1

## Path 4: Text Fallback (No Mic)
**Priority: P0 — Critical fallback**
1. Home → New Session → Topic → Confidence
2. Click "Having mic issues? Type instead"
3. Type explanation in textarea
4. Click "Submit to Your Supervisor"
5. Analysis → Socratic (also type answers) → Card → History

## Path 5: Low Confidence / Gap Fix Mode
**Priority: P1 — Shows routing variety in demo**
1. Set confidence to 2
2. Give a vague, error-filled explanation
3. Analysis should show: many errors, blind spots, low confidence_assessment
4. Routing should be "gap_fix" mode
5. Socratic questions should be simpler, more foundational
6. Learning card confidence_after may stay low (honest)

## Path 6: High Confidence / Level Up Mode
**Priority: P1 — Shows routing variety**
1. Set confidence to 9
2. Give a thorough, mostly-correct explanation
3. Analysis should show: mostly solid, few fuzzy areas
4. Routing should be "level_up" or "socratic_probe"
5. Questions push toward adjacent/harder concepts
6. Learning card shows high mastery

## Path 7: Factual Error / Conflict Resolution Mode
**Priority: P2**
1. Set confidence to 7
2. Deliberately include a factual error in explanation
3. Analysis should catch the error with "You said X / Source says Y"
4. Routing should be "conflict_resolution"
5. Socratic questions present the contradiction and ask learner to reconcile

## Path 8: Multiple Sessions — History Accumulation
**Priority: P1 — Proves it's a product, not a one-off**
1. Complete Path 1 fully
2. Return to history → See session 1 with mode tag, confidence badge, "one thing to remember"
3. Start new session on a different topic
4. Complete it → Return to history
5. Two sessions visible, sorted newest first
6. Each shows different routing modes and confidence trajectories

## Path 9: Empty/Minimal Explanation
**Priority: P2 — Edge case**
1. Topic → Confidence → Recording
2. Record only 2-3 words ("I don't know much")
3. Submit → Analysis should handle gracefully
4. Should get gap_fix routing with basic questions
5. Should NOT crash or return malformed UI

## Path 10: Session Recovery / Error Resilience
**Priority: P2 — Edge case**
1. Start a session → Get to analysis step
2. If any API call fails, user sees error message (not white screen)
3. Can retry or navigate back
4. App never crashes to a white screen

---

## Test Automation Strategy

### Tier 1: API Contract Tests (Node.js, no browser needed)
- Call each Claude function with mock inputs
- Verify response parses to valid JSON
- Verify JSON shape matches expected schema
- Verify all required fields present
- Can run headlessly in Claude Code

### Tier 2: Component Smoke Tests (Vitest + React Testing Library)
- Each component renders without crashing
- SourceInput: can type topic, select modes
- ConfidenceSlider: slider updates value
- VoiceRecorder: shows mic button, shows text fallback
- AnalysisView: renders mock analysis data correctly
- SocraticLoop: renders mock questions
- LearningCard: renders mock card data

### Tier 3: End-to-End (Playwright — stretch goal)
- Path 1 fully automated with API mocking
- Path 4 (text fallback) fully automated
- Screenshot comparison for UI regression

### What to build NOW
- Tier 1 API tests (fastest to set up, catches the real bugs)
- Tier 2 component smoke tests (catches render crashes)
- Tier 3 only if time permits Monday
