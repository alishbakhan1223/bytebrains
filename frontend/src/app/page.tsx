"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplet,
  Activity,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Send,
  Building2,
  CheckCircle2,
  BarChart3,
  Bot,
  Hospital,
} from "lucide-react";
import { api, saveSession, getCurrentUser } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleQuickDemoLogin = async (email: string, pass: string, roleName: string) => {
    try {
      setLoadingRole(roleName);
      const session = await api.login(email, pass);
      if (session.role === "admin") router.push("/dashboard/admin");
      else if (session.role === "blood_bank_staff") router.push("/dashboard/blood-bank");
      else router.push("/dashboard/hospital");
    } catch (err) {
      alert("Backend connection error. Make sure FastAPI server is running.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-transparent border-b border-white/10 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-semibold mb-6 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span>Predict. Coordinate. Respond.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto drop-shadow-md">
            AI-Powered Blood Inventory &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-200">
              Emergency Coordination
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-100 max-w-3xl mx-auto leading-relaxed drop-shadow">
            An intelligent healthcare operations platform helping blood banks and hospitals monitor supply, identify shortage risks, reduce expiry-related waste, and respond to urgent blood requests in real time.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="mt-10 max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-black/25">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Instant Academic Demonstration Logins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hospital Staff */}
              <button
                onClick={() => handleQuickDemoLogin("hospital@bloodbridge.org", "hospital123", "hospital")}
                disabled={loadingRole !== null}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100/90 dark:hover:bg-blue-900/70 transition-all text-left group backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-md shadow-blue-500/20">
                  <Hospital className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Hospital Staff</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">City General Hospital</span>
                <span className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                  {loadingRole === "hospital" ? "Connecting..." : "Launch Hospital View →"}
                </span>
              </button>

              {/* Blood Bank Staff */}
              <button
                onClick={() => handleQuickDemoLogin("bloodbank@bloodbridge.org", "bloodbank123", "bloodbank")}
                disabled={loadingRole !== null}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-200/80 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/60 hover:bg-red-100/90 dark:hover:bg-red-900/70 transition-all text-left group backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-md shadow-red-500/20">
                  <Droplet className="w-5 h-5 fill-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Blood Bank Staff</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Central Blood Bank</span>
                <span className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center">
                  {loadingRole === "bloodbank" ? "Connecting..." : "Launch Blood Bank View →"}
                </span>
              </button>

              {/* Administrator */}
              <button
                onClick={() => handleQuickDemoLogin("admin@bloodbridge.org", "admin123", "admin")}
                disabled={loadingRole !== null}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/80 dark:bg-purple-950/60 hover:bg-purple-100/90 dark:hover:bg-purple-900/70 transition-all text-left group backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-md shadow-purple-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Administrator</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Regional Health Authority</span>
                <span className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                  {loadingRole === "admin" ? "Connecting..." : "Launch Admin View →"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Workflow Section */}
      <section className="py-16 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Core Architecture
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              End-to-End Operational Lifecycle
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {[
              { step: "01", name: "Monitor", desc: "Live multi-bank inventory tracking" },
              { step: "02", name: "Detect", desc: "Explainable shortage risk engine" },
              { step: "03", name: "Alert", desc: "Automated real-time notifications" },
              { step: "04", name: "Coordinate", desc: "Cross-facility emergency requests" },
              { step: "05", name: "Respond", desc: "FEFO atomic inventory fulfillment" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm"
              >
                <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 block mb-1">
                  {item.step}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-20 bg-slate-50/85 dark:bg-slate-900/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              System Capabilities
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              Engineered for Modern Emergency Healthcare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 mb-4 shadow-sm">
                <Droplet className="w-6 h-6 fill-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Smart Dynamic Inventory
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Multi-batch tracking with real-time dynamic expiry calculation, FEFO (First-Expiry-First-Out) fulfillment, and configurable low-stock thresholds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Explainable Shortage Risk
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A transparent shortage risk engine that provides clear operational reasons instead of black-box metrics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-4 shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Intelligent Automation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Event-driven webhooks for emergency requests, scheduled low-stock alerts, and expiry warnings without hardcoded background scripts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Emergency Coordination
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Structured request lifecycle (Submitted &rarr; Reviewing &rarr; Approved &rarr; Fulfilled) keeping authorized healthcare professionals in complete control.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Database-Grounded Assistant
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                AI chatbot grounded directly in live queries with strict role-scoping and controlled write action confirmations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Immutable Audit Logging
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete traceability: logins, request submissions, status transitions, batch deductions, and automation events recorded for regulatory compliance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
