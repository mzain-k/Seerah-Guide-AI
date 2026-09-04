"use client";

import { useState } from "react";
import { generateSession, StudyRequest, StudyResponse, QuizQuestion } from "@/lib/api";
import QuizView from "@/components/QuizView";
import { BookOpen } from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StudyResponse | null>(null);

  const [startPage, setStartPage] = useState<number>(24);
  const [endPage, setEndPage] = useState<number>(29);
  const [sessionType, setSessionType] = useState<"quiz" | "tutor">("quiz");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await generateSession({ start_page: startPage, end_page: endPage, session_type: sessionType, language: "english" });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // If we have a Quiz Result, render the Quiz UI instead of the form
  if (result && result.session_type === "quiz" && Array.isArray(result.content)) {
    return (
      <main className="min-h-screen bg-seerah-bg p-4 md:p-12">
        <QuizView questions={result.content} onRestart={() => setResult(null)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-seerah-bg text-seerah-text flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-8">
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
                <label className="text-sm font-semibold text-seerah-text tracking-wide">Start Page</label>
                <input type="number" value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none transition" min={1} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-seerah-text tracking-wide">End Page</label>
                <input type="number" value={endPage} onChange={(e) => setEndPage(Number(e.target.value))} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none transition" min={1} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-seerah-text tracking-wide">Mode</label>
              <select value={sessionType} onChange={(e) => setSessionType(e.target.value as "quiz" | "tutor")} className="w-full p-3 bg-seerah-bg border border-seerah-border rounded-xl focus:ring-2 focus:ring-seerah-accent outline-none transition appearance-none">
                <option value="quiz">Quiz Master (Interactive MCQ)</option>
                <option value="tutor" disabled>Tutor Lesson (Coming Next)</option>
              </select>
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