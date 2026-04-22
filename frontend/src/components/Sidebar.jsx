const Sidebar = ({ active, setActive }) => {
  const links = [
    { name: "Dashboard", icon: "🛡️" },
    { name: "Phishing Scanner", icon: "🔍" },
    { name: "Threat Monitor", icon: "🚨" },
    { name: "Network Scan", icon: "🌐" },
    { name: "Reports", icon: "📊" },
    { name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen p-6 flex flex-col border-r border-slate-700">
      <h1 className="text-cyan-400 text-xl font-bold mb-10">🛡️ CipherWatch</h1>
      <nav className="flex flex-col gap-2">
        {links.map((l) => (
          <button
            key={l.name}
            onClick={() => setActive(l.name)}
            className={`text-left px-4 py-2 rounded-lg text-sm transition ${
              active === l.name
                ? "bg-cyan-500 text-white font-semibold"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            {l.icon} {l.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;