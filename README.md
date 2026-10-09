<div align="center">

# 🎙️ Sonic Clarity

**Voice AI Interview Preparation Platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![CI](https://github.com/Aryaa1704/Sonic-Clarity/actions/workflows/ci.yml/badge.svg)](https://github.com/Aryaa1704/Sonic-Clarity/actions/workflows/ci.yml)

*Practice interviews with AI, master pronunciation, get real-time feedback.*

[Report Bug](https://github.com/Aryaa1704/Sonic-Clarity/issues/new?template=bug_report.md) · [Request Feature](https://github.com/Aryaa1704/Sonic-Clarity/issues/new?template=feature_request.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Live Interview Room** | Real-time AI-powered mock interview with voice detection |
| 🔊 **Pronunciation Inspector** | Phonetic analysis and speech clarity feedback |
| 📝 **Transcript View** | Live speech-to-text with highlighted corrections |
| 🧠 **Quiz Mode** | AI-generated topic quizzes with voice input |
| 📡 **RAG Explorer** | Retrieval-augmented knowledge base for interview prep |
| 📊 **Audio Visualizer** | Real-time waveform and frequency visualization |
| 🔍 **Langfuse Observability** | Track AI performance and usage metrics |
| 🚀 **Deployment Hub** | One-click deploy configs for Vercel, Render, Docker |

---

## 🛠️ Tech Stack

**Frontend**
- [React 19](https://reactjs.org/) + [TypeScript 7](https://www.typescriptlang.org/)
- [Vite 8](https://vitejs.dev/) for blazing-fast builds
- [Tailwind CSS 4](https://tailwindcss.com/) for styling
- [Motion](https://motion.dev/) for animations
- [Lucide React](https://lucide.dev/) for icons

**Backend**
- [Express.js](https://expressjs.com/) + [TSX](https://github.com/privatenumber/tsx)
- [Google Gemini AI](https://ai.google.dev/) (`@google/genai`)
- [Nodemailer](https://nodemailer.com/) for notifications

**DevOps**
- [Docker](https://www.docker.com/) containerization
- [Vercel](https://vercel.com/) / [Render](https://render.com/) deployment
- [GitHub Actions](https://github.com/features/actions) CI/CD

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18 or [Bun](https://bun.sh/) >= 1.0
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/Aryaa1704/Sonic-Clarity.git
cd Sonic-Clarity
```

### 2. Install dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values — see `.env.example` for all required variables.

### 4. Run the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌍 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for the full guide.

### Docker

```bash
docker build -t sonic-clarity .
docker run -p 3000:3000 --env-file .env sonic-clarity
```

### Render

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Render deployment guide.

---

## 📁 Project Structure

```
Sonic-Clarity/
├── src/
│   ├── components/        # React components
│   │   ├── AudioVisualizer.tsx
│   │   ├── AuthModal.tsx
│   │   ├── LiveInterviewRoom.tsx
│   │   ├── PronunciationInspector.tsx
│   │   ├── QuizView.tsx
│   │   ├── TranscriptView.tsx
│   │   └── ...
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── data/              # Static data
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── api/                   # Serverless API functions
├── server.ts              # Express server
├── Dockerfile
├── vercel.json
└── render.yaml
```

---

## 🤝 Contributing

Contributions are what make the open source community amazing! We'd love your help.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

**Quick steps:**
1. Fork the repo
2. Create your branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to your branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 🔒 Security

Found a vulnerability? Please read [SECURITY.md](SECURITY.md) before opening a public issue.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 👤 Author

**Aryan Sharma**
- GitHub: [@Aryaa1704](https://github.com/Aryaa1704)
- Email: aryansharma009009@gmail.com

---

<div align="center">

Made with ❤️ and 🎙️ by Aryan Sharma

⭐ Star this repo if you find it helpful!

</div>
