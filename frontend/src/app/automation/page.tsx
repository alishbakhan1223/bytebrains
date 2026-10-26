"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Cpu,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Zap,
  Activity,
  Workflow,
} from "lucide-react";

export default function AutomationPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchData = async () => {
    // Automation feature disabled from RBAC
    router.push("/dashboard");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTrigger = async (wfId: string) => {
    try {
      setTriggeringId(wfId);
      setStatusMessage(null);
      const res = await api.triggerWorkflow(wfId);
      setStatusMessage(`Workflow '${wfId}' triggered successfully.`);
      await fetchData();
    } catch (err: any) {
      setStatusMessage(`Trigger error: ${err.message}`);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Workflow Automation Hub
            </h1>
            <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-red-300">
              5 Active Workflows
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1">
            Automated event orchestration connecting BloodBridge APIs, scheduled triggers, and staff notifications.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm font-semibold text-blue-900 flex items-center space-x-2 shadow-sm">
          <Activity className="w-5 h-5 text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid of 6 Production Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626] bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                  {wf.id}
                </span>
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Configured</span>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  {wf.name}
                </h3>
                <div className="text-xs text-[#374151] mt-2 space-y-1 font-medium">
                  <div><strong className="text-[#111827]">Trigger:</strong> {wf.trigger}</div>
                  <div><strong className="text-[#111827]">Action:</strong> {wf.target}</div>
                </div>
              </div>

              <div className="pt-2 text-xs font-mono text-[#4B5563] bg-slate-50 border border-slate-200 p-2.5 rounded-lg truncate font-semibold">
                {wf.webhook_endpoint}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleTrigger(wf.id)}
                disabled={triggeringId === wf.id}
                className="w-full py-2 px-3 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-60"
              >
                <Play className={`w-3.5 h-3.5 ${triggeringId === wf.id ? "animate-spin" : ""}`} />
                <span>{triggeringId === wf.id ? "Triggering..." : "Simulate / Drill Trigger"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Log Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#4B5563]" />
          <span>Recent Automation Execution Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[#374151] font-bold uppercase text-[12px] border-b border-slate-200">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Workflow Name</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payload Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#4B5563] font-medium">
                    No automation events recorded yet. Click &quot;Simulate / Drill Trigger&quot; above to invoke a workflow.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#FEF2F2] transition-colors">
                    <td className="p-3 text-[#4B5563] font-mono text-xs whitespace-nowrap">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-[#111827]">
                      {evt.workflow_name}
                    </td>
                    <td className="p-3 font-mono text-xs text-[#374151] font-medium">
                      {evt.event_type}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {evt.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-[#4B5563] max-w-xs truncate font-medium">
                      {JSON.stringify(evt.payload)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
