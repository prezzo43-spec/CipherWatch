# CipherWatch Backend

Secure backend server for phishing analysis using **Grok AI (xAI)** - **FREE TIER AVAILABLE!**

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get FREE Grok API Key:**
   - Visit [xAI Console](https://console.x.ai/)
   - Sign up for a free account
   - Generate an API key
   - Copy the key

3. **Configure environment variables:**
   - Open `backend/.env`
   - Replace `xai-your-free-api-key-here` with your actual Grok API key:
   ```
   GROK_API_KEY=xai-your-actual-key-here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

## Features

✅ **FREE Grok AI** - No credit card required for basic usage
✅ **Mock fallback** - Works even without API key for testing
✅ **Secure API key storage** - Server-side only
✅ **CORS enabled** - Frontend communication
✅ **Error handling** - Detailed error responses

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns: `{ status: "ok", message: "Backend is running" }`

### Analyze URL/Email
- **POST** `/api/scan`
- Request body:
  ```json
  {
    "input": "url or email content to analyze",
    "scanType": "url" or "email"
  }
  ```
- Response:
  ```json
  {
    "verdict": "Safe | Suspicious | Dangerous",
    "risk_score": 0-100,
    "summary": "Analysis summary",
    "red_flags": ["flag1", "flag2"],
    "recommendation": "What user should do"
  }
  ```

## Testing Without API Key

If you don't set up the Grok API key, the backend will automatically use mock responses for testing the UI. Just start the server and it will work!

## Troubleshooting

- **Connection refused?** Make sure backend is running on port 5000
- **API key error?** Verify `GROK_API_KEY` in `.env`
- **CORS errors?** Backend has CORS enabled by default
- **Mock mode?** Check console for "⚠️ Grok API key not configured, using mock response"
