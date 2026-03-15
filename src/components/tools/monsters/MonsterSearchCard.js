export default function MonsterSearchCard({
  monster,
  searchType,
  formatSubText,
  isOpen = false,
  onClick,
}) {
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

const styles = {
  card: {
    width: "100%",
    display: "block",
    textAlign: "left",
    borderRadius: "24px",
    padding: "18px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.88)",
    boxShadow: "0 14px 34px rgba(15,23,42,0.07)",
    transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
    cursor: "pointer",
    appearance: "none",
  },
  cardOpen: {
    border: "1px solid #c7d2fe",
    borderBottom: "1px solid transparent",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    boxShadow: "0 14px 34px rgba(79,70,229,0.10)",
    background: "#ffffff",
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
    color: "#0f172a",
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
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid #bfdbfe",
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
    color: "#64748b",
    fontWeight: 800,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  arrowOpen: {
    color: "#4338ca",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
  },
  subText: {
    margin: "12px 0 0",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
    minHeight: "24px",
  },
};