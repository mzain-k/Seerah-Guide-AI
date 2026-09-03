// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// 1. Type Definitions (Mirroring FastAPI Pydantic Models)
export type SessionType = "quiz" | "tutor";
export type Language = "english" | "urdu";

export interface StudyRequest {
  start_page: number;
  end_page: number;
  session_type: SessionType;
  language: Language;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  category: string;
  is_key_takeaway: boolean;
}

export interface StudyResponse {
  start_page: number;
  end_page: number;
  session_type: SessionType;
  language: Language;
  content: string | QuizQuestion[]; // String for Tutor markdown, Array for Quiz
}

// 2. The Fetch Wrapper
export async function generateSession(requestData: StudyRequest): Promise<StudyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      // Extract the exact error message from FastAPI if available
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error (generateSession):", error);
    throw error;
  }
}