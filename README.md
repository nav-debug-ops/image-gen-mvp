# Amazon Listing Image Generator

A professional image generation tool for Amazon sellers. Generate product photos optimized for Amazon listings with automatic session tracking, calendar integration, and data export.

## Features

### Image Generation
- **Amazon-Optimized Prompts** - Automatically builds professional prompts for Amazon listing images
- **5 Image Types** - Main Image, Lifestyle, Infographic, Detail Shot, Comparison
- **8 Product Categories** - Electronics, Home & Kitchen, Beauty, Sports, Toys, Clothing, Food, Pets
- **Multiple AI Providers** - Replicate (Flux), OpenAI (DALL-E 3), Stability AI

### Session Tracking
- **Time Tracking** - Track how long you spend generating images
- **Project Organization** - Group sessions by product/project name
- **Session Statistics** - View total time, images generated, session history
- **Auto-Start** - Sessions automatically start when you generate

### Calendar Integration (Clockwise Compatible)
- **Google Calendar Sync** - Create focus time blocks when you start sessions
- **Automatic Updates** - Calendar events update with actual duration when you end
- **Clockwise Compatible** - Works with Clockwise for smart scheduling

### Data & Export
- **IndexedDB Storage** - All data persisted locally in the browser
- **CSV Export** - Export sessions and images to spreadsheet
- **PDF Reports** - Generate printable reports with statistics
- **History & Favorites** - Browse and manage all generated images

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

Edit your `.env` file:

```env
# Replicate (Recommended - Flux model)
VITE_API_PROVIDER=replicate
VITE_API_KEY=your_replicate_token

# OpenAI (DALL-E 3)
VITE_API_PROVIDER=openai
VITE_API_KEY=your_openai_api_key

# Stability AI (SDXL)
VITE_API_PROVIDER=stability
VITE_API_KEY=your_stability_api_key
```

### Google Calendar Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable Google Calendar API
3. Create OAuth 2.0 credentials (Web application)
4. Add `http://localhost:3000` to authorized JavaScript origins
5. Add to your `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key
```

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
│   │   ├── SessionPanel.jsx    # Time tracking controls
│   │   └── SettingsPanel.jsx   # API config + exports
│   ├── api/
│   │   └── imageGen.js         # Multi-provider image API
│   ├── services/
│   │   ├── database.js         # IndexedDB storage
│   │   ├── sessionTracker.js   # Session/time tracking
│   │   └── calendar.js         # Google Calendar integration
│   └── utils/
│       └── export.js           # CSV/PDF export utilities
├── .env.example                # Environment template
├── package.json
└── vite.config.js
```

## Tech Stack

- React 18
- Vite
- IndexedDB (persistent storage)
- Lucide React (icons)
- Google Calendar API

## API Pricing (Approximate)

| Provider | Cost per Image |
|----------|---------------|
| Replicate (Flux) | ~$0.003 |
| Stability AI | ~$0.002 |
| OpenAI DALL-E 3 | $0.04 (standard) |

## License

MIT
