import { useState } from "react";

const riskColor = {
  Safe: "text-green-400 border-green-400",
  Suspicious: "text-yellow-400 border-yellow-400",
  Dangerous: "text-red-400 border-red-400",
};

const riskBg = {
  Safe: "bg-green-900/20",
  Suspicious: "bg-yellow-900/20",
  Dangerous: "bg-red-900/20",
};

const riskIcon = {
  Safe: "✅",
  Suspicious: "⚠️",
  Dangerous: "🚨",
};

const PhishingScanner = () => {
  const [input, setInput] = useState("");
  const [scanType, setScanType] = useState("url");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
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
}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content.map((i) => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setHistory((prev) => [
        { input: input.substring(0, 40) + "...", verdict: parsed.verdict, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setResult({ verdict: "Error", summary: "Analysis failed. Please try again.", red_flags: [], recommendation: "Check your connection.", risk_score: 0 });
    }

    setLoading(false);
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h2 className="text-white text-2xl font-bold">🔍 Phishing Scanner</h2>
        <p className="text-slate-400 mt-1">Paste a URL or email content to scan for threats</p>
      </div>

      {/* Scan Type Toggle */}
      <div className="flex gap-3">
        {["url", "email"].map((type) => (
          <button
            key={type}
            onClick={() => { setScanType(type); setInput(""); setResult(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              scanType === type ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {type === "url" ? "🌐 URL Scanner" : "📧 Email Scanner"}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
        {scanType === "url" ? (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a URL here e.g. http://suspicious-site.xyz/login"
            className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 outline-none border border-slate-600 focus:border-cyan-500 transition"
          />
        ) : (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the full email content here..."
            rows={6}
            className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 outline-none border border-slate-600 focus:border-cyan-500 transition resize-none"
          />
        )}

        <button
          onClick={analyze}
          disabled={loading || !input.trim()}
          className="self-start px-8 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
        >
          {loading ? "⏳ Analyzing..." : "🔍 Scan Now"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-6 border ${riskColor[result.verdict]} ${riskBg[result.verdict]}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{riskIcon[result.verdict]}</span>
            <div>
              <p className={`text-2xl font-bold ${riskColor[result.verdict]}`}>{result.verdict}</p>
              <p className="text-slate-400 text-sm">Risk Score: {result.risk_score}/100</p>
            </div>
          </div>

          <p className="text-white mb-4">{result.summary}</p>

          {result.red_flags?.length > 0 && (
            <div className="mb-4">
              <p className="text-slate-400 text-sm font-semibold mb-2">🚩 Red Flags:</p>
              <ul className="flex flex-col gap-1">
                {result.red_flags.map((flag, i) => (
                  <li key={i} className="text-slate-300 text-sm">• {flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm font-semibold">💡 Recommendation:</p>
            <p className="text-white text-sm mt-1">{result.recommendation}</p>
          </div>
        </div>
      )}

      {/* Scan History */}
      {history.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-slate-300 font-semibold mb-4">📋 Recent Scans</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2">Input</th>
                <th className="text-left py-2">Verdict</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-slate-700">
                  <td className="py-2 text-slate-400">{h.input}</td>
                  <td className={`py-2 font-semibold ${riskColor[h.verdict]}`}>{h.verdict}</td>
                  <td className="py-2 text-slate-500">{h.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PhishingScanner;