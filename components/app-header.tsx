"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getDocumentTheme, toggleDocumentTheme } from "@/lib/theme/apply-theme";

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function AppHeader() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getDocumentTheme() === "dark");
  }, []);

  const handleToggle = useCallback(() => {
    const next = toggleDocumentTheme();
    setIsDark(next === "dark");
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between border-b border-border-default bg-surface px-4"
      style={{ height: "var(--header-height)" }}>
      <Link
        href="/explorar"
        className="font-fraunces text-[16px] font-semibold text-accent-brand hover:opacity-80"
      >
        Kupulumuka
      </Link>
      <button
        type="button"
        aria-label="Alternar tema"
        onClick={handleToggle}
        className="flex size-11 items-center justify-center rounded-[10px] text-secondary-text hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  );
}
