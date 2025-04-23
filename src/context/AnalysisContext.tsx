import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { VulnerabilityResult } from '../components/AnalysisResult';

interface HistoryEntry {
  id: string;
  file_name: string;
  results: VulnerabilityResult[];
  created_at: string;
}

interface AnalysisState {
  session: Session | null;
  loading: boolean;
  analyzing: boolean;
  currentFile: string | null;
  currentCode: string | null;
  results: VulnerabilityResult[];
  error: string | null;
  showHistory: boolean;
  history: HistoryEntry[];
  selectedSeverities: string[];
  isDevMode: boolean;
  selectedModel: string;
  fileInputKey: number; // Used to reset file input
}

// Action types for the reducer
type AnalysisAction =
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_CURRENT_FILE'; payload: string | null }
  | { type: 'SET_CURRENT_CODE'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: VulnerabilityResult[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOW_HISTORY'; payload: boolean }
  | { type: 'SET_HISTORY'; payload: HistoryEntry[] }
  | { type: 'TOGGLE_SEVERITY'; payload: string }
  | { type: 'SET_DEV_MODE'; payload: boolean }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'RESET_ANALYSIS_RESULTS' }
  | { type: 'RESET_FILE_INPUT' }
  | { type: 'RESET_ALL_STATE' };

const initialState: AnalysisState = {
  session: null,
  loading: true,
  analyzing: false,
  currentFile: null,
  currentCode: null,
  results: [],
  error: null,
  showHistory: false,
  history: [],
  selectedSeverities: [],
  isDevMode: false,
  selectedModel: 'nvidia/llama-3.1-nemotron-nano-8b-v1:free',
  fileInputKey: Date.now(), // Initialize with current timestamp
};

// Reducer function to handle state updates
function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ANALYZING':
      return { ...state, analyzing: action.payload };
    
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload };
    
    case 'SET_CURRENT_CODE':
      return { ...state, currentCode: action.payload };
    
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SHOW_HISTORY':
      return { ...state, showHistory: action.payload };
    
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    
    case 'TOGGLE_SEVERITY':
      return {
        ...state,
        selectedSeverities: state.selectedSeverities.includes(action.payload)
          ? state.selectedSeverities.filter(s => s !== action.payload)
          : [...state.selectedSeverities, action.payload]
      };
    
    case 'SET_DEV_MODE':
      return { ...state, isDevMode: action.payload };
    
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
    
    case 'RESET_ANALYSIS_RESULTS':
      return {
        ...state,
        results: [],
        error: null,
        currentFile: null,
        currentCode: null,
        selectedSeverities: []
      };
    
    case 'RESET_FILE_INPUT':
      return {
        ...state,
        fileInputKey: Date.now()
      };
    
    case 'RESET_ALL_STATE':
      return {
        ...initialState,
        fileInputKey: Date.now(),
        isDevMode: state.isDevMode // Preserve dev mode setting
      };
    
    default:
      return state;
  }
}

// Create context with initial values
interface AnalysisContextProps {
  state: AnalysisState;
  dispatch: React.Dispatch<AnalysisAction>;
  loadHistory: () => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleSeverityChange: (severity: string) => void;
  filteredResults: VulnerabilityResult[];
}

const AnalysisContext = createContext<AnalysisContextProps | undefined>(undefined);

