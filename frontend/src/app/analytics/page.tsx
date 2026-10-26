"use client";

import React, { useEffect, useState } from "react";
import { api, getCurrentUser } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Building2,
  Droplet,
  Users,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"both" | "hospital" | "blood_bank">("both");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-sm font-medium text-slate-500">Loading scoped intelligence analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-red-600 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
        <p className="font-semibold">{error || "Failed to retrieve analytics data"}</p>
      </div>
    );
  }

  const role = data.role || currentUser?.role || "admin";
  const hospitalData = data.hospital_analytics;
  const bloodBankData = data.blood_bank_analytics;
  const summary = data.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {role === "hospital_staff" && "Hospital Clinical & Transfusion Analytics"}
              {role === "blood_bank_staff" && "Blood Bank Inventory & Donor Supply Analytics"}
              {role === "admin" && "Executive Network Intelligence & Analytics"}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                role === "hospital_staff"
                  ? "bg-blue-100 text-blue-800 border-blue-300"
                  : role === "blood_bank_staff"
                  ? "bg-red-100 text-red-800 border-red-300"
                  : "bg-purple-100 text-purple-800 border-purple-300"
              }`}
            >
              {role === "hospital_staff" && "HOSPITAL RBAC"}
              {role === "blood_bank_staff" && "BLOOD BANK RBAC"}
              {role === "admin" && "ADMIN RBAC (DUAL VIEW)"}
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1">
            {role === "hospital_staff" && "Detailed monitoring of clinical transfusion throughput, urgent requests, and hospital delivery turnaround."}
            {role === "blood_bank_staff" && "Live monitoring of blood reserve levels, donor intake, avoidable wastage, and batch shelf-life."}
            {role === "admin" && "Unified cross-system operations: complete visibility into both hospital clinical demand and blood bank reserves."}
          </p>
        </div>

        {/* Admin Tab Switcher */}
        {role === "admin" && (
          <div className="flex items-center bg-white/15 backdrop-blur-md p-1.5 rounded-xl border border-white/20 self-start md:self-auto">
            <button
              onClick={() => setAdminTab("both")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                adminTab === "both"
                  ? "bg-white text-purple-800 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Both / Executive
            </button>
            <button
              onClick={() => setAdminTab("hospital")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
                adminTab === "hospital"
                  ? "bg-white text-blue-800 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 mr-1" />
              <span>Hospital View</span>
            </button>
            <button
              onClick={() => setAdminTab("blood_bank")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
                adminTab === "blood_bank"
                  ? "bg-white text-red-800 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Droplet className="w-3.5 h-3.5 mr-1" />
              <span>Blood Bank View</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. HOSPITAL ANALYTICS SECTION (Visible to Hospital Staff & Admin)          */}
      {/* ========================================================================= */}
      {(role === "hospital_staff" || (role === "admin" && (adminTab === "both" || adminTab === "hospital"))) && hospitalData && (
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Hospital Clinical Demand & Transfusion Intelligence
              </h2>
              <span className="text-xs text-slate-300 font-medium">
                Scope: {hospitalData.hospital_name}
              </span>
            </div>
          </div>

          {/* Hospital KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-600 shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                30-Day Transfusions
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-[#111827] leading-tight">
                {hospitalData.summary.total_30d_transfused_units}{" "}
                <span className="text-xs font-semibold text-[#4B5563]">units</span>
              </div>
              <span className="text-xs text-[#4B5563] font-medium mt-1 block">Clinical bedside usage</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                Order Fulfillment
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-blue-700 leading-tight">
                {hospitalData.summary.fulfillment_rate_pct}%
              </div>
              <span className="text-xs text-[#4B5563] font-medium mt-1 block">
                {hospitalData.summary.fulfilled_requests_count} / {hospitalData.summary.total_requests} requests
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-[#DC2626] shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                Critical Emergencies
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-[#DC2626] leading-tight">
                {hospitalData.summary.emergency_critical_count}
              </div>
              <span className="text-xs text-rose-700 font-semibold mt-1 block">
                +{hospitalData.summary.emergency_urgent_count} urgent orders
              </span>
            </div>
          </div>

          {/* Hospital Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Usage Trend */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                Hospital Transfusions (Past 14 Days)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hospitalData.daily_transfusion_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#111827", borderRadius: "8px", fontWeight: "bold" }} />
                    <Line
                      type="monotone"
                      dataKey="units_transfused"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#2563eb" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand by Blood Group */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                Hospital Blood Group Consumption (30 Days)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hospitalData.demand_by_blood_group}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="blood_group" tick={{ fontSize: 12, fill: "#111827", fontWeight: "bold" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#111827", borderRadius: "8px", fontWeight: "bold" }} />
                    <Bar dataKey="units_used" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hospital Request Priority & Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                Requests by Clinical Priority
              </h4>
              <div className="space-y-2 text-sm">
                {hospitalData.request_priority_breakdown?.map((item: any) => (
                  <div key={item.priority} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-[#374151]">{item.priority}</span>
                    <span className="font-bold text-[#111827]">{item.count} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                Requests Lifecycle Status
              </h4>
              <div className="space-y-2 text-sm">
                {hospitalData.request_status_breakdown?.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-[#374151]">{item.status}</span>
                    <span className="font-bold text-[#111827]">{item.count} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Divider between sections in dual view */}
      {role === "admin" && adminTab === "both" && (
        <div className="border-t-2 border-dashed border-white/20 my-8"></div>
      )}

      {/* ========================================================================= */}
      {/* 2. BLOOD BANK ANALYTICS SECTION (Visible to Blood Bank Staff & Admin)     */}
      {/* ========================================================================= */}
      {(role === "blood_bank_staff" || (role === "admin" && (adminTab === "both" || adminTab === "blood_bank"))) && bloodBankData && (
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Droplet className="w-5 h-5 fill-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Blood Bank Inventory & Donor Supply Operations
              </h2>
              <span className="text-xs text-slate-300 font-medium">
                Scope: {bloodBankData.blood_bank_name}
              </span>
            </div>
          </div>

          {/* Blood Bank KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-[#DC2626] shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                Available Reserves
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-[#111827] leading-tight">
                {bloodBankData.summary.active_available_inventory}{" "}
                <span className="text-xs font-semibold text-[#4B5563]">units</span>
              </div>
              <span className="text-xs text-[#4B5563] font-medium mt-1 block">
                +{bloodBankData.summary.reserved_units} reserved for delivery
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                Donor Intake Volume
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-emerald-700 leading-tight">
                {bloodBankData.summary.total_intake_units}{" "}
                <span className="text-xs font-semibold text-[#4B5563]">units</span>
              </div>
              <span className="text-xs text-[#4B5563] font-medium mt-1 block">
                {bloodBankData.summary.total_donations_collected} donations / {bloodBankData.summary.active_registered_donors} donors
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                Avoidable Wastage
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-amber-700 leading-tight">
                {bloodBankData.summary.wastage_rate_pct}%
              </div>
              <span className="text-xs text-amber-800 font-semibold mt-1 block">
                {bloodBankData.summary.expired_units} expired / {bloodBankData.summary.expiring_soon_7d_units} expiring soon
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-purple-600 shadow-md">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
                Dispatch Velocity
              </span>
              <div className="mt-2 text-[38px] font-extrabold text-[#111827] leading-tight">
                {bloodBankData.summary.average_dispatch_hours}{" "}
                <span className="text-xs font-semibold text-[#4B5563]">hrs</span>
              </div>
              <span className="text-xs text-[#4B5563] font-medium mt-1 block">
                {bloodBankData.summary.fulfilled_orders_count} of {bloodBankData.summary.total_orders_received} orders fulfilled
              </span>
            </div>
          </div>

          {/* Blood Bank Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Stock Reserves by Blood Group */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                Available Units by Blood Group
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloodBankData.stock_by_blood_group}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="blood_group" tick={{ fontSize: 12, fill: "#111827", fontWeight: "bold" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#111827", borderRadius: "8px", fontWeight: "bold" }} />
                    <Bar dataKey="available_units" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Status Breakdown */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                Inventory Stock Classification
              </h3>
              <div className="h-64 flex flex-col justify-center space-y-3">
                {bloodBankData.inventory_status_breakdown?.map((item: any) => (
                  <div key={item.status} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          item.status === "AVAILABLE"
                            ? "bg-emerald-600"
                            : item.status === "RESERVED"
                            ? "bg-blue-600"
                            : item.status === "EXPIRED"
                            ? "bg-red-600"
                            : "bg-amber-600"
                        }`}
                      ></span>
                      <span className="text-xs font-bold text-[#374151]">{item.status}</span>
                    </div>
                    <span className="text-sm font-extrabold text-[#111827]">
                      {item.units} <span className="text-xs font-semibold text-[#4B5563]">units</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
