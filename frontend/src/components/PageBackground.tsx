"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function PageBackground() {
  const pathname = usePathname();
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check if current route is landing or auth hero route
  const isHeroRoute = pathname === "/" || pathname === "/login" || pathname === "/register";

  useEffect(() => {
    // Detect prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handleChange);

      // Subtle mouse parallax for hero view
      const handleMouseMove = (e: MouseEvent) => {
        if (mediaQuery.matches) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 16;
        const y = (e.clientY / window.innerHeight - 0.5) * 16;
        setMouseOffset({ x, y });
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, []);

  if (isHeroRoute) {
    return (
      <div
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {/* Parallax & Ken Burns Image Wrapper */}
        <div
          className={`absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] transition-transform duration-300 ease-out ${
            reducedMotion ? "" : "animate-ken-burns"
          }`}
          style={
            reducedMotion
              ? undefined
              : {
                  transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
                }
          }
        >
          <Image
            src="/images/ambulance-bg.jpg"
            alt="BloodBridge Emergency Medical Response Ambulance in Pakistan"
            fill
            priority
            quality={75}
            sizes="100vw"
            className="object-cover object-center select-none"
          />
        </div>

        {/* Cinematic Dark-to-Red Gradient Overlay (55-65% opacity for readability) */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-red-950/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.3)_0%,rgba(2,6,23,0.75)_100%)]" />

        {/* Floating 3D-Style Translucent Blood Drops */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Drop 1 - Top Left Large */}
          <div
            className={`absolute top-[18%] left-[8%] w-10 h-14 ${
              reducedMotion ? "" : "animate-float-slow"
            } opacity-80`}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 via-red-600 to-rose-950 shadow-[0_0_20px_rgba(220,38,38,0.6),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_6px_rgba(0,0,0,0.5)] transform -rotate-12 backdrop-blur-sm" />
          </div>

          {/* Drop 2 - Top Right Medium */}
          <div
            className={`absolute top-[28%] right-[12%] w-7 h-10 ${
              reducedMotion ? "" : "animate-float-medium"
            } opacity-75`}
            style={{ animationDelay: "1.5s" }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-300 via-red-600 to-red-900 shadow-[0_0_15px_rgba(225,29,72,0.5),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.5)] transform rotate-6" />
          </div>

          {/* Drop 3 - Bottom Left Small */}
          <div
            className={`absolute bottom-[22%] left-[16%] w-5 h-7 ${
              reducedMotion ? "" : "animate-float-fast"
            } opacity-70`}
            style={{ animationDelay: "0.8s" }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-950 shadow-[0_0_12px_rgba(220,38,38,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] transform -rotate-6" />
          </div>

          {/* Drop 4 - Bottom Right Large Accent */}
          <div
            className={`absolute bottom-[18%] right-[18%] w-9 h-12 ${
              reducedMotion ? "" : "animate-float-slow"
            } opacity-60`}
            style={{ animationDelay: "2.5s" }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-300 via-red-600 to-rose-950 shadow-[0_0_18px_rgba(220,38,38,0.5),inset_0_2px_4px_rgba(255,255,255,0.75)] transform rotate-12" />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard & Authenticated Pages Background
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Kids & Blood Drop Scene at Low Opacity (10-15%) */}
      <div className="absolute inset-0">
        <Image
          src="/images/kids-drops-bg.jpg"
          alt="Every drop saves a life - BloodBridge"
          fill
          quality={75}
          sizes="100vw"
          className="object-cover object-center select-none opacity-[0.13] dark:opacity-[0.09]"
        />
      </div>

      {/* Clean White/Light Overlay for Full Content Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/85 via-white/80 to-slate-50/90 dark:from-slate-950/90 dark:via-slate-950/85 dark:to-slate-950/95" />

      {/* Subtle Crimson Warmth Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.04),transparent_60%)]" />

      {/* Micro Floating Ruby Accents in Background */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div
          className={`absolute top-[12%] right-[8%] w-4 h-6 ${
            reducedMotion ? "" : "animate-float-slow"
          }`}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_0_8px_rgba(220,38,38,0.3)]" />
        </div>
        <div
          className={`absolute bottom-[15%] left-[5%] w-3 h-4 ${
            reducedMotion ? "" : "animate-float-medium"
          }`}
          style={{ animationDelay: "2s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-rose-700 shadow-[0_0_6px_rgba(220,38,38,0.3)]" />
        </div>
      </div>
    </div>
  );
}
