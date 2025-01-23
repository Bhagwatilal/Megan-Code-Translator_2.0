import React, { useState, useCallback, useEffect } from 'react';
import { Editor } from './components/Editor';
import { LanguageSelector } from './components/LanguageSelector';
import { AuthModal } from './components/AuthModal';
import { OutputWindow } from './components/OutputWindow';
import { languages } from './config/languages';
import { translateCode } from './lib/translator';
import { Language } from './types';
import { Code2, LogIn, Play } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { executeCode } from './lib/codeRunner';

function App() {
  const [sourceLanguage, setSourceLanguage] = useState<Language>(languages[0]);
  const [targetLanguage, setTargetLanguage] = useState<Language>(languages[1]);
  const [sourceCode, setSourceCode] = useState<string>('');
  const [translatedCode, setTranslatedCode] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [freeTranslationsUsed, setFreeTranslationsUsed] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sourceOutput, setSourceOutput] = useState<string>('');
  const [targetOutput, setTargetOutput] = useState<string>('');
  const [showSourceOutput, setShowSourceOutput] = useState(false);
  const [showTargetOutput, setShowTargetOutput] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const translateDebounced = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (code: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          if (!code.trim()) {
            setTranslatedCode('');
            return;
          }

          if (!user && freeTranslationsUsed >= 3) {
            setIsAuthModalOpen(true);
            return;
          }
          
          setIsTranslating(true);
          try {
            const result = await translateCode(
              code,
              sourceLanguage.name,
              targetLanguage.name
            );
            setTranslatedCode(result);
            if (!user) {
              setFreeTranslationsUsed(prev => prev + 1);
            }
          } catch (error) {
            toast.error('Translation failed. Please try again.');
          } finally {
            setIsTranslating(false);
          }
        }, 1000);
      };
    })(),
    [sourceLanguage, targetLanguage, user, freeTranslationsUsed]
  );

  useEffect(() => {
    if (sourceCode) {
      translateDebounced(sourceCode);
    }
  }, [sourceCode, translateDebounced]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const runCode = async (code: string, language: Language) => {
    try {
      const output = await executeCode(code, language);
      return output;
    } catch (error) {
      return `Error executing code: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const handleRunSourceCode = async () => {
    const output = await runCode(sourceCode, sourceLanguage);
    setSourceOutput(output);
    setShowSourceOutput(true);
  };

  const handleRunTargetCode = async () => {
    const output = await runCode(translatedCode, targetLanguage);
    setTargetOutput(output);
    setShowTargetOutput(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold">Code Translator</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user && (
                <span className="text-sm text-gray-400">
                  {3 - freeTranslationsUsed} free translations remaining
                </span>
              )}

              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-300">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
              <div className="bg-gray-800 p-3 rounded-t-lg border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Source Code</h2>
                <div className="flex items-center space-x-4">
                  <LanguageSelector
                    languages={languages}
                    selected={sourceLanguage}
                    onChange={setSourceLanguage}
                  />
                  <button
                    onClick={handleRunSourceCode}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
              <div className="h-[calc(100vh-20rem)]">
                <Editor
                  language={sourceLanguage}
                  value={sourceCode}
                  onChange={setSourceCode}
                />
              </div>
            </div>
            {showSourceOutput && (
              <OutputWindow
                output={sourceOutput}
                onClose={() => setShowSourceOutput(false)}
              />
            )}
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
              <div className="bg-gray-800 p-3 rounded-t-lg border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Translated Code</h2>
                <div className="flex items-center space-x-4">
                  <LanguageSelector
                    languages={languages}
                    selected={targetLanguage}
                    onChange={setTargetLanguage}
                  />
                  <button
                    onClick={handleRunTargetCode}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
              <div className="h-[calc(100vh-20rem)] relative">
                <Editor
                  language={targetLanguage}
                  value={translatedCode}
                  readOnly
                />
                {isTranslating && (
                  <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-blue-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {showTargetOutput && (
              <OutputWindow
                output={targetOutput}
                onClose={() => setShowTargetOutput(false)}
              />
            )}
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;