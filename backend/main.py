"""
Main FastAPI application entry point for the Seerah Tutor Backend.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import StudyRequest, StudyResponse, ChatRequest, SessionType
from services.data_service import data_service
from services import llm_service

# Lifespan manager ensures data loads once on startup and fails fast if broken
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate()
    data_service.load()
    yield
    # Cleanup logic (if any) goes here

app = FastAPI(
    title="AI Seerah Tutor API",
    lifespan=lifespan
)

# Configure CORS so your Next.js frontend (running on port 3000) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate-session", response_model=StudyResponse)
async def create_session(request: StudyRequest):
    """Generates the initial Quiz or Tutor lesson for a given page range."""
    try:
        # Extract exact text layer
        source_text = data_service.get_page_range(request.start_page, request.end_page)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Route based on requested session type
        if request.session_type == SessionType.QUIZ:
            content = llm_service.generate_quiz(source_text, request.language)
        else:
            content = llm_service.generate_tutor_lesson(source_text, request.language)
            
        return StudyResponse(
            start_page=request.start_page,
            end_page=request.end_page,
            session_type=request.session_type,
            language=request.language,
            content=content
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/api/tutor/chat")
async def tutor_chat(request: ChatRequest):
    """Handles follow-up questions for the Tutor with full context retention."""
    try:
        source_text = data_service.get_page_range(request.start_page, request.end_page)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        response_text = llm_service.chat_tutor(
            text=source_text,
            chat_history=request.chat_history,
            user_message=request.user_message,
            language=request.language
        )
        return {"response": response_text}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

# Run locally using: uvicorn main:app --reload