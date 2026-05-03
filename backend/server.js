const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Stripe = require("stripe");
require("dotenv").config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  premium_yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Grok API configuration
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROK_API_KEY = process.env.GROK_API_KEY;

// Mock analysis function for testing without API key
function generateMockAnalysis(input, scanType) {
  const isSuspicious = input.toLowerCase().includes('login') ||
                      input.toLowerCase().includes('password') ||
                      input.toLowerCase().includes('urgent') ||
                      input.toLowerCase().includes('bank') ||
                      input.includes('http://') ||
                      input.includes('@');

  if (isSuspicious) {
    return {
      verdict: "Suspicious",
      risk_score: Math.floor(Math.random() * 40) + 40, // 40-80
      summary: "This content shows several indicators commonly associated with phishing attempts.",
      red_flags: [
        "Contains urgent language",
        "Requests personal information",
        "Uses suspicious links or domains"
      ],
      recommendation: "Do not click any links or provide personal information. Verify the sender through official channels."
    };
  } else {
    return {
      verdict: "Safe",
      risk_score: Math.floor(Math.random() * 20) + 5, // 5-25
      summary: "This content appears to be legitimate with no obvious phishing indicators.",
      red_flags: [],
      recommendation: "This appears safe, but always verify important communications through trusted channels."
    };
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Phishing analysis endpoint
app.post("/api/scan", async (req, res) => {
  try {
    const { input, scanType } = req.body;

    if (!input || !scanType) {
      return res.status(400).json({
        error: "Missing required fields: input and scanType",
      });
    }

    // Check if Grok API key is configured
    if (!GROK_API_KEY || GROK_API_KEY === 'xai-your-free-api-key-here') {
      console.log("⚠️  Grok API key not configured, using mock response");
      // Mock response for testing
      const mockResponse = generateMockAnalysis(input, scanType);
      return res.json(mockResponse);
    }

    const response = await axios.post(GROK_API_URL, {
      model: "grok-beta",
      messages: [
        {
          role: "system",
          content: "You are a cybersecurity expert specializing in phishing detection. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: `You are a cybersecurity expert. Analyze this ${scanType} for phishing, malware, or social engineering threats.

${scanType.toUpperCase()}: ${input}

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "verdict": "Safe" or "Suspicious" or "Dangerous",
  "risk_score": number between 0-100,
  "summary": "one sentence summary",
  "red_flags": ["flag1", "flag2"],
  "recommendation": "what the user should do"
}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    }, {
      headers: {
        "Authorization": `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    // Extract the text response
    const text = response.data.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (error) {
    console.error("Error analyzing:", error.response?.data || error.message);
    res.status(500).json({
      error: "Analysis failed",
      details: error.response?.data?.error || error.message,
      verdict: "Error",
      summary: "Analysis failed. Please try again.",
      red_flags: [],
      recommendation: "Check your connection.",
      risk_score: 0,
    });
  }
});

// Stripe checkout session endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { plan } = req.body;
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe secret key is not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      success_url: `${FRONTEND_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/?canceled=true`,
      metadata: {
        plan,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error.response?.data || error.message);
    res.status(500).json({ error: "Unable to create checkout session." });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CipherWatch backend running on http://localhost:${PORT}`);
  console.log(`🤖 Using Grok AI (xAI) for phishing analysis`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/scan`);
});
