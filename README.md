# 🌱 EcoPulse — AI-Powered Carbon Nudge Engine

> **Hackathon Project** · FastAPI + React Native (Expo) · OpenAI GPT-4o-mini

EcoPulse is a behavior-change app that goes beyond carbon tracking — it uses an AI "Nudge Engine" to generate **personalised, time-sensitive Eco-Challenges** that push users toward greener daily decisions. Points (Eco-Coins) and streaks keep them engaged.

---

## 🏗 Architecture

```
ecopulse/
├── backend/      FastAPI + SQLite + OpenAI
└── frontend/     React Native (Expo SDK 51)
```

---

## ⚡ Quick Start (2 terminals)

### Terminal 1 — Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# (Optional) Add OpenAI key — skip for mock mode
copy .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

# Run server
uvicorn app.main:app --reload --port 8000
```

> ✅ API is live at **http://localhost:8000**
> 📄 Swagger UI (live demo for judges): **http://localhost:8000/docs**

---

### Terminal 2 — Frontend

```bash
cd frontend

npm install
npx expo start
```

> 📱 Scan the QR code with **Expo Go** (iOS/Android) to run on your phone
> 🌐 Press `w` for browser preview

**⚠️ Physical device?** Update `BASE_URL` in `frontend/src/services/api.ts`:
```ts
export const BASE_URL = 'http://YOUR_LAN_IP:8000';
// Example: 'http://192.168.1.5:8000'
```
Find your IP: `ipconfig` (Windows) or `ifconfig` (macOS/Linux)

---

## 🧠 Core Logic (for Judges)

### 1. 🌍 Carbon Calculator (`backend/app/services/carbon_calculator.py`)
Uses **DEFRA/IPCC emission factors** (gold standard, used in UK government reporting):

| Activity | Factor |
|----------|--------|
| Car (petrol) | 0.192 kg CO₂e / km |
| Bus | 0.089 kg CO₂e / km |
| Flight | 0.255 kg CO₂e / km |
| Train | 0.041 kg CO₂e / km |
| Beef meal | 3.0 kg CO₂e / meal |
| Vegetarian meal | 0.25 kg CO₂e / meal |
| Vegan meal | 0.10 kg CO₂e / meal |

**Formula:** `footprint = Σ (quantity × emission_factor)`

### 2. 🤖 AI Nudge Engine (`backend/app/services/nudge_engine.py`)
- Identifies the **hot-spot** (highest-impact activity)
- Calls **GPT-4o-mini** with JSON mode → 3 personalised, positive challenges
- **Mock fallback**: works without an API key — curated challenge bank filtered by hot-spot
- Returns `ai_powered: true/false` so the frontend shows an "AI Powered" badge

### 3. 🏆 Eco-Coins Gamification (`backend/app/services/gamification.py`)
Built on **BJ Fogg's Tiny Habits** model — reward the smallest green action:

| Action | Coins |
|--------|-------|
| Log daily activities | +5 |
| Reduce footprint vs. yesterday | +10 |
| Complete easy challenge | +15 |
| Complete medium challenge | +20 |
| Complete hard challenge | +40 |
| 7-day streak bonus | +50 |

**Levels:** Seedling 🌱 → Sprout 🌿 → Tree 🌳 → Forest Guardian 🌲

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/activities/log` | Log activities → get footprint + challenges + coins |
| `GET` | `/api/activities/factors` | All emission factors |
| `GET` | `/api/activities/history/{user_id}` | Last 7 days of logs |
| `GET` | `/api/challenges/{user_id}` | Get all challenges |
| `POST` | `/api/challenges/{id}/complete` | Complete challenge → award coins |
| `GET` | `/api/users/{user_id}/profile` | Full user profile + level progress |

### Example: Log Activities
```bash
curl -X POST http://localhost:8000/api/activities/log \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo_user",
    "activities": [
      {"category": "transport", "type": "car", "quantity": 25},
      {"category": "food", "type": "beef", "quantity": 1}
    ]
  }'
```

### Example Response
```json
{
  "footprint": {
    "total_kg": 7.8,
    "breakdown": {"transport_kg": 4.8, "food_kg": 3.0},
    "hot_spot": "1 meal(s) by beef",
    "vs_global_avg": -43.1
  },
  "challenges": [
    {
      "id": "uuid",
      "title": "🥗 Try a veggie lunch today",
      "description": "Swapping one beef meal for vegetarian saves ~2.75 kg CO₂e!",
      "difficulty": "easy",
      "coins_reward": 15,
      "category": "food",
      "completed": false
    }
  ],
  "coins_earned": 5,
  "new_balance": 5,
  "streak_days": 1,
  "level": "Seedling",
  "ai_powered": false
}
```

---

## 📱 Frontend Screens

| Screen | Description |
|--------|-------------|
| **Home** | Carbon ring chart, coin balance, streak, challenge preview |
| **Log Day** | Transport mode picker + food type selector → submit |
| **Challenges** | Full AI-generated challenge list, complete for coins |
| **Profile** | Level badge, progress bar, stats grid, level roadmap |

---

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(empty)* | GPT-4o-mini key — leave blank for mock mode |
| `APP_ENV` | `development` | Environment flag |

---

## 📦 Size Budget

| Component | Committed Size |
|-----------|---------------|
| Backend Python source | ~35 KB |
| Frontend TypeScript source | ~65 KB |
| Config files | ~5 KB |
| **Total** | **~105 KB** ✅ (limit: 10 MB) |

Dependencies (`node_modules/`, `venv/`) are in `.gitignore` and NOT committed.

---

## 🧪 Run Unit Tests

We have included a unit testing suite to verify the precision of the carbon calculation logic:

```bash
cd backend
# Make sure your virtual environment is active
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux

python -m unittest tests/test_calculator.py
```

---

## 🗺 Future Roadmap

1. **Transaction-based Tracking:** Integrate open banking APIs (like Plaid) to automatically estimate the carbon footprint of your purchases.
2. **Mobile Push Notifications:** Schedule daily nudges and alerts to prompt users to log their day.
3. **Global Leaderboards:** Introduce school/workspace-wide competitions with real-world green rewards.
4. **Enhanced Accessibility:** Full screen-reader support and WCAG-compliant color themes.

---

*Built for hackathon · Powered by DEFRA/IPCC emission data · AI by OpenAI GPT-4o-mini*
