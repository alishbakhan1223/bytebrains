"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Hospital,
  Droplet,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  Zap,
} from "lucide-react";
import { api, getCurrentUser } from "@/lib/api";

export default function HospitalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Request modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("O-");
  const [quantity, setQuantity] = useState(2);
  const [priority, setPriority] = useState("Critical");
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const res = await api.getHospitalDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load hospital dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      await api.createRequest({
        blood_group: bloodGroup,
        quantity: Number(quantity),
        priority,
        required_datetime: new Date(requiredDate).toISOString(),
        notes,
      });
      setShowCreateModal(false);
      setNotes("");
      await loadDashboard();
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="font-medium">Connecting to hospital dispatch feed...</p>
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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const myRequests = data?.my_requests || [];
  const networkAvailability = data?.network_availability || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header (outside cards, on dark atmospheric canvas: text-white) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Hospital Emergency Coordination Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 drop-shadow-sm tracking-tight">
            {data?.hospital_name || "Emergency Medical Center"}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-sm flex items-center space-x-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Emergency Request</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Big numbers #111827 36-40px font-extrabold, labels #374151 font-semibold, accent borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Submitted Requests */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-blue-600 border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Clock className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Submitted Requests
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.total_submitted_requests ?? 0}
            </span>
          </div>
        </div>

        {/* Active Emergencies */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-[#DC2626] border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#DC2626] flex-shrink-0">
            <AlertCircle className="w-7 h-7 text-[#DC2626]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Active Emergencies
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.emergency_requests_count ?? 0}
            </span>
          </div>
        </div>

        {/* Fulfilled Requests */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-emerald-600 border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Fulfilled Requests
            </span>
            <span className="text-[38px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.fulfilled_requests_count ?? 0}
            </span>
          </div>
        </div>

        {/* Units Received */}
        <div className="p-5 rounded-2xl bg-white border-l-4 border-l-purple-600 border border-slate-200/90 shadow-md flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Droplet className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider block">
              Units Received / Total
            </span>
            <span className="text-[32px] font-extrabold text-[#111827] leading-none block mt-1 tracking-tight">
              {kpis.total_units_received ?? 0} / {kpis.total_units_requested ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Network Blood Group Availability Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <div className="mb-6 pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#111827]">
            Regional Blood Network Availability
          </h2>
          <p className="text-sm text-[#4B5563] font-medium mt-0.5">
            Live available units across certified blood centers to help triage transfusions
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {networkAvailability.map((g: any) => (
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
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded mt-1.5 inline-block ${
                  g.is_low_stock
                    ? "bg-red-200 text-red-950 border border-red-300"
                    : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                }`}
              >
                {g.is_low_stock ? "DEFICIT" : "IN STOCK"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Submitted Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
        <div className="mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#111827]">
            Our Blood Requests Tracking
          </h2>
          <p className="text-sm text-[#4B5563] font-medium mt-0.5">
            Live updates on pending, approved, and fulfilled blood orders
          </p>
        </div>

        {myRequests.length === 0 ? (
          <p className="text-sm text-[#4B5563] py-8 text-center font-medium">No blood requests created yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#374151] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Req ID</th>
                  <th className="py-3.5 px-4">Group</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Fulfilled</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Required Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-[14px]">
                {myRequests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#FEF2F2] transition-colors border-b border-slate-100">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#4B5563]">#{r.id}</td>
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
                    <td className="py-3.5 px-4 text-[13px] font-mono text-[#4B5563] whitespace-nowrap">
                      {new Date(r.required_datetime).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                    <td className="py-3.5 px-4 text-[14px] text-[#374151] max-w-xs truncate" title={r.notes}>
                      {r.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <Zap className="w-5 h-5 fill-red-600" />
              <h3 className="text-xl font-bold text-[#111827]">
                Submit Emergency Blood Request
              </h3>
            </div>
            <p className="text-sm text-[#4B5563] mb-4">
              Dispatches emergency requirement to central blood banks and triggers automated priority notification.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#111827] font-bold text-sm focus:border-red-500 focus:outline-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                    Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#111827] font-bold text-sm focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#111827] font-bold text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                    Required By
                  </label>
                  <input
                    type="datetime-local"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-[#111827] focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#374151] mb-1">
                  Clinical Emergency Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Trauma Bay 1 acute hemorrhage, O- universal donor required immediately"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-[#111827] font-medium focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-bold text-[#374151] hover:text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-[#DC2626] hover:bg-red-700 text-white rounded-xl shadow-md transition-colors"
                >
                  {submitLoading ? "Transmitting..." : "Submit Emergency Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
