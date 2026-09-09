// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- 1. TYPE DEFINITIONS ---
export type SessionType = "quiz" | "tutor";
export type Language = "english" | "urdu";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  start_page: number;
  end_page: number;
  language: Language;
  chat_history: ChatMessage[];
  user_message: string;
  user_name: string;
}

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
  id: string;
  start_page: number;
  end_page: number;
  session_type: SessionType;
  language: Language;
  content: string | QuizQuestion[];
  score: number | null;
  chat_history?: any[];
}

// --- 2. AUTHENTICATION ENDPOINTS ---

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Login failed");
  }
  return response.json();
}

export async function register(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Registration failed");
  }
  return response.json();
}

// --- 3. SECURED APP ENDPOINTS ---
// Notice how every app route now requires the JWT token

export async function generateSession(requestData: StudyRequest, token: string): Promise<StudyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const detail = errorData?.detail;
      const errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
      throw new Error(errorMessage || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error (generateSession):", error);
    throw error;
  }
}

export async function chatTutor(requestData: ChatRequest, token: string): Promise<{ response: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error (chatTutor):", error);
    throw error;
  }
}

export async function fetchSessions(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sessions");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (fetchSessions):", error);
    throw error;
  }
}

export const saveQuizScore = async (sessionId: string, score: number, totalQuestions: number, token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/quiz/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      session_id: sessionId, 
      score: score, 
      total_questions: totalQuestions 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Server error: ${response.status}`);
  }

  return await response.json();
};

export async function fetchBookPage(pageNumber: number, token: string): Promise<{ page: number; text: string }> {
  const response = await fetch(`${API_BASE_URL}/api/book/page/${pageNumber}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error("Failed to load page");
  }
  return await response.json();
}

export async function fetchBookMeta(token: string): Promise<{ total_pages: number }> {
  const response = await fetch(`${API_BASE_URL}/api/book/meta`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error("Failed to load book metadata");
  }
  return await response.json();
}