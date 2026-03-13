# Local Setup Guide

Step-by-step instructions to run the Amazon Listing Pro MVP on your local machine.

---

## Prerequisites

Install these before starting:

- **Python 3.10+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Git** — [git-scm.com](https://git-scm.com/)

---

## Step 1: Clone the Repo

```bash
git clone https://github.com/nav-debug-ops/image-gen-mvp.git
cd image-gen-mvp
```

---

## Step 2: Set Up the Backend

Open a terminal in the project root:

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it — Windows:
venv\Scripts\activate
# Activate it — Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env from the template
copy .env.example .env
# Mac/Linux:
# cp .env.example .env
```

Now open `backend/.env` and fill in your **Gemini API key**:

```
GEMINI_API_KEY=your_key_here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com) → Get API Key.

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`
Verify it's working: `http://localhost:8000/health` should return `{"status":"healthy"}`

---

## Step 3: Set Up the Frontend

Open a **new terminal** in the project root (not inside `backend/`):

```bash
# From the image-gen-mvp/ root folder
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Step 4: Open the App

Go to `http://localhost:3000` in your browser.

> **Note:** In development mode, login is automatically bypassed — you go straight to the dashboard without needing an account.

---

## Troubleshooting

### `pip install` fails
Make sure your virtual environment is activated — you should see `(venv)` in your terminal prompt.

### Backend won't start — "module not found"
You're probably not inside the `backend/` folder. Run `cd backend` first, then activate the venv, then run uvicorn.

### Frontend shows blank page or "Network Error"
- Make sure the backend is running on port 8000
- Make sure you ran `npm install` before `npm run dev`

### Images not generating
- Check that `GEMINI_API_KEY` is set in `backend/.env`
- Check the backend terminal for error messages

---

## Useful Commands

| Command | Run from | Purpose |
|---------|----------|---------|
| `uvicorn app.main:app --reload` | `backend/` | Start backend |
| `npm run dev` | project root | Start frontend |
| `npm run build` | project root | Build for production |
| `pip install -r requirements.txt` | `backend/` | Install Python deps |
| `npm install` | project root | Install JS deps |
