/* eslint-disable */
"use client";

import React, { useState, useEffect, useActionState } from "react";
import { User, Bell, Palette, Shield, Database, Sparkles, LogOut, Loader2 } from "lucide-react";
import { settingsRepo, type AppSettings } from "@/lib/storage";
import { logoutAction } from "@/actions/authActions";
import { SmoothInput } from "@/components/ui/SmoothInput";

export default function SettingsClient({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [settings, setSettings] = useState<AppSettings>({ theme: "system", studyGoal: 120, notifications: true });
  const [activeTab, setActiveTab] = useState("Profile");
  const [state, formAction, isPending] = useActionState(logoutAction, null);

  useEffect(() => {
    setSettings(settingsRepo.get());
  }, []);

  const handleSave = () => {
    settingsRepo.save(settings);
    alert("Settings saved successfully!");
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseInt(e.target.value) || 0;
    setSettings(prev => ({ ...prev, studyGoal: hours * 60 }));
  };

  const initialLetter = userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">Settings</h1>
          <p className="text-foreground-muted mt-2">Manage your account and application preferences.</p>
        </div>
        <form action={formAction}>
          <button 
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50 min-w-[120px] justify-center"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {isPending ? "Signing out..." : "Sign Out"}
          </button>
        </form>
      </header>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="space-y-1">
          {[
            { icon: User, label: "Profile" },
            { icon: Palette, label: "Appearance" },
            { icon: Bell, label: "Notifications" },
            { icon: Sparkles, label: "AI Preferences" },
            { icon: Database, label: "Data & Privacy" },
          ].map(item => (
            <button 
              key={item.label} 
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.label ? 'bg-surface-elevated text-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'}`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.label ? 'text-primary' : ''}`} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-8">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-4">{activeTab} Settings</h3>
            
            {activeTab === "Profile" && (
              <>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
                    {initialLetter}
                  </div>
                  <div>
                    <button className="text-sm font-medium bg-surface-elevated border border-border px-3 py-1.5 rounded-md hover:bg-surface-hover transition-colors" onClick={() => alert("Development: File upload not connected")}>
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                    <SmoothInput type="text" defaultValue={userName} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                    <SmoothInput type="email" defaultValue={userEmail} disabled />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Daily Study Goal (Hours)</label>
                  <SmoothInput 
                    type="number" 
                    value={Math.round(settings.studyGoal / 60)} 
                    onChange={handleGoalChange}
                    wrapperClassName="max-w-[150px]" 
                  />
                </div>
              </>
            )}

            {activeTab === "Appearance" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Theme</label>
                  <select 
                    value={settings.theme}
                    onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as "light" | "dark" | "system" }))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "Notifications" && (
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications} 
                    onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <span className="text-sm font-medium text-foreground">Enable push notifications</span>
                </label>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
