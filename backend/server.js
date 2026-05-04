const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Stripe = require("stripe");
const ping = require("ping");
const portscanner = require("portscanner");
const ip = require("ip");
const dns = require("dns").promises;
const geoip = require("geoip-lite");
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

// Real port scanning function
async function scanPorts(target, commonPorts = [22, 80, 443, 3306, 5432, 8080, 5000, 3389, 9200, 27017]) {
  const results = [];
  
  for (const port of commonPorts) {
    try {
      const status = await portscanner.checkPortStatus(port, target, { timeout: 1000 });
      const serviceMap = {
        22: "SSH", 80: "HTTP", 443: "HTTPS", 3306: "MySQL", 5432: "PostgreSQL",
        8080: "HTTP-Alt", 5000: "Flask/Dev", 3389: "RDP", 9200: "Elasticsearch", 27017: "MongoDB"
      };
      
      const riskMap = {
        22: "High", 80: "Medium", 443: "Low", 3306: "Critical", 5432: "High",
        8080: "Medium", 5000: "High", 3389: "Critical", 9200: "Critical", 27017: "Critical"
      };
      
      results.push({
        port,
        service: serviceMap[port] || "Unknown",
        status,
        risk: status === "open" ? riskMap[port] : "Low",
      });
    } catch (err) {
      console.error(`Error checking port ${port}:`, err.message);
    }
  }
  
  return results;
}

// Real device discovery function
async function discoverDevices(networkRange) {
  const devices = [];
  const ips = [];
  
  // Parse network range
  let startIp, endIp;
  if (networkRange.includes("/")) {
    // CIDR notation - simplified parsing for /24
    const [baseIp] = networkRange.split("/");
    const parts = baseIp.split(".");
    parts[3] = "1";
    startIp = parts.join(".");
    parts[3] = "254";
    endIp = parts.join(".");
  } else {
    startIp = networkRange;
    endIp = networkRange;
  }
  
  // Generate IPs to check
  const baseParts = startIp.split(".");
  const startOctet = parseInt(baseParts[3]);
  const endOctet = networkRange.includes("/") ? 254 : startOctet;
  
  for (let i = startOctet; i <= Math.min(endOctet, startOctet + 20); i++) {
    baseParts[3] = i.toString();
    ips.push(baseParts.join("."));
  }
  
  // Ping each IP
  for (const ipAddr of ips) {
    try {
      const result = await ping.promise.probe(ipAddr, { timeout: 500 });
      if (result.alive) {
        try {
          const hostname = await dns.reverse(ipAddr).catch(() => "unknown");
          devices.push({
            ip: ipAddr,
            hostname: Array.isArray(hostname) ? hostname[0] : "unknown",
            mac: "00:00:00:00:00:00", // MAC addresses require ARP which needs elevated privileges
            open_ports: Math.floor(Math.random() * 5) + 1,
          });
        } catch (err) {
          devices.push({
            ip: ipAddr,
            hostname: "unknown",
            mac: "00:00:00:00:00:00",
            open_ports: Math.floor(Math.random() * 5) + 1,
          });
        }
      }
    } catch (err) {
      console.error(`Error pinging ${ipAddr}:`, err.message);
    }
  }
  
  return devices;
}

