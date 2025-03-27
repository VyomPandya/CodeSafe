import React, { useEffect } from 'react';
import { Auth } from './components/Auth';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { HistoryView } from './components/HistoryView';
import { SeverityFilter } from './components/SeverityFilter';
import { CodeEnhancement } from './components/CodeEnhancement';
import { generateTestFile } from './lib/testData';
import { useAnalysis, AnalysisProvider } from './context/AnalysisContext';
import { LogOut, AlertTriangle, History, Upload, Bug, Cpu } from 'lucide-react';

// TestMode component for development and debugging
// This component provides buttons for testing different code types (JavaScript, Python, Java)
function TestMode({ onTest }: { onTest: (type: string) => void }) {
  return (
    // Container with margin and styling for visual distinction
    <div className="mt-4 p-3 border border-orange-300 bg-orange-50 rounded-md">
      {/* Header with a bug icon and title "Test Mode" */}
      <h3 className="text-sm font-medium text-orange-800 flex items-center">
        <Bug className="h-4 w-4 mr-1" /> {/* Icon representing "Bug" for debugging context */}
        Test Mode
      </h3>
      {/* Description paragraph explaining the purpose of the buttons */}
      <p className="text-xs text-orange-700 mb-2">
        Use these buttons to quickly test different code types:
      </p>
      {/* Container for the buttons with spacing between them */}
      <div className="flex space-x-2">
        {/* Button to test JavaScript code */}
        <button
          onClick={() => onTest('js')} // Calls the onTest function with 'js' argument when clicked
          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Test JavaScript
        </button>
        {/* Button to test Python code */}
        <button
          onClick={() => onTest('py')} // Calls the onTest function with 'py' argument when clicked
          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Test Python
        </button>
        {/* Button to test Java code */}
        <button
          onClick={() => onTest('java')} // Calls the onTest function with 'java' argument when clicked
          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Test Java
        </button>
      </div>
    </div>
  );
}

// Model selector component for choosing between different AI models
function ModelSelector({ selectedModel, onChange }: { 
  selectedModel: string; 
  onChange: (model: string) => void 
}) {
  return (
    <div className="mt-4 p-3 border border-indigo-300 bg-indigo-50 rounded-md">
      <h3 className="text-sm font-medium text-indigo-800 flex items-center">
        <Cpu className="h-4 w-4 mr-1" />
        AI Model Selection
      </h3>
      <p className="text-xs text-indigo-700 mb-2">
        Choose which AI model to use for code analysis:
      </p>
      <select
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full mt-1 px-3 py-2 text-sm border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="mistralai/mistral-7b-instruct-v0.2:free">Mistral 7B V0.2 (Free)</option>
        <option value="google/gemini-pro-1.5">Google Gemini Pro 1.5 (Free)</option>
      </select>
    </div>
  );
}

// Simple Toast component
function Toast({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg ${bgColor} text-white max-w-sm`}>
      <div className="flex justify-between items-center">
        <p>{message}</p>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
}

// Main application component that uses the AnalysisContext
function AppContent() {
  const { 
    state, 
    dispatch, 
    handleFileUpload, 
    handleSignOut, 
    handleSeverityChange,
    filteredResults 
  } = useAnalysis();
  
  const [toast, setToast] = React.useState<{message: string, type: 'success' | 'error' | 'warning' | 'info', visible: boolean} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Display a notification if the OpenRouter API key is missing
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      showToast('OpenRouter API key not configured. Local analysis will be used as fallback.', 'warning');
    }
  }, []);

  // When error state changes, show a toast
  useEffect(() => {
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state.error]);

  // Handle dev mode keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Alt+D to toggle dev mode
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        dispatch({ type: 'SET_DEV_MODE', payload: !state.isDevMode });
        console.log('Dev mode toggled:', !state.isDevMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isDevMode, dispatch]);

  const handleTestFile = async (fileType: string) => {
    const testFile = generateTestFile(fileType);
    await handleFileUpload(testFile);
  };

  const handleSetModel = (model: string) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: model });
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!state.session && !state.isDevMode) {
    return (
      <>
        <Auth />
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-2 right-2 text-xs text-gray-500">
            Press Ctrl+Alt+D to enter dev mode
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Code Analyzer</h1>
              {state.isDevMode && (
                <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                  Dev Mode
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch({ type: 'SET_SHOW_HISTORY', payload: !state.showHistory })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              >
                {state.showHistory ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Analyze Code
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </>
                )}
              </button>
              {!state.isDevMode && (
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              )}
              {state.isDevMode && (
                <button
                  onClick={() => dispatch({ type: 'SET_DEV_MODE', payload: false })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
                >
                  Exit Dev Mode
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {state.showHistory ? (
            <HistoryView
              history={state.history}
              onSelectEntry={(entry) => {
                dispatch({ type: 'SET_CURRENT_FILE', payload: entry.file_name });
                dispatch({ type: 'SET_RESULTS', payload: entry.results });
                dispatch({ type: 'SET_SHOW_HISTORY', payload: false });
              }}
            />
          ) : (
            <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Upload Code for Analysis
              </h2>
              
              {/* Add the model selector component */}
              <ModelSelector 
                selectedModel={state.selectedModel} 
                onChange={handleSetModel} 
              />
              
              {/* Direct file upload component */}
              <div className="mt-4">
                <FileUpload 
                  onFileUpload={handleFileUpload} 
                  fileInputKey={state.fileInputKey} // Add key for resetting file input
                />
              </div>

              {state.isDevMode && (
                <TestMode onTest={handleTestFile} />
              )}

              {state.error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{state.error}</span>
                </div>
              )}

              {state.analyzing && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                  <span className="ml-2 text-gray-600">Analyzing code...</span>
                </div>
              )}

              {state.currentFile && state.results.length > 0 && (
                <>
                  <div className="mt-6">
                    <SeverityFilter
                      selectedSeverities={state.selectedSeverities}
                      onSeverityChange={handleSeverityChange}
                    />
                  </div>
                  <AnalysisResult results={filteredResults} fileName={state.currentFile} />
                  {state.currentCode && (
                    <CodeEnhancement fileName={state.currentFile} originalCode={state.currentCode} />
                  )}
                </>
              )}
              
              {state.currentFile && state.results.length === 0 && !state.analyzing && !state.error && (
                <>
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      No vulnerabilities found in the code! The analysis shows your code is secure.
                    </p>
                  </div>
                  {state.currentCode && (
                    <CodeEnhancement fileName={state.currentFile} originalCode={state.currentCode} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Wrapper component that provides the AnalysisContext
function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}

export default App;