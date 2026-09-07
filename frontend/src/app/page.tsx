"use client";

import { useState, useEffect } from "react";
import { generateSession, StudyRequest, StudyResponse } from "@/lib/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import QuizView from "@/components/QuizView";
import TutorView from "@/components/TutorView";
import { BookOpen } from "lucide-react";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Persistent Result State
  const [result, setResult] = useLocalStorage<StudyResponse | null>("seerah_active_session", null);

  // Form States
  const [startPage, setStartPage] = useState<number>(24);
  const [endPage, setEndPage] = useState<number>(29);
  const [sessionType, setSessionType] = useState<"quiz" | "tutor">("quiz");
  const [language, setLanguage] = useState<"english" | "urdu">("english");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Add this validation block
    if (startPage > endPage) {
      setError("Start page cannot be greater than the end page.");
      setLoading(false);
      return;
    }

    try {
      // Pass the dynamic language state, not hardcoded "english"
      const data = await generateSession({ 
        start_page: startPage, 
        end_page: endPage, 
        session_type: sessionType, 
        language: language 
      });
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
      <main className="min-h-screen bg-seerah-bg p-4 md:p-12" dir={layoutDir}>
        <div className={languageClass}>
          <QuizView questions={result.content} onRestart={() => setResult(null)} />
        </div>
      </main>
    );
  }

  // Route to Tutor UI
  if (result && result.session_type === "tutor" && typeof result.content === "string") {
    return (
      <main className="min-h-screen bg-seerah-bg p-4 md:p-8" dir={layoutDir}>
        <div className={languageClass}>
          <TutorView sessionData={result} onExit={() => setResult(null)} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-seerah-bg text-seerah-text flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-seerah-surface rounded-full shadow-sm border border-seerah-border mb-2">
            <BookOpen className="text-seerah-accent w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-seerah-text">Seerah Tutor</h1>
          <p className="text-seerah-muted text-lg">Deep contextual learning from The Sealed Nectar</p>
        </div>

        <div className="bg-seerah-surface p-8 rounded-2xl shadow-sm border border-seerah-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide">Start Page</label>
                <input type="number" value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none" min={1} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide">End Page</label>
                <input type="number" value={endPage} onChange={(e) => setEndPage(Number(e.target.value))} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none" min={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
  );
}