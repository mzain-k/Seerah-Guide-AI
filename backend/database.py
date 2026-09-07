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

def save_study_session(session_record: dict):
    """
    Inserts a newly generated session into the PostgreSQL database.
    We wrap this in a try/except block because if the database goes down, 
    we still want the user to see their generated quiz on the frontend.
    """
    try:
        # Supabase Python SDK handles the JSONB serialization automatically
        response = supabase.table("study_sessions").insert(session_record).execute()
        return response.data
    except Exception as e:
        print(f"CRITICAL DB ERROR: Failed to save session - {e}")
        return None