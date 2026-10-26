"use client";

import React, { useEffect, useState } from "react";
import { api, getCurrentUser } from "@/lib/api";
import {
  Settings,
  Save,
  CheckCircle,
  AlertTriangle,
  Hospital,
  Building2,
  Sliders,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    expiry_warning_days: 14,
    expiry_urgent_days: 7,
    expiry_critical_days: 3,
    min_inventory_thresholds: {
      "O-": 12,
      "O+": 20,
      "A-": 8,
      "A+": 16,
      "B-": 8,
      "B+": 16,
      "AB-": 4,
      "AB+": 8,
    },
  });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [bloodBanks, setBloodBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [st, hs, bbs] = await Promise.all([
          api.getSettings().catch(() => null),
          api.getHospitals().catch(() => []),
          api.getBloodBanks().catch(() => []),
        ]);
        if (st) {
          setSettings((prev: any) => ({ ...prev, ...st }));
        }
        setHospitals(hs || []);
        setBloodBanks(bbs || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSaveThresholds = async () => {
    try {
      setSaving(true);
      await api.updateSetting("expiry_warning_days", String(settings.expiry_warning_days));
      await api.updateSetting("expiry_urgent_days", String(settings.expiry_urgent_days));
      await api.updateSetting("expiry_critical_days", String(settings.expiry_critical_days));
      await api.updateSetting("min_inventory_thresholds", JSON.stringify(settings.min_inventory_thresholds));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              System Configuration & Thresholds
            </h1>
            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-300">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1">
            Configure expiry detection windows, blood-group safety buffers, and manage participating healthcare institutions.
          </p>
        </div>

        <button
          onClick={handleSaveThresholds}
          disabled={saving}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors disabled:opacity-60 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Configuration"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-900 flex items-center space-x-2 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Threshold configuration updated and persisted across database services.</span>
        </div>
      )}

      {/* Expiry Monitoring Windows */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#111827] flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#DC2626]" />
          <span>Automated Expiry Monitoring Windows (Days)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-[#374151] block mb-1.5 uppercase">
              Warning Window (Days)
            </label>
            <input
              type="number"
              value={settings.expiry_warning_days || 14}
              onChange={(e) =>
                setSettings({ ...settings, expiry_warning_days: parseInt(e.target.value) || 14 })
              }
              className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 font-mono bg-white text-[#111827] focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
            <span className="text-xs font-medium text-[#4B5563] block mt-1.5">FIFO prioritization advisory</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-[#374151] block mb-1.5 uppercase">
              Urgent Window (Days)
            </label>
            <input
              type="number"
              value={settings.expiry_urgent_days || 7}
              onChange={(e) =>
                setSettings({ ...settings, expiry_urgent_days: parseInt(e.target.value) || 7 })
              }
              className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 font-mono bg-white text-[#111827] focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
            <span className="text-xs font-medium text-[#4B5563] block mt-1.5">Triggers Workflow 2 expiry alerts</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-[#374151] block mb-1.5 uppercase">
              Critical Window (Days)
            </label>
            <input
              type="number"
              value={settings.expiry_critical_days || 3}
              onChange={(e) =>
                setSettings({ ...settings, expiry_critical_days: parseInt(e.target.value) || 3 })
              }
              className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 font-mono bg-white text-[#111827] focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
            <span className="text-xs font-medium text-[#4B5563] block mt-1.5">High-priority triage notification</span>
          </div>
        </div>
      </div>

      {/* Low-Stock Thresholds */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#111827] flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Minimum Low-Stock Buffer (Units per Blood Group)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => (
            <div key={bg} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#111827]">{bg}</span>
              <input
                type="number"
                value={settings.min_inventory_thresholds?.[bg] ?? 10}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    min_inventory_thresholds: {
                      ...settings.min_inventory_thresholds,
                      [bg]: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-16 text-right p-2 rounded-lg border border-slate-300 font-mono font-bold text-sm bg-white text-[#111827] focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Participating Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] flex items-center space-x-2">
            <Hospital className="w-4 h-4 text-blue-600" />
            <span>Authorized Hospitals ({hospitals.length})</span>
          </h3>
          <div className="space-y-2">
            {hospitals.map((h) => (
              <div key={h.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-sm text-[#111827]">{h.name}</div>
                <div className="text-xs font-semibold text-[#4B5563]">{h.location} • {h.contact_information}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#DC2626]" />
            <span>Participating Blood Banks ({bloodBanks.length})</span>
          </h3>
          <div className="space-y-2">
            {bloodBanks.map((bb) => (
              <div key={bb.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-sm text-[#111827]">{bb.name}</div>
                <div className="text-xs font-semibold text-[#4B5563]">{bb.location} • {bb.contact_information}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
