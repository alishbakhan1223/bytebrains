"use client";

import React, { useState, useRef, InputHTMLAttributes, forwardRef } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  showLeftIcon?: boolean;
  containerClassName?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showLeftIcon = true,
      containerClassName = "",
      className = "",
      placeholder = "••••••••",
      ...props
    },
    forwardedRef
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);

    const setRef = (el: HTMLInputElement | null) => {
      (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
      if (typeof forwardedRef === "function") {
        forwardedRef(el);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
      }
    };

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsVisible((prev) => !prev);
      // Keep cursor focus on the input after toggling
      requestAnimationFrame(() => {
        internalRef.current?.focus();
      });
    };

    const defaultInputClasses =
      "w-full py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-all";

    const leftPadding = showLeftIcon ? "pl-10" : "pl-3.5";
    const rightPadding = "pr-10";

    return (
      <div className={`relative ${containerClassName}`}>
        {showLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
        )}

        <input
          ref={setRef}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          className={`${defaultInputClasses} ${leftPadding} ${rightPadding} ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-label={isVisible ? "Hide password" : "Show password"}
          title={isVisible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:text-red-600 dark:focus:text-red-400 transition-colors"
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
