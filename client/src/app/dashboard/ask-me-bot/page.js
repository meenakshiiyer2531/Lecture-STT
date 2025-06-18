"use client";

import { useState, useRef, useEffect } from "react";

export default function AskMeBotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

const API_URL = "https://lecture-stt.onrender.com";
  const sendMessage = async (type, content) => {
    if (!content.trim()) return;

    const newMsg = { role: "user", type, content };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: content }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType?.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}:\n${text}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", type: "text", content: data.answer },
      ]);
    } catch (error) {
      console.error("Error from backend:", error.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          type: "text",
          content:
            "⚠️ Failed to connect to server. Please ensure the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-gray-50 text-black font-sans">
      {/* Header */}
      <header className="bg-white shadow p-4 text-center font-bold text-2xl text-purple-600">
        🤖 Ask Me Bot
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4 sm:px-8 hide-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-[80%] sm:max-w-md shadow ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.type === "text" && (
                <p className="break-words whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">
              Bot is typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Footer */}
      <footer className="p-4 bg-white border-t flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Ask your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && sendMessage("text", input.trim())
          }
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={() => sendMessage("text", input.trim())}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
          disabled={loading}
        >
          Send
        </button>
      </footer>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
