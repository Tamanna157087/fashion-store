import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

const AIFloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am **Aura**, your personal AI fashion assistant. Ask me anything like *'Black dress under ₹2000'* or *'Shoes for wedding'*, and I'll find real outfits for you! 💖",
      products: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "🖤 Black dress under ₹2000",
    "👟 Running shoes for men",
    "💃 Wedding outfit for women",
    "🧥 Blue oversized hoodie",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/ai/chat", { message: textToSend });
      const aiMsg = {
        sender: "ai",
        text: res.data.reply,
        products: res.data.products || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Apologies! I encountered a temporary network issue. Please try rephrasing your fashion request.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition duration-300 flex items-center gap-2 border-2 border-white/20"
        >
          <span className="text-2xl animate-bounce">🤖</span>
          <span className="hidden group-hover:inline text-xs font-black uppercase tracking-wider pr-1">
            AI Stylist
          </span>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 text-white p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-xl shadow-md">
                ✨
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  Aura AI Fashion Stylist
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    ONLINE
                  </span>
                </h3>
                <p className="text-[10px] text-gray-300">Powered by Fashion Intelligence</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-2xl font-bold transition p-1"
            >
              &times;
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Grounded Recommended Products Grid inside AI Message */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                      {msg.products.map((p) => {
                        const img = p.thumbnail || (p.images && p.images[0]?.url) || p.image;
                        return (
                          <Link
                            key={p._id}
                            to={`/product/${p._id}`}
                            onClick={() => setIsOpen(false)}
                            className="bg-gray-50 hover:bg-indigo-50/80 p-2 rounded-xl border border-gray-200/60 transition group flex flex-col justify-between"
                          >
                            <img
                              src={img}
                              alt={p.title}
                              className="w-full h-20 object-cover rounded-lg mb-1.5 border border-gray-100"
                            />
                            <div className="font-bold text-gray-900 truncate group-hover:text-indigo-600 text-[11px]">
                              {p.title}
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-extrabold text-indigo-600 mt-1">
                              <span>₹{p.discountPrice || p.price}</span>
                              <span className="text-amber-500 font-mono">★{p.rating || 4.5}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 bg-white p-3 rounded-2xl w-fit border border-gray-100 animate-pulse">
                <span className="text-sm">🤖 Aura is thinking</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping delay-300"></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompt Pills */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200/60 transition"
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
            className="p-3 bg-white border-t border-gray-100 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask Aura anything about style & fashion..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-50 shadow-md"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIFloatingChat;
