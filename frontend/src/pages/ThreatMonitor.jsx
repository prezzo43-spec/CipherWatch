import { useState, useEffect } from "react";

const severityConfig = {
  Critical: { color: "text-red-400", bg: "bg-red-900/20", border: "border-red-500", dot: "bg-red-400" },
  High:     { color: "text-orange-400", bg: "bg-orange-900/20", border: "border-orange-500", dot: "bg-orange-400" },
  Medium:   { color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-500", dot: "bg-yellow-400" },
  Low:      { color: "text-green-400", bg: "bg-green-900/20", border: "border-green-500", dot: "bg-green-400" },
};

const threatTypes = ["Phishing", "Malware", "Brute Force", "SQL Injection", "DDoS", "Ransomware", "Data Leak", "Zero-Day"];
const severities = ["Critical", "High", "Medium", "Low"];
const regions = ["Kenya", "Nigeria", "Russia", "China", "USA", "Brazil", "India", "Germany"];
const sources = ["192.168.1.", "10.0.0.", "172.16.0.", "203.45.67.", "91.234.56.", "185.220."];

const generateThreat = (id) => ({
  id,
  type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
  severity: severities[Math.floor(Math.random() * severities.length)],
  source: sources[Math.floor(Math.random() * sources.length)] + Math.floor(Math.random() * 255),
  region: regions[Math.floor(Math.random() * regions.length)],
  city: "Unknown",
  time: new Date().toLocaleTimeString(),
  blocked: Math.random() > 0.3,
  source_data: "Mock Data",
  threat_score: Math.floor(Math.random() * 100),
});

const stats = [
  { label: "Active Threats", value: "24", icon: "🔴", color: "border-red-500" },
  { label: "Blocked Today", value: "183", icon: "🛡️", color: "border-green-500" },
  { label: "Under Watch", value: "7", icon: "👁️", color: "border-yellow-500" },
  { label: "Safe Systems", value: "94%", icon: "✅", color: "border-cyan-500" },
];

export default function ThreatMonitor() {
  const [threats, setThreats] = useState([]);
  const [filter, setFilter] = useState("All");
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch real threats from backend
  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/threats");
        if (response.ok) {
          const data = await response.json();
          if (data.threats && Array.isArray(data.threats)) {
            // Convert API data to frontend format with time
            const formattedThreats = data.threats.map((threat, idx) => ({
              id: threat.id || `threat-${idx}-${Date.now()}`,
              type: threat.type || "Threat",
              severity: threat.severity || "Medium",
              source: threat.source || "Unknown",
              region: threat.region || "Unknown",
              city: threat.city || "Unknown",
              blocked: threat.blocked !== undefined ? threat.blocked : Math.random() > 0.3,
              time: new Date().toLocaleTimeString(),
              source_data: threat.source_data || "CipherWatch",
              threat_score: threat.threat_score || 0,
            }));
            setThreats(formattedThreats);
            const criticalCount = formattedThreats.filter(t => t.severity === "Critical").length;
            setAlertCount(criticalCount);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error fetching threats:", err);
        // Fallback to mock data
        const mockThreats = Array.from({ length: 8 }, (_, i) => generateThreat(i));
        setThreats(mockThreats);
        setLoading(false);
      }
    };

    fetchThreats();
  }, []);

  // Auto-refresh threats every 10 seconds
  useEffect(() => {
    if (paused) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:5000/api/threats");
        if (response.ok) {
          const data = await response.json();
          if (data.threats && Array.isArray(data.threats)) {
            const formattedThreats = data.threats.map((threat, idx) => ({
              id: threat.id || `threat-${idx}-${Date.now()}`,
              type: threat.type || "Threat",
              severity: threat.severity || "Medium",
              source: threat.source || "Unknown",
              region: threat.region || "Unknown",
              city: threat.city || "Unknown",
              blocked: threat.blocked !== undefined ? threat.blocked : Math.random() > 0.3,
              time: new Date().toLocaleTimeString(),
              source_data: threat.source_data || "CipherWatch",
              threat_score: threat.threat_score || 0,
            }));
            setThreats(formattedThreats);
            const criticalCount = formattedThreats.filter(t => t.severity === "Critical").length;
            if (criticalCount > alertCount) {
              setAlertCount(criticalCount);
            }
          }
        }
      } catch (err) {
        console.error("Error refreshing threats:", err);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [paused, alertCount]);

  const filtered = filter === "All" ? threats : threats.filter((t) => t.severity === filter);

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-bold">🚨 Threat Monitor</h2>
          <p className="text-slate-400 mt-1">Live feed of detected threats across the world</p>
        </div>
        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
              🔔 {alertCount} Critical Alert{alertCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => setPaused((p) => !p)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              paused ? "bg-green-600 hover:bg-green-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            {paused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <button
            onClick={() => setAlertCount(0)}
            className="px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
          >
            Clear Alerts
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-slate-800 rounded-xl p-4 border-l-4 ${s.color}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-xs">{s.label}</p>
                <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["All", "Critical", "High", "Medium", "Low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-slate-500 text-sm self-center">
          {paused ? "⏸ Paused" : "🔴 Live"} — {filtered.length} threats
        </span>
      </div>

      {/* Threat Feed */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-700 flex justify-between text-slate-400 text-xs uppercase tracking-wider">
          <span className="w-1/4">Type</span>
          <span className="w-1/4">Source IP</span>
          <span className="w-1/6">Region</span>
          <span className="w-1/6">Severity</span>
          <span className="w-1/6">Status</span>
          <span className="w-1/6">Time</span>
        </div>

        <div className="flex flex-col">
          {filtered.map((threat) => {
            const cfg = severityConfig[threat.severity];
            return (
              <div
                key={threat.id}
                onClick={() => setSelected(selected?.id === threat.id ? null : threat)}
                className="px-6 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer transition flex items-center"
              >
                <span className="w-1/4 text-white text-sm">{threat.type}</span>
                <span className="w-1/4 text-slate-400 text-sm font-mono">{threat.source}</span>
                <span className="w-1/6 text-slate-400 text-sm">{threat.region}</span>
                <span className={`w-1/6 text-sm font-semibold flex items-center gap-2 ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} ${threat.severity === "Critical" ? "animate-pulse" : ""}`}></span>
                  {threat.severity}
                </span>
                <span className={`w-1/6 text-xs font-semibold ${threat.blocked ? "text-green-400" : "text-red-400"}`}>
                  {threat.blocked ? "✅ Blocked" : "⚠️ Active"}
                </span>
                <span className="w-1/6 text-slate-500 text-xs">{threat.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className={`rounded-xl p-6 border ${severityConfig[selected.severity].border} ${severityConfig[selected.severity].bg}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white font-bold text-lg">🔍 Threat Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Threat Type", selected.type],
              ["Source IP", selected.source],
              ["Region", selected.region],
              ["City", selected.city],
              ["Severity", selected.severity],
              ["Status", selected.blocked ? "Blocked" : "Active"],
              ["Threat Score", `${selected.threat_score || 0}/100`],
              ["Source", selected.source_data],
              ["Detected At", selected.time],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-white font-semibold mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}