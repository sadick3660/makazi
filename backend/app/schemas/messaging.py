"""
Messaging schemas — conversations, messages, chatbot.
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    landlord_id: uuid.UUID


class MessageCreate(BaseModel):
    conversation_id: uuid.UUID
    message:         str = Field(..., min_length=1)
    message_type:    str = "TEXT"


class MessageOut(BaseModel):
    id:              uuid.UUID
    conversation_id: uuid.UUID
    sender_id:       uuid.UUID
    message:         Optional[str]
    message_type:    str
    is_read:         bool
    sent_at:         str
    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id:          uuid.UUID
    seeker_id:   uuid.UUID
    landlord_id: uuid.UUID
    created_at:  str
    messages:    List[MessageOut] = []
    model_config = {"from_attributes": True}


class ChatbotMessageCreate(BaseModel):
    message:  str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class ChatbotMessageOut(BaseModel):
    id:         uuid.UUID
    user_id:    Optional[uuid.UUID]
    question:   Optional[str]
    response:   Optional[str]
    language:   Optional[str]
    created_at: str
    model_config = {"from_attributes": True}
