"""
Handles Google Gemini API execution, prompt injection, and structured outputs.
Implements the "Tethered Scholar" architecture to prevent hallucinations while 
allowing historical bridging.
"""
import json
import logging
from google import genai
from google.genai import types

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.genai.errors import APIError
from models import QuizQuestion, Language, ChatMessage
from config import settings

logger = logging.getLogger(__name__)

# Initialize the new Google GenAI client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# The Tethered Scholar System Prompt
SYSTEM_INSTRUCTION = """You are an expert, orthodox Islamic scholar specializing in the Seerah of Prophet Muhammad (PBUH). You firmly believe Islam is the absolute truth, and the Prophet (PBUH) is the ultimate exemplar and blessing for all mankind. Your mission is to train the user to deeply understand Seerah so they can teach it.

1. The Primary Anchor: Ground your core analysis and answers strictly in the provided reading text.
2. The Contextual Bridge: If the user asks about past events, or if connecting a past event is critical to understanding the current text, you may use your verified, pre-trained expert knowledge of the Seerah. When doing so, you MUST explicitly clarify this by saying, "While not in today's reading, it is important to remember that..."
3. The Anti-Spoiler Protocol: Treat the user as a student progressing chronologically. Do NOT mention or spoil future events unless the user explicitly asks a direct question about the future consequences.
"""

def _get_language_instruction(language: Language) -> str:
    if language == Language.URDU:
        return "You MUST translate your entire response into clear, natural, and grammatically correct Urdu."
    return "Respond in English."

@retry(
    stop=stop_after_attempt(4), 
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(APIError)
)

def generate_quiz(text: str, language: Language) -> list[QuizQuestion]:
    """Generates a 20-question quiz returning a strict JSON array matching QuizQuestion."""
    prompt = f"""
    Objective: Generate exactly 20 multiple-choice questions based ONLY on the provided text.
    Focus: Test historical facts, tribal dynamics, and extract philosophical or psychological lessons.
    Language Instruction: {_get_language_instruction(language)}
    
    Source Text:
    {text}
    """
    
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                # Force the output to match an array of our Pydantic model
                response_schema=list[QuizQuestion], 
                temperature=0.2, # Low temperature for factual accuracy
            ),
        )
        # Parse the guaranteed JSON string back into Pydantic objects
        return [QuizQuestion(**q) for q in json.loads(response.text)]
    except Exception as e:
        logger.error(f"Quiz generation failed: {str(e)}")
        raise RuntimeError("Failed to generate quiz from LLM.") from e


def generate_tutor_lesson(text: str, language: Language) -> str:
    """Two-Phase Generation for the autonomous Tutor markdown article."""
    prompt = f"""
    Phase 1: Lens Selection (Internal Analysis)
    Read the provided text. Identify the 2 or 3 most prominent underlying themes from this list ONLY: 
    [Geopolitics, Human Psychology, Philosophy, Tribal Dynamics, Military Strategy, Courage & Resilience, Spirituality, Social Justice & Institution Building].

    Phase 2: The Lesson (Output Generation)
    Structure your response strictly in the following format using Markdown:
    ## Core Summary
    (A brief, 3-sentence summary of the historical events in the text.)
    
    ## Analytical Lenses
    (Create a heading for each of the 2-3 lenses you selected in Phase 1. Break down the mechanisms of the event. Why did they make these decisions? How does this reveal fundamental human nature or divine wisdom?)
    
    ## The Scholar's Takeaway
    (One highly impactful, philosophical, and actionable lesson the user can use to teach this specific Seerah segment to a modern audience.)

    Language Instruction: {_get_language_instruction(language)}
    
    Source Text:
    {text}
    """
    
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.5,
            ),
        )
        return response.text
    except Exception as e:
        logger.error(f"Tutor lesson generation failed: {str(e)}")
        raise RuntimeError("Failed to generate tutor lesson from LLM.") from e


def chat_tutor(text: str, chat_history: list[ChatMessage], user_message: str, language: Language) -> str:
    """Handles follow-up cross-questions in Tutor Mode by injecting chat history."""
    
    # Format the history into the SDK's expected structure
    formatted_history = []
    for msg in chat_history:
        formatted_history.append(
            types.Content(role=msg.role, parts=[types.Part.from_text(text=msg.content)])
        )
    
    # The new prompt includes the source text reminder + user question
    new_prompt = f"""
    Source Text Reminder (Anchor your answer here):
    {text}
    
    Language Instruction: {_get_language_instruction(language)}
    
    User Question: {user_message}
    """
    
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            # Pass history + the new prompt
            contents=formatted_history + [new_prompt], 
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.4,
            ),
        )
        return response.text
    except Exception as e:
        logger.error(f"Chat generation failed: {str(e)}")
        raise RuntimeError("Failed to process chat with LLM.") from e