"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, URDU_TRANSLATIONS } from "./translations";
import { soundManager } from "./sound";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (text: string) => text,
  isUrdu: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pw_lang") as Language | null;
    if (saved === "ur" || saved === "en") {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      if (saved === "ur") {
        document.documentElement.classList.add("urdu-font");
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("pw_lang", lang);
    document.documentElement.lang = lang;
    if (lang === "ur") {
      document.documentElement.classList.add("urdu-font");
    } else {
      document.documentElement.classList.remove("urdu-font");
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "ur" : "en";
    setLanguage(nextLang);
    soundManager.playClick();
  };

  const t = (text: string): string => {
    if (language === "en" || !text) return text;
    return URDU_TRANSLATIONS[text] || text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isUrdu: language === "ur",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
