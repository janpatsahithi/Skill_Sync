import { useState, useRef, useEffect } from "react";
import { Bot, User, Sparkles, RefreshCw, Send } from "lucide-react";
import { ragAPI } from "../services/api";

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello 👋 I'm your AI Career Advisor.\n\nAsk me anything about your career!",
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
      const aiResponse = response.data?.answer || response.data?.response || "I'm here to help with your career questions!";
      
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
        content: "Hello 👋 I'm your AI Career Advisor. Ask me anything!",
        time: new Date(),
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex justify-between items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-primary via-secondary to-accent">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">AI Career Advisor</h2>
            <p className="text-xs text-white/80">Online • Ready to help</p>
          </div>
        </div>

        <button
          onClick={resetChat}
          className="text-sm flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <RefreshCw size={16} />
          Reset Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : ""
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <Sparkles size={16} className="text-white" />
                </div>
              )}

              <div className="max-w-[75%] rounded-xl border px-4 py-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                <p className="text-sm whitespace-pre-wrap text-white">{m.content}</p>
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {typing && (
            <p className="text-sm text-white/80">AI is typing…</p>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-4 py-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything about your career…"
            className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 bg-white/90 text-gray-900 placeholder-gray-500"
            style={{ borderColor: '#EC4899', focusRingColor: '#EC4899' }}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all duration-300 hover:scale-105"
            style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f472b6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #A855F7, #EC4899, #3B82F6)'; }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

