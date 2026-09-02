# AI Seerah Tutor & Quiz Master

An intelligent, full-stack educational platform designed to provide interactive tutoring and structured quizzes based on the historical and philosophical context of the Seerah (*The Sealed Nectar*).

This system leverages exact-match data ingestion and a "Tethered Scholar" prompt architecture to eliminate AI hallucinations, ensuring the LLM strictly adheres to the provided text while gracefully referencing broader historical contexts when prompted.

## 🚀 Tech Stack

*   **Frontend:** Next.js (React), Tailwind CSS, TypeScript
*   **Backend:** FastAPI (Python), Uvicorn, Pydantic
*   **AI Engine:** Google Gemini (1.5 / 2.5 Flash) via `google-genai` SDK
*   **Database (Planned):** PostgreSQL via Supabase

## 🏗️ System Architecture

1.  **Stateless API:** The backend holds no conversational state. The Next.js frontend manages the chat history and quiz UI state.
2.  **In-Memory Context Engine:** The 324-page PDF is pre-processed into a flat JSON dictionary (`seerah_pages.json`). FastAPI loads this into RAM on startup, extracting exact page ranges in `O(1)` time to inject into the LLM prompt.
3.  **Two-Phase Generation:** The Tutor autonomously selects analytical lenses (e.g., Geopolitics, Psychology) before generating the lesson, preventing user-forced contextual errors.

## 💻 Local Development Setup

### 1. Backend (FastAPI)

Navigate to the backend directory and set up the Python environment:

```bash
cd backend
python -m venv venv

# Windows Activation
.\venv\Scripts\activate
# Mac/Linux Activation
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt