window._env_ = {
  "SUPABASE_URL": "",
  "SUPABASE_ANON_KEY": "",
  "OPENROUTER_API_KEY": ""
};

// Log environment loading for debugging
console.log("env-config.js loaded at: " + new Date().toISOString());
if (window._env_.SUPABASE_URL) console.log("Supabase URL available");
if (window._env_.SUPABASE_ANON_KEY) console.log("Supabase Anon Key available");
