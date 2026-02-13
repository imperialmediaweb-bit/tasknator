"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, Shield } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("workspace");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your workspace configuration</p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px">
        {[
          { id: "workspace", label: "Workspace", icon: Settings },
          { id: "security", label: "Security", icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "workspace" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Workspace Settings</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Workspace Name</label>
            <input type="text" defaultValue="" placeholder="My Workspace" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
            <select className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="en">English</option>
              <option value="ro">Romanian</option>
            </select>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Save Changes</button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Change Password</h3>
            <div className="space-y-3">
              <input type="password" placeholder="Current password" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="password" placeholder="New password" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">Update Password</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-slate-500 mb-3">Add an extra layer of security to your account.</p>
            <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Enable 2FA</button>
          </div>
        </div>
      )}
    </div>
  );
}
