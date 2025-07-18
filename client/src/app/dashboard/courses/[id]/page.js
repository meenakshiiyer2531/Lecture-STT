"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef();
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const BACKEND_URL = "https://lecture-stt.onrender.com";

  useEffect(() => setMounted(true), []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/courses/${id}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.error("Fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [id]);

  const sendText = async () => {
    if (!input.trim()) return;
    try {
      await axios.post(`${BACKEND_URL}/api/courses/${id}/messages`, {
        type: "text",
        content: input,
      });
      setInput("");
      fetchMessages();
    } catch {
      alert("Failed to send text");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendText();
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/courses/${id}/messages/${messageId}`);
      fetchMessages();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete message");
    }
  };

  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 10 * 1024 * 1024) return alert("File too large (max 10MB).");

    const fd = new FormData();
    fd.append("file", file);
    try {
      await axios.post(`${BACKEND_URL}/api/courses/${id}/upload`, fd);
      fetchMessages();
    } catch {
      alert("Upload failed");
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        const chunks = [];

        mr.ondataavailable = (e) => chunks.push(e.data);

        mr.onstop = async () => {
          setIsUploadingAudio(true);
          const blob = new Blob(chunks, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("file", blob, "recording.webm");
          try {
            await axios.post(`${BACKEND_URL}/api/courses/${id}/upload`, fd);
            fetchMessages();
          } catch {
            alert("Audio upload failed");
          } finally {
            setIsUploadingAudio(false);
          }
        };

        mediaRecorderRef.current = mr;
        mr.start();
        setIsRecording(true);
      } catch {
        alert("Microphone access denied");
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full max-w-screen mx-auto bg-gray-50 text-black">
      <header className="sticky top-0 p-4 bg-white shadow text-center z-10">
        <h1 className="text-purple-700 text-xl sm:text-2xl font-semibold tracking-wide">🎓 Course Chat</h1>
      </header>

      {isRecording && (
        <div className="bg-yellow-200 text-red-700 text-center py-2 animate-pulse">
          🎙️ Recording... Speak now!
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-white to-purple-50 space-y-3">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m._id}
              className="bg-white p-3 rounded-lg shadow-md border-l-4 border-purple-400 relative group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-gray-400 mb-1">{m.type.toUpperCase()}</p>

              {m.type === "text" && (
                <div className="flex justify-between items-center">
                  <p className="text-gray-800 break-words">{m.content}</p>
                  <button
                    onClick={() => deleteMessage(m._id)}
                    className="text-red-500 text-xs ml-2 opacity-0 group-hover:opacity-100 transition"
                  >
                    ❌ Delete
                  </button>
                </div>
              )}

              {m.type === "audio" && (
                <div className="space-y-1">
                  <audio controls className="w-full mt-1" src={`${BACKEND_URL}/uploads/${m.content}`} />
                  <p className="text-sm italic text-gray-600">{m.transcription}</p>
                  <button onClick={() => deleteMessage(m._id)} className="text-red-500 text-xs">❌ Delete</button>
                </div>
              )}

              {m.type === "pdf" && (
                <div className="flex justify-between items-center">
                  <a
                    href={`${BACKEND_URL}/uploads/${m.content}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 truncate"
                  >
                    📄 View PDF
                  </a>
                  <button onClick={() => deleteMessage(m._id)} className="text-red-500 text-xs">❌ Delete</button>
                </div>
              )}

              {m.type === "image" && (
                <div className="space-y-2">
                  <img
                    src={`${BACKEND_URL}/uploads/${m.content}`}
                    className="w-full sm:w-1/2 rounded shadow"
                    alt="Uploaded"
                  />
                  <button onClick={() => deleteMessage(m._id)} className="text-red-500 text-xs">❌ Delete</button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      <footer className="p-4 bg-white shadow-lg border-t flex flex-col sm:flex-row gap-2 items-stretch">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message and press Enter…"
          className="flex-1 px-4 py-2 rounded border shadow-sm focus:outline-purple-500"
          disabled={isUploadingAudio}
        />
        <button
          onClick={sendText}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition"
          disabled={isUploadingAudio}
        >
          Send
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={sendFile}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
          disabled={isUploadingAudio}
        >
          Upload
        </button>
        <button
          onClick={toggleRecording}
          className={`${
            isRecording ? "bg-red-600" : "bg-blue-600"
          } hover:brightness-110 text-white px-4 py-2 rounded transition`}
          disabled={isUploadingAudio}
        >
          {isRecording ? "Stop" : "🎤 Record"}
        </button>
      </footer>
    </div>
  );
}
