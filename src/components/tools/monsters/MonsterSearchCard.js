export default function MonsterSearchCard({
  monster,
  searchType,
  formatSubText,
}) {
  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>{monster.name}</h2>
          {monster.monster_no && (
            <p style={styles.monsterNo}>No. {monster.monster_no}</p>
          )}
        </div>
        <span style={styles.arrow}>→</span>
      </div>

      <div style={styles.metaRow}>
        {monster.system_type && (
          <span style={styles.typeChip}>{monster.system_type}</span>
        )}

        {searchType === "orb" && (monster.matched_color || monster.orb_color) && (
          <span style={styles.colorChip}>
            {monster.matched_color || monster.orb_color}
          </span>
        )}
      </div>

      {formatSubText(monster) && (
        <p style={styles.subText}>{formatSubText(monster)}</p>
      )}
    </article>
  );
}

const styles = {
  card: {
    display: "block",
    borderRadius: "24px",
    padding: "18px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.88)",
    boxShadow: "0 14px 34px rgba(15,23,42,0.07)",
    transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  monsterNo: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: 700,
  },
  arrow: {
    fontSize: "18px",
    color: "#94a3b8",
    fontWeight: 800,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  },
  typeChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: 800,
  },
  colorChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid #e2e8f0",
  },
  subText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
    minHeight: "24px",
  },
};