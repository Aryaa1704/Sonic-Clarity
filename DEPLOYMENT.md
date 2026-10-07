# Live Deployment Guide (Live Kaise Deploy Karein)

Aap is full-stack application ko **Render.com** (100% Free & Recommended), **Railway.app**, ya **Docker** par 2 se 3 minute me live deploy kar sakte hain.

---

## 1. Code me kya-kya changes kiye gaye hain?

1. **Dynamic Port (`process.env.PORT`)**:
   - `server.ts` me hardcoded port hatakar `process.env.PORT || 3000` implement kiya gaya hai taaki cloud hosts (Render/Railway) apna port bind kar sakein.
2. **Production Static Assets (`dist/`)**:
   - Production mode me server automatically pre-built `dist/` directory se React frontend serve karega aur SPA routing handle karega.
3. **`package.json` Dependencies**:
   - `tsx` runtime ko `dependencies` me move kiya gaya hai taaki `npm start` production environments me bina kisi error ke chale.
4. **Clean Authentication**:
   - Kisi bhi fake/dummy account (`learner`) ko remove kiya gaya hai.
   - Real email + 8+ char password complexity (direct registration and login bina fake OTP ke).
   - Authentic Google OAuth consent / permission flow.

---

## 2. Option A: Render.com par Deploy karna (Recommended ⭐ - Free Tier)

Render par full-stack Node.js Web Service deploy karna sabse aasan hai aur bilkul free hai:

### Step 1: GitHub par code push karein
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### Step 2: Render.com par Account banayein
1. [dashboard.render.com](https://dashboard.render.com) par jayein (GitHub se login karein).
2. Top-right me **New +** button par click karein aur **Web Service** choose karein.
3. Apna GitHub repository select karein.

### Step 3: Service Settings Configure karein
- **Name**: `ai-interview-coach` (ya apni pasand ka naam)
- **Region**: Singapore ya Frankfurt (India ke liye fast latency)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free` ($0/month)

### Step 4: Environment Variables Add karein
Render dashboard ke **Environment Variables** section me:
- **Key**: `GEMINI_API_KEY`
- **Value**: Apni Google AI Studio API key paste karein

### Step 5: Deploy!
- **Create Web Service** button dabayein.
- Render 1-2 minute me build karke live URL de dega:
  `https://ai-interview-coach.onrender.com` (Free SSL Certificate ke saath).

---

## 3. Option B: Railway.app par Deploy karna

1. [railway.app](https://railway.app) par login karein.
2. **New Project** &rarr; **Deploy from GitHub repo** select karein.
3. **Variables** tab me `GEMINI_API_KEY` add karein.
4. **Settings** &rarr; **Generate Domain** click karein. Done!

---

## 4. Option C: Docker se Run karna

```bash
# Build Docker image
docker build -t ai-interview-coach .

# Run container
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key" ai-interview-coach
```

---

## 5. Local Testing Before Push

Agar aapko apne local machine par production build test karna hai:
```bash
npm run build
NODE_ENV=production npm start
```
Browser me `http://localhost:3000` open karein.
