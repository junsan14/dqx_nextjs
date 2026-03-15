"use client";

import { useEffect, useState } from "react";

export function usePrefersDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => setIsDark(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return isDark;
}

export function getMonsterEditorTheme(isDark) {
  return isDark
    ? {
        isDark: true,
        pageBg: "#020617",
        pageText: "#e5e7eb",
        mutedText: "#94a3b8",
        panelBg: "#111827",
        panelBorder: "#374151",
        cardBg: "#111827",
        cardBorder: "#374151",
        softBg: "#0f172a",
        softBorder: "#475569",
        title: "#f9fafb",
        text: "#e5e7eb",
        subText: "#cbd5e1",
        inputBg: "#0f172a",
        inputBorder: "#475569",
        inputText: "#f8fafc",
        inputPlaceholder: "#94a3b8",
        inputDisabledBg: "#0b1220",
        primaryBg: "#e5e7eb",
        primaryText: "#111827",
        primaryBorder: "#e5e7eb",
        secondaryBg: "#1e293b",
        secondaryText: "#93c5fd",
        secondaryBorder: "#3b82f6",
        dangerBg: "#1f2937",
        dangerText: "#fca5a5",
        dangerBorder: "#ef4444",
        tabBarBg: "#0f172a",
        tabIdleText: "#cbd5e1",
        tabActiveBg: "#1e293b",
        tabActiveText: "#f8fafc",
        badgeBg: "#312e81",
        badgeText: "#c7d2fe",
        tagBg: "#1e293b",
        tagBorder: "#475569",
        tagText: "#e2e8f0",
        hoverBg: "#1f2937",
        selectedBg: "#1e293b",
        selectedBorder: "#60a5fa",
        overlayBg: "rgba(15, 23, 42, 0.28)",
        overlayActiveBg: "rgba(59, 130, 246, 0.35)",
        overlayBorder: "rgba(148, 163, 184, 0.5)",
        ghostBg: "#0f172a",
        ghostBorder: "#475569",
        warningBg: "#3f2a10",
        warningBorder: "#d97706",
        warningText: "#fde68a",
        softDangerBg: "#2a1320",
        softDangerBorder: "#7f1d1d",
      }
    : {
        isDark: false,
        pageBg: "#f8fafc",
        pageText: "#111827",
        mutedText: "#64748b",
        panelBg: "#ffffff",
        panelBorder: "#d1d5db",
        cardBg: "#ffffff",
        cardBorder: "#e5e7eb",
        softBg: "#f8fafc",
        softBorder: "#cbd5e1",
        title: "#111827",
        text: "#0f172a",
        subText: "#334155",
        inputBg: "#ffffff",
        inputBorder: "#cbd5e1",
        inputText: "#111827",
        inputPlaceholder: "#6b7280",
        inputDisabledBg: "#f8fafc",
        primaryBg: "#111111",
        primaryText: "#ffffff",
        primaryBorder: "#111111",
        secondaryBg: "#ffffff",
        secondaryText: "#1976d2",
        secondaryBorder: "#1976d2",
        dangerBg: "#ffffff",
        dangerText: "#b91c1c",
        dangerBorder: "#ef4444",
        tabBarBg: "#e2e8f0",
        tabIdleText: "#334155",
        tabActiveBg: "#ffffff",
        tabActiveText: "#111827",
        badgeBg: "#eef2ff",
        badgeText: "#4338ca",
        tagBg: "#f8fafc",
        tagBorder: "#cbd5e1",
        tagText: "#334155",
        hoverBg: "#f8fafc",
        selectedBg: "#eff6ff",
        selectedBorder: "#3b82f6",
        overlayBg: "rgba(15, 23, 42, 0.12)",
        overlayActiveBg: "rgba(59, 130, 246, 0.20)",
        overlayBorder: "rgba(148, 163, 184, 0.35)",
        ghostBg: "#f8fafc",
        ghostBorder: "#cbd5e1",
        warningBg: "#fef3c7",
        warningBorder: "#fcd34d",
        warningText: "#92400e",
        softDangerBg: "#fff1f2",
        softDangerBorder: "#fecaca",
      };
}

