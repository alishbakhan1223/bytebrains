"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Clock,
  User,
  Activity,
} from "lucide-react";
import { api, getCurrentUser } from "@/lib/api";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      if (!user || user.role !== "admin") {
        router.push("/login");
        return;
      }
      const data = await api.getAuditLogs({
        entity_type: entityFilter || undefined,
        action: actionFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err: any) {
      alert(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter, actionFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header (outside cards, on dark atmospheric canvas: text-white) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
            System Compliance & Audit Trail
          </h1>
          <p className="text-sm text-slate-200 mt-1 font-medium">
            Immutable healthcare compliance records of all security, inventory, and request lifecycle actions
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#111827] font-bold"
          >
            <option value="">All Entities</option>
            <option value="BLOOD_REQUEST">Blood Requests</option>
            <option value="BLOOD_INVENTORY">Blood Inventory</option>
            <option value="USER">User Authentication</option>
            <option value="SYSTEM">System</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#111827] font-bold"
          >
            <option value="">All Actions</option>
            <option value="REQUEST_SUBMITTED">REQUEST_SUBMITTED</option>
            <option value="REQUEST_FULFILLED">REQUEST_FULFILLED</option>
            <option value="REQUEST_STATUS_UPDATED">REQUEST_STATUS_UPDATED</option>
            <option value="INVENTORY_BATCH_ADDED">INVENTORY_BATCH_ADDED</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_LOGOUT">USER_LOGOUT</option>
          </select>

          {(entityFilter || actionFilter) && (
            <button
              onClick={() => {
                setEntityFilter("");
                setActionFilter("");
              }}
              className="text-xs text-[#B91C1C] font-bold hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-[#4B5563] font-bold">
          Showing {logs.length} logged record(s)
        </div>
      </div>

      {/* Logs Table (solid white card, #374151 header 12-13px uppercase, #4B5563 timestamp, #111827 user, #374151 entity, #1F2937 description 14px, dark pill action badges, #FEF2F2 hover) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#4B5563]">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#DC2626]" />
            <p className="text-sm font-semibold">Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#4B5563]">
            <p className="text-sm font-semibold">No audit logs found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-slate-200 text-xs font-bold text-[#374151] uppercase tracking-wider bg-slate-50">
                <tr>
                  <th className="py-3.5 px-4">Log ID</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Entity ID</th>
                  <th className="py-3.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FEF2F2] transition-colors border-b border-slate-100">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#4B5563]">#{log.id}</td>
                    <td className="py-3.5 px-4 font-mono text-[13px] text-[#4B5563] whitespace-nowrap font-medium">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#111827] text-[14px]">
                      {log.user_name || "System"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#111827] text-white px-2.5 py-1 rounded-md font-bold text-xs shadow-sm inline-block">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#374151] font-medium text-[14px]">{log.entity_type}</td>
                    <td className="py-3.5 px-4 font-mono text-[#4B5563] text-xs">#{log.entity_id || "—"}</td>
                    <td className="py-3.5 px-4 text-[#1F2937] text-[14px] font-normal max-w-lg truncate" title={log.description}>
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
