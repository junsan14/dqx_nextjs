"use client";

import { useEffect, useState } from "react";

function joinDisplayValue(value) {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean).join(" / ");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return "";

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean).join(" / ");
      }

      if (typeof parsed === "string") return parsed.trim();
    } catch (_) {
      return trimmed;
    }

    return trimmed;
  }

  return String(value);
}

function usePrefersDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsDark(media.matches);

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }

    media.addListener(apply);
    return () => media.removeListener(apply);
  }, []);

  return isDark;
}

function getReincarnationParentName(monster) {
  if (!monster) return "";

  return (
    monster.reincarnation_parent_name ||
    monster.parent_name ||
    monster.reincarnation_parent?.name ||
    ""
  );
}

export default function MonsterDetailHero({ monster }) {
  const isDark = usePrefersDark();
  const styles = getStyles(isDark);

  const description =
    joinDisplayValue(monster?.description) ||
    joinDisplayValue(monster?.note) ||
    "";

  const parentName = getReincarnationParentName(monster);
  const isReincarnated =
    Number(monster?.is_reincarnated) === 1 || monster?.is_reincarnated === true;

  return (
    <section style={styles.card}>
      <div style={styles.contentCol}>
        <div style={styles.titleBlock}>
          <div style={styles.titleRow}>

            {isReincarnated ? (
              <div style={styles.reincarnationRow}>
                <span style={styles.reincarnationBadge}>転生</span>
                {parentName ? (
                  <span style={styles.parentText}>（{parentName}）</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {monster?.system_type ? (
            <div style={styles.systemType}>{monster.system_type}</div>
          ) : null}
        </div>

        {description ? <p style={styles.description}>{description}</p> : null}

        {monster?.exp != null || monster?.gold != null ? (
          <div style={styles.metaGrid}>
            {monster?.exp != null ? (
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>EXP</span>
                <span style={styles.metaValue}>{monster.exp}</span>
              </div>
            ) : null}

            {monster?.gold != null ? (
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>G</span>
                <span style={styles.metaValue}>{monster.gold}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getStyles(isDark) {
  return {
    card: {
      marginBottom: "16px",
      width: "100%",
    },
    contentCol: {
      minWidth: 0,
      display: "grid",
      gap: "12px",
      alignContent: "start",
      width: "100%",
    },
    titleBlock: {
      display: "grid",
      gap: "6px",
      width: "100%",
    },
    titleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "12px",
      flexWrap: "wrap",
      width: "100%",
    },
    title: {
      margin: 0,
      fontSize: "clamp(26px, 5vw, 40px)",
      lineHeight: 1.15,
      fontWeight: 900,
      color: isDark ? "#f8fafc" : "#0f172a",
      letterSpacing: "-0.02em",
      minWidth: 0,
      wordBreak: "break-word",
    },
    reincarnationRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
      justifyContent: "flex-start",
    },
    reincarnationBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
      lineHeight: 1,
      background: isDark
        ? "rgba(250, 204, 21, 0.18)"
        : "rgba(245, 158, 11, 0.14)",
      color: isDark ? "#fde68a" : "#b45309",
      border: isDark
        ? "1px solid rgba(250, 204, 21, 0.35)"
        : "1px solid rgba(245, 158, 11, 0.26)",
      whiteSpace: "nowrap",
    },
    parentText: {
      fontSize: "14px",
      fontWeight: 700,
      color: isDark ? "#cbd5e1" : "#475569",
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
    systemType: {
      fontSize: "14px",
      fontWeight: 700,
      color: isDark ? "#94a3b8" : "#64748b",
      wordBreak: "break-word",
    },
    description: {
      margin: 0,
      color: isDark ? "#cbd5e1" : "#475569",
      fontSize: "14px",
      lineHeight: 1.8,
      wordBreak: "break-word",
    },
    metaGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
    },
    metaItem: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: isDark ? "#0f172a" : "#f8fafc",
      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "8px 10px",
    },
    metaLabel: {
      fontSize: "11px",
      fontWeight: 800,
      color: isDark ? "#94a3b8" : "#64748b",
    },
    metaValue: {
      fontSize: "13px",
      fontWeight: 800,
      color: isDark ? "#f8fafc" : "#0f172a",
    },
  };
}