function mapColor(value, theme) {
  if (!theme?.isDark || typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();

  const map = {
    "#fff": theme.cardBg,
    "#ffffff": theme.cardBg,
    "#f8fafc": theme.softBg,
    "#eff6ff": theme.selectedBg,
    "#dbeafe": theme.selectedBg,
    "#eef2ff": theme.badgeBg,
    "#e5e7eb": theme.cardBorder,
    "#e2e8f0": theme.softBorder,
    "#d1d5db": theme.panelBorder,
    "#cbd5e1": theme.inputBorder,
    "#94a3b8": theme.mutedText,
    "#64748b": theme.mutedText,
    "#334155": theme.subText,
    "#0f172a": theme.text,
    "#111827": theme.title,
    "#2563eb": theme.selectedBorder,
    "#1d4ed8": theme.secondaryText,
    "#4338ca": theme.badgeText,
    "#3730a3": theme.badgeText,
    "#b91c1c": theme.dangerText,
    "#ef4444": theme.dangerBorder,
    "#fecaca": theme.softDangerBorder,
    "#fff1f2": theme.softDangerBg,
    "#fef3c7": theme.warningBg,
    "#fcd34d": theme.warningBorder,
    "#92400e": theme.warningText,
  };

  if (normalized in map) return map[normalized];

  if (normalized == 'transparent') return value;
  return value;
}

export function applyMonsterThemeToStyleTree(input, theme) {
  if (!theme?.isDark) return input;

  if (Array.isArray(input)) {
    return input.map((item) => applyMonsterThemeToStyleTree(item, theme));
  }

  if (!input || typeof input !== "object") {
    return mapColor(input, theme);
  }

  const next = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      let mapped = mapColor(value, theme);

      if (key === "background" || key === "backgroundColor") {
        if (value === "#ffffff" || value === "#fff") mapped = theme.cardBg;
        if (value === "#f8fafc") mapped = theme.softBg;
        if (value === "#eff6ff" || value === "#dbeafe") mapped = theme.selectedBg;
        if (value === "#eef2ff") mapped = theme.badgeBg;
      }

      if (key === "color") {
        if (value === "#0f172a" || value === "#111827") mapped = theme.text;
        if (value === "#334155") mapped = theme.subText;
        if (value === "#64748b" || value === "#94a3b8") mapped = theme.mutedText;
      }

      if (key === "border") {
        mapped = String(mapped)
          .replace(/#ffffff|#fff/gi, theme.cardBg)
          .replace(/#f8fafc/gi, theme.softBg)
          .replace(/#e5e7eb/gi, theme.cardBorder)
          .replace(/#e2e8f0/gi, theme.softBorder)
          .replace(/#cbd5e1/gi, theme.inputBorder)
          .replace(/#2563eb/gi, theme.selectedBorder)
          .replace(/#ef4444/gi, theme.dangerBorder)
          .replace(/#fcd34d/gi, theme.warningBorder)
          .replace(/#fecaca/gi, theme.softDangerBorder);
      }

      if (/boxShadow/i.test(key)) {
        mapped = value
          .replace(/rgba\(15, 23, 42, 0\.04\)/g, "rgba(2, 6, 23, 0.45)")
          .replace(/rgba\(15, 23, 42, 0\.06\)/g, "rgba(2, 6, 23, 0.5)")
          .replace(/rgba\(15, 23, 42, 0\.08\)/g, "rgba(2, 6, 23, 0.55)")
          .replace(/rgba\(15, 23, 42, 0\.12\)/g, "rgba(2, 6, 23, 0.65)");
      }

      next[key] = mapped;
      continue;
    }

    next[key] = applyMonsterThemeToStyleTree(value, theme);
  }

  return next;
}
