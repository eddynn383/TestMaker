"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Style = "neumorphism" | "minimalist";
type Theme = "light" | "dark";

interface Settings {
  style: Style;
  theme: Theme;
  setStyle: (s: Style) => void;
  setTheme: (t: Theme) => void;
}

const SettingsContext = createContext<Settings>({
  style: "neumorphism",
  theme: "light",
  setStyle: () => {},
  setTheme: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<Style>("neumorphism");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const s = (localStorage.getItem("tm-style") as Style) || "neumorphism";
    const t = (localStorage.getItem("tm-theme") as Theme) || "light";
    setStyleState(s);
    setThemeState(t);
    applyToHtml(s, t);
  }, []);

  function setStyle(s: Style) {
    setStyleState(s);
    localStorage.setItem("tm-style", s);
    applyToHtml(s, theme);
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("tm-theme", t);
    applyToHtml(style, t);
  }

  return (
    <SettingsContext.Provider value={{ style, theme, setStyle, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

function applyToHtml(style: Style, theme: Theme) {
  document.documentElement.setAttribute("data-style", style);
  document.documentElement.setAttribute("data-theme", theme);
}
