"use client";

import { useState, useEffect } from "react";
import { fetchBookPage, fetchBookMeta } from "@/lib/api";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

export default function ReaderView({
  token,
  onExit,
  onQuizMe,
}: {
  token: string;
  onExit: () => void;
  onQuizMe: (startPage: number, endPage: number, language: "english" | "urdu") => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [rangeStart, setRangeStart] = useState(1);
  const [language, setLanguage] = useState<"english" | "urdu">("english");

  useEffect(() => {
    fetchBookMeta(token)
      .then((meta) => setTotalPages(meta.total_pages))
      .catch((err) => console.error("Failed to load book metadata:", err));
  }, [token]);

  useEffect(() => {
    if (language !== "english") return;
    setLoading(true);
    fetchBookPage(currentPage, token)
      .then((data) => setText(data.text))
      .catch((err) => {
        console.error("Failed to load page:", err);
        setText("Could not load this page.");
      })
      .finally(() => setLoading(false));
  }, [currentPage, token, language]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1));

  return (
    <div className="max-w-3xl mx-auto h-[calc(100dvh-2rem)] sm:h-[85vh] flex flex-col bg-seerah-surface rounded-2xl shadow-sm border border-seerah-border overflow-hidden">
      
      {/* Header */}
      <div className="bg-seerah-bg border-b border-seerah-border p-3 sm:p-4 flex flex-wrap gap-2 justify-between items-center z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onExit}
            className="p-2 shrink-0 hover:bg-seerah-border rounded-lg transition-colors text-seerah-muted hover:text-seerah-text"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <BookOpen className="text-seerah-accent shrink-0" size={20} />
          <h2 className="font-serif font-bold text-base sm:text-lg text-seerah-text truncate">Reader</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* English / Urdu toggle */}
          <div className="flex bg-white border border-seerah-border rounded-lg overflow-hidden text-xs sm:text-sm">
            <button
              onClick={() => setLanguage("english")}
              className={`px-3 py-1.5 font-medium transition-colors ${language === "english" ? "bg-seerah-accent text-white" : "text-seerah-muted hover:bg-seerah-bg"}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("urdu")}
              className={`px-3 py-1.5 font-medium transition-colors ${language === "urdu" ? "bg-seerah-accent text-white" : "text-seerah-muted hover:bg-seerah-bg"}`}
            >
              اردو
            </button>
          </div>

          <span className="text-xs sm:text-sm text-seerah-muted font-medium bg-white px-2.5 sm:px-3 py-1 rounded-full border border-seerah-border shrink-0">
            Page {currentPage}{totalPages ? ` / ${totalPages}` : ""}
          </span>
        </div>
      </div>

      {/* Page Content */}
      {language === "english" ? (
        <div className="flex-1 overflow-y-auto p-6 sm:p-12">
          {loading ? (
            <p className="text-seerah-muted animate-pulse">Loading page...</p>
          ) : (
            <div className="max-w-[65ch] mx-auto">
              <p className="font-serif text-lg sm:text-xl leading-[1.9] text-seerah-text first-letter:text-5xl first-letter:font-bold first-letter:text-seerah-accent first-letter:mr-2 first-letter:float-left first-letter:leading-none">
                {text}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 bg-gray-100">
          <iframe
            key={currentPage}
            src={`/book-urdu.pdf#page=${currentPage}`}
            className="w-full h-full border-0"
            title="Urdu book PDF"
          />
        </div>
      )}

      {/* Navigation + Quiz Trigger */}
      <div className="p-3 sm:p-4 bg-white border-t border-seerah-border flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg border border-seerah-border hover:bg-seerah-bg disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => onQuizMe(rangeStart, currentPage, language)}
          className="flex-1 text-center bg-seerah-accent text-white py-2.5 rounded-xl font-medium hover:bg-seerah-accentHover transition-colors text-sm sm:text-base"
        >
          Quiz me on pages {rangeStart}–{currentPage}
        </button>

        <button
          onClick={goNext}
          disabled={totalPages !== null && currentPage >= totalPages}
          className="p-2 rounded-lg border border-seerah-border hover:bg-seerah-bg disabled:opacity-40 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}