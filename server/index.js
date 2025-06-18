// server.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import Tesseract from "tesseract.js";
import pkg from "pdfjs-dist/legacy/build/pdf.js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const { getDocument } = pkg;

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// MongoDB Schema
const MessageSchema = new mongoose.Schema({
  type: String,
  content: String,
  transcription: String,
  createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  messages: [MessageSchema]
});

const Course = mongoose.model("Course", CourseSchema);

// MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// PDF text extraction
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  return text;
}

// Groq setup
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Upload endpoint
app.post("/api/courses/:id/upload", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const ext = path.extname(file.originalname).toLowerCase();
    const filePath = path.join(uploadsDir, file.filename);

    let message = { type: "file", content: file.filename };

    if ([".mp3", ".wav", ".m4a", ".webm"].includes(ext)) {
      const result = await groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-large-v3-turbo",
        language: "en",
        response_format: "verbose_json",
        temperature: 0.0
      });
      message = {
        type: "audio",
        content: file.filename,
        transcription: result.text || ""
      };
    } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      message.type = "image";
    } else if (ext === ".pdf") {
      message.type = "pdf";
    }

    course.messages.push(message);
    await course.save();
    res.json({ success: true, message });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Ask endpoint
app.post("/api/ask", async (req, res) => {
  const { question, courseId, fileName } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required" });

  let fileContext = "";

  const promptSystemInstructions = `
You are an academic assistant for M.Tech Computer Science students.

Follow these rules for every response:

1. Start with a clear, short title.
2. Use bold section headings.
3. Use numbered or bullet lists without asterisks.
4. Keep the structure clear and readable.
5. Do not use markdown (no asterisks or hashtags).
6. Avoid personal comments like "I hope this helps."
7. Remove all asterisks from the output.
8. Use simple, clear, and concise language.
9. Answer directly using technical terms and definitions.
10. Only respond to Computer Science topics (AI, OS, DBMS, CN, Compiler Design, Algorithms, etc.).

If the question is irrelevant, respond with:
"Sorry, I can only help with M.Tech Computer Science topics."
`.trim();

  try {
    if (courseId && fileName) {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      const fileMsg = course.messages.find(msg =>
        msg.content === fileName && ["image", "pdf"].includes(msg.type)
      );

      if (fileMsg) {
        const filePath = path.join(uploadsDir, fileMsg.content);
        if (fileMsg.type === "image") {
          const ocr = await Tesseract.recognize(filePath, "eng");
          fileContext = ocr.data.text;
        } else if (fileMsg.type === "pdf") {
          fileContext = await extractTextFromPDF(filePath);
        }
      }
    }

    const messages = [
      { role: "system", content: promptSystemInstructions }
    ];

    if (fileContext) {
      messages.push({
        role: "user",
        content: `Relevant file content:\n${fileContext.slice(0, 1000)}`
      });
    }

    messages.push({ role: "user", content: `Question: ${question}` });

    const response = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stop: null,
      stream: false
    });

    const answerRaw = response.choices?.[0]?.message?.content || "No answer found.";
    const answer = formatResponse(answerRaw);

    res.json({ answer });
  } catch (err) {
    console.error("❌ Ask error:", err);
    res.status(500).json({ error: "Failed to process your question." });
  }
});

// Format answer for frontend
function formatResponse(text) {
  let cleaned = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/(?<!\n)(\d+\.\s)/g, '\n$1')
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

  if (cleaned.length > 4000) {
    cleaned = cleaned.slice(0, 4000) + "\n\n[Response truncated]";
  }

  return cleaned;
}

// Routes
app.post("/api/courses", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Course name is required" });
    const course = new Course({ name });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/courses", async (_, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/courses/:id/messages", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course.messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/courses/:id/messages", async (req, res) => {
  try {
    const { type, content } = req.body;
    if (!type || !content) return res.status(400).json({ error: "Missing type or content" });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const message = { type, content };
    course.messages.push(message);
    await course.save();
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/courses/:courseId/messages/:messageId", async (req, res) => {
  const { courseId, messageId } = req.params;
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const index = course.messages.findIndex(m => m._id.toString() === messageId);
    if (index === -1) return res.status(404).json({ error: "Message not found" });

    const msg = course.messages[index];
    const filePath = path.join(uploadsDir, msg.content);
    if (["audio", "image", "pdf"].includes(msg.type)) {
      fs.unlink(filePath, err => {
        if (err) console.warn("⚠️ Failed to delete:", filePath);
      });
    }

    course.messages.splice(index, 1);
    await course.save();
    res.json({ success: true, deletedMessage: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.send("Course deleted");
  } catch (err) {
    res.status(500).send("Error deleting course");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Handle unhandled rejections
process.on("unhandledRejection", err => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});
