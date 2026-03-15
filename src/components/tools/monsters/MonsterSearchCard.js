"use client";

import { useEffect, useState } from "react";

export default function MonsterSearchCard({
  monster,
  searchType,
  formatSubText,
  isOpen = false,
  onClick,
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => setIsDark(media.matches);

    applyTheme();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }

    media.addListener(applyTheme);
    return () => media.removeListener(applyTheme);
  }, []);

  const styles = getStyles(isDark);
  const subText = formatSubText ? formatSubText(monster) : null;
  const typeText =
    searchType === "monster" ? monster?.system_type || "" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.card,
        ...(isOpen ? styles.cardOpen : {}),
      }}
    >
      <div style={styles.topRow}>
        <h2 style={styles.cardTitle}>{monster.name}</h2>

        <div style={styles.rightSide}>
          {typeText ? <span style={styles.typeTag}>{typeText}</span> : null}
          <span
            style={{
              ...styles.arrow,
              ...(isOpen ? styles.arrowOpen : {}),
            }}
          >
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </div>

      {subText && searchType !== "monster" ? (
        <p style={styles.subText}>{subText}</p>
      ) : null}
    </button>
  );
}

function getStyles(isDark) {
  return {
    card: {
      width: "100%",
      display: "block",
      textAlign: "left",
      borderRadius: "24px",
      padding: "18px",
      background: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.88)",
      border: isDark
        ? "1px solid rgba(51,65,85,0.95)"
        : "1px solid rgba(255,255,255,0.88)",
      boxShadow: isDark
        ? "0 14px 34px rgba(2,6,23,0.5)"
        : "0 14px 34px rgba(15,23,42,0.07)",
      transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease, color .16s ease",
      cursor: "pointer",
      appearance: "none",
    },
    cardOpen: {
      border: isDark ? "1px solid #6366f1" : "1px solid #c7d2fe",
      borderBottom: "1px solid transparent",
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      boxShadow: isDark
        ? "0 14px 34px rgba(99,102,241,0.18)"
        : "0 14px 34px rgba(79,70,229,0.10)",
      background: isDark ? "#0f172a" : "#ffffff",
    },
    topRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
    },
    cardTitle: {
      margin: 0,
      fontSize: "24px",
      lineHeight: 1.2,
      fontWeight: 900,
      letterSpacing: "-0.03em",
      color: isDark ? "#f8fafc" : "#0f172a",
      minWidth: 0,
    },
    rightSide: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0,
    },
    typeTag: {
      display: "inline-flex",
      alignItems: "center",
      maxWidth: "220px",
      padding: "7px 10px",
      borderRadius: "999px",
      background: isDark ? "rgba(59,130,246,0.14)" : "#eff6ff",
      color: isDark ? "#93c5fd" : "#1d4ed8",
      fontSize: "12px",
      fontWeight: 800,
      border: isDark ? "1px solid rgba(96,165,250,0.28)" : "1px solid #bfdbfe",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    arrow: {
      minWidth: "32px",
      height: "32px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "999px",
      fontSize: "18px",
      color: isDark ? "#cbd5e1" : "#64748b",
      fontWeight: 800,
      background: isDark ? "#1e293b" : "#f8fafc",
      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
    },
    arrowOpen: {
      color: isDark ? "#c7d2fe" : "#4338ca",
      background: isDark ? "rgba(99,102,241,0.18)" : "#eef2ff",
      border: isDark ? "1px solid rgba(129,140,248,0.4)" : "1px solid #c7d2fe",
    },
    subText: {
      margin: "12px 0 0",
      color: isDark ? "#cbd5e1" : "#475569",
      fontSize: "14px",
      lineHeight: 1.7,
      minHeight: "24px",
    },
  };
}