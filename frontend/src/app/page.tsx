"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { generateSession, StudyRequest, StudyResponse, fetchSessions } from "@/lib/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import QuizView from "@/components/QuizView";
import TutorView from "@/components/TutorView";
import LoginView from "@/components/LoginView";
import ReaderView from "@/components/ReaderView"

const formatName = (name: string) => name ? name.charAt(0).toUpperCase() + name.slice(1) : "";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [username, setUsername] = useState<string>("");
  const [showReader, setShowReader] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("seerah_auth_token");
    if (savedToken) setToken(savedToken);
    setIsHydrated(true);
  }, []);

  // Persistent Result State
  const [result, setResult] = useLocalStorage<StudyResponse | null>("seerah_active_session", null);

  // Fetch history from Supabase whenever the token changes (login) or when
  // the user returns to the dashboard (result clears) — keeps scores fresh
  useEffect(() => {
    if (token && !result) {
      fetchSessions(token)
        .then(data => setHistory(data.sessions))
        .catch(err => console.error("Failed to load history:", err));
    }
  }, [token, result]);

  const handleLogout = () => {
    localStorage.removeItem("seerah_auth_token");
    setToken(null);
    setHistory([]);
    setResult(null); // Clear active screen
  };

  useEffect(() => setIsMounted(true), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [startPage, setStartPage] = useState<number>(24);
  const [endPage, setEndPage] = useState<number>(29);
  const [sessionType, setSessionType] = useState<"quiz" | "tutor">("quiz");
  const [language, setLanguage] = useState<"english" | "urdu">("english");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (startPage > endPage) {
      setError("Start page cannot be greater than the end page.");
      setLoading(false);
      return;
    }

    try {
      const data = await generateSession({ 
        start_page: startPage, 
        end_page: endPage, 
        session_type: sessionType, 
        language: language 
      }, token!);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  // Determine RTL and Font if Urdu
  const isUrdu = result?.language === "urdu";
  const layoutDir = isUrdu ? "rtl" : "ltr";
  const languageClass = isUrdu ? "urdu-text text-right" : "";

  // Route to Quiz UI
  if (result && result.session_type === "quiz" && Array.isArray(result.content)) {
    return (
      <main className="min-h-dvh bg-seerah-bg p-4 sm:p-6 md:p-8" dir={layoutDir}>
        <div className={languageClass}>
          <QuizView 
            key={result.id}
            questions={result.content} 
            sessionId={result.id}
            token={token!} 
            onRestart={() => setResult(null)} 
            dbScore={result.score}
          />
        </div>
      </main>
    );
  }

  // Route to Tutor UI
  if (result && result.session_type === "tutor" && typeof result.content === "string") {
    return (
      <main className="min-h-dvh bg-seerah-bg p-4 sm:p-6 md:p-8" dir={layoutDir}>
        <div className={languageClass}>
          <TutorView key={result.id}  sessionData={result} token={token!} username={username || localStorage.getItem("seerah_username") || "Student"} onExit={() => setResult(null)} />
        </div>
      </main>
    );
  }

  if (showReader) {
  return (
    <main className="min-h-dvh bg-seerah-bg p-4 sm:p-6 md:p-8">
      <ReaderView
        token={token!}
        onExit={() => setShowReader(false)}
        onQuizMe={(start, end) => {
          setStartPage(start);
          setEndPage(end);
          setSessionType("quiz");
          setShowReader(false);
          // Optionally auto-submit here instead of just pre-filling the form
        }}
      />
    </main>
  );
}

  // Prevent hydration errors by waiting for localStorage check
  if (!isHydrated) return null; 

  // If no token exists, lock the user out and show Login screen
  if (!token) {
    return (
      <LoginView 
        onAuthSuccess={(newToken, fetchedUsername) => {
          localStorage.setItem("seerah_auth_token", newToken);
          localStorage.setItem("seerah_username", fetchedUsername);
          setToken(newToken);
          setUsername(fetchedUsername);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-seerah-bg overflow-hidden">
      {/* Sidebar injected here */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        sessions={history} 
        onLogout={handleLogout} 
        onSelectSession={(session) => setResult(session)}
        onOpenReader={() => setShowReader(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-seerah-text mb-4">
              Seerah Tutor
            </h1>
            <p className="text-seerah-muted text-base sm:text-lg max-w-xl mx-auto">
              Configure your study session parameters to generate personalized questions or begin an interactive tutoring dialogue.
            </p>
          </div>

          <div className="bg-seerah-surface p-5 sm:p-8 rounded-2xl shadow-sm border border-seerah-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-wide">Start Page</label>
                  <input type="number" value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none" min={1} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-wide">End Page</label>
                  <input type="number" value={endPage} onChange={(e) => setEndPage(Number(e.target.value))} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none" min={1} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-wide">Mode</label>
                  <select value={sessionType} onChange={(e) => setSessionType(e.target.value as "quiz" | "tutor")} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none appearance-none">
                    <option value="quiz">Quiz Master</option>
                    <option value="tutor">Tutor Lesson</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold tracking-wide">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as "english" | "urdu")} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none appearance-none">
                    <option value="english">English</option>
                    <option value="urdu">Urdu (اردو)</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-seerah-accent text-white p-4 rounded-xl font-semibold hover:bg-seerah-accentHover transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                {loading ? <span className="animate-pulse">Analyzing Pages...</span> : "Generate Session"}
              </button>
            </form>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}