/**
 * Supabase Client Configuration
 * True Freelance App
 */

const SUPABASE_URL = 'https://bhibsvdlfnvujobkpzzy.supabase.co';
const SUPABASE_ANON_KEY = 'sbp_dd246433ffc636da1142a70d563157a4c8ffc558';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose globally for use in other scripts
window.supabaseClient = supabase;
