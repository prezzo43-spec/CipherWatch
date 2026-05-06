# CipherWatch Backend

Secure backend server for CipherWatch with live API key support for real-world threat intelligence.

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy the environment example:**
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Configure real API keys:**
   - Open `backend/.env`
   - Add your keys for live phishing and threat data:
   ```env
   GROK_API_KEY=xai-your-actual-key-here
   ABUSEIPDB_API_KEY=your-abuseipdb-key
   OTX_API_KEY=your-alienvault-otx-key
   URLHAUS_API_KEY=optional-urlhaus-key
   ```

4. **Optional billing setup:**
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
   STRIPE_PRICE_ID_MONTHLY=price_YOUR_MONTHLY_ID
   STRIPE_PRICE_ID_YEARLY=price_YOUR_YEARLY_ID
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`.

## Real API Key Support

CipherWatch can now use live API keys for real-world data:

- `GROK_API_KEY` for xAI phishing analysis
- `ABUSEIPDB_API_KEY` for malicious IP intelligence
- `OTX_API_KEY` for AlienVault OTX pulses
- `URLHAUS_API_KEY` support is available if required by specific workflows

The frontend Settings page also persists API key values via the server.

## Settings Endpoints

### Get current settings
- **GET** `/api/settings`

### Save API keys and backend settings
- **POST** `/api/settings`
- Request body:
  ```json
  {
    "GROK_API_KEY": "...",
    "ABUSEIPDB_API_KEY": "...",
    "OTX_API_KEY": "...",
    "URLHAUS_API_KEY": "..."
  }
  ```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Response: `{ status: "ok", message: "Backend is running" }`

### Analyze URL/Email
- **POST** `/api/scan`
- Request body:
  ```json
  {
    "input": "url or email content to analyze",
    "scanType": "url"
  }
  ```

### Network Scan
- **POST** `/api/network-scan`
- Request body includes `target` and `scanType`, and the backend uses real port scanning plus device discovery.

### Threat Intelligence
- **GET** `/api/threats`
- Returns aggregated threat feeds from AbuseIPDB, URLhaus, and AlienVault OTX when configured.

### Stripe Billing
- **POST** `/api/create-checkout-session`
- Request body:
  ```json
  {
    "plan": "premium_monthly" or "premium_yearly"
  }
  ```

## Notes

- If API keys are missing for a source, CipherWatch will still run and fallback gracefully.
- `backend/settings.json` is ignored by git and stores runtime key values locally.
- Keep your keys secure and do not commit `.env` or `settings.json` to source control.

