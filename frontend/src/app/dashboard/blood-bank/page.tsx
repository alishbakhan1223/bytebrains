"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { api, getCurrentUser } from "@/lib/api";

export default function BloodBankDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fulfillment dialog state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [fulfillUnits, setFulfillUnits] = useState<number>(0);
  const [fulfillNote, setFulfillNote] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const res = await api.getBloodBankDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load blood bank dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApprove = async (reqId: number) => {
    try {
      setActionLoading(true);
      await api.updateRequestStatus(reqId, "Approved", "Approved by blood bank staff");
      await loadDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reqId: number) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
      setActionLoading(true);
      await api.updateRequestStatus(reqId, "Rejected", reason);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await api.fulfillRequest(
        selectedRequest.id,
        fulfillUnits > 0 ? fulfillUnits : undefined,
        fulfillNote
      );
      setSelectedRequest(null);
      await loadDashboard();
    } catch (err: any) {
      alert(`Fulfillment Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-600 mb-3" />
        <p className="font-medium">Connecting to BloodBridge backend...</p>
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
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const groups = data?.inventory_by_group || [];
  const recentReqs = data?.recent_requests || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner (outside cards, on dark atmospheric canvas: text-white) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Live Blood Bank Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 drop-shadow-sm tracking-tight">
            {data?.blood_bank_name || "Blood Bank Facility"}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/inventory"
            className="px-4 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-sm flex items-center space-x-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Inventory</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {kpis.low_stock_groups_count > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start space-x-3 text-amber-950 shadow-sm">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#111827]">Safety Stock Threshold Alert</h2>
            <p className="text-xs mt-0.5 text-[#374151] font-semibold">
              {kpis.low_stock_groups_count} blood group(s) are currently below configured minimum safety thresholds (e.g. O-, AB-). Immediate donor mobilization or inter-facility transfer required.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards: Big numbers #111827 36-40px font-extrabold, labels #374151 font-semibold, accent borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Available Units */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-emerald-600 border border-slate-200/90 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Available Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Droplet className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-2 tracking-tight">
            {kpis.total_available_units ?? 0}
          </span>
          <span className="text-[13px] text-emerald-700 font-bold mt-2 flex items-center">
            Ready for dispatch
          </span>
        </div>

        {/* Low Stock Groups */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-amber-500 border border-slate-200/90 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Low Stock Groups
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-2 tracking-tight">
            {kpis.low_stock_groups_count ?? 0}
          </span>
          <span className="text-[13px] text-amber-800 font-semibold mt-2 block">
            Below safety reserve
          </span>
        </div>

        {/* Critical Expiry */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-[#DC2626] border border-slate-200/90 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Critical Expiry (≤3d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626]">
              <Clock className="w-4 h-4 text-[#DC2626]" />
            </div>
          </div>
          <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-2 tracking-tight">
            {kpis.critical_expiry_count ?? 0}
          </span>
          <span className="text-[13px] text-red-700 font-bold mt-2 block">
            Requires prioritization
          </span>
        </div>

        {/* Pending Requests */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-blue-600 border border-slate-200/90 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Pending Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-2 tracking-tight">
            {kpis.pending_requests_count ?? 0}
          </span>
          <span className="text-[13px] text-blue-700 font-semibold mt-2 block">
            Awaiting review
          </span>
        </div>

        {/* Emergency Requests */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-purple-600 border border-slate-200/90 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Emergency Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-2 tracking-tight">
            {kpis.emergency_requests_count ?? 0}
          </span>
          <span className="text-[13px] text-purple-700 font-bold mt-2 block">
            Critical priority
          </span>
        </div>
      </div>

      {/* Inventory by Blood Group Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              Blood Group Inventory Availability
            </h2>
            <p className="text-sm text-[#4B5563] font-medium mt-0.5">
              Live available units vs configured safety threshold
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-sm font-bold text-[#B91C1C] hover:text-red-800 flex items-center transition-colors"
          >
            <span>View All Batches</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {groups.map((g: any) => {
            const pct = Math.min(100, Math.round((g.available_units / (g.min_threshold * 1.5)) * 100));
            return (
              <div
                key={g.blood_group}
                className={`p-4 rounded-xl border text-center relative overflow-hidden transition-all ${
                  g.is_low_stock
                    ? "border-red-300 bg-red-50/70"
                    : "border-slate-200 bg-[#F9FAFB]"
                }`}
              >
                {g.is_low_stock && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" title="Low Stock" />
                )}
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
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${g.is_low_stock ? "bg-red-600" : "bg-emerald-600"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Blood Requests Processing Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              Incoming Hospital Requests
            </h2>
            <p className="text-sm text-[#4B5563] font-medium mt-0.5">
              Review and authorize hospital emergency blood supply dispatch
            </p>
          </div>
          <Link
            href="/requests"
            className="text-sm font-bold text-[#B91C1C] hover:text-red-800 flex items-center transition-colors"
          >
            <span>View All Requests</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {recentReqs.length === 0 ? (
          <p className="text-sm text-[#4B5563] py-8 text-center font-medium">No active requests awaiting processing.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#374151] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Req ID</th>
                  <th className="py-3.5 px-4">Hospital</th>
                  <th className="py-3.5 px-4">Group</th>
                  <th className="py-3.5 px-4">Requested</th>
                  <th className="py-3.5 px-4">Fulfilled</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-[14px]">
                {recentReqs.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#FEF2F2] transition-colors border-b border-slate-100">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#4B5563]">#{r.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#111827]">
                      {r.hospital_name}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#B91C1C] text-base">{r.blood_group}</td>
                    <td className="py-3.5 px-4 font-bold text-[#1F2937]">{r.quantity} units</td>
                    <td className="py-3.5 px-4 text-[#4B5563] font-medium">{r.fulfilled_quantity} units</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-bold border ${
                          r.priority === "Critical"
                            ? "bg-red-100 text-red-950 border-red-300"
                            : r.priority === "Urgent"
                            ? "bg-amber-100 text-amber-950 border-amber-300"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-bold border ${
                          r.status === "Fulfilled"
                            ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                            : r.status === "Approved"
                            ? "bg-blue-100 text-blue-950 border-blue-300"
                            : r.status === "Rejected"
                            ? "bg-red-100 text-red-950 border-red-300"
                            : "bg-amber-100 text-amber-950 border-amber-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {r.status === "Submitted" && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                        >
                          Approve
                        </button>
                      )}
                      {(r.status === "Submitted" || r.status === "Approved" || r.status === "Partially Fulfilled") && (
                        <button
                          onClick={() => {
                            setSelectedRequest(r);
                            setFulfillUnits(r.quantity - r.fulfilled_quantity);
                            setFulfillNote("");
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                        >
                          Fulfill
                        </button>
                      )}
                      {r.status === "Submitted" && (
                        <button
                          onClick={() => handleReject(r.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 text-xs font-bold text-[#374151] hover:text-red-700"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fulfillment Modal Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold text-[#111827] mb-2">
              Fulfill Blood Request #{selectedRequest.id}
            </h3>
            <p className="text-sm text-[#4B5563] mb-4">
              Authorized release of <span className="font-extrabold text-[#B91C1C]">{selectedRequest.blood_group}</span> units for <span className="font-bold text-[#111827]">{selectedRequest.hospital_name}</span>. Inventory will be automatically deducted using FEFO (First-Expiry-First-Out).
            </p>

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                  Units to Dispatch (Remaining: {selectedRequest.quantity - selectedRequest.fulfilled_quantity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedRequest.quantity - selectedRequest.fulfilled_quantity}
                  value={fulfillUnits}
                  onChange={(e) => setFulfillUnits(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#111827] font-semibold text-sm focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                  Dispatch Notes / Courier Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched via Emergency Transit Van #4"
                  value={fulfillNote}
                  onChange={(e) => setFulfillNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#111827] font-semibold text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-sm font-bold text-[#374151] hover:text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors"
                >
                  {actionLoading ? "Processing Atomic Deduction..." : "Confirm & Fulfill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
