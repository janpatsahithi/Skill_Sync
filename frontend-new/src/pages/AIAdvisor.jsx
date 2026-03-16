import { useState, useRef, useEffect } from "react";
import { Bot, User, Sparkles, RefreshCw, Send } from "lucide-react";
import { ragAPI } from "../services/api";

export default function AIAdvisor() {
  const formatAdvisorResponse = (payload) => {
    if (!payload) return "I'm here to help with your career questions!";
    if (typeof payload === "string") return payload;

    if (payload.executive_career_summary) {
      const section = (title, value) => {
        if (!value) return "";
        if (Array.isArray(value)) {
          return `${title}\n${value
            .map((item, idx) => `${idx + 1}. ${typeof item === "string" ? item : JSON.stringify(item)}`)
            .join("\n")}`;
        }
        if (typeof value === "object") {
          return `${title}\n${JSON.stringify(value, null, 2)}`;
        }
        return `${title}\n${value}`;
      };

      return [
        section("1) Executive Career Summary", payload.executive_career_summary),
        section("2) Top Role Recommendation", payload.top_role_recommendation),
        section("3) Skill Gap Breakdown", payload.skill_gap_breakdown),
        section("4) Learning Path Strategy", payload.learning_path_strategy),
        section("5) Market Insight Analysis", payload.market_insight_analysis),
        section("6) Action Plan", payload.action_plan),
        section("7) Long-Term Career Trajectory", payload.long_term_career_trajectory),
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const summary = payload.summary ? `Summary: ${payload.summary}` : "";
    const analysis = payload.analysis ? `Analysis: ${payload.analysis}` : "";
    const strategy = Array.isArray(payload.recommended_strategy)
      ? `Recommended Strategy:\n${payload.recommended_strategy.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "";
    const confidence = payload.confidence_level ? `Confidence: ${payload.confidence_level}` : "";

    return [summary, analysis, strategy, confidence].filter(Boolean).join("\n\n");
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello, I'm your AI Career Advisor.\n\nAsk me anything about your career!",
      time: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: input,
      time: new Date(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const response = await ragAPI.ask(userMsg.content);
      const aiPayload = response.data?.answer || response.data?.response;
      const aiResponse = formatAdvisorResponse(aiPayload);

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: aiResponse,
          time: new Date(),
        },
      ]);
    } catch (err) {
      console.error("RAG API error:", err);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "I apologize, but I'm having trouble processing your request. Please try again.",
          time: new Date(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: "Hello, I'm your AI Career Advisor. Ask me anything!",
        time: new Date(),
      },
    ]);
  };

  return (
    <div
      className="h-[calc(100vh-4rem)] flex flex-col"
      style={{ background: "linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)" }}
    >
      <div
        className="border-b px-6 py-4 flex justify-between items-center"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.35)", borderColor: "rgba(255, 255, 255, 0.5)" }}
      >
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-primary via-secondary to-accent">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Career Advisor
            </h2>
            <p className="text-xs text-slate-600">Online - Ready to help</p>
          </div>
        </div>

        <button
          onClick={resetChat}
          className="text-sm flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <RefreshCw size={16} />
          Reset Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}>
                  <Sparkles size={16} className="text-slate-700" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-xl border px-4 py-3 ${
                  m.role === "user" ? "text-white border-transparent" : "text-slate-800 border-primary/20"
                }`}
                style={{
                  background:
                    m.role === "user"
                      ? "linear-gradient(to right, #A855F7, #3B82F6)"
                      : "rgba(255, 255, 255, 0.88)",
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(168, 85, 247, 0.9)" }}>
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {typing && <p className="text-sm text-slate-600">AI is typing...</p>}

          <div ref={endRef} />
        </div>
      </div>

      <div
        className="border-t px-4 py-4"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.35)", borderColor: "rgba(255, 255, 255, 0.5)" }}
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything about your career..."
            className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 bg-white/95 text-gray-900 placeholder-gray-500"
            style={{ borderColor: "#EC4899", focusRingColor: "#EC4899" }}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all duration-300 hover:scale-105"
            style={{ background: "linear-gradient(to right, #A855F7, #3B82F6)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f472b6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to right, #A855F7, #EC4899, #3B82F6)";
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
