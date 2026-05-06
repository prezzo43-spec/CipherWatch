import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("overview");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("7d");

  // Mock data for demonstration
  const overviewData = {
    summary: {
      totalThreats: 247,
      blockedThreats: 189,
      activeScans: 23,
      vulnerabilities: 45,
      systemsProtected: 12,
      uptime: "99.8%"
    },
    threatTrends: [
      { date: "2026-05-01", threats: 12, blocked: 9 },
      { date: "2026-05-02", threats: 18, blocked: 14 },
      { date: "2026-05-03", threats: 8, blocked: 7 },
      { date: "2026-05-04", threats: 22, blocked: 18 },
      { date: "2026-05-05", threats: 15, blocked: 12 },
      { date: "2026-05-06", threats: 19, blocked: 16 },
    ],
    threatTypes: [
      { name: "Phishing", value: 35, color: "#ef4444" },
      { name: "Malware", value: 28, color: "#f97316" },
      { name: "Brute Force", value: 22, color: "#eab308" },
      { name: "SQL Injection", value: 15, color: "#22c55e" },
    ],
    topRegions: [
      { region: "Russia", threats: 45, percentage: 18.2 },
      { region: "China", threats: 38, percentage: 15.4 },
      { region: "USA", threats: 32, percentage: 12.9 },
      { region: "Brazil", threats: 28, percentage: 11.3 },
      { region: "India", threats: 25, percentage: 10.1 },
    ],
    recentScans: [
      { id: 1, type: "Network Scan", target: "192.168.1.0/24", vulnerabilities: 3, time: "2 hours ago" },
      { id: 2, type: "Vulnerability Scan", target: "example.com", vulnerabilities: 7, time: "4 hours ago" },
      { id: 3, type: "Port Scan", target: "10.0.0.1", vulnerabilities: 1, time: "6 hours ago" },
    ]
  };

  const generateReport = useCallback(async (type) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${type}?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        // Fallback to mock data
        setReportData(overviewData);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData(overviewData);
    }
    setLoading(false);
  }, [dateRange]);

  const exportReport = async (format) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeReport,
          format,
          dateRange,
          data: reportData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cipherwatch-report-${activeReport}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  useEffect(() => {
    generateReport(activeReport);
  }, [activeReport, generateReport]);

  const data = reportData || overviewData;

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-bold">📊 Security Reports</h2>
          <p className="text-slate-400 mt-1">Comprehensive security analytics and reporting</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={() => exportReport("pdf")}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
          >
            📄 PDF
          </button>
          <button
            onClick={() => exportReport("csv")}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
          >
            📊 CSV
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "overview", label: "📈 Overview", icon: "📈" },
          { id: "threats", label: "🚨 Threats", icon: "🚨" },
          { id: "scans", label: "🔍 Scans", icon: "🔍" },
          { id: "vulnerabilities", label: "🛡️ Vulnerabilities", icon: "🛡️" },
          { id: "compliance", label: "📋 Compliance", icon: "📋" },
        ].map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeReport === report.id ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {report.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-cyan-400 text-lg">Generating report...</div>
        </div>
      ) : (
        <>
          {/* Overview Report */}
          {activeReport === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Cards */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">📊 Security Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(data.summary).map(([key, value]) => (
                    <div key={key} className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-white text-lg font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat Trends Chart */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">📈 Threat Trends</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.threatTrends}>
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
                    <Line type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} name="Total Threats" />
                    <Line type="monotone" dataKey="blocked" stroke="#22c55e" strokeWidth={2} name="Blocked" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Threat Types Pie Chart */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">🎯 Threat Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.threatTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.threatTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Regions */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">🌍 Top Threat Regions</h3>
                <div className="space-y-3">
                  {data.topRegions.map((region, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-slate-300">{region.region}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${region.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-400 text-sm">{region.threats}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Scans */}
              <div className="bg-slate-800 rounded-xl p-6 lg:col-span-2">
                <h3 className="text-slate-300 font-semibold mb-4">🔍 Recent Security Scans</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Target</th>
                        <th className="text-left py-2">Vulnerabilities</th>
                        <th className="text-left py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentScans.map((scan) => (
                        <tr key={scan.id} className="border-b border-slate-700">
                          <td className="py-3 text-white">{scan.type}</td>
                          <td className="py-3 text-slate-400 font-mono">{scan.target}</td>
                          <td className={`py-3 font-semibold ${scan.vulnerabilities > 0 ? "text-red-400" : "text-green-400"}`}>
                            {scan.vulnerabilities > 0 ? `${scan.vulnerabilities} found` : "None"}
                          </td>
                          <td className="py-3 text-slate-500">{scan.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Threats Report */}
          {activeReport === "threats" && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">🚨 Threat Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-2xl font-bold">89</p>
                    <p className="text-slate-300 text-sm">Critical Threats</p>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
                    <p className="text-orange-400 text-2xl font-bold">156</p>
                    <p className="text-slate-300 text-sm">High Severity</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-400 text-2xl font-bold">234</p>
                    <p className="text-slate-300 text-sm">Total Blocked</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.threatTrends}>
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
                    <Bar dataKey="threats" fill="#ef4444" name="Threats Detected" />
                    <Bar dataKey="blocked" fill="#22c55e" name="Threats Blocked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Scans Report */}
          {activeReport === "scans" && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">🔍 Scan Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-cyan-900/20 border border-cyan-500 rounded-lg p-4">
                    <p className="text-cyan-400 text-2xl font-bold">23</p>
                    <p className="text-slate-300 text-sm">Active Scans</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 text-2xl font-bold">156</p>
                    <p className="text-slate-300 text-sm">Completed</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-400 text-2xl font-bold">8</p>
                    <p className="text-slate-300 text-sm">Pending</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-2xl font-bold">3</p>
                    <p className="text-slate-300 text-sm">Failed</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="text-left py-2">Scan Type</th>
                        <th className="text-left py-2">Target</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Vulnerabilities</th>
                        <th className="text-left py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentScans.map((scan) => (
                        <tr key={scan.id} className="border-b border-slate-700">
                          <td className="py-3 text-white">{scan.type}</td>
                          <td className="py-3 text-slate-400 font-mono">{scan.target}</td>
                          <td className="py-3">
                            <span className="px-2 py-1 bg-green-900 text-green-400 rounded text-xs">Completed</span>
                          </td>
                          <td className={`py-3 font-semibold ${scan.vulnerabilities > 0 ? "text-red-400" : "text-green-400"}`}>
                            {scan.vulnerabilities}
                          </td>
                          <td className="py-3 text-slate-500">2m 34s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Vulnerabilities Report */}
          {activeReport === "vulnerabilities" && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">🛡️ Vulnerability Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-2xl font-bold">12</p>
                    <p className="text-slate-300 text-sm">Critical</p>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
                    <p className="text-orange-400 text-2xl font-bold">23</p>
                    <p className="text-slate-300 text-sm">High</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-400 text-2xl font-bold">45</p>
                    <p className="text-slate-300 text-sm">Total</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Exposed MySQL Database", severity: "Critical", count: 3, remediation: "Restrict database access to trusted IPs only" },
                    { name: "Weak SSH Configuration", severity: "High", count: 5, remediation: "Disable password authentication, use key-based auth" },
                    { name: "Missing Security Headers", severity: "Medium", count: 8, remediation: "Add HSTS, CSP, and X-Frame-Options headers" },
                    { name: "Outdated SSL Certificates", severity: "High", count: 4, remediation: "Update to TLS 1.3 and renew certificates" },
                  ].map((vuln, idx) => (
                    <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold">{vuln.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          vuln.severity === "Critical" ? "bg-red-900 text-red-400" :
                          vuln.severity === "High" ? "bg-orange-900 text-orange-400" :
                          "bg-yellow-900 text-yellow-400"
                        }`}>
                          {vuln.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">Found on {vuln.count} systems</p>
                      <p className="text-slate-300 text-sm"><strong>Remediation:</strong> {vuln.remediation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Report */}
          {activeReport === "compliance" && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-slate-300 font-semibold mb-4">📋 Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 text-2xl font-bold">87%</p>
                    <p className="text-slate-300 text-sm">PCI DSS</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-400 text-2xl font-bold">72%</p>
                    <p className="text-slate-300 text-sm">GDPR</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 text-2xl font-bold">91%</p>
                    <p className="text-slate-300 text-sm">HIPAA</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-2xl font-bold">65%</p>
                    <p className="text-slate-300 text-sm">SOX</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { standard: "PCI DSS", status: "Good", issues: 3, description: "Payment card data handling compliance" },
                    { standard: "GDPR", status: "Needs Attention", issues: 8, description: "EU data protection regulations" },
                    { standard: "HIPAA", status: "Excellent", issues: 1, description: "Healthcare data privacy" },
                    { standard: "SOX", status: "Critical", issues: 12, description: "Financial reporting controls" },
                  ].map((comp, idx) => (
                    <div key={idx} className={`rounded-lg p-4 border-l-4 ${
                      comp.status === "Excellent" ? "border-green-500 bg-green-900/20" :
                      comp.status === "Good" ? "border-green-500 bg-green-900/20" :
                      comp.status === "Needs Attention" ? "border-yellow-500 bg-yellow-900/20" :
                      "border-red-500 bg-red-900/20"
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold">{comp.standard}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          comp.status === "Excellent" ? "bg-green-900 text-green-400" :
                          comp.status === "Good" ? "bg-green-900 text-green-400" :
                          comp.status === "Needs Attention" ? "bg-yellow-900 text-yellow-400" :
                          "bg-red-900 text-red-400"
                        }`}>
                          {comp.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">{comp.description}</p>
                      <p className="text-slate-300 text-sm">
                        <strong>Issues:</strong> {comp.issues} outstanding items requiring attention
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;