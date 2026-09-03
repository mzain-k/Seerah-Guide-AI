"use client";

import { useState } from "react";
import { generateSession, StudyRequest, StudyResponse } from "@/lib/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StudyResponse | null>(null);

  // Form State
  const [startPage, setStartPage] = useState<number>(24);
  const [endPage, setEndPage] = useState<number>(29);
  const [sessionType, setSessionType] = useState<"quiz" | "tutor">("quiz");
  const [language, setLanguage] = useState<"english" | "urdu">("english");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestData: StudyRequest = {
        start_page: startPage,
        end_page: endPage,
        session_type: sessionType,
        language,
      };

      const data = await generateSession(requestData);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Seerah Tutor
          </h1>
          <p className="text-gray-500">
            Deep contextual learning from The Sealed Nectar
          </p>
        </header>

        {/* The Control Panel */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Start Page</label>
              <input
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                min={1}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">End Page</label>
              <input
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(Number(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                min={1}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Mode</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as "quiz" | "tutor")}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="quiz">Quiz Master</option>
                <option value="tutor">Tutor Lesson</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Start Session"}
            </button>
          </form>
        </section>

        {/* Error Handling */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
            <strong>Error: </strong> {error}
          </div>
        )}

        {/* Raw Output Preview (Temporary) */}
        {result && (
          <section className="bg-gray-900 text-green-400 p-6 rounded-2xl shadow-inner overflow-auto max-h-[600px] text-sm font-mono">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </section>
        )}
      </div>
    </main>
  );
}