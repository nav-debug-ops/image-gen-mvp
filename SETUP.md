# Setup Guide

Complete step-by-step guide to run the ImageGen MVP locally.

## Prerequisites

1. **Python 3.10+** - [Download](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **Replicate Account** - [Sign up](https://replicate.com/) (free tier available)

---

## Step 1: Get Your Replicate API Token

1. Go to [replicate.com](https://replicate.com)
2. Sign up or log in
3. Go to Account Settings → API Tokens
4. Copy your API token

---

## Step 2: Set Up Backend

Open a terminal and run:

```bash
# Navigate to backend folder
cd image-gen-mvp/backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (Mac/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# (Mac/Linux: cp .env.example .env)

# Edit .env and add your Replicate API token
# REPLICATE_API_TOKEN=your_token_here

# Run the backend
uvicorn app.main:app --reload
```

Backend will be running at: `http://localhost:8000`

Test it: Open `http://localhost:8000` in your browser - you should see:
```json
{"message": "ImageGen MVP API", "status": "running"}
```

---

## Step 3: Set Up Frontend

Open a **new terminal** and run:

```bash
# Navigate to frontend folder
cd image-gen-mvp/frontend

# Install dependencies
npm install

# Create .env.local
copy .env.example .env.local
# (Mac/Linux: cp .env.example .env.local)

# Run the frontend
npm run dev
```

Frontend will be running at: `http://localhost:3000`

---

## Step 4: Use the App

1. Open `http://localhost:3000` in your browser
2. Type a prompt like "A cute cat in a garden"
3. Select a style (optional)
4. Click "Generate"
5. Wait for your image!

---

## Troubleshooting

### "Failed to generate image"
- Check that your Replicate API token is correct in `backend/.env`
- Ensure you have credits in your Replicate account
- Check the backend terminal for error messages

### "Network Error" or CORS issues
- Make sure the backend is running on port 8000
- Check that `FRONTEND_URL=http://localhost:3000` in backend `.env`

### Images not loading
- Check that the `generated` folder exists in the backend directory
- Verify the backend is serving static files correctly

---

## Next Steps

After confirming the MVP works:

1. **Add authentication** - Protect your API
2. **Deploy** - Use Vercel (frontend) + Railway/Render (backend)
3. **Add more features** - See the roadmap in README.md

---

## Useful Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `uvicorn app.main:app --reload` | backend/ | Run backend |
| `npm run dev` | frontend/ | Run frontend |
| `npm run build` | frontend/ | Build for production |
| `pip freeze > requirements.txt` | backend/ | Update dependencies |
