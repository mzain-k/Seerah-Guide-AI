"""
Main FastAPI application entry point for the Seerah Tutor Backend.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import StudyRequest, StudyResponse, ChatRequest, SessionType
from auth import hash_password, verify_password, create_access_token, get_current_user
from fastapi import FastAPI, HTTPException, Depends
from services.data_service import data_service
from services import llm_service
from database import save_study_session, get_all_sessions
from models import UserCreate
from auth import hash_password
from database import supabase
from pydantic import BaseModel


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
    allow_origins=["http://localhost:3000", "https://seerah-guide-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreRequest(BaseModel):
    session_id: str
    score: int
    total_questions: int

@app.post("/api/generate-session", response_model=StudyResponse)
async def create_session(request: StudyRequest, user_id: str = Depends(get_current_user)):
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
            
        # --- NEW DB INSERTION LOGIC ---
        # Dynamically handle serialization for ANY Pydantic model or list of models
        if hasattr(content, "model_dump"):
            # It's a single Pydantic model (e.g., Quiz wrapper)
            db_content = content.model_dump()
        elif isinstance(content, list) and len(content) > 0 and hasattr(content[0], "model_dump"):
            # It's a list of Pydantic models
            db_content = [item.model_dump() for item in content]
        else:
            # It's a plain string (Tutor) or plain dictionary
            db_content = content

        session_record = {
            "session_type": request.session_type.value,
            "start_page": request.start_page,
            "end_page": request.end_page,
            "language": request.language.value,
            "content": db_content,
            "user_id": user_id  # explicitly pass the user_id
        }
        
        # 1. Insert directly and capture the response to get the generated ID
        db_response = supabase.table("study_sessions").insert(session_record).execute()
        new_session_id = db_response.data[0]["id"]

        # 2. Return the new_session_id in the response!
        return StudyResponse(
            id=new_session_id,  # <--- THIS WAS MISSING
            start_page=request.start_page,
            end_page=request.end_page,
            session_type=request.session_type,
            language=request.language,
            content=content
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/api/tutor/chat")
async def tutor_chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    try:
        # 1. Fetch the exact book text using your DataService
        db_content = data_service.get_page_range(request.start_page, request.end_page)
        
        # 2. Get LLM response using the EXACT kwargs from llm_service.py
        # 2. Get LLM response using the EXACT kwargs from llm_service.py
        response_text = llm_service.chat_tutor(
            text=db_content,
            chat_history=request.chat_history,
            user_message=request.user_message,
            language=request.language,
            user_name=request.user_name  # <--- ADD THIS
        )
        
       # 3. Format history for Supabase
        updated_history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]
        updated_history.extend([
            {"role": "user", "content": request.user_message},
            {"role": "assistant", "content": response_text}
        ])
        
        # WRITE TO chat_history, NOT content
        supabase.table("study_sessions").update({
            "chat_history": updated_history 
        }).eq("user_id", user_id).eq("start_page", request.start_page).eq("end_page", request.end_page).execute()

        return {"response": response_text}
        
    except KeyError as e:
        # Catches the loud failure from DataService if pages are missing
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register")
async def register_user(user: UserCreate):
    """Registers a new user in the custom app_users table."""
    try:
        # 1. Hash the raw password
        hashed_pw = hash_password(user.password)
        
        # 2. Insert into PostgreSQL
        response = supabase.table("app_users").insert({
            "username": user.username.lower(), # Lowercase ensures 'Zain' and 'zain' are the same user
            "password_hash": hashed_pw
        }).execute()
        
        return {"message": "User registered successfully", "username": user.username}
        
    except Exception as e:
        # If the unique constraint on the username column fails, Supabase throws an error
        raise HTTPException(status_code=400, detail="Username already exists or database error.")

@app.post("/api/auth/login")
async def login_user(user: UserCreate):
    try:
        response = supabase.table("app_users").select("*").eq("username", user.username.lower()).execute()
        users = response.data
        if not users or not verify_password(user.password, users[0]["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password.")
            
        db_user = users[0]
        access_token = create_access_token(data={"sub": db_user["id"], "username": db_user["username"]})
        
        # Return username so the frontend can format and display it
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "username": db_user["username"]
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error during login.")

@app.get("/api/sessions")
async def fetch_sessions(user_id: str = Depends(get_current_user)):
    """Retrieves all historical study sessions for the logged-in user."""
    sessions = get_all_sessions(user_id)
    return {"sessions": sessions}

@app.post("/api/quiz/score")
async def save_quiz_score(request: ScoreRequest, user_id: str = Depends(get_current_user)):
    try:
        # Updates the specific session with the final score
        supabase.table("study_sessions").update({
            "score": request.score,
            "total_questions": request.total_questions
        }).eq("id", request.session_id).eq("user_id", user_id).execute()

        return {"message": "Score saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/book/page/{page_number}")
async def get_book_page(page_number: int, user_id: str = Depends(get_current_user)):
    """Returns the raw text for a single page, for the in-app reader."""
    try:
        text = data_service.get_page_range(page_number, page_number)
        return {"page": page_number, "text": text}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/book/meta")
async def get_book_meta(user_id: str = Depends(get_current_user)):
    """Returns book metadata (total pages) for reader navigation."""
    return {"total_pages": data_service.total_pages}

# Run locally using: uvicorn main:app --reload