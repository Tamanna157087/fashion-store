import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const CUSTOMER_WELCOME_MESSAGE = {
  sender: "assistant",
  text: `👋 Welcome!\n\nI'm your AI Shopping Assistant.\n\nI can help you with:\n• Product recommendations\n• Size suggestions\n• Order tracking\n• Returns\n• Fashion advice`,
  products: [],
};

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([CUSTOMER_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "👗 Party dresses under ₹3000",
    "🕺 Oversized streetwear t-shirts for men",
    "📦 Check my recent order status",
    "🏷️ What coupon codes are available?",
    "👠 Matching footwear for red dress",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim()) return;

    if (!user) {
      toast.info("Please log in to chat with AI Assistant");
      return;
    }

    const userMsg = { sender: "user", text: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/ai/customer",
        { message: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: res.data.reply,
          products: res.data.products || [],
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to get AI response");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("/ai/history/customer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([CUSTOMER_WELCOME_MESSAGE]);
      toast.success("New chat started");
    } catch {
      setMessages([CUSTOMER_WELCOME_MESSAGE]);
      toast.success("New chat started");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono uppercase px-3 py-1 rounded-full">
            ✨ Gemini AI Powered Assistant
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">AI Personal Stylist & Assistant</h1>
          <p className="text-xs text-gray-300 mt-1">Get personalized recommendations, fashion advice, size guide & order assistance.</p>
        </div>

        <button
          onClick={handleNewChat}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition flex items-center gap-1.5"
        >
          <span>✨</span> New Chat
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl shadow-xl h-[600px] flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-sm bg-gray-50/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-gray-400">
                  {msg.sender === "user" ? "You" : "Aura (AI Stylist)"}
                </span>
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                }`}
              >
                <p className="whitespace-pre-line font-medium text-xs md:text-sm">{msg.text}</p>

                {/* Grounded Recommended Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {msg.products.map((p) => {
                      if (!p || !p._id) return null;
                      const img = p.thumbnail || (p.images && p.images[0]?.url) || p.image;
                      return (
                        <Link
                          key={p._id}
                          to={`/product/${p._id}`}
                          className="bg-gray-50 hover:bg-indigo-50/80 p-2.5 rounded-xl border border-gray-200/60 transition group flex flex-col justify-between"
                        >
                          <img
                            src={img}
                            alt={p.title}
                            className="w-full h-28 object-cover rounded-lg mb-2 border border-gray-100"
                          />
                          <div className="font-bold text-gray-900 truncate group-hover:text-indigo-600 text-xs">
                            {p.title}
                          </div>
                          <div className="flex justify-between items-center text-xs font-extrabold text-indigo-600 mt-2">
                            <span>₹{p.discountPrice || p.price}</span>
                            <span className="text-amber-500 font-mono text-[10px]">★{p.rating || 4.5}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 bg-white p-4 rounded-2xl w-fit border border-gray-100 animate-pulse text-xs">
              <span>🤖 Aura is processing database picks</span>
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping delay-150"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping delay-300"></span>
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-none">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-full border border-gray-200/60 transition"
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
          className="p-4 bg-white border-t border-gray-100 flex gap-3"
        >
          <input
            type="text"
            placeholder={user ? "Ask Aura anything about style, orders, size, or offers..." : "Log in to chat with AI Assistant..."}
            disabled={!user}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none font-medium disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !user}
            className="bg-gray-900 hover:bg-indigo-600 text-white font-extrabold px-6 py-3 rounded-2xl text-sm transition disabled:opacity-50 shadow-lg"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
