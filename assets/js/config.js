// amalgamG3 — Supabase configuration
// Anon/publishable key is safe to expose client-side; access is enforced by RLS + edge functions.
const SUPABASE_URL = "https://pnqaczmsyfzosxuyhcmn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucWFjem1zeWZ6b3N4dXloY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTk0ODgsImV4cCI6MjEwMzQ3NTQ4OH0.N_5nWHZLHd7JQjxc0FAwevlk5RUTOmTkfT4eUFiejrk";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);