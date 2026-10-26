"use client";

import React from "react";
import { Amiri, Noto_Nastaliq_Urdu } from "next/font/google";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-amiri",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-nastaliq",
});

export default function QuranVerseBanner() {
  return (
    <div
      className={`${amiri.variable} ${nastaliq.variable} relative overflow-hidden rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-amber-300/30 bg-gradient-to-br from-[#082215]/95 via-[#180a0f]/95 to-[#2b0808]/95 backdrop-blur-xl text-center`}
    >
      {/* Subtle Islamic Geometric Pattern Background at low opacity */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none select-none bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l7.5 15 15-7.5-7.5 15 15 7.5-15 7.5 7.5 15-15-7.5-7.5 15-7.5-15-15 7.5 7.5-15-15-7.5 15-7.5-7.5-15 15 7.5z' fill='%23fbbf24' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Decorative Gold Accent Header */}
      <div className="relative z-10 flex items-center justify-center space-x-3 mb-4">
        <div className="h-px w-10 sm:w-20 bg-gradient-to-r from-transparent to-amber-400/60" />
        <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-amber-300/90 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-950/40 shadow-sm">
          Surah Al-Ma&apos;idah 5:32
        </span>
        <div className="h-px w-10 sm:w-20 bg-gradient-to-l from-transparent to-amber-400/60" />
      </div>

      {/* Arabic Text (Exact, Unaltered, with diacritics, RTL) */}
      <div className="relative z-10 my-5">
        <p
          dir="rtl"
          lang="ar"
          style={{ fontFamily: 'var(--font-amiri), "Amiri", "Traditional Arabic", serif' }}
          className="text-2xl sm:text-4xl md:text-5xl font-bold text-amber-100 leading-[1.8] sm:leading-[1.9] tracking-wide drop-shadow-[0_2px_12px_rgba(251,191,36,0.3)] select-text"
        >
          وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا
        </p>
      </div>

      {/* Urdu Translation (Noto Nastaliq Urdu, RTL) */}
      <div className="relative z-10 mt-4 mb-3">
        <p
          dir="rtl"
          lang="ur"
          style={{
            fontFamily:
              'var(--font-nastaliq), "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif',
          }}
          className="text-lg sm:text-2xl font-normal text-emerald-200/95 leading-[2.2] tracking-normal select-text"
        >
          &ldquo;اور جس نے ایک جان کو بچایا، گویا اس نے تمام انسانوں کو بچا لیا&rdquo;
        </p>
      </div>

      {/* English Translation */}
      <div className="relative z-10 max-w-2xl mx-auto pt-2 border-t border-amber-400/20">
        <p className="text-sm sm:text-base font-medium text-slate-200/90 italic leading-relaxed">
          &ldquo;And whoever saves one life, it is as if he had saved all of mankind.&rdquo;
        </p>
      </div>
    </div>
  );
}
