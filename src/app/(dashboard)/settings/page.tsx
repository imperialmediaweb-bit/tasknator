"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Key, Shield, Globe, Save } from "lucide-react";

const AI_PROVIDERS = [
  { value: "ANTHROPIC", label: "Anthropic Claude", description: "Claude 3.5 Sonnet" },
  { value: "OPENAI", label: "OpenAI", description: "GPT-4o" },
  { value: "GEMINI", label: "Google Gemini", description: "Gemini 1.5 Pro" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("providers");
  const [saving, setSaving] = useState(false);
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [savedProviders, setSavedProviders] = useState<string[]>([]);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const res = await fetch("/api/providers/current");
      if (res.ok) {
        const data = await res.json();
        setSavedProviders(data.map((p: any) => p.provider));
      }
    } catch {}
  }

  async function saveProviderKey(provider: string) {
    const apiKey = providerKeys[provider];
    if (!apiKey) return;
    setSaving(true);
    try {
      await fetch("/api/providers/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      setSavedProviders(prev => [...prev.filter(p => p !== provider), provider]);
      setProviderKeys(prev => ({ ...prev, [provider]: "" }));
    } catch {}
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your workspace configuration</p>
      </div>

      <div className="flex gap-2 border-b border-gray-100 pb-px">
        {[
          { id: "providers", label: "AI Providers", icon: Key },
          { id: "workspace", label: "Workspace", icon: Settings },
          { id: "security", label: "Security", icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "providers" && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              Configure your AI provider API keys. Keys are encrypted and stored securely. You can set up multiple providers for fallback.
            </p>
          </div>
          {AI_PROVIDERS.map(provider => (
            <div key={provider.value} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.label}</h3>
                  <p className="text-xs text-gray-500">{provider.description}</p>
                </div>
                {savedProviders.includes(provider.value) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Connected</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={providerKeys[provider.value] || ""}
                  onChange={(e) => setProviderKeys(prev => ({ ...prev, [provider.value]: e.target.value }))}
                  placeholder={savedProviders.includes(provider.value) ? "••••••••••••••••" : `Enter ${provider.label} API key`}
                  className="flex-1 h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => saveProviderKey(provider.value)}
                  disabled={saving || !providerKeys[provider.value]}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "workspace" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Workspace Settings</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Workspace Name</label>
            <input type="text" defaultValue="" placeholder="My Workspace" className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
            <select className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="en">English</option>
              <option value="ro">Romanian</option>
            </select>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Change Password</h3>
            <div className="space-y-3">
              <input type="password" placeholder="Current password" className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="New password" className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">Update Password</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account.</p>
            <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Enable 2FA</button>
          </div>
        </div>
      )}
    </div>
  );
}
