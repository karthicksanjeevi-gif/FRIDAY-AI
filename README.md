# Friday - Advanced Multimodal AI Assistant

A production-ready conversational AI interface built with React, TypeScript, and the Google Gemini API. Supports **Real-time Voice** (Live API), **Image Analysis**, and **File Uploads**.

---

## ⚡ Quick Start (VS Code)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Gemini API Key**: Get it from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup
Run the following in your VS Code terminal:

```bash
# Install dependencies
npm install

# Create environment file
# (Create a file named .env in the root directory)
echo "API_KEY=your_actual_key_here" > .env
```

### 3. Run Application
```bash
npm start
```
Open `http://localhost:1234` in your browser.

---

## 🎙️ Troubleshooting Voice Agent in VS Code

If the "Voice" button doesn't work or you hear silence:

1.  **Check Permissions**:
    *   Look at the URL bar. Is there a "Microphone Blocked" icon? Click it and select "Allow".
    *   **Note**: Browsers often block Microphone access on `http://` unless it is `localhost`. Ensure you are running on `http://localhost:1234`.

2.  **AudioContext Autoplay Policy**:
    *   This app includes an automatic fix (`ctx.resume()`), but if you still hear nothing, click anywhere on the page *before* hitting the Voice button. Browsers require a "user gesture" before playing audio.

3.  **Check Console Logs**:
    *   Press `F12` -> Console.
    *   Look for "Friday Live Session Error".
    *   If you see "QuotaExceeded", your API key has hit the free tier limit. Wait a minute and try again.

---

## 📁 Features

### 1. Voice Agent (Gemini Live)
- Real-time, low-latency conversation.
- Interruptible (just start talking to stop the model).
- Visual feedback for listening/speaking states.

### 2. File & Image Analysis
- **Images**: Upload via the Image icon. Ask questions about the photo.
- **Files**: Upload PDFs, CSVs, or Text files via the Paperclip icon. Friday will analyze the content automatically.

### 3. Google Search Grounding
- Ask about current events ("Who won the game last night?") and Friday will use Google Search to provide factual answers with citations.

---

## 🏗️ Architecture

- **Frontend**: React 19, TypeScript, TailwindCSS, Framer Motion.
- **AI Logic**: `@google/genai` SDK running client-side for maximum speed and simplicity.
- **Bundler**: Parcel (Zero config, fast HMR).

## 🛠 Common Errors
- **"Process is not defined"**: Ensure your `.env` file exists and you restarted the server.
- **"429 Resource Exhausted"**: You are on the Free Tier and sending messages too fast. Slow down or upgrade to a paid key.
