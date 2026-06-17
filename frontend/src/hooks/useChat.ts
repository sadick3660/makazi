/**
 * useChat — manages WebSocket-first chat with REST fallback.
 * Integrates NLP intent → automatic map search trigger.
 */
import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { createChatWebSocket, searchRentals, sendChatMessage } from "../services/api";
import { useAppStore } from "../store/appStore";
import type { ChatMessage, ConversationResponse } from "../types";

// Ward → coordinate lookup for auto-centering the map
const WARD_COORDS: Record<string, [number, number]> = {
  Mikocheni:    [-6.764, 39.279],
  Mwananyamala: [-6.784, 39.262],
  Kijitonyama:  [-6.778, 39.271],
  Mwenge:       [-6.771, 39.259],
  Mabatini:     [-6.801, 39.244],
  Makumbusho:   [-6.776, 39.254],
  Sinza:        [-6.792, 39.249],
};

export function useChat() {
  const {
    sessionId,
    setSessionId,
    addMessage,
    setTyping,
    applyIntent,
    setSearchResults,
    setMapCenter,
    setSearching,
    activeWard,
    activeMaxRent,
    activeMinRooms,
  } = useAppStore();

  const wsRef = useRef<WebSocket | null>(null);
  const resolvedSessionId = sessionId ?? uuidv4();

  // ── Bootstrap WebSocket on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) setSessionId(resolvedSessionId);

    const ws = createChatWebSocket(resolvedSessionId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data: ConversationResponse = JSON.parse(event.data);
        handleResponse(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      // WebSocket failed — REST fallback handled per-send
      wsRef.current = null;
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Process a response from either WS or REST ────────────────────────────
  const handleResponse = useCallback(
    (data: ConversationResponse) => {
      setTyping(false);
      if (!sessionId) setSessionId(data.session_id);

      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        intent: data.parsed_intent,
      };
      addMessage(assistantMsg);

      if (data.parsed_intent) {
        applyIntent(data.parsed_intent);

        // Auto-trigger map search when intent is search_accommodation
        if (data.action_triggered === "TRIGGER_SEARCH") {
          const ward = data.parsed_intent.geographical_bounds.target_ward;
          const coords = ward ? WARD_COORDS[ward] : [-6.774, 39.259];
          const [lat, lng] = coords ?? [-6.774, 39.259];

          setMapCenter([lat, lng], 15);
          triggerSearch(lng, lat, data.parsed_intent.financial_constraints.max_budget_limit);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId]
  );

  // ── Trigger spatial search ────────────────────────────────────────────────
  const triggerSearch = useCallback(
    async (lng: number, lat: number, maxRent?: number | null) => {
      setSearching(true);
      try {
        const results = await searchRentals({
          target_lng: lng,
          target_lat: lat,
          radius_metres: 2000,
          max_rent: maxRent ?? activeMaxRent ?? undefined,
          min_rooms: activeMinRooms ?? undefined,
          ward: activeWard ?? undefined,
          limit: 30,
        });
        setSearchResults(results.results);
      } catch {
        // silently ignore — user sees no results
      } finally {
        setSearching(false);
      }
    },
    [activeWard, activeMaxRent, activeMinRooms, setSearchResults, setSearching]
  );

  // ── Send a user message ───────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      addMessage(userMsg);
      setTyping(true);

      // Try WebSocket first, fall back to REST
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ message: text }));
      } else {
        try {
          const data = await sendChatMessage(text, resolvedSessionId);
          handleResponse(data);
        } catch {
          setTyping(false);
          const errMsg: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content:
              "Samahani, kuna tatizo la mtandao. Please check your connection and try again.",
            timestamp: new Date(),
          };
          addMessage(errMsg);
        }
      }
    },
    [addMessage, setTyping, handleResponse, resolvedSessionId]
  );

  return { sendMessage, triggerSearch };
}
