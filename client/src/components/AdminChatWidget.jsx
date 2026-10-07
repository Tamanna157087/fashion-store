import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const ADMIN_WELCOME_MESSAGE = {
  sender: "assistant",
  text: `🧠 Welcome Admin!\n\nI am your AI Business Intelligence Assistant powered by Gemini.\n\nAsk me about:\n• Revenue\n• Sales\n• Low Stock\n• Marketing\n• Analytics`,
};

const AdminChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([ADMIN_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const adminPrompts = [
    "📊 Show total sales revenue summary",
    "⚠️ Which products are low in stock?",
    "⭐ What are our top selling items?",
    "💡 Suggest discount & marketing ideas",
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim()) return;

    const userMsg = { sender: "user", text: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/ai/admin",
        { message: query },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: res.data.reply,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to fetch admin AI analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("/ai/history/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([ADMIN_WELCOME_MESSAGE]);
      toast.success("New chat started");
    } catch {
      setMessages([ADMIN_WELCOME_MESSAGE]);
      toast.success("New chat started");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-900 hover:bg-black text-indigo-400 p-4 rounded-full shadow-2xl border border-indigo-500/30 flex items-center gap-2 hover:scale-105 transition duration-300"
        >
          <span className="text-2xl">⚡</span>
          <span className="text-xs font-black uppercase text-white tracking-wider pr-1">
            Admin AI
          </span>
        </button>
      )}

      {isOpen && (
        <div className="bg-gray-950 text-white rounded-3xl shadow-2xl border border-gray-800 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xl">
                🧠
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  Admin Executive AI
                  <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                    ANALYTICS
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400">Database Business Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                title="Start New Chat"
                className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-indigo-500/30 transition flex items-center gap-1"
              >
                <span>✨</span> New Chat
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold p-1"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-gray-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700/60"
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-indigo-400 bg-gray-800 p-3 rounded-2xl w-fit border border-gray-700">
                <span className="text-xs">⚡ Analyzing business database</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping delay-300"></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Pills */}
          <div className="px-3 py-2 bg-gray-900 border-t border-gray-800 flex gap-1.5 overflow-x-auto scrollbar-none">
            {adminPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-700 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask Admin AI for revenue, low stock, or metrics..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminChatWidget;
