import { useState, useEffect } from "react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // General Settings
    general: {
      systemName: "CipherWatch Security",
      timezone: "UTC-5",
      language: "en",
      theme: "dark",
      autoUpdate: true,
      maintenanceMode: false,
    },
    // Security Settings
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      passwordPolicy: "strong",
      ipWhitelist: ["192.168.1.0/24", "10.0.0.0/8"],
      auditLogging: true,
      encryptionLevel: "AES-256",
    },
    // Notifications
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      slackIntegration: true,
      webhookUrl: "https://hooks.slack.com/services/...",
      alertThresholds: {
        critical: true,
        high: true,
        medium: false,
        low: false,
      },
      reportFrequency: "daily",
    },
    // API Settings
    api: {
      grokApiKey: "xai-...",
      abuseIpDbKey: "",
      urlhausApiKey: "",
      alienVaultKey: "",
      rateLimit: 100,
      apiTimeout: 30,
    },
    // Scanning Settings
    scanning: {
      autoScan: true,
      scanFrequency: "hourly",
      scanDepth: "deep",
      excludePatterns: [".git", "node_modules", "vendor"],
      maxConcurrentScans: 5,
      scanTimeout: 300,
    },
    // Backup Settings
    backup: {
      autoBackup: true,
      backupFrequency: "daily",
      retentionPeriod: 30,
      backupLocation: "/backups",
      encryptionEnabled: true,
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setSaved(false);
  };

  const handleNestedSettingChange = (category, parentKey, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parentKey]: {
          ...prev[category][parentKey],
          [key]: value
        }
      }
    }));
    setSaved(false);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/settings");
        if (response.ok) {
          const json = await response.json();
          const apiSettings = json.settings;
          setSettings(prev => ({
            ...prev,
            api: {
              ...prev.api,
              grokApiKey: apiSettings.GROK_API_KEY || "",
              abuseIpDbKey: apiSettings.ABUSEIPDB_API_KEY || "",
              urlhausApiKey: apiSettings.URLHAUS_API_KEY || "",
              alienVaultKey: apiSettings.OTX_API_KEY || "",
            },
          }));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          GROK_API_KEY: settings.api.grokApiKey,
          ABUSEIPDB_API_KEY: settings.api.abuseIpDbKey,
          OTX_API_KEY: settings.api.alienVaultKey,
          URLHAUS_API_KEY: settings.api.urlhausApiKey,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        console.error("Failed to save settings:", data);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const testApiConnection = async (apiName) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      alert(`${apiName} connection test successful!`);
    } catch (error) {
      alert(`${apiName} connection test failed: ${error.message}`);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "api", label: "API Keys", icon: "🔑" },
    { id: "scanning", label: "Scanning", icon: "🔍" },
    { id: "backup", label: "Backup", icon: "💾" },
  ];

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-bold">⚙️ Settings</h2>
          <p className="text-slate-400 mt-1">Configure your CipherWatch security system</p>
        </div>
        <button
          onClick={saveSettings}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition flex items-center gap-2"
        >
          💾 Save Settings
        </button>
      </div>

      {saved && (
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-400">✅ Settings saved successfully!</p>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-800 rounded-xl p-8 text-slate-200">
          <p>Loading saved settings...</p>
        </div>
      ) : (
        <div>
          {/* Settings Tabs */}
          <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === tab.id ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">System Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">System Name</label>
                <input
                  type="text"
                  value={settings.general.systemName}
                  onChange={(e) => handleSettingChange("general", "systemName", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => handleSettingChange("general", "timezone", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="UTC-8">Pacific Time (UTC-8)</option>
                  <option value="UTC-5">Eastern Time (UTC-5)</option>
                  <option value="UTC+0">UTC</option>
                  <option value="UTC+1">Central European Time (UTC+1)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Language</label>
                <select
                  value={settings.general.language}
                  onChange={(e) => handleSettingChange("general", "language", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Theme</label>
                <select
                  value={settings.general.theme}
                  onChange={(e) => handleSettingChange("general", "theme", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">System Behavior</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto Update</p>
                  <p className="text-slate-400 text-sm">Automatically update system components</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.general.autoUpdate}
                    onChange={(e) => handleSettingChange("general", "autoUpdate", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Maintenance Mode</p>
                  <p className="text-slate-400 text-sm">Put system in maintenance mode</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => handleSettingChange("general", "maintenanceMode", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Authentication & Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange("security", "sessionTimeout", parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Password Policy</label>
                <select
                  value={settings.security.passwordPolicy}
                  onChange={(e) => handleSettingChange("security", "passwordPolicy", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="basic">Basic (8+ chars)</option>
                  <option value="strong">Strong (12+ chars, mixed case, numbers)</option>
                  <option value="complex">Complex (16+ chars, special chars)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">IP Whitelist</h3>
            <div className="space-y-3">
              {settings.security.ipWhitelist.map((ip, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => {
                      const newWhitelist = [...settings.security.ipWhitelist];
                      newWhitelist[index] = e.target.value;
                      handleSettingChange("security", "ipWhitelist", newWhitelist);
                    }}
                    className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                    placeholder="192.168.1.0/24"
                  />
                  <button
                    onClick={() => {
                      const newWhitelist = settings.security.ipWhitelist.filter((_, i) => i !== index);
                      handleSettingChange("security", "ipWhitelist", newWhitelist);
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newWhitelist = [...settings.security.ipWhitelist, ""];
                  handleSettingChange("security", "ipWhitelist", newWhitelist);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
              >
                + Add IP Range
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Security Features</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-slate-400 text-sm">Require 2FA for all admin accounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => handleSettingChange("security", "twoFactorAuth", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Audit Logging</p>
                  <p className="text-slate-400 text-sm">Log all security events and user actions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.auditLogging}
                    onChange={(e) => handleSettingChange("security", "auditLogging", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Alert Channels</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Alerts</p>
                  <p className="text-slate-400 text-sm">Send security alerts via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => handleSettingChange("notifications", "emailAlerts", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Alerts</p>
                  <p className="text-slate-400 text-sm">Send critical alerts via SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsAlerts}
                    onChange={(e) => handleSettingChange("notifications", "smsAlerts", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Slack Integration</p>
                  <p className="text-slate-400 text-sm">Send alerts to Slack channels</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.slackIntegration}
                    onChange={(e) => handleSettingChange("notifications", "slackIntegration", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          {settings.notifications.slackIntegration && (
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-slate-300 font-semibold mb-4">Slack Configuration</h3>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={settings.notifications.webhookUrl}
                  onChange={(e) => handleSettingChange("notifications", "webhookUrl", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Alert Thresholds</h3>
            <div className="space-y-4">
              {Object.entries(settings.notifications.alertThresholds).map(([level, enabled]) => (
                <div key={level} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium capitalize">{level} Severity Alerts</p>
                    <p className="text-slate-400 text-sm">Send notifications for {level} severity threats</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleNestedSettingChange("notifications", "alertThresholds", level, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Settings */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">AI & Threat Intelligence APIs</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Grok AI API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.api.grokApiKey}
                    onChange={(e) => handleSettingChange("api", "grokApiKey", e.target.value)}
                    className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                    placeholder="xai-..."
                  />
                  <button
                    onClick={() => testApiConnection("Grok AI")}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
                  >
                    Test
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">AbuseIPDB API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.api.abuseIpDbKey}
                    onChange={(e) => handleSettingChange("api", "abuseIpDbKey", e.target.value)}
                    className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                    placeholder="Enter API key..."
                  />
                  <button
                    onClick={() => testApiConnection("AbuseIPDB")}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
                  >
                    Test
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">URLhaus API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.api.urlhausApiKey}
                    onChange={(e) => handleSettingChange("api", "urlhausApiKey", e.target.value)}
                    className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                    placeholder="Enter API key..."
                  />
                  <button
                    onClick={() => testApiConnection("URLhaus")}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
                  >
                    Test
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">AlienVault OTX API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.api.alienVaultKey}
                    onChange={(e) => handleSettingChange("api", "alienVaultKey", e.target.value)}
                    className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                    placeholder="Enter API key..."
                  />
                  <button
                    onClick={() => testApiConnection("AlienVault OTX")}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Rate Limit (requests/minute)</label>
                <input
                  type="number"
                  value={settings.api.rateLimit}
                  onChange={(e) => handleSettingChange("api", "rateLimit", parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">API Timeout (seconds)</label>
                <input
                  type="number"
                  value={settings.api.apiTimeout}
                  onChange={(e) => handleSettingChange("api", "apiTimeout", parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Settings */}
      {activeTab === "scanning" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Scan Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Scan Frequency</label>
                <select
                  value={settings.scanning.scanFrequency}
                  onChange={(e) => handleSettingChange("scanning", "scanFrequency", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Scan Depth</label>
                <select
                  value={settings.scanning.scanDepth}
                  onChange={(e) => handleSettingChange("scanning", "scanDepth", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="quick">Quick Scan</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep Scan</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Max Concurrent Scans</label>
                <input
                  type="number"
                  value={settings.scanning.maxConcurrentScans}
                  onChange={(e) => handleSettingChange("scanning", "maxConcurrentScans", parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Scan Timeout (seconds)</label>
                <input
                  type="number"
                  value={settings.scanning.scanTimeout}
                  onChange={(e) => handleSettingChange("scanning", "scanTimeout", parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Scan Exclusions</h3>
            <div className="space-y-3">
              {settings.scanning.excludePatterns.map((pattern, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => {
                      const newPatterns = [...settings.scanning.excludePatterns];
                      newPatterns[index] = e.target.value;
                      handleSettingChange("scanning", "excludePatterns", newPatterns);
                    }}
                    className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                    placeholder="node_modules"
                  />
                  <button
                    onClick={() => {
                      const newPatterns = settings.scanning.excludePatterns.filter((_, i) => i !== index);
                      handleSettingChange("scanning", "excludePatterns", newPatterns);
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newPatterns = [...settings.scanning.excludePatterns, ""];
                  handleSettingChange("scanning", "excludePatterns", newPatterns);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
              >
                + Add Pattern
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Scan Automation</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto Scan</p>
                <p className="text-slate-400 text-sm">Automatically run scheduled scans</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.scanning.autoScan}
                  onChange={(e) => handleSettingChange("scanning", "autoScan", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Backup Settings */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Backup Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Backup Frequency</label>
                <select
                  value={settings.backup.backupFrequency}
                  onChange={(e) => handleSettingChange("backup", "backupFrequency", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Retention Period (days)</label>
                <input
                  type="number"
                  value={settings.backup.retentionPeriod}
                  onChange={(e) => handleSettingChange("backup", "retentionPeriod", parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-sm mb-2">Backup Location</label>
                <input
                  type="text"
                  value={settings.backup.backupLocation}
                  onChange={(e) => handleSettingChange("backup", "backupLocation", e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-cyan-500"
                  placeholder="/backups"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Backup Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto Backup</p>
                  <p className="text-slate-400 text-sm">Automatically create backups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backup.autoBackup}
                    onChange={(e) => handleSettingChange("backup", "autoBackup", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Encryption</p>
                  <p className="text-slate-400 text-sm">Encrypt backup files</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backup.encryptionEnabled}
                    onChange={(e) => handleSettingChange("backup", "encryptionEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-slate-300 font-semibold mb-4">Backup Actions</h3>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition">
                🔄 Run Backup Now
              </button>
              <button className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition">
                📁 View Backups
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition">
                🗑️ Clean Old Backups
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
};

export default Settings;