/// <reference types="vite/client" />

// Add custom environment variable declaration
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // readonly VITE_OPENROUTER_API_KEY: string; // No longer used in frontend
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add window._env_ declaration
interface Window {
  _env_?: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    // OPENROUTER_API_KEY?: string; // No longer used in frontend
  };
}
