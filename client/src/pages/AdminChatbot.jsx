import { useState, useEffect, useRef } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const ADMIN_WELCOME_MESSAGE = {
  sender: "assistant",
  text: `🧠 Welcome Admin!\n\nI am your AI Business Intelligence Assistant powered by Gemini.\n\nAsk me about:\n• Revenue\n• Sales\n• Low Stock\n• Marketing\n• Analytics`,
};

const AdminChatbot = () => {
  const [messages, setMessages] = useState([ADMIN_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const adminPrompts = [
    "💰 Show total sales revenue summary",
    "⚠️ Which products are low in stock?",
    "🔥 Which products sell the most?",
    "📈 How many orders were cancelled?",
    "🏷️ Suggest discounts & restocking plan",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        { headers: { Authorization: `Bearer ${token}` } }
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
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono uppercase px-3 py-1 rounded-full">
            🧠 Gemini Business Intelligence
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 text-white">Admin AI Assistant</h1>
          <p className="text-xs text-gray-400 mt-1">Real-time database grounded business analytics, revenue reports & inventory forecasting.</p>
        </div>

        <button
          onClick={handleNewChat}
          className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-500/30 transition flex items-center gap-1.5"
        >
          <span>✨</span> New Chat
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-gray-950 text-white border border-gray-800 rounded-3xl shadow-2xl h-[620px] flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs md:text-sm bg-gray-900/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-gray-500">
                  {msg.sender === "user" ? "Admin" : "Executive AI"}
                </span>
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 leading-relaxed shadow-md ${
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
            <div className="flex items-center gap-2 text-indigo-400 bg-gray-800 p-4 rounded-2xl w-fit border border-gray-700 animate-pulse text-xs">
              <span>⚡ Executive AI is querying database analytics</span>
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-150"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-300"></span>
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex gap-2 overflow-x-auto scrollbar-none">
          {adminPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-full border border-gray-700 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3"
        >
          <input
            type="text"
            placeholder="Ask Admin AI for revenue, low stock items, or marketing strategy..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl text-sm transition disabled:opacity-50 shadow-lg"
          >
            Ask AI
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminChatbot;
