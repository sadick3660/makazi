/**
 * ChatPanel — left-side conversational canvas.
 * Bilingual Swahili/English interface.
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useAppStore } from "../store/appStore";
import { useChat } from "../hooks/useChat";
import type { ChatMessage } from "../types";

const SUGGESTIONS = [
  "Natafuta chumba Mwenge kisichozidi 150,000",
  "Ninaomba nyumba Sinza na vyumba 2",
  "What is the fair price for Mikocheni?",
  "Show hospitals near Kijitonyama",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={clsx(
        "flex w-full mb-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold mr-2 mt-1">
          AI
        </div>
      )}
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white rounded-tr-sm"
            : "bg-slate-800 text-slate-100 rounded-tl-sm"
        )}
      >
        <p>{msg.content}</p>
        {msg.intent &&
          msg.intent.parsed_intent !== "unknown" && (
            <div className="mt-1.5 pt-1.5 border-t border-white/10 text-xs text-slate-400 space-y-0.5">
              <span className="inline-block bg-brand-700/60 text-brand-200 rounded px-1.5 py-0.5 font-mono">
                {msg.intent.parsed_intent}
              </span>
              {msg.intent.geographical_bounds.target_ward && (
                <span className="ml-1.5 inline-block bg-slate-700 rounded px-1.5 py-0.5">
                  📍 {msg.intent.geographical_bounds.target_ward}
                </span>
              )}
              {msg.intent.financial_constraints.max_budget_limit && (
                <span className="ml-1.5 inline-block bg-slate-700 rounded px-1.5 py-0.5">
                  💰 TZS {msg.intent.financial_constraints.max_budget_limit.toLocaleString()}
                </span>
              )}
            </div>
          )}
        <p className="text-[10px] text-slate-500 mt-1 text-right">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 mb-3 pl-9">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const { messages, isTyping } = useAppStore();
  const { sendMessage } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Msaidizi wa Nyumba
          </h2>
          <p className="text-xs text-slate-400">
            Housing Intelligence · Kinondoni
          </p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">🏠</p>
            <p className="text-slate-400 text-sm font-medium">
              Karibu! Find accommodation in Kinondoni.
            </p>
            <p className="text-slate-500 text-xs mt-1 mb-5">
              Ask in Swahili, English, or both.
            </p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-slate-800/60 border-t border-slate-700/50">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder='Natafuta chumba Mwenge…'
            aria-label="Chat input"
            className="flex-1 resize-none rounded-xl bg-slate-700 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[42px] max-h-32"
            style={{ height: "auto" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className={clsx(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isTyping
                ? "bg-brand-600 hover:bg-brand-500 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
