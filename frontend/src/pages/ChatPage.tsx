import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, MapPin, TrendingUp, Search, Sparkles, Globe } from "lucide-react";
import clsx from "clsx";
import { v4 as uuid } from "uuid";
import { chatApi, propertiesApi } from "../services/api";
import { useLang } from "../contexts/LanguageContext";
import PropertyCard from "../components/ui/PropertyCard";
import type { ChatMessage as ChatMsg, Property } from "../types";

type UIMessage = ChatMsg & { searchResults?: Property[] };

export default function ChatPage() {
  const { t, language } = useLang();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([{
      id: uuid(), role: "assistant", content: t("chat.welcome"), timestamp: new Date().toISOString(),
    }]);
  }, [language]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: UIMessage = { id: uuid(), role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await chatApi.sendMessage(text, sessionId);
      if (!sessionId) setSessionId(res.session_id);
      let results: Property[] | undefined;

      if (res.trigger_search && res.search_params) {
        try {
          const sr = await propertiesApi.search(res.search_params);
          results = sr.results.slice(0, 3);
        } catch { /* ignore */ }
      }

      const assistantMsg: UIMessage = {
        id: uuid(), role: "assistant", content: res.reply,
        timestamp: new Date().toISOString(), intent: res.intent,
        searchResults: results,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: uuid(), role: "assistant",
        content: "Samahani, kuna tatizo la mtandao. / Sorry, there was a network issue.",
        timestamp: new Date().toISOString(),
      }]);
    } finally { setTyping(false); }
  }, [sessionId, t]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const SUGGESTIONS = [t("chat.suggestion1"), t("chat.suggestion2"), t("chat.suggestion3"), t("chat.suggestion4")];

  const INTENT_ICONS: Record<string, typeof Search> = {
    search_accommodation: Search,
    predict_fair_price: TrendingUp,
    view_amenities: MapPin,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-surface-900 flex items-center gap-2">
            NyumbaLink AI
            <span className="badge-green text-[10px] gap-1"><Sparkles className="w-2.5 h-2.5" />Live</span>
          </h1>
          <p className="text-xs text-surface-500">AI Housing Assistant · {language === "sw" ? "Inasaidia kwa Swahili & English" : "Supports Swahili & English"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Globe className="w-4 h-4 text-surface-400" />
          <span className="text-xs text-surface-500">{language.toUpperCase()}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 1 && (
          <div className="max-w-xl mx-auto">
            <p className="text-xs text-surface-400 text-center mb-4 font-medium">Try asking:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-sm text-surface-700 bg-white hover:bg-primary-50 hover:text-primary-700 border border-surface-200 hover:border-primary-200 rounded-xl px-4 py-3 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={clsx("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={clsx("max-w-[75%]", msg.role === "user" ? "max-w-[65%]" : "")}>
              <div className={clsx(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-primary-500 text-white rounded-tr-sm"
                  : "bg-white border border-surface-200 text-surface-800 rounded-tl-sm"
              )}>
                {msg.content}

                {msg.intent && msg.intent.parsed_intent !== "unknown" && (
                  <div className="mt-2 pt-2 border-t border-surface-100 flex flex-wrap gap-1.5">
                    {(() => {
                      const Icon = INTENT_ICONS[msg.intent.parsed_intent] ?? Search;
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-primary-50 text-primary-700 rounded-full px-2 py-0.5 font-mono">
                          <Icon className="w-2.5 h-2.5" />{msg.intent.parsed_intent}
                        </span>
                      );
                    })()}
                    {msg.intent.ward && <span className="text-[10px] bg-surface-100 rounded-full px-2 py-0.5">📍 {msg.intent.ward}</span>}
                    {msg.intent.max_budget && <span className="text-[10px] bg-surface-100 rounded-full px-2 py-0.5">💰 TZS {msg.intent.max_budget.toLocaleString()}</span>}
                  </div>
                )}
              </div>

              {/* Inline search results */}
              {msg.searchResults && msg.searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-surface-500 font-medium px-1">Found {msg.searchResults.length} properties:</p>
                  {msg.searchResults.map(p => <PropertyCard key={p.id} property={p} compact />)}
                  <button onClick={() => navigate("/search")}
                    className="text-xs text-primary-600 font-semibold hover:underline px-1"
                  >
                    View all results →
                  </button>
                </div>
              )}

              <p className="text-[10px] text-surface-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {msg.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-surface-200 flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-surface-500" />
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-surface-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-surface-200 px-4 sm:px-6 py-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder={t("chat.placeholder")}
            aria-label="Chat message input"
            className="flex-1 resize-none rounded-2xl border border-surface-300 bg-surface-50 text-surface-900 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 placeholder-surface-400 min-h-[48px] max-h-32"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            aria-label="Send message"
            className={clsx(
              "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
              input.trim() && !typing
                ? "bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
                : "bg-surface-200 text-surface-400 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-surface-400 mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
