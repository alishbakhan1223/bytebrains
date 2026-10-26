"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { api, getCurrentUser } from "@/lib/api";
import {
  Bot,
  Send,
  User,
  ShieldCheck,
  AlertTriangle,
  Database,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

interface MessageItem {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sourceType?: string;
  provider?: string;
  isError?: boolean;
  failedPrompt?: string;
  pendingAction?: {
    action_type: string;
    parameters: any;
  };
  confirmed?: boolean;
  structuredData?: any;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am the **BloodBridge Clinical & Inventory AI Assistant**.\n\nI am directly grounded in your live blood bank inventory, expiry trackers, and shortage risk engine.\n\nYou can ask me questions about stock levels, blood donation, emergency dispatch, or compatibility.",
      sourceType: "GUIDE",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>("Multi-LLM");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // Check health endpoint on load to detect active provider
    api
      .getAssistantHealth()
      .then((h) => {
        if (h && h.active_provider) {
          setActiveProvider(h.active_provider.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  const quickPrompts = [
    "How many O+ units are available?",
    "Which blood groups are low?",
    "Why is O- showing high shortage risk?",
    "Who can donate blood?",
    "O- aur AB+ ka compatibility batao",
    "Create an emergency request for 2 units of O-",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading || isSendingRef.current) return;

    isSendingRef.current = true;
    setInput("");

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };

    // If retrying, remove previous error message if present
    setMessages((prev) => [...prev.filter((m) => !(m.isError && m.failedPrompt === text)), userMsg]);
    setLoading(true);

    // Build recent conversation history for follow-ups
    const historyPayload = messages
      .filter((m) => m.id !== "welcome" && !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const res = await api.chatMessage(text, historyPayload);
      if (res.provider) {
        setActiveProvider(res.provider.toUpperCase());
      }

      const assistantMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: res.response_text,
        sourceType: res.source_type,
        provider: res.provider,
        pendingAction: res.pending_action,
        structuredData: res.structured_data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: `Unable to retrieve response from assistant: ${err.message || "Network or provider error"}`,
        sourceType: "GUIDE",
        isError: true,
        failedPrompt: text,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleConfirmAction = async (msgId: string, actionType: string, params: any) => {
    try {
      setConfirming(true);
      const res = await api.confirmChatAction(actionType, params);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m))
      );

      // Append confirmation success message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: "assistant",
          text: `✅ **Action Executed:** ${res.message}`,
          sourceType: "LIVE_DATABASE",
        },
      ]);
    } catch (err: any) {
      alert("Action execution failed: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const getSourceBadge = (source?: string, provider?: string) => {
    const provTag = provider ? ` • ${provider}` : "";
    switch (source) {
      case "LIVE_DATABASE":
        return (
          <span className="flex items-center space-x-1 text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300">
            <Database className="w-3.5 h-3.5" />
            <span>Live DB Grounded{provTag}</span>
          </span>
        );
      case "RISK_ENGINE":
        return (
          <span className="flex items-center space-x-1 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Explainable Risk Engine{provTag}</span>
          </span>
        );
      case "ACTION_CONFIRMATION":
        return (
          <span className="flex items-center space-x-1 text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded border border-rose-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Human Approval Gate{provTag}</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-xs font-bold bg-slate-100 text-[#374151] px-2.5 py-0.5 rounded border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>System Guide{provTag}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              BloodBridge AI Assistant
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grounded NLP ({activeProvider})</span>
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1">
            Real-time LLM intelligence grounded in live database inventories, shortage forecasts, and clinical approval gates.
          </p>
        </div>
      </div>

      {/* Suggested Queries Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-200 font-semibold shrink-0">Try asking:</span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#111827] font-semibold border border-slate-300 rounded-full transition-colors shadow-sm disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 h-[560px] flex flex-col shadow-md overflow-hidden">
        {/* Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? "bg-slate-900 text-white shadow"
                      : m.isError
                      ? "bg-amber-600 text-white"
                      : "bg-[#DC2626] text-white shadow-md"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`max-w-xl space-y-2 ${isUser ? "items-end text-right" : ""}`}>
                  {!isUser && !m.isError && m.sourceType && (
                    <div className="flex items-center space-x-2">
                      {getSourceBadge(m.sourceType, m.provider)}
                    </div>
                  )}

                  {m.isError ? (
                    <div className="p-4 rounded-2xl text-sm bg-red-50 text-red-900 border border-red-200 space-y-2.5">
                      <div className="flex items-center space-x-2 font-bold text-red-800">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Assistant Communication Error</span>
                      </div>
                      <p className="text-xs text-red-700 leading-relaxed font-medium">{m.text}</p>
                      {m.failedPrompt && (
                        <button
                          onClick={() => handleSend(m.failedPrompt)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Query</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#DC2626] text-white font-medium rounded-tr-none shadow-sm"
                          : "bg-slate-50 text-[#111827] font-normal border border-slate-200 rounded-tl-none shadow-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-strong:text-[#111827] prose-strong:font-bold"
                      }`}
                    >
                      {isUser ? (
                        <span>{m.text}</span>
                      ) : (
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      )}
                    </div>
                  )}

                  {/* Controlled Action Confirmation Card */}
                  {m.pendingAction && !m.confirmed && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-950 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Action Requires Human Authorization</span>
                      </div>
                      <p className="text-amber-900 text-xs font-medium">
                        The assistant has prepared an emergency blood dispatch. Authorize to write to the regional network database:
                      </p>
                      <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-amber-950 font-mono text-xs">
                        <strong>Group:</strong> {m.pendingAction.parameters.blood_group} &bull;{" "}
                        <strong>Quantity:</strong> {m.pendingAction.parameters.quantity} unit(s) &bull;{" "}
                        <strong>Priority:</strong> {m.pendingAction.parameters.priority}
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() =>
                            handleConfirmAction(m.id, m.pendingAction!.action_type, m.pendingAction!.parameters)
                          }
                          disabled={confirming}
                          className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-60"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{confirming ? "Authorizing..." : "Confirm & Execute"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#DC2626] text-white shadow-md flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce"></span>
                </div>
                <span className="text-xs font-semibold text-[#4B5563]">
                  Consulting live database & generating clinical response...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question or enter action (e.g. 'How many O+ units are available?')..."
            className="flex-1 text-sm font-semibold p-3 rounded-xl border border-slate-300 bg-white text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-3 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
