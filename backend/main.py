"""
Main FastAPI application entry point for the Seerah Tutor Backend.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import StudyRequest, StudyResponse, ChatRequest, SessionType
from auth import hash_password, verify_password, create_access_token
from services.data_service import data_service
from services import llm_service
from database import save_study_session
from models import UserCreate
from auth import hash_password
from database import supabase

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
            "content": db_content
        }
        save_study_session(session_record)
        # ------------------------------    
        save_study_session(session_record)
        # ------------------------------

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
    """Verifies credentials and returns a JWT."""
    try:
        # 1. Fetch the user from Supabase
        response = supabase.table("app_users").select("*").eq("username", user.username.lower()).execute()
        users = response.data
        
        # 2. Check if user exists
        if not users:
            raise HTTPException(status_code=401, detail="Invalid username or password.")
            
        db_user = users[0]
        
        # 3. Verify the password
        if not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password.")
            
        # 4. Generate the token containing their unique database ID
        access_token = create_access_token(data={"sub": db_user["id"], "username": db_user["username"]})
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during login.")

# Run locally using: uvicorn main:app --reload