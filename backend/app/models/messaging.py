"""
Messaging ORM models — conversations, messages, chatbot_conversations.
Matches dbschema.sql.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id:          Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seeker_id:   Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    landlord_id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at:  Mapped[datetime]   = mapped_column(DateTime, server_default=func.now(), nullable=False)

    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.sent_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id:              Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id:       Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message:         Mapped[str | None] = mapped_column(Text, nullable=True)
    message_type:    Mapped[str]        = mapped_column(String(20), default="TEXT", nullable=False)
    is_read:         Mapped[bool]       = mapped_column(Boolean, default=False, nullable=False)
    sent_at:         Mapped[datetime]   = mapped_column(DateTime, server_default=func.now(), nullable=False)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"

    id:         Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:    Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    question:   Mapped[str | None]      = mapped_column(Text, nullable=True)
    response:   Mapped[str | None]      = mapped_column(Text, nullable=True)
    language:   Mapped[str | None]      = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime]        = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user: Mapped["User | None"] = relationship("User", back_populates="chatbot_convos")  # noqa: F821
