"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, User, BookOpen } from "lucide-react";
import { chatTutor, ChatMessage, StudyResponse } from "@/lib/api";

export default function TutorView({ sessionData }: { sessionData: StudyResponse }) {
  // Initialize chat with the AI's first generated lesson
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: sessionData.content as string }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message to UI instantly
    const updatedHistory: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedHistory);
    setIsTyping(true);

    try {
      const res = await chatTutor({
        start_page: sessionData.start_page,
        end_page: sessionData.end_page,
        language: sessionData.language,
        chat_history: messages, // Send history so LLM remembers the context
        user_message: userMsg
      });

      setMessages([...updatedHistory, { role: "assistant", content: res.response }]);
    } catch (error) {
      setMessages([...updatedHistory, { role: "assistant", content: "**Error:** The scholar could not be reached. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col bg-seerah-surface rounded-2xl shadow-sm border border-seerah-border overflow-hidden">
      
      {/* Header */}
      <div className="bg-seerah-bg border-b border-seerah-border p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <BookOpen className="text-seerah-accent" />
          <h2 className="font-serif font-bold text-lg text-seerah-text">Tutor Session</h2>
        </div>
        <span className="text-sm text-seerah-muted font-medium bg-white px-3 py-1 rounded-full border border-seerah-border">
          Pages {sessionData.start_page} - {sessionData.end_page}
        </span>
      </div>

      {/* Chat History / Markdown Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            
            {/* Avatar */}
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${
              msg.role === "assistant" ? "bg-seerah-accent text-white border-seerah-accentHover" : "bg-white text-seerah-muted border-seerah-border"
            }`}>
              {msg.role === "assistant" ? <BookOpen size={18} /> : <User size={18} />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[85%] rounded-2xl p-6 shadow-sm ${
              msg.role === "user" ? "bg-seerah-text text-white" : "bg-seerah-bg border border-seerah-border"
            }`}>
              {msg.role === "assistant" ? (
                // Prose handles all the markdown styling beautifully
                <div className="prose prose-stone prose-headings:font-serif prose-headings:text-seerah-text prose-p:text-seerah-text prose-strong:text-seerah-accent max-w-none leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-lg">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-seerah-accent text-white border border-seerah-accentHover flex items-center justify-center shadow-sm">
              <BookOpen size={18} />
            </div>
            <div className="bg-seerah-bg border border-seerah-border rounded-2xl p-6 text-seerah-muted flex items-center gap-2">
              <span className="animate-pulse">The scholar is analyzing the text...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-seerah-border">
        <div className="max-w-3xl mx-auto relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize magic: reset height to auto, then set to scrollHeight
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent standard new line
                handleSend();
                // Reset height back to default after sending
                e.currentTarget.style.height = "auto";
              }
            }}
            placeholder="Ask a question... (Shift + Enter for new line)"
            rows={1}
            className="w-full bg-seerah-bg border border-seerah-border rounded-xl py-4 pl-6 pr-16 text-seerah-text focus:outline-none focus:ring-2 focus:ring-seerah-accent transition-all resize-none overflow-y-auto max-h-[200px]"
            style={{ minHeight: "58px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-seerah-accent text-white rounded-lg hover:bg-seerah-accentHover transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}