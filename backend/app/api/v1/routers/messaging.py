"""
Messaging Router — /api/v1/messaging
======================================
Direct landlord↔seeker conversations + message threads.
Also includes chatbot conversation logging.
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routers.auth import _get_current_user
from app.db.session import get_db
from app.models.messaging import Conversation, Message, ChatbotConversation
from app.models.user import User
from app.schemas.messaging import (
    ChatbotMessageCreate, ConversationCreate, ConversationOut,
    MessageCreate, MessageOut,
)

router = APIRouter(prefix="/messaging", tags=["Messaging"])


# ── Conversations ─────────────────────────────────────────────────────────────

@router.post("/conversations", response_model=ConversationOut,
             status_code=status.HTTP_201_CREATED, summary="Start a conversation with a landlord")
async def start_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationOut:
    # Check if conversation already exists
    existing = await db.execute(
        select(Conversation).where(
            Conversation.seeker_id == current_user.id,
            Conversation.landlord_id == payload.landlord_id,
        )
    )
    conv = existing.scalar_one_or_none()
    if conv:
        return ConversationOut.model_validate(conv)

    conv = Conversation(seeker_id=current_user.id, landlord_id=payload.landlord_id)
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return ConversationOut.model_validate(conv)


@router.get("/conversations", response_model=List[ConversationOut],
            summary="List my conversations")
async def list_conversations(
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ConversationOut]:
    result = await db.execute(
        select(Conversation).where(
            or_(Conversation.seeker_id == current_user.id,
                Conversation.landlord_id == current_user.id)
        ).order_by(Conversation.created_at.desc())
    )
    return [ConversationOut.model_validate(c) for c in result.scalars().all()]


@router.get("/conversations/{conversation_id}", response_model=ConversationOut,
            summary="Get a conversation with messages")
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationOut:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    if conv.seeker_id != current_user.id and conv.landlord_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your conversation.")
    return ConversationOut.model_validate(conv)


# ── Messages ──────────────────────────────────────────────────────────────────

@router.post("/messages", response_model=MessageOut,
             status_code=status.HTTP_201_CREATED, summary="Send a message")
async def send_message(
    payload: MessageCreate,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    # Verify conversation exists and user is participant
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == payload.conversation_id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    if conv.seeker_id != current_user.id and conv.landlord_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your conversation.")

    msg = Message(
        conversation_id=payload.conversation_id,
        sender_id=current_user.id,
        message=payload.message,
        message_type=payload.message_type,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)


@router.patch("/messages/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT,
              summary="Mark a message as read")
async def mark_read(
    message_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalar_one_or_none()
    if msg:
        msg.is_read = True
        await db.flush()


# ── Chatbot log ───────────────────────────────────────────────────────────────

@router.post("/chatbot/log", status_code=status.HTTP_201_CREATED,
             summary="Log a chatbot conversation turn")
async def log_chatbot(
    payload: ChatbotMessageCreate,
    response_text: str,
    language: str = "en",
    current_user: User | None = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    log = ChatbotConversation(
        user_id=current_user.id if current_user else None,
        question=payload.message,
        response=response_text,
        language=language,
    )
    db.add(log)
    await db.flush()
    return {"id": str(log.id)}