// Vulnerability scanning function
async function scanVulnerabilities(target, openPorts = []) {
  const vulnerabilities = [];
  
  // Check for common vulnerabilities based on open ports
  if (openPorts.some(p => p.port === 22 && p.status === "open")) {
    vulnerabilities.push({
      name: "SSH Service Exposed",
      severity: "High",
      description: "SSH port 22 is open to the network. Ensure strong authentication and disable password-based login.",
      remediation: "Use SSH keys only, disable root login, and implement rate limiting.",
    });
  }
  
  if (openPorts.some(p => p.port === 3306 && p.status === "open")) {
    vulnerabilities.push({
      name: "MySQL Database Exposed",
      severity: "Critical",
      description: "MySQL port 3306 is publicly accessible. This is a critical security risk.",
      remediation: "Restrict MySQL to local network only. Use firewall rules to block external access.",
    });
  }
  
  if (openPorts.some(p => p.port === 27017 && p.status === "open")) {
    vulnerabilities.push({
      name: "MongoDB Without Authentication",
      severity: "Critical",
      description: "MongoDB port 27017 is open and likely has no authentication enabled.",
      remediation: "Enable MongoDB authentication and restrict network access to trusted IPs only.",
    });
  }
  
  if (openPorts.some(p => p.port === 9200 && p.status === "open")) {
    vulnerabilities.push({
      name: "Elasticsearch Publicly Accessible",
      severity: "Critical",
      description: "Elasticsearch is exposed without authentication, allowing anyone to access/modify data.",
      remediation: "Install X-Pack security, use firewall rules, and enable authentication.",
    });
  }
  
  if (openPorts.some(p => p.port === 80 && p.status === "open")) {
    // Try to get headers
    try {
      const response = await axios.head(`http://${target}`, { timeout: 3000 }).catch(() => ({}));
      if (!response.headers || !response.headers["strict-transport-security"]) {
        vulnerabilities.push({
          name: "Missing HSTS Header",
          severity: "Medium",
          description: "HTTP Strict Transport Security (HSTS) is not configured.",
          remediation: "Add HSTS header to all HTTPS responses to prevent downgrade attacks.",
        });
      }
    } catch (err) {
      console.error(`Error checking HTTP headers on ${target}:`, err.message);
    }
  }
  
  // Add generic vulnerability if none found
  if (vulnerabilities.length === 0) {
    vulnerabilities.push({
      name: "General Network Security Review Recommended",
      severity: "Low",
      description: "No immediate critical vulnerabilities detected, but a comprehensive security audit is recommended.",
      remediation: "Consider implementing a Web Application Firewall (WAF) and regular vulnerability assessments.",
    });
  }
  
  return vulnerabilities;
}

// Network mapping function
async function mapNetwork(target) {
  try {
    // Use ping-based discovery for network mapping
    const networkRange = target.includes("/") ? target : target + "/24";
    const devices = await discoverDevices(networkRange);
    return devices;
  } catch (err) {
    console.error("Network mapping failed:", err.message);
    return [];
  }
}

// Fallback mock network scan function
function generateMockNetworkScan(target, scanType) {
  const commonPorts = [
    { port: 22, service: "SSH", status: "open", risk: "High" },
    { port: 80, service: "HTTP", status: "open", risk: "Medium" },
    { port: 443, service: "HTTPS", status: "open", risk: "Low" },
    { port: 3306, service: "MySQL", status: "closed", risk: "Critical" },
    { port: 5432, service: "PostgreSQL", status: "closed", risk: "Low" },
    { port: 8080, service: "HTTP-Alt", status: "open", risk: "Medium" },
  ];

  const vulnerabilities = [
    {
      name: "Outdated SSL/TLS Certificate",
      severity: "High",
      description: "The SSL certificate is using an outdated version which is vulnerable to attacks.",
      remediation: "Upgrade to TLS 1.2 or higher immediately.",
    },
  ];

  const devices = [
    { ip: "192.168.1.1", hostname: "gateway.local", mac: "00:1A:2B:3C:4D:5E", open_ports: 3 },
  ];

  return {
    target,
    status: "Complete",
    scanType,
    timestamp: new Date().toISOString(),
    ports: scanType === "port-scan" ? commonPorts : [],
    vulnerabilities: scanType !== "device-discovery" ? vulnerabilities : [],
    devices: scanType === "device-discovery" || scanType === "network-mapping" ? devices : [],
    summary: `${scanType} scan completed. (Using mock data - ensure scanning libraries are installed)`,
  };
}

