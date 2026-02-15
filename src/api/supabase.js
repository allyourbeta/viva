import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase is optional for initial development — functions gracefully degrade
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function getDeviceId() {
  let id = localStorage.getItem('thinkflow_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('thinkflow_device_id', id);
  }
  return id;
}

/**
 * Save a completed session to Supabase.
 */
export async function saveSession(sessionData) {
  if (!supabase) {
    console.warn('Supabase not configured — session not saved');
    return { id: crypto.randomUUID(), ...sessionData };
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      device_id: getDeviceId(),
      topic: sessionData.topic,
      source_url: sessionData.sourceUrl || null,
      source_text: sessionData.sourceText || null,
      source_was_auto_searched: sessionData.sourceWasAutoSearched || false,
      confidence_before: sessionData.confidenceBefore,
      transcript: sessionData.transcript,
      recording_duration_seconds: sessionData.recordingDuration || null,
      analysis: sessionData.analysis,
      routing_mode: sessionData.routingMode,
      routing_rationale: sessionData.routingRationale,
      routing_plan: sessionData.routingPlan,
      questions: sessionData.questions,
      confidence_after: sessionData.learningCard?.confidence_after,
      concepts_mastered: sessionData.learningCard?.concepts_mastered,
      remaining_gaps: sessionData.learningCard?.remaining_gaps,
      key_correction: sessionData.learningCard?.key_correction,
      one_thing_to_remember: sessionData.learningCard?.one_thing_to_remember,
      meta_learning_insight: sessionData.learningCard?.meta_learning_insight,
      next_session_seed: sessionData.learningCard?.next_session_seed,
      sources_used: sessionData.sourcesUsed || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save session:', error);
    throw error;
  }

  return data;
}

/**
 * Load past sessions for the session history page.
 */
export async function loadSessions() {
  if (!supabase) {
    console.warn('Supabase not configured — returning empty history');
    return [];
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('id, created_at, topic, confidence_before, confidence_after, routing_mode, concepts_mastered, remaining_gaps, key_correction, one_thing_to_remember, meta_learning_insight, next_session_seed')
    .eq('device_id', getDeviceId())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Load a single session by ID (for viewing past cards).
 */
export async function loadSession(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to load session:', error);
    return null;
  }

  return data;
}
