"""
Conversation Router — /api/v1/conversation
===========================================
REST endpoint and WebSocket endpoint for bilingual chat interactions.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from fastapi.responses import JSONResponse

from app.schemas.nlp import ConversationRequest, ConversationResponse
from app.services.chat_service import ConversationSession, process_conversation

router = APIRouter(prefix="/conversation", tags=["Conversation"])


# ---------------------------------------------------------------------------
# POST /message — single-turn REST chat
# ---------------------------------------------------------------------------

@router.post(
    "/message",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Process a single bilingual (Swahili/English) chat message",
)
async def post_message(payload: ConversationRequest) -> ConversationResponse:
    """
    Full NLP pipeline turn:
    1. Normalize code-switched text
    2. Classify intent (search / price / amenities)
    3. Extract entities (ward, budget, room count)
    4. Generate bilingual reply
    """
    return await process_conversation(payload)


# ---------------------------------------------------------------------------
# GET /history/{session_id} — session history
# ---------------------------------------------------------------------------

@router.get(
    "/history/{session_id}",
    summary="Retrieve conversation history for a session",
)
async def get_history(session_id: str) -> JSONResponse:
    history = ConversationSession.history(session_id)
    return JSONResponse(content={"session_id": session_id, "history": history})


# ---------------------------------------------------------------------------
# WebSocket /ws/{session_id} — real-time streaming chat
# ---------------------------------------------------------------------------

@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str) -> None:
    """
    Real-time WebSocket chat endpoint.
    Accepts text frames, processes them through the NLP pipeline,
    and streams back structured JSON responses.

    Frame format sent by client:
        { "message": "Natafuta chumba Sinza" }

    Frame format returned by server:
        { "session_id": "...", "reply": "...", "parsed_intent": {...}, "action_triggered": "..." }
    """
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()

            # Parse incoming JSON frame
            try:
                data = json.loads(raw)
                message = str(data.get("message", "")).strip()
            except (json.JSONDecodeError, AttributeError):
                message = raw.strip()

            if not message:
                await websocket.send_text(
                    json.dumps({"error": "Empty message received."})
                )
                continue

            request = ConversationRequest(message=message, session_id=session_id)
            response = await process_conversation(request)

            await websocket.send_text(
                json.dumps(response.model_dump(), default=str)
            )

    except WebSocketDisconnect:
        # Client disconnected — clean exit, no error needed
        pass
