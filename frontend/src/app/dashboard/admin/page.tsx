"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Hospital,
  Users,
  Package,
  Activity,
  Settings,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import { api, getCurrentUser } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getCurrentUser();
      if (!user || user.role !== "admin") {
        router.push("/login");
        return;
      }
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
        <p className="font-semibold text-lg text-slate-200">Loading administrative governance metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-white border border-red-200 text-red-700 shadow-xl">
          <h2 className="text-xl font-bold mb-2 text-[#111827]">Error Connecting to Dashboard</h2>
          <p className="text-base mb-4 text-[#374151]">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentLogs = data?.recent_audit_logs || [];
  const overview = data?.inventory_overview?.by_blood_group || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner (outside cards, on dark background: text-white) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
              System Administrator Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 drop-shadow-sm tracking-tight">
            Regional Blood Coordination Network
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/audit"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md text-sm flex items-center space-x-2 transition-all hover:scale-105"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Full Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards: Big numbers #111827 36-40px font-extrabold, labels #374151 font-semibold, accent borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Partner Hospitals */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-blue-600 border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Hospital className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Partner Hospitals
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.total_hospitals ?? 0}
            </span>
          </div>
        </div>

        {/* Blood Bank Centers */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-[#DC2626] border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626] flex-shrink-0">
            <Building2 className="w-7 h-7 text-[#DC2626]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Blood Bank Centers
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.total_blood_banks ?? 0}
            </span>
          </div>
        </div>

        {/* Active Staff Users */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-purple-600 border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Users className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Active Staff Users
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.total_users ?? 0}
            </span>
          </div>
        </div>

        {/* Tracked Batches */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-emerald-600 border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Package className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Tracked Batches
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.total_batches ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Network Inventory Balance Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <h2 className="text-xl font-bold text-[#111827] mb-1">
          Network-Wide Blood Supply Reserves
        </h2>
        <p className="text-sm text-[#4B5563] mb-6 font-medium">
          Aggregate inventory across all facilities with low-stock threshold detection
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {overview.map((g: any) => (
            <div
              key={g.blood_group}
              className={`p-4 rounded-xl border text-center transition-all ${
                g.is_low_stock
                  ? "border-red-300 bg-red-50/70"
                  : "border-slate-200 bg-[#F9FAFB]"
              }`}
            >
              <span className="text-lg font-black text-[#111827] block">
                {g.blood_group}
              </span>
              <span className="text-3xl font-extrabold text-[#B91C1C] my-1.5 block leading-none">
                {g.available_units}
              </span>
              <span className="text-[13px] text-[#374151] block font-semibold">
                Threshold: {g.min_threshold}
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded mt-2.5 inline-block ${
                  g.is_low_stock
                    ? "bg-red-200 text-red-950 border border-red-300"
                    : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                }`}
              >
                {g.is_low_stock ? "DEFICIT" : "HEALTHY"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time System Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              System Audit Trail
            </h2>
            <p className="text-sm text-[#4B5563] font-medium mt-0.5">
              Immutable ledger of logins, request submissions, inventory deductions, and status changes
            </p>
          </div>
          <Link
            href="/audit"
            className="text-sm font-bold text-[#B91C1C] hover:text-red-800 flex items-center transition-colors"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#374151] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[13px]">
              {recentLogs.map((log: any) => (
                <tr
                  key={log.id}
                  className="hover:bg-[#FEF2F2] transition-colors border-b border-slate-100"
                >
                  <td className="py-3.5 px-4 text-[#4B5563] whitespace-nowrap font-medium">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-[#111827] text-[14px]">
                    {log.user_name || "System"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-[#111827] text-white px-2.5 py-1 rounded-md font-bold text-xs shadow-sm">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#374151] font-sans text-[14px] font-medium">
                    {log.entity_type}
                  </td>
                  <td
                    className="py-3.5 px-4 font-sans text-[#1F2937] text-[14px] font-normal max-w-md truncate"
                    title={log.description}
                  >
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
