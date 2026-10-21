# WaveNxD Technologies — AI Sales Representative

An AI-powered sales assistant web application for **WaveNxD Technologies Pvt. Ltd., Kolhapur**, a company specialising in **ultrasonic spray nozzle systems**.

---

## 📋 Project Overview

This application provides a conversational AI sales representative that:
- Explains ultrasonic spray nozzle products in detail
- Discovers customer requirements through guided conversation
- Recommends suitable products based on application needs
- Collects and stores quotation requests
- Supports English, Hindi, and Marathi

---

## 🏗️ Architecture

```
Internship_Project_Nexaprime/
├── backend/              ← Python FastAPI server
│   ├── app/
│   │   ├── main.py          ← Entry point
│   │   ├── config.py        ← Environment variable loading
│   │   ├── database.py      ← Motor + Beanie MongoDB setup
│   │   ├── models.py        ← Database models
│   │   ├── schemas.py       ← Pydantic request/response models
│   │   ├── products.py      ← Product catalogue data
│   │   ├── ai_service.py    ← Gemini AI integration
│   │   ├── recommender.py   ← Product recommendation logic
│   │   └── routers/
│   │       ├── chat.py      ← Chat API endpoints
│   │       ├── quotations.py← Quotation API endpoints
│   │       └── followups.py ← Follow-up API endpoints
│   ├── .env             ← ⚠️ YOUR SECRETS — never commit this file
│   ├── .env.example     ← Template (safe to commit)
│   ├── requirements.txt ← Python dependencies
│   └── .gitignore
├── frontend/             ← React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚡ Technology Stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS    |
| Backend    | Python 3.10+, FastAPI, Uvicorn  |
| Database   | MongoDB via Motor and Beanie    |
| AI         | Google Gemini API (google-genai)|
| HTTP       | Axios (frontend → backend)      |

---

## ✅ Prerequisites

Before starting, install these on your computer:

1. **Node.js** (v18 or later) — https://nodejs.org/
2. **Python** (v3.10 or later) — https://www.python.org/downloads/
3. **MongoDB** (local server or MongoDB Atlas) — https://www.mongodb.com/try/download/community
4. **Git** — https://git-scm.com/

Verify they are installed by opening PowerShell and running:
```powershell
node --version
python --version
git --version
```

---

## 🔑 Gemini API Key Setup (IMPORTANT — Do This First)

You need a free Google Gemini API key to enable AI features.

### Step 1 — Get your API key
1. Open https://aistudio.google.com/app/apikey in your browser
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key that appears (it starts with `AIza...`)

### Step 2 — Add the key to your `.env` file
1. In Antigravity IDE, open the file: `backend/.env`
2. Replace `PASTE_YOUR_API_KEY_HERE` with the key you copied:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   GEMINI_MODEL=gemini-2.0-flash
   ```
3. Save the file (Ctrl+S)

> ⚠️ **NEVER share your API key or commit the `.env` file to GitHub.**
> The `.gitignore` file already excludes `.env` automatically.

### Step 3 — Restart the backend
After editing `.env`, stop the backend (Ctrl+C in its terminal) and start it again.

---

## 🚀 Installation & Running

### Terminal 1 — Backend

```powershell
# Navigate to the backend folder
cd d:\Internship_Project_Nexaprime\backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at: http://localhost:8000
API documentation (Swagger UI): http://localhost:8000/docs

### Configure user and admin access

Copy `backend/.env.example` to `backend/.env` and configure `MONGODB_URI` and
`DB_NAME` for your MongoDB database. Before starting the backend for the first
time, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`; the backend
creates that admin account in MongoDB if no admin account exists yet. Use a
strong password of at least 8 characters. Set `JWT_SECRET` to a long random
value as well. If an admin account already exists, set `ADMIN_USERNAME` to
that existing admin's username to synchronize its password from the environment.

Users can create an account from the login page or sign in with an existing
account. After login, users can submit quotation requests and see only their
own requests and their review status. Admins can open **Admin Panel** to see
all pending quotation requests, review the request details, approve or reject
them, add comments, and inspect activity logs. User registrations, successful
logins, quotation submissions, and admin decisions are recorded in MongoDB.

### Terminal 2 — Frontend

```powershell
# Navigate to the frontend folder
cd d:\Internship_Project_Nexaprime\frontend

# Install Node dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will be available at: http://localhost:5173

---

## 🧪 Testing the Application

1. Open http://localhost:5173 in your browser
2. The home page shows the product catalogue
3. Click **"Chat with AI"** to open the chatbot
4. Type a message like: *"Hello, tell me about your products"*
5. Try switching to Hindi: *"नमस्ते, आपके उत्पाद बताइए"*
6. Create a user account or sign in, then use **"Get Quote"** to submit a request
7. Sign in as the configured admin to approve/reject pending requests in **Admin Panel**

---

## 🐛 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `GEMINI_API_KEY not found` | `.env` file not configured | Edit `backend/.env` and add your key |
| `uvicorn: command not found` | Virtual environment not activated | Run `.\venv\Scripts\Activate.ps1` |
| `npm: command not found` | Node.js not installed | Install from https://nodejs.org/ |
| `CORS error` in browser | Backend not running | Start backend on port 8000 first |
| `ModuleNotFoundError` | Dependencies not installed | Run `pip install -r requirements.txt` |
| AI returns demo response | API key missing or invalid | Check `backend/.env` configuration |

---

## 🔒 Security — Keeping Secrets Safe

- The `backend/.env` file is listed in `.gitignore` — it will NOT be committed to GitHub
- Never paste your API key into chat, email, or source code files
- The `backend/.env.example` file contains only placeholders and is safe to share
- The API key is only used on the backend server — it is never sent to the browser

---

## 📞 Contact

**WaveNxD Technologies Pvt. Ltd.**  
Kolhapur, Maharashtra, India

---

*Built as an internship project demonstrating AI-powered sales assistance for industrial ultrasonic spray nozzle systems.*
