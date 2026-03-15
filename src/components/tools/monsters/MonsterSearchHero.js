"use client";

import { useEffect, useState } from "react";

export default function MonsterSearchHero() {
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

  return (
    <section style={styles.hero}>
      <div style={styles.heroGlow} />
      <p style={styles.kicker}>DQX MONSTER DATABASE</p>
      <h1 style={styles.title}>モンスター検索</h1>
    </section>
  );
}

function getStyles(isDark) {
  return {
    hero: {
      maxWidth: "1100px",
      margin: "0 auto 22px",
      position: "relative",
      padding: "24px 4px 8px",
    },
    heroGlow: {
      position: "absolute",
      top: "-40px",
      right: "10%",
      width: "220px",
      height: "220px",
      background: isDark
        ? "radial-gradient(circle, rgba(129,140,248,0.34), transparent 70%)"
        : "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)",
      filter: "blur(10px)",
      pointerEvents: "none",
    },
    kicker: {
      margin: "0 0 10px",
      fontSize: "12px",
      letterSpacing: "0.18em",
      color: isDark ? "#a5b4fc" : "#6366f1",
      fontWeight: 800,
    },
    title: {
      margin: "0 0 10px",
      fontSize: "clamp(34px, 6vw, 58px)",
      lineHeight: 1.02,
      fontWeight: 900,
      letterSpacing: "-0.04em",
      color: isDark ? "#f8fafc" : "#0f172a",
    },
    lead: {
      margin: 0,
      color: isDark ? "#cbd5e1" : "#475569",
      fontSize: "16px",
      lineHeight: 1.7,
    },
  };
}