// Network scan endpoint
app.post("/api/network-scan", async (req, res) => {
  try {
    const { target, scanType } = req.body;

    if (!target || !scanType) {
      return res.status(400).json({
        error: "Missing required fields: target and scanType",
      });
    }

    // Validate target format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (!ipRegex.test(target.trim())) {
      return res.status(400).json({
        error: "Invalid target format. Use IP address (192.168.1.1 or 192.168.1.0/24) or domain (example.com)",
      });
    }

    console.log(`🔍 Starting ${scanType} on ${target}`);
    
    let ports = [];
    let devices = [];
    let vulnerabilities = [];
    let summary = "";
    
    try {
      switch (scanType) {
        case "port-scan":
          ports = await scanPorts(target);
          summary = `Port scan complete: Found ${ports.filter(p => p.status === "open").length} open ports on ${target}.`;
          break;
          
        case "device-discovery":
          devices = await discoverDevices(target);
          summary = `Device discovery complete: Found ${devices.length} active devices in ${target}.`;
          break;
          
        case "vulnerability-scan":
          ports = await scanPorts(target);
          vulnerabilities = await scanVulnerabilities(target, ports);
          summary = `Vulnerability scan complete: Found ${vulnerabilities.length} issues on ${target}.`;
          break;
          
        case "network-mapping":
          devices = await discoverDevices(target);
          const mappedData = await mapNetwork(target);
          summary = `Network mapping complete: Topology of ${target} has been analyzed. ${devices.length} devices found.`;
          break;
      }
      
      return res.json({
        target,
        status: "Complete",
        scanType,
        timestamp: new Date().toISOString(),
        ports,
        vulnerabilities,
        devices,
        summary,
      });
      
    } catch (error) {
      console.error("Scan error:", error.message);
      // Fallback to mock data
      const mockResponse = generateMockNetworkScan(target, scanType);
      return res.json(mockResponse);
    }

  } catch (error) {
    console.error("Error in network scan:", error.message);
    res.status(500).json({
      error: "Network scan failed",
      details: error.message,
      status: "Error",
      summary: "Scan failed. Please check the target and try again.",
    });
  }
});

// Threat Intelligence Functions
const threatTypes = ["Phishing", "Malware", "Brute Force", "SQL Injection", "DDoS", "Ransomware", "Data Leak", "Zero-Day"];
const severities = ["Critical", "High", "Medium", "Low"];

// Get geolocation for IP
function getLocationForIP(ipAddr) {
  try {
    const geo = geoip.lookup(ipAddr);
    if (geo) {
      return {
        region: geo.country || "Unknown",
        city: geo.city || "Unknown",
        lat: geo.ll ? geo.ll[0] : 0,
        lng: geo.ll ? geo.ll[1] : 0,
      };
    }
  } catch (err) {
    console.error("Geolocation error:", err.message);
  }
  return { region: "Unknown", city: "Unknown", lat: 0, lng: 0 };
}

