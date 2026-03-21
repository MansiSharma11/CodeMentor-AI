# ⚡ CodeMentor AI

> An AI coding tutor that actually remembers you — powered by Hindsight persistent memory.

![Theme](https://img.shields.io/badge/theme-Catppuccin%20Mocha-cba6f7?style=flat-square)
![AI](https://img.shields.io/badge/AI-Groq%20llama--3.3--70b-f38ba8?style=flat-square)
![Memory](https://img.shields.io/badge/memory-Hindsight-89b4fa?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-Netlify-a6e3a1?style=flat-square)

---

## 🧠 What is it?

Most coding platforms forget everything when you close the tab.  
CodeMentor AI remembers your mistakes, tracks your patterns, and  
gets smarter about **YOU** the more you use it.

No setup needed — just open the app and start coding.

---

## ✨ Features

- 💬 **AI Mentor Chat** — personalized answers based on YOUR history
- 🎯 **Smart Challenges** — picked based on your weak areas
- 📊 **Progress Tracking** — mistake patterns, learning path, streaks
- 🧠 **Persistent Memory** — powered by Hindsight (retain, recall, reflect)
- ⚡ **Real-time Code Feedback** — instant analysis as you type
- 🌙 **Light & Dark Mode** — Catppuccin Mocha & Latte themes
- 🌍 **6 Languages** — Python, JavaScript, TypeScript, Java, C++, Go

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Memory | Hindsight by Vectorize |
| AI | Groq (llama-3.3-70b-versatile) |
| Frontend | Vanilla HTML, CSS, JS |
| Backend | Netlify Serverless Functions |
| Theme | Catppuccin Mocha / Latte |

---

## 📁 Project Structure

```
codementor-ai/
├── index.html              → App structure & layout
├── styles.css              → Catppuccin theme & styling
├── app.js                  → AI logic, Hindsight memory, challenges
├── README.md               → You are here
└── netlify/
    └── functions/
        ├── chat.js         → Groq AI calls (keys hidden server-side)
        └── memory.js       → Hindsight retain/recall calls (keys hidden)
```

---

## 🚀 Deploy on Netlify (Recommended)

### Step 1 — Fork & clone this repo
```bash
git clone https://github.com/yourusername/codementor-ai
cd codementor-ai
```

### Step 2 — Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and log in
2. Click **Add new site** → **Import from Git**
3. Select this repository
4. Click **Deploy site**

### Step 3 — Add environment variables
In your Netlify dashboard → **Site Settings** → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |
| `HINDSIGHT_API_KEY` | Your Hindsight key from ui.hindsight.vectorize.io |
| `HINDSIGHT_URL` | `https://api.hindsight.vectorize.io` |

### Step 4 — Done! 🎉
Your live URL will be: `https://yoursite.netlify.app`  
All users can use the app — **no API keys needed from them.**

---

## 💻 Run Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Create .env file with your keys
echo "GROQ_API_KEY=gsk_..." > .env
echo "HINDSIGHT_API_KEY=hsk_..." >> .env
echo "HINDSIGHT_URL=https://api.hindsight.vectorize.io" >> .env

# Start local dev server
netlify dev
```

Then open `http://localhost:8888`

---

## 🧠 How Hindsight Memory Works

| Operation | When it fires |
|-----------|--------------|
| `retain()` | Every message sent, solution submitted, hint requested |
| `recall()` | Before every AI response — fetches your personal history |
| `observations` | Auto-built patterns like "student misses edge cases" |

Every student gets their own memory scope using tags:  
`student:yourname` — so memories never mix between users.

---

## 🔑 Get API Keys

- **Groq** → [console.groq.com/keys](https://console.groq.com/keys) *(free)*
- **Hindsight** → [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io) *(use code MEMHACK315 for $50 free credits)*

---

## 🏆 Built for

**Hindsight Memory Hackathon**  
Theme: *AI Agents That Learn Using Hindsight*

---

## 📄 License

MIT — free to use, modify and share.