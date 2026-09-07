"""
Pydantic validation models for the Seerah Tutor API.

StudyResponse always echoes back the exact start_page/end_page the backend
actually used — this is the source-of-truth confirmation of what the LLM
read, independent of whatever the user selected in the UI.
"""
from enum import Enum
from typing import Literal, Union

from pydantic import BaseModel, Field, field_validator, model_validator

from config import settings


class Language(str, Enum):
    ENGLISH = "english"
    URDU = "urdu"


class SessionType(str, Enum):
    QUIZ = "quiz"
    TUTOR = "tutor"


class StudyRequest(BaseModel):
    start_page: int
    end_page: int
    session_type: SessionType
    language: Language

    @model_validator(mode='after')
    def check_page_range(self):
        if self.start_page > self.end_page:
            raise ValueError('Start page cannot be greater than end page.')
        
        # Optional: You can also restrict how many pages they request at once
        if (self.end_page - self.start_page) > 10:
            raise ValueError('Please select a range of 10 pages or fewer to prevent API timeouts.')
            
        return self


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Follow-up cross-question in Tutor Mode. Carries chat history + the
    same page context so the model keeps grounding in the right text."""

    start_page: int = Field(..., ge=1)
    end_page: int = Field(..., ge=1)
    language: Language = Language.ENGLISH
    chat_history: list[ChatMessage]
    user_message: str = Field(..., min_length=1)


class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(..., min_length=4, max_length=4)
    correct_answer: str
    explanation: str
    category: str
    is_key_takeaway: bool

    @field_validator("correct_answer")
    @classmethod
    def correct_answer_must_be_in_options(cls, v: str, info) -> str:
        options = info.data.get("options")
        if options and v not in options:
            raise ValueError("correct_answer must exactly match one of the options")
        return v


class StudyResponse(BaseModel):
    """Wraps generated content with the page range actually consumed."""

    start_page: int
    end_page: int
    session_type: SessionType
    language: Language
    content: Union[str, list[QuizQuestion]]