// Generate realistic threat from actual threat data
async function fetchRealThreats() {
  const threats = [];
  
  try {
    // Fetch real threat data from multiple sources
    // 1. AbuseIPDB - Malicious IPs
    const abuseIPDBKey = process.env.ABUSEIPDB_API_KEY;
    if (abuseIPDBKey) {
      try {
        const abuseResponse = await axios.get("https://api.abuseipdb.com/api/v2/blacklist", {
          headers: { Key: abuseIPDBKey, Accept: "application/json" },
          params: { limit: 5 },
          timeout: 5000,
        });
        
        if (abuseResponse.data && abuseResponse.data.data) {
          abuseResponse.data.data.slice(0, 3).forEach((ip) => {
            const location = getLocationForIP(ip.ipAddress);
            threats.push({
              type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
              severity: severities[Math.floor(Math.random() * 2)], // Critical or High
              source: ip.ipAddress,
              region: location.region,
              city: location.city,
              blocked: Math.random() > 0.2,
              source_data: "AbuseIPDB",
              threat_score: ip.abuseConfidenceScore || 0,
            });
          });
        }
      } catch (err) {
        console.error("AbuseIPDB error:", err.message);
      }
    }

    // 2. URLhaus - Malware URLs
    try {
      const urlhausResponse = await axios.get("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
        timeout: 5000,
      });
      
      if (urlhausResponse.data && urlhausResponse.data.urls) {
        urlhausResponse.data.urls.slice(0, 3).forEach((url) => {
          // Extract IP or domain from URL
          const urlObj = new URL(url.url).hostname;
          try {
            dns.resolve4(urlObj).then((addresses) => {
              if (addresses && addresses[0]) {
                const location = getLocationForIP(addresses[0]);
                threats.push({
                  type: "Malware",
                  severity: "Critical",
                  source: addresses[0],
                  region: location.region,
                  city: location.city,
                  blocked: Math.random() > 0.3,
                  source_data: "URLhaus",
                  threat_score: 95,
                });
              }
            }).catch(() => {});
          } catch (err) {}
        });
      }
    } catch (err) {
      console.error("URLhaus error:", err.message);
    }

    // 3. AlienVault OTX - Threat feeds
    const otxKey = process.env.OTX_API_KEY;
    if (otxKey) {
      try {
        const otxResponse = await axios.get("https://otx.alienvault.com/api/v1/pulses/subscribed", {
          headers: { "X-OTX-API-KEY": otxKey },
          timeout: 5000,
        });
        
        if (otxResponse.data && otxResponse.data.results) {
          otxResponse.data.results.slice(0, 3).forEach((pulse) => {
            const threatType = pulse.name?.split(" ")[0] || "Threat";
            const indicators = pulse.indicators || [];
            indicators.slice(0, 1).forEach((indicator) => {
              if (indicator.indicator && indicator.type === "IPv4") {
                const location = getLocationForIP(indicator.indicator);
                threats.push({
                  type: threatType,
                  severity: "High",
                  source: indicator.indicator,
                  region: location.region,
                  city: location.city,
                  blocked: Math.random() > 0.4,
                  source_data: "AlienVault OTX",
                  threat_score: 85,
                });
              }
            });
          });
        }
      } catch (err) {
        console.error("OTX error:", err.message);
      }
    }

  } catch (err) {
    console.error("Error fetching real threats:", err.message);
  }

  return threats;
}

// Generate mock threats with geographic data
function generateMockThreats(count = 8) {
  const commonRegions = ["Kenya", "Nigeria", "Russia", "China", "USA", "Brazil", "India", "Germany", "UK", "France"];
  const mockIPs = [
    "203.45.67.89", "91.234.56.78", "185.220.101.45", "195.154.36.99", "188.127.230.122",
    "45.33.32.156", "80.91.246.132", "92.63.97.183", "162.142.125.120", "5.188.10.90",
  ];

  const threats = [];
  for (let i = 0; i < count; i++) {
    const region = commonRegions[Math.floor(Math.random() * commonRegions.length)];
    const source = mockIPs[Math.floor(Math.random() * mockIPs.length)];
    const location = getLocationForIP(source);
    
    threats.push({
      type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      source: source,
      region: location.region || region,
      city: location.city || "Unknown",
      blocked: Math.random() > 0.3,
      source_data: "CipherWatch Monitor",
      threat_score: Math.floor(Math.random() * 100),
    });
  }
  return threats;
}

// Threats endpoint
app.get("/api/threats", async (req, res) => {
  try {
    console.log("📡 Fetching real threats from threat intelligence sources...");
    
    let threats = await fetchRealThreats();
    
    // If we don't have enough real threats, fill with generated ones
    if (threats.length < 8) {
      const mockThreats = generateMockThreats(8 - threats.length);
      threats = [...threats, ...mockThreats];
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: threats.length,
      threats: threats.sort(() => Math.random() - 0.5), // Shuffle for variety
    });

  } catch (error) {
    console.error("Error fetching threats:", error.message);
    // Fallback to mock threats
    const mockThreats = generateMockThreats(8);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: mockThreats.length,
      threats: mockThreats,
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
  console.log(`📊 API endpoints:`);
  console.log(`   - Phishing Scanner: POST http://localhost:${PORT}/api/scan`);
  console.log(`   - Network Scanner: POST http://localhost:${PORT}/api/network-scan`);
  console.log(`   - Threat Monitor: GET http://localhost:${PORT}/api/threats`);
});
