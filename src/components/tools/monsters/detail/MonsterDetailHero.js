"use client";

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

export default function MonsterDetailHero({ monster }) {
  const description =
    joinDisplayValue(monster?.description) ||
    joinDisplayValue(monster?.note) ||
    "";

  return (
    <section style={styles.card}>
      <div style={styles.contentCol}>
       

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

const styles = {
  card: {
    marginBottom: "16px",
  },
  contentCol: {
    minWidth: 0,
    display: "grid",
    gap: "12px",
    alignContent: "start",
  },
  typeTag: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid #bfdbfe",
  },
  description: {
    margin: 0,
    color: "#475569",
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
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "8px 10px",
  },
  metaLabel: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#64748b",
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0f172a",
  },
};