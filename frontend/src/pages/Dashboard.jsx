import ThreatMonitor from "./ThreatMonitor";
import PhishingScanner from "./PhishingScanner";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const threatData = [
  { time: "Mon", threats: 4 },
  { time: "Tue", threats: 7 },
  { time: "Wed", threats: 3 },
  { time: "Thu", threats: 9 },
  { time: "Fri", threats: 5 },
  { time: "Sat", threats: 12 },
  { time: "Sun", threats: 6 },
];

const alerts = [
  { id: 1, type: "Phishing", source: "email@suspicious.com", severity: "High", time: "2 mins ago" },
  { id: 2, type: "Malware Link", source: "http://mal-site.xyz", severity: "Critical", time: "15 mins ago" },
  { id: 3, type: "Brute Force", source: "192.168.1.104", severity: "Medium", time: "1 hr ago" },
  { id: 4, type: "Data Leak", source: "darkweb-forum.onion", severity: "High", time: "3 hrs ago" },
];

const severityColor = {
  Critical: "text-red-400",
  High: "text-orange-400",
  Medium: "text-yellow-400",
};

const Dashboard = () => {
  const [active, setActive] = useState("Dashboard");

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col overflow-auto">
        <TopBar page={active} />
        <main className="flex-1 overflow-auto">
  {active === "Dashboard" && (
    <div className="p-8 flex flex-col gap-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Threats Detected" value="128" icon="🚨" color="border-red-500" />
        <StatCard title="Phishing Blocked" value="43" icon="🎣" color="border-orange-500" />
        <StatCard title="Scans Today" value="17" icon="🔍" color="border-cyan-500" />
        <StatCard title="Systems Safe" value="99%" icon="✅" color="border-green-500" />
      </div>
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-slate-300 mb-4 font-semibold">📈 Threat Activity This Week</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={threatData}>
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
            <Line type="monotone" dataKey="threats" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-slate-300 mb-4 font-semibold">🚨 Recent Alerts</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Source</th>
              <th className="text-left py-2">Severity</th>
              <th className="text-left py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                <td className="py-3">{a.type}</td>
                <td className="py-3 text-slate-400">{a.source}</td>
                <td className={`py-3 font-semibold ${severityColor[a.severity]}`}>{a.severity}</td>
                <td className="py-3 text-slate-500">{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
  {active === "Phishing Scanner" && <PhishingScanner />}
  {active === "Threat Monitor" && <ThreatMonitor />}
</main>
      </div>
    </div>
  );
};

export default Dashboard;