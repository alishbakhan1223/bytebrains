"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Heart,
  Droplet,
  Users,
  Activity,
  Award,
  Sparkles,
  HeartPulse,
  ArrowUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import QuranVerseBanner from "./QuranVerseBanner";

interface StatItemProps {
  number: number;
  prefix?: string;
  suffix?: string;
  label: string;
  subtext: string;
}

function StatCounter({ number, prefix = "", suffix = "", label, subtext }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Detect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(number);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [number]);

  useEffect(() => {
    if (!isVisible) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(number);
      return;
    }

    const duration = 1800; // ms
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * number));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCount(number);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, number]);

  return (
    <div
      ref={ref}
      className="p-5 sm:p-6 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-slate-800 shadow-xl shadow-black/10 text-center flex flex-col justify-between"
    >
      <div>
        <div className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400 tracking-tight mb-1">
          {prefix}
          {count.toLocaleString()}
          {suffix}
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{label}</h4>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{subtext}</p>
    </div>
  );
}

interface DonateMotivationProps {
  onBecomeDonor?: () => void;
}

export default function DonateMotivation({ onBecomeDonor }: DonateMotivationProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  const galleryItems = [
    {
      src: "/images/donate-1.jpg",
      title: "Pediatric Hope & Recovery",
      desc: "Giving smiling children battling thalassemia and hematology conditions the gift of a healthy future.",
      tag: "Thalassemia Support",
    },
    {
      src: "/images/donate-2.jpg",
      title: "Caring for Beloved Elders",
      desc: "Providing vital emergency red cells and platelets during cardiac and major surgical operations.",
      tag: "Surgical Care",
    },
    {
      src: "/images/donate-3.jpg",
      title: "Safe Deliveries & Maternal Care",
      desc: "Protecting Pakistani mothers and newborn infants through critical obstetric emergency transfusions.",
      tag: "Maternal Health",
    },
    {
      src: "/images/donate-4.jpg",
      title: "Safe, Dignified Donation",
      desc: "Voluntary lifesavers donating in clean, sterile accredited centers with attentive medical care.",
      tag: "Clean & Certified",
    },
  ];

  const motivationCards = [
    {
      icon: HeartPulse,
      title: "Free Health Screening",
      desc: "Comprehensive pre-donation vital checks, blood pressure evaluation, and hemoglobin testing at zero cost.",
      badge: "Health Benefit",
    },
    {
      icon: Droplet,
      title: "Know Your Blood Group",
      desc: "Official laboratory confirmation of your ABO blood group, Rh factor, and infectious disease screening results.",
      badge: "Knowledge",
    },
    {
      icon: Award,
      title: "Donor Recognition Badge",
      desc: "Receive a permanent digital donor badge in BloodBridge and commemorative milestone certificates.",
      badge: "Honor",
    },
    {
      icon: Sparkles,
      title: "Earn Sadqa-e-Jariya",
      desc: "A timeless spiritual charity that continues to bring blessings by keeping a fellow human being alive.",
      badge: "Spiritual Reward",
    },
  ];

  return (
    <section className="mt-20 pt-16 pb-24 border-t border-white/10 text-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-bold mb-4 backdrop-blur-md shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400 animate-pulse" />
            <span>Why Donate Blood?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
            Your One Blood Donation Can{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-200">
              Save Up to 3 Lives
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-200/95 leading-relaxed drop-shadow">
            Thousands of patients across Pakistan wait for compatible blood every single day.
            Your single decision to donate brings hope, heals families, and restores lives.
          </p>
        </div>

        {/* 2. Quranic Verse Banner */}
        <QuranVerseBanner />

        {/* 1. Photo Gallery: Pakistani Patients & Donors */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Real Stories, Real Hope in Pakistan
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Every unit collected is immediately cross-matched to save an urgent life.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl overflow-hidden bg-slate-900/80 border border-white/20 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-red-400/50"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm shadow-md">
                    {item.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h4 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-red-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Impact Stat Cards with Animated Count-Up */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              The Power of One Donation
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Transforming critical shortages into coordinated life-saving outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCounter
              number={3}
              suffix=" Lives"
              label="Saved Per Donation"
              subtext="One pint of whole blood separates into red cells, platelets, and plasma."
            />
            <StatCounter
              number={2}
              suffix=" Seconds"
              label="Between Transfusion Needs"
              subtext="Trauma, childbirth emergencies, and surgical patients constantly rely on blood."
            />
            <StatCounter
              number={250000}
              suffix="+"
              label="Children with Thalassemia"
              subtext="Pakistani children who rely on scheduled monthly life-giving transfusions."
            />
            <StatCounter
              number={100}
              suffix="%"
              label="Voluntary Lifesaving Impact"
              subtext="Donating costs nothing but is worth everything to a recovering patient."
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400/90 italic">
            *Illustrative healthcare figures representing public health indicators and medical data.
          </p>
        </div>

        {/* 4. Reward & Motivation Cards */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Benefits of Giving Blood
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Health, community honor, and eternal reward.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {motivationCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-800 shadow-xl shadow-black/10 flex flex-col justify-between hover:border-red-400/60 transition-all hover:scale-[1.02]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {card.badge}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Bottom Call to Action */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-red-600 via-rose-700 to-red-700 text-white text-center shadow-2xl relative overflow-hidden border border-white/20">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 2px, transparent 2px)`,
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Save a Life Today?
            </h3>
            <p className="text-sm sm:text-base text-red-100 leading-relaxed">
              Register as an authorized healthcare staff member or blood bank coordinator, or sign up
              to monitor regional emergency inventory.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onBecomeDonor}
                className="inline-flex items-center space-x-2.5 px-8 py-4 bg-white text-red-600 hover:bg-slate-100 font-black rounded-2xl shadow-xl shadow-black/20 hover:scale-105 transition-all text-sm sm:text-base cursor-pointer"
              >
                <span>Become a Donor Today</span>
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
