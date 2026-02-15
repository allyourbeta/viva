# CLAUDE.md — Viva Project Conventions

## What This Is
Viva is a voice-first learning companion inspired by the Oxbridge tutorial/supervision system. Users explain concepts by voice, Claude evaluates their understanding against source material, then conducts a Socratic dialogue to close gaps.

## Architecture
- Layered: Components (UI) → Store (Zustand) → Services (pure functions) → API (all external calls)
- Components contain NO business logic
- Services are pure functions with NO React or database imports
- All Anthropic API calls in `src/api/claude.js`
- All Supabase calls in `src/api/supabase.js`
- All prompts in `src/prompts/` as exported template strings
- State management via Zustand in `src/store/sessionStore.js`

## File Rules
- No file over 300 lines — split immediately
- One component per file
- Use default exports for components, named exports for services/utils

## Styling
- Tailwind CSS v4 via @tailwindcss/vite plugin
- Import `@import "tailwindcss"` in src/index.css
- ADHD-friendly: minimal, high contrast, one action per screen, big primary buttons
- No visual clutter — when in doubt, remove it
- Color palette: indigo-600 primary, warm neutrals, green for success, amber for fuzzy, red for errors

## Claude API Calls
- Use Anthropic SDK (@anthropic-ai/sdk)
- Always request structured JSON output
- Always include web_search in tools list
- Always wrap in try/catch with user-friendly fallback
- Parse JSON defensively: strip markdown fences, validate shape
- API key stored in env var VITE_ANTHROPIC_API_KEY

## Supabase
- Client initialized in src/api/supabase.js
- Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- No auth for MVP — anonymous sessions
- Schema: single `sessions` table (see engineering spec)

## Testing
- After changes: `npm run build` to verify no build errors
- Manual test the full flow: source → confidence → record → analysis → questions → card

## Git
- Commit after each working checkpoint
- Commit message format: "feat: description" or "fix: description"
