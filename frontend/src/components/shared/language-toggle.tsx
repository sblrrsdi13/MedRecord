"use client";

import { useLanguage } from "@/contexts/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="group relative inline-flex">
      <div
        className="relative inline-flex h-9 items-center gap-1 rounded-full border border-[#c7c1b5] bg-[#eef1e8] p-1 shadow-sm"
        aria-label="Switch language"
      >
        <button
          type="button"
          onClick={() => setLanguage("id")}
          className={`h-7 rounded-full px-3 text-xs font-bold transition-all duration-300 ${
            language === "id"
              ? "bg-[#5f7974] text-white shadow-sm"
              : "text-[#6a746f] hover:bg-white/70 hover:text-[#5f7974]"
          }`}
          aria-pressed={language === "id"}
        >
          ID
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`h-7 rounded-full px-3 text-xs font-bold transition-all duration-300 ${
            language === "en"
              ? "bg-[#5f7974] text-white shadow-sm"
              : "text-[#6a746f] hover:bg-white/70 hover:text-[#5f7974]"
          }`}
          aria-pressed={language === "en"}
        >
          EN
        </button>
      </div>

      {/* Tooltip */}
      <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md bg-stone-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap z-50">
        {language === "id" ? "Bahasa Indonesia" : "English"}
      </div>
    </div>
  );
}



