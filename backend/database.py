import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Fail fast if keys are missing
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("CRITICAL: Supabase credentials not found in .env file.")

# Initialize a single, reusable client instance
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def save_study_session(session_record: dict, user_id: str):
    """Inserts a session tied directly to the authenticated user."""
    try:
        session_record["user_id"] = user_id  # Attach the user's UUID before saving
        response = supabase.table("study_sessions").insert(session_record).execute()
        return response.data
    except Exception as e:
        print(f"CRITICAL DB ERROR: Failed to save session - {e}")
        return None

def get_all_sessions(user_id: str):
    """Fetches session metadata ONLY for the authenticated user."""
    try:
        response = supabase.table("study_sessions").select(
            "id, session_type, start_page, end_page, language, created_at"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()  # The .eq() filters by user
        return response.data
    except Exception as e:
        print(f"CRITICAL DB ERROR: Failed to fetch sessions - {e}")
        return []