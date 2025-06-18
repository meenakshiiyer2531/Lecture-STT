# 🎙️ Lecture-STT (Speech-To-Text + File Q&A Assistant)

Lecture-STT is a full-stack web application designed to help students and researchers extract, manage, and interact with lecture notes using speech and file-based transcription.

## 📌 Features

- 🎧 Upload and transcribe **audio files** (MP3, WAV, M4A, WEBM) using Whisper
- 🖼️ OCR support for **image files** (JPG, PNG)
- 📄 Text extraction from **PDF documents**
- 🤖 Ask questions from uploaded files using Groq LLaMA 3.3
- 🧠 Clean and concise academic responses tailored for Computer Science topics
- 📂 Organize content by **courses**
- 🗑️ Delete individual messages or entire courses

---

## ⚙️ Tech Stack

- **Frontend**: *(Add your frontend framework here, e.g. React.js)*
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **OCR**: Tesseract.js
- **PDF Parsing**: pdfjs-dist
- **AI/LLM**: Groq API (LLaMA 3.3 70B)
- **Audio Transcription**: Whisper Large v3 (via Groq)
- **File Uploads**: Multer
- **Environment Variables**: `dotenv`


  
## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/meenakshiiyer2531/Lecture-STT.git
cd Lecture-STT
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Create .env File
Create a .env file in the root and add:

```ini

PORT=5000
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key

```
⚠️ Never commit your .env file. It's already included in .gitignore.