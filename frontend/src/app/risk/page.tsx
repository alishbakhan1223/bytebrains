"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Info,
  Layers,
} from "lucide-react";

export default function RiskMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRisks();
      setAssessments(res.assessments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load risk engine data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const handleRecalculate = async () => {
    try {
      setGenerating(true);
      await api.generateRisks();
      await fetchRisks();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "HIGH":
        return (
          <span className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>HIGH SHORTAGE RISK</span>
          </span>
        );
      case "MEDIUM":
        return (
          <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ELEVATED VULNERABILITY</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SUFFICIENT BUFFER</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header (outside cards, on dark atmospheric canvas: text-white) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/15">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Explainable Risk Engine
            </h1>
            <span className="bg-slate-100 text-slate-900 text-xs px-2.5 py-0.5 rounded-full font-bold border border-slate-300">
              Zero Black-Box
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1 font-medium">
            Multifactor evaluation correlating current inventory, projected usage, pending requests, and expiry windows.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={generating}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all hover:scale-105 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          <span>{generating ? "Evaluating Factors..." : "Re-evaluate Regional Risks"}</span>
        </button>
      </div>

      {/* Philosophy Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-md flex items-start space-x-3 text-sm text-[#1F2937]">
        <Info className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#111827]">Explainability Mandate:</span> BloodBridge does not provide cryptic AI scores. Every operational alert displays verified contributing parameters so clinical directors can trace the exact underlying reasons.
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#4B5563] font-semibold">Loading explainable risk models...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-700 bg-red-50 rounded-2xl border border-red-200 font-semibold">{error}</div>
      ) : (
        <div className="space-y-4">
          {assessments.map((a: any) => {
            const isHigh = a.risk_level === "HIGH";
            const isMedium = a.risk_level === "MEDIUM";

            return (
              <div
                key={a.blood_group}
                className={`p-6 rounded-2xl border bg-white shadow-md transition-shadow hover:shadow-lg ${
                  isHigh
                    ? "border-red-300 ring-2 ring-red-500/20"
                    : isMedium
                    ? "border-amber-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-black text-[#111827]">
                      {a.blood_group}
                    </span>
                    <div>
                      {getRiskBadge(a.risk_level)}
                      <span className="text-xs text-[#4B5563] ml-2 font-mono font-medium">
                        Updated {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs">
                    <div>
                      <span className="text-[#4B5563] block font-semibold">Available</span>
                      <span className="font-extrabold text-[#111827] text-base">
                        {a.current_inventory} units
                      </span>
                    </div>
                    <div>
                      <span className="text-[#4B5563] block font-semibold">7d Demand</span>
                      <span className="font-extrabold text-[#111827] text-base">
                        {a.predicted_demand} units
                      </span>
                    </div>
                    <div>
                      <span className="text-[#4B5563] block font-semibold">Expiring (7d)</span>
                      <span className="font-extrabold text-[#DC2626] text-base">
                        {a.expiring_units} units
                      </span>
                    </div>
                    <div>
                      <span className="text-[#4B5563] block font-semibold">Active Requests</span>
                      <span className="font-extrabold text-[#111827] text-base">
                        {a.active_requests}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explainable Contributing Factors */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#374151] mb-2">
                    Contributing Factors & Mathematical Drivers:
                  </h4>
                  <ul className="space-y-1.5 text-[14px] text-[#1F2937] font-medium">
                    {a.reasons?.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0 mt-1.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Suggestions */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-[14px]">
                  <span className="text-[#374151] font-semibold">
                    Recommended action: {isHigh ? "Initiate donor mobilization and query regional blood bank coordination." : "Maintain normal FIFO allocation."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
