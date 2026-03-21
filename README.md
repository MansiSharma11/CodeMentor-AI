# ⚡ CodeMentor AI — Learn. Remember. Grow.

> An AI-powered coding mentor with **persistent memory** that remembers your mistakes, tracks your progress, and gives you personalized challenges — forever, across every session.

---

## 🧠 What Is This?

**CodeMentor AI** is a hackathon project built as a fully client-side web application that combines:

- 🤖 **AI Mentorship** — Powered by Groq (LLaMA 3.3 70B), CodeMentor provides real-time, personalized explanations, code reviews, and tailored feedback.
- 🧠 **Persistent Memory** — Integrated with [Hindsight](https://vectorize.io) to store and recall your coding patterns, recurring mistakes, and progress across sessions.
- 🎯 **Adaptive Challenges** — Curated coding challenges selected based on your memory profile (e.g., if you have off-by-one errors, you'll get Binary Search problems).
- 📊 **Progress Tracking** — Track challenges solved, accuracy, time, hints used, and mistake patterns with a live dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **AI Mentor Chat** | Chat with an AI that knows your history and gives personalized guidance |
| 🧠 **Hindsight Memory** | Retains and recalls your coding behavior using a vector memory bank |
| 🎯 **Coding Challenges** | 3 curated problems targeting your weak points (hash maps, stacks, binary search) |
| 📝 **Live Code Editor** | In-browser editor with real-time pattern analysis (edge case detection, complexity hints) |
| 📊 **Progress Dashboard** | Session stats, mistake pattern tracking, and personalized learning path |
| 🎮 **Demo Mode** | Try the full experience without API keys — simulated memories included |
| 🌙 **Dark/Light Theme** | Catppuccin Mocha / Latte themes with one-click toggle |
| 🌐 **6 Languages** | Python, JavaScript, TypeScript, Java, C++, and Go |

---

## 🚀 Getting Started

### No Installation Required

CodeMentor AI is a **pure HTML/CSS/JS** application — just open the file in your browser!

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/codementor-ai.git
cd codementor-ai

# Open in browser (Windows)
start Index.html

# Or on Mac/Linux
open Index.html
```

---

## 🔑 API Keys Setup

On first launch, you'll see a **Connect CodeMentor AI** modal. You have two options:

### Option 1: Full Mode (Recommended)

| Key | Where to Get It | Required? |
|---|---|---|
| **Hindsight API Endpoint** | [Hindsight Cloud Dashboard](https://vectorize.io) → "Connect to Hindsight" | Optional |
| **Hindsight API Key** | Hindsight Cloud → API Key section (shown once) | Optional |
| **Groq API Key** | [console.groq.com/keys](https://console.groq.com/keys) | For real AI responses |
| **Your Name** | Any name — used to scope your personal memory tag | Yes |

### Option 2: Demo Mode

Click **🎮 Demo Mode** to skip setup entirely. You'll get:
- Pre-loaded simulated memories
- Local AI-like responses (no Groq calls)
- Full UI experience — great for exploring the app

> **Note:** API keys are stored only in your browser's `localStorage` and never sent to any server other than Groq and Hindsight directly.

---

## 🗂️ Project Structure

```
hackathon/
├── Index.html      # Main app shell, layout, and modal
├── App.js          # All app logic — AI, memory, challenges, UI
├── Styles.css      # Full design system (Catppuccin theme, animations)
└── README.md       # You are here!
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML, CSS, JavaScript (no frameworks!) |
| **AI Engine** | [Groq API](https://groq.com) — LLaMA 3.3 70B Versatile |
| **Memory Layer** | [Hindsight by Vectorize](https://vectorize.io) — vector memory bank |
| **Fonts** | Google Fonts: Syne, DM Mono, Instrument Serif |
| **Theme** | Catppuccin Mocha (dark) / Latte (light) |

---

## 🏗️ How It Works

```
User Message
     │
     ▼
hsRecall() ──► Hindsight API (fetch relevant memories)
     │
     ▼
buildSystemPrompt() ──► Personalized system prompt with memory context
     │
     ▼
callAI() ──► Groq API (LLaMA 3.3-70B)
     │
     ▼
appendMsg() ──► Display to user
     │
     ▼
hsRetain() ──► Hindsight API (save this interaction for future sessions)
```

**Memory Tags used:**
- `student:<yourname>` — personal scoping
- `lang:<python/js/etc>` — language-specific observations
- `mistake`, `improvement`, `solution` — behavioral tags

---

## 🎯 Challenges Included

| # | Title | Difficulty | Focus Area |
|---|---|---|---|
| 1 | Two Sum | 🟢 Easy | Hash Maps, O(n) |
| 2 | Valid Parentheses | 🟡 Medium | Stack data structure |
| 3 | Binary Search | 🔴 Hard | Off-by-one errors, O(log n) |

Each challenge is selected with a **"Why this challenge?"** rationale powered by your memory profile.

---

## 📸 Screenshots

> *(Add screenshots of the app here once deployed)*

---

## 🤝 Contributing

This project was built for a hackathon. Feel free to fork and extend it!

Ideas for future features:
- [ ] More challenges across more difficulty levels
- [ ] Code execution sandbox (e.g., Piston API)
- [ ] Streak tracking and gamification
- [ ] Export memory bank as a learning report
- [ ] Multi-user support with separate memory banks

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
  Built with ❤️ at a Hackathon &nbsp;•&nbsp; Powered by Groq × Hindsight
</div>