// Provider component
function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState);
  
  // Function to load analysis history
  const loadHistory = async () => {
    if (!state.session?.user) return;
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('analysis_history')
        .select('*')
        .eq('user_id', state.session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      dispatch({ type: 'SET_HISTORY', payload: data || [] });
    } catch (err) {
      console.error('Error loading history:', err);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : "Failed to load analysis history"
      });
    }
  };

  // Function to handle file upload and analysis
  const handleFileUpload = async (file: File) => {
    // Import here to avoid circular dependencies
    const { analyzeCode } = await import('../lib/analyzer');
    
    try {
      // Reset previous analysis results first
      dispatch({ type: 'RESET_ANALYSIS_RESULTS' });
      
      // Start analyzing
      dispatch({ type: 'SET_ANALYZING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_CURRENT_FILE', payload: file.name });
      
      // Read the file content
      const content = await file.text();
      dispatch({ type: 'SET_CURRENT_CODE', payload: content });
      
      // Create a new file object
      const fileBlob = new Blob([content], { type: file.type });
      const fileObject = new File([fileBlob], file.name, { type: file.type });
      
      // Analyze code
      const analysisResults = await analyzeCode(fileObject, state.selectedModel);
      dispatch({ type: 'SET_RESULTS', payload: analysisResults });

      // Save to analysis history if user is logged in
      if (state.session?.user) {
        try {
          const client = getSupabaseClient();
          const { error: dbError } = await client
            .from('analysis_history')
            .insert([
              {
                user_id: state.session.user.id,
                file_name: file.name,
                results: analysisResults,
                created_at: new Date().toISOString(),
              },
            ]);

          if (dbError) throw dbError;
          await loadHistory();
        } catch (dbErr) {
          console.error("Failed to save analysis history:", dbErr);
        }
      }
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err instanceof Error ? err.message : 'An error occurred during analysis' 
      });
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
      // Reset file input to allow uploading the same file again
      dispatch({ type: 'RESET_FILE_INPUT' });
    }
  };

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      
      // First explicitly set session to null to ensure the session state change is detected
      dispatch({ type: 'SET_SESSION', payload: null });
      
      // Then reset all other state
      dispatch({ type: 'RESET_ALL_STATE' });
      
      // Finally set loading to false
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error("Sign out failed:", error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : "Sign out failed. Please try again." 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Function to handle severity filter changes
  const handleSeverityChange = (severity: string) => {
    dispatch({ type: 'TOGGLE_SEVERITY', payload: severity });
  };

  // Compute filtered results based on selected severities
  const filteredResults = state.selectedSeverities.length > 0
    ? state.results.filter(result => state.selectedSeverities.includes(result.severity))
    : state.results;

  // Handle auth state changes
  useEffect(() => {
    try {
      // Try to get Supabase client but catch error if it's not initialized
      let client;
      try {
        client = getSupabaseClient();
      } catch (error) {
        console.warn("Authentication service unavailable:", error);
        dispatch({ type: 'SET_LOADING', payload: false });
        return () => {};
      }

      // Only proceed if we have a client
      if (!client) {
        return () => {};
      }

      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed', event, session);
        
        if (event === 'SIGNED_IN') {
          // Reset analysis state when a new user signs in
          dispatch({ type: 'RESET_ANALYSIS_RESULTS' });
        }
        
        dispatch({ type: 'SET_SESSION', payload: session });
      });

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Failed to subscribe to auth state changes:", error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: "Authentication service is unavailable." 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return () => {};
    }
  }, []);

  // Get initial session
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        // Try to get Supabase client but catch error if it's not initialized
        let client;
        try {
          client = getSupabaseClient();
        } catch (error) {
          console.warn("Authentication service unavailable for initial session:", error);
          dispatch({ 
            type: 'SET_ERROR', 
            payload: error instanceof Error ? error.message : "Authentication service is unavailable" 
          });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // Only proceed if we have a client
        if (!client) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        const { data } = await client.auth.getSession();
        console.log('Initial session:', data.session);
        dispatch({ type: 'SET_SESSION', payload: data.session });
      } catch (error) {
        console.error("Failed to get initial session:", error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : "Failed to initialize authentication" 
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    getInitialSession();
  }, []);

  // Load history when session changes
  useEffect(() => {
    if (state.session?.user) {
      loadHistory();
    }
  }, [state.session]);

  return (
    <AnalysisContext.Provider 
      value={{ 
        state, 
        dispatch, 
        loadHistory, 
        handleFileUpload, 
        handleSignOut, 
        handleSeverityChange,
        filteredResults
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

// Custom hook to use the analysis context
function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}; 

export { AnalysisProvider, useAnalysis };