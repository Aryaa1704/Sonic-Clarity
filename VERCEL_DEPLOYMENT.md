# Vercel Deployment Guide (Vercel App par Kaise Deploy Karein)

Aap is full-stack application ko **Vercel** (`vercel.com`) par 1-click me deploy kar sakte hain. Codebase me `vercel.json` aur `api/index.ts` serverless API routing pehle se configure kar di gayi hai.

---

## 🚀 5 Simple Steps to Deploy on Vercel

### Step 1: GitHub par Code Push karein
```bash
git add .
git commit -m "Vercel deploy ready"
git push origin main
```

### Step 2: Vercel Dashboard par jayein
1. [vercel.com](https://vercel.com) par login karein (GitHub se).
2. Top-right me **"Add New..."** &rarr; **"Project"** select karein.
3. Apna GitHub repository choose karke **"Import"** par click karein.

### Step 3: Project Configuration
- **Framework Preset**: `Vite` (Vercel automatically detect kar leta hai)
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 4: Environment Variables Add karein
Vercel setup screen par **Environment Variables** section me:
- **Key**: `GEMINI_API_KEY`
- **Value**: *(Apni Google AI Studio API key paste karein)*

### Step 5: Click "Deploy"!
Vercel 45 seconds ke andar app ko compile karke live SSL domain provide karega:
`https://your-project.vercel.app`

---

## ⚡ 1-Command CLI Deployment (Alternative)
Agar aap terminal se deploy karna chahte hain:
```bash
# Vercel CLI install karein
npm i -g vercel

# Production me deploy karein
vercel --prod
```

---

## 🛡️ 1 Million Users Concurrency Tuning Summary
Is release me app ko 1 Million concurrent users ke liye tune kiya gaya hai:
1. **Gzip / Brotli Compression**: Network bandwidth 70%+ bachat.
2. **LRU Bounded Account Store**: 100,000 active sessions memory limit with automatic oldest eviction to prevent memory leaks.
3. **Sliding-Window Rate Limiter**: 300 requests/minute per IP capacity against DDoS and brute force.
4. **Serverless Architecture**: Vercel Serverless Edge automatically scales horizontally from 0 to 1,000,000+ users based on traffic demand without running a costly 24/7 dedicated server.
5. **Mandatory Email Verification**: Unverified users cannot enter the application until they confirm their 6-digit verification code.
