"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AskMeBotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (type, content) => {
    if (!content) return;

    const newMsg = { role: "user", type, content };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const body = { question: content };

      const res = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}:\n${text}`);
      }

      const data = await res.json();
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
          content: "⚠️ Server error. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-[50vw] bg-gray-50 text-black font-sans">
      {/* Header */}
      <header className="bg-white shadow p-4 text-center font-bold text-2xl text-purple-500">
        🤖 Ask Me Bot
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-md shadow ${
                msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {msg.type === "text" && <p>{msg.content}</p>}
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
      </main>

      {/* Footer */}
      <footer className="p-4 bg-white flex items-center gap-2 border-t">
        <input
          type="text"
          placeholder="Ask your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage("text", input.trim())}
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => sendMessage("text", input.trim())}
          className="bg-purple-500 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
          disabled={loading}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
