import { useState } from "react";

const severityColor = {
  Critical: "text-red-400 border-red-400",
  High: "text-orange-400 border-orange-400",
  Medium: "text-yellow-400 border-yellow-400",
  Low: "text-green-400 border-green-400",
};

const severityBg = {
  Critical: "bg-red-900/20",
  High: "bg-orange-900/20",
  Medium: "bg-yellow-900/20",
  Low: "bg-green-900/20",
};

const severityIcon = {
  Critical: "🚨",
  High: "⚠️",
  Medium: "⚡",
  Low: "ℹ️",
};

const NetworkScanner = () => {
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("port-scan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const scan = async () => {
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:5000/api/network-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, scanType }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Backend error:", errText);
        throw new Error("Backend returned error");
      }

      const parsed = await response.json();
      setResult(parsed);
      setHistory((prev) => [
        {
          target: target.substring(0, 30) + "...",
          scanType,
          vulnerabilities: parsed.vulnerabilities?.length || 0,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      console.error("Scan error:", err);
      setResult({
        status: "Error",
        message: err.message,
        vulnerabilities: [],
        devices: [],
        ports: [],
      });
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading && target.trim()) {
      scan();
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h2 className="text-white text-2xl font-bold">🌐 Network Scanner</h2>
        <p className="text-slate-400 mt-1">Scan networks for vulnerabilities, open ports, and connected devices</p>
      </div>

      {/* Scan Type Toggle */}
      <div className="flex gap-3 flex-wrap">
        {[
          { id: "port-scan", label: "🔌 Port Scan", icon: "🔌" },
          { id: "device-discovery", label: "🖥️ Device Discovery", icon: "🖥️" },
          { id: "vulnerability-scan", label: "🛡️ Vulnerability Scan", icon: "🛡️" },
          { id: "network-mapping", label: "🗺️ Network Mapping", icon: "🗺️" },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setScanType(type.id);
              setTarget("");
              setResult(null);
            }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              scanType === type.id ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            scanType === "port-scan"
              ? "Enter IP address e.g. 192.168.1.1"
              : scanType === "device-discovery"
              ? "Enter network range e.g. 192.168.1.0/24"
              : scanType === "vulnerability-scan"
              ? "Enter domain e.g. example.com"
              : "Enter IP or domain to map e.g. 192.168.1.0"
          }
          className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 outline-none border border-slate-600 focus:border-cyan-500 transition"
        />

        <button
          onClick={scan}
          disabled={loading || !target.trim()}
          className="self-start px-8 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
        >
          {loading ? "⏳ Scanning..." : "🔍 Start Scan"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-6 border ${result.status === "Error" ? "border-red-400 bg-red-900/20" : "border-cyan-400 bg-cyan-900/20"}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">{result.status === "Error" ? "❌" : "✅"}</span>
            <div>
              <p className="text-2xl font-bold text-cyan-400">{result.target}</p>
              <p className="text-slate-400 text-sm">Scan Type: {scanType.replace(/-/g, " ")}</p>
            </div>
          </div>

          {/* Vulnerabilities */}
          {result.vulnerabilities && result.vulnerabilities.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-300 text-sm font-semibold mb-3">🚨 Vulnerabilities Found:</p>
              <div className="flex flex-col gap-3">
                {result.vulnerabilities.map((vuln, i) => (
                  <div key={i} className={`rounded-lg p-4 border-l-4 ${severityColor[vuln.severity]} ${severityBg[vuln.severity]}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{severityIcon[vuln.severity]}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{vuln.name}</p>
                        <p className="text-slate-400 text-sm mt-1">{vuln.description}</p>
                        {vuln.remediation && (
                          <p className="text-slate-300 text-sm mt-2">
                            <span className="font-semibold">💡 Fix:</span> {vuln.remediation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ports */}
          {result.ports && result.ports.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-300 text-sm font-semibold mb-3">🔌 Open Ports:</p>
              <div className="bg-slate-900/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700 bg-slate-800">
                      <th className="text-left py-3 px-4">Port</th>
                      <th className="text-left py-3 px-4">Service</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ports.map((port, i) => (
                      <tr key={i} className="border-b border-slate-700 hover:bg-slate-800 transition">
                        <td className="py-3 px-4 text-white font-mono">{port.port}</td>
                        <td className="py-3 px-4 text-slate-300">{port.service}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${port.status === "open" ? "bg-green-900 text-green-400" : "bg-slate-700 text-slate-300"}`}>
                            {port.status}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-semibold ${port.risk === "High" ? "text-red-400" : port.risk === "Medium" ? "text-yellow-400" : "text-green-400"}`}>
                          {port.risk}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Devices */}
          {result.devices && result.devices.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-300 text-sm font-semibold mb-3">🖥️ Devices Found:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.devices.map((device, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-cyan-400 font-mono font-semibold">{device.ip}</p>
                    <p className="text-slate-400 text-sm mt-1">Hostname: {device.hostname}</p>
                    <p className="text-slate-400 text-sm">MAC: {device.mac}</p>
                    <p className="text-slate-400 text-sm">Open Ports: {device.open_ports}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.summary && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm font-semibold">📊 Summary:</p>
              <p className="text-white text-sm mt-2">{result.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      {history.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-slate-300 font-semibold mb-4">📋 Scan History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2">Target</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Vulnerabilities</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-slate-700 hover:bg-slate-700 transition">
                  <td className="py-2 text-slate-400 font-mono">{h.target}</td>
                  <td className="py-2 text-slate-300 capitalize">{h.scanType.replace(/-/g, " ")}</td>
                  <td className={`py-2 font-semibold ${h.vulnerabilities > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {h.vulnerabilities > 0 ? `${h.vulnerabilities} found` : "None"}
                  </td>
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

export default NetworkScanner;
