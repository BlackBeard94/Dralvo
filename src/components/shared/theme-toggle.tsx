"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem("dralvo-theme");
  if (stored === "dark" || stored === "light") return stored;
  return null;
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getStoredTheme() ?? getSystemTheme();
    applyTheme(initial);

    const frame = window.requestAnimationFrame(() => {
      setTheme(initial);
      setMounted(true);
    });

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const next = event.matches ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
      }
    };

    mq.addEventListener("change", onChange);
    return () => {
      window.cancelAnimationFrame(frame);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("dralvo-theme", next);
  };

  if (!mounted) {
    return <div className="theme-toggle opacity-0" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
