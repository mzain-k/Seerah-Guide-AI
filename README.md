# 🌙 Seerah Tutor

> An intelligent, full-stack learning platform designed to provide interactive quizzes, personalized AI tutoring sessions, and historical session tracking for studying the Seerah.

![Tech Stack](https://img.shields.io/badge/Stack-Next.js_%7C_FastAPI_%7C_Supabase-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat&logo=tailwind-css&logoColor=white)

---

## 📖 Overview

**Seerah Tutor** bridges traditional text study with modern generative AI. By selecting specific page ranges from source texts, users can generate dynamic Markdown-based study lessons or interactive multiple-choice quizzes. The platform features persistent state tracking, score review modes, custom user authentication, and context-aware AI chat capabilities that dynamically personalize interactions based on the logged-in user's profile.

---

## ✨ Key Features

*   **🤖 AI-Driven Tutor Sessions:** Generates comprehensive lesson summaries from custom book page ranges and allows real-time follow-up conversations with a context-aware scholar AI.
*   **🎯 Interactive Quizzes:** Automated quiz generation complete with instant answer validation, historical performance tracking, and scholar takeaways.
*   **📜 Historical Session Review:** Access past quizzes and tutor chats from a persistent sidebar, complete with saved scores and full chat history rendering.
*   **👤 Dynamic Personalization:** Secure custom authentication (`app_users` table with hashed passwords) that tracks usernames and injects them into LLM prompts for personalized greetings.
*   **⚡ Robust State Management:** Leverages React state synchronization with local storage and database persistence to ensure smooth user experiences without UI freezing.

---

## 🏗️ Architecture & Tech Stack

### **Frontend**
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Lucide Icons
*   **Markdown Parsing:** `react-markdown` with typography prose plugins

### **Backend**
*   **Framework:** FastAPI (Python)
*   **Data Validation:** Pydantic
*   **AI Integration:** Custom LLM service wrapper handling prompt templates and dynamic payload injection
*   **Security:** JWT-based access tokens & `passlib` password hashing

### **Database & Storage**
*   **Database:** Supabase (PostgreSQL)
*   **Data Schemas:** Relational user tables combined with `jsonb` document stores for chat history and quiz payloads.

---

## 📂 Project Directory Structure

```text
seerah-tutor/
├── backend/
│   ├── services/
│   │   ├── data_service.py
│   │   └── llm_service.py
│   ├── auth.py
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── LoginView.tsx
    │   │   ├── QuizView.tsx
    │   │   ├── TutorView.tsx
    │   │   └── ...
    │   ├── hooks/
    │   └── lib/
    │       └── api.ts
    ├── package.json
    └── tailwind.config.ts
```

## 🗄️ Database Schema (Supabase)

The application relies on two core tables inside Supabase:

### 1. `app_users`
Handles custom user accounts and authentication.
* `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
* `username` (text, Unique, Lowercase enforced)
* `password_hash` (text)
* `created_at` (timestamptz)

### 2. `study_sessions`
Stores all generated quizzes, tutor articles, scores, and ongoing chat histories.
* `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
* `user_id` (uuid, Foreign Key referencing `app_users.id`)
* `session_type` (text - `'quiz'` or `'tutor'`)
* `start_page` (integer)
* `end_page` (integer)
* `language` (text)
* `content` (jsonb - stores quiz questions or primary markdown lesson)
* `chat_history` (jsonb - stores ongoing follow-up messages for tutor sessions)
* `score` (integer, Nullable)
* `total_questions` (integer, Nullable)
* `created_at` (timestamptz)

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* A Supabase project instance

## 1. Clone the Repository
```bash
git clone [https://github.com/your-username/seerah-tutor.git](https://github.com/your-username/seerah-tutor.git)
cd seerah-tutor
```

## 2. Backend Setup

Create a `.env` file inside the `backend/` directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_or_anon_key
JWT_SECRET_KEY=your_super_secret_jwt_key
OPENAI_API_KEY=your_llm_api_key
```

Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

## 3. Frontend Setup

Open a new terminal window, navigate to the `frontend` directory, and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the platform.

---

## 🌐 Deployment Guidelines

### Frontend (Next.js)

The frontend can be easily deployed on **Vercel**.

- Set the **Root Directory** to `frontend`.
- Set `NEXT_PUBLIC_API_URL` to your production backend URL.

### Backend (FastAPI)

The backend can be deployed on **Render** or **Railway**.

- Set the **Root Directory** to `backend`.
- Use the following build command:

```bash
pip install -r requirements.txt
```

- Use the following start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🛡️ License

This project is built for educational and spiritual enrichment purposes. Feel free to fork, adapt, and build upon it.
