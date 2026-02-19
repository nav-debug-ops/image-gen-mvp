# Amazon Listing Image Generator

A professional image generation tool for Amazon sellers. Generate product photos optimized for Amazon listings with AI-powered generation and data export.

## Features

### Image Generation
- **Amazon-Optimized Prompts** - Automatically builds professional prompts for Amazon listing images
- **5 Image Types** - Main Image, Lifestyle, Infographic, Detail Shot, Comparison
- **8 Product Categories** - Electronics, Home & Kitchen, Beauty, Sports, Toys, Clothing, Food, Pets
- **Multiple AI Providers** - Replicate (Flux), OpenAI (DALL-E 3), Stability AI

### Data & Export
- **IndexedDB Storage** - All data persisted locally in the browser
- **CSV Export** - Export images to spreadsheet
- **PDF Reports** - Generate printable reports with statistics
- **History & Favorites** - Browse and manage all generated images

### Authentication
- **User Registration & Login** - Secure JWT-based authentication
- **Password Reset** - Email-based forgot password flow via Gmail SMTP

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API (optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your API credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Demo Mode

By default, the app runs in demo mode using placeholder images. This is perfect for testing the UI without an API key.

## Configuration

### Image Generation API

API keys are configured on the backend. See `backend/.env.example` for details.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + Enter | Generate image |
| Ctrl + S | Save to gallery |

## Project Structure

```
image-gen-mvp/
├── src/
│   ├── App.jsx                 # Main app with state management
│   ├── App.css                 # Styles (dark theme)
│   ├── main.jsx                # Entry point
│   ├── components/
│   │   ├── PromptInput.jsx     # Image type, category, prompt
│   │   ├── ImageDisplay.jsx    # Image viewer + progress
│   │   ├── History.jsx         # Generation history
│   │   ├── Gallery.jsx         # Saved favorites
│   │   └── SettingsPanel.jsx   # API config + exports
│   ├── api/
│   │   ├── imageGen.js         # Multi-provider image API
│   │   └── auth.js             # Authentication API
│   ├── pages/
│   │   ├── Login.jsx           # Login/Register/Forgot password
│   │   └── ResetPassword.jsx   # Password reset page
│   ├── services/
│   │   └── database.js         # IndexedDB storage
│   └── utils/
│       └── export.js           # CSV/PDF export utilities
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI application
│   │   ├── config.py           # Settings & environment
│   │   ├── models/             # SQLAlchemy models
│   │   ├── api/                # API routes
│   │   └── services/           # Business logic
│   └── requirements.txt
├── .env.example                # Environment template
├── package.json
└── vite.config.js
```

## Tech Stack

- React 18
- Vite
- FastAPI (Python backend)
- IndexedDB (client-side storage)
- SQLite + SQLAlchemy (backend storage)
- Lucide React (icons)

## API Pricing (Approximate)

| Provider | Cost per Image |
|----------|---------------|
| Replicate (Flux) | ~$0.003 |
| Stability AI | ~$0.002 |
| OpenAI DALL-E 3 | $0.04 (standard) |

## License

MIT
