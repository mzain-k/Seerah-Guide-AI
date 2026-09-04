"use client";

import { useState } from "react";
import { QuizQuestion } from "@/lib/api";
import { CheckCircle2, XCircle, ArrowRight, BookOpen } from "lucide-react";

export default function QuizView({ questions, onRestart }: { questions: QuizQuestion[], onRestart: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentQ.correct_answer;

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    if (option === currentQ.correct_answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const takeaways = questions.filter(q => q.is_key_takeaway);
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-seerah-surface p-8 rounded-2xl shadow-sm border border-seerah-border text-center">
          <h2 className="text-3xl font-serif font-bold text-seerah-text mb-2">Session Complete</h2>
          <p className="text-lg text-seerah-muted mb-6">You scored {score} out of {questions.length}</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
            <div className="bg-seerah-accent h-3 rounded-full transition-all duration-1000" style={{ width: `${(score / questions.length) * 100}%` }}></div>
          </div>
          <button onClick={onRestart} className="bg-seerah-accent text-white px-6 py-2 rounded-lg hover:bg-seerah-accentHover transition">
            Start New Session
          </button>
        </div>

        {takeaways.length > 0 && (
          <div className="bg-seerah-surface p-8 rounded-2xl shadow-sm border border-seerah-border">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 border-b pb-4">
              <BookOpen className="text-seerah-accent" />
              Scholar's Takeaways
            </h3>
            <div className="space-y-6">
              {takeaways.map((q, i) => (
                <div key={i} className="space-y-2">
                  <p className="font-medium text-seerah-text">{q.question}</p>
                  <p className="text-seerah-muted text-sm leading-relaxed bg-seerah-bg p-4 rounded-lg">{q.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-8 text-sm font-medium text-seerah-muted tracking-wide">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span className="bg-white px-3 py-1 rounded-full border border-seerah-border shadow-sm">
          {currentQ.category}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-seerah-surface p-8 md:p-10 rounded-2xl shadow-sm border border-seerah-border mb-6">
        <h2 className="text-2xl font-serif text-seerah-text leading-snug mb-8">
          {currentQ.question}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isActuallyCorrect = option === currentQ.correct_answer;
            
            let buttonStyle = "border-seerah-border hover:border-seerah-accent hover:bg-seerah-bg text-seerah-text";
            
            if (isAnswered) {
              if (isActuallyCorrect) {
                buttonStyle = "border-seerah-correct bg-green-50 text-seerah-correct ring-1 ring-seerah-correct";
              } else if (isSelected) {
                buttonStyle = "border-seerah-wrong bg-red-50 text-seerah-wrong";
              } else {
                buttonStyle = "border-seerah-border opacity-50 cursor-not-allowed";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex justify-between items-center ${buttonStyle}`}
              >
                <span className="text-lg">{option}</span>
                {isAnswered && isActuallyCorrect && <CheckCircle2 className="text-seerah-correct shrink-0" />}
                {isAnswered && isSelected && !isActuallyCorrect && <XCircle className="text-seerah-wrong shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Box (Reveals instantly on answer) */}
      {isAnswered && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-6 rounded-2xl mb-6 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h4 className={`font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? 'Correct Reflection' : 'Historical Correction'}
            </h4>
            <p className="text-seerah-text leading-relaxed">{currentQ.explanation}</p>
          </div>
          
          <button 
            onClick={handleNext}
            className="w-full bg-seerah-text text-white p-4 rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Session'}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}