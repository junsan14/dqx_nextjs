export default function MonsterDetailHero({ monster }) {
  return (
    <section style={styles.heroCard}>
      <div style={styles.heroHeader}>
        <div style={styles.heroMain}>
          <div style={styles.nameRow}>
            <h1 style={styles.title}>{monster.name}</h1>
            {monster.system_type ? (
              <span style={styles.systemTag}>{monster.system_type}</span>
            ) : null}
          </div>

          <div style={styles.metaRow}>
            {monster.monster_no ? <span>No. {monster.monster_no}</span> : null}
          </div>
        </div>
      </div>

      {monster.source_url ? (
        <div style={styles.sourceRow}>
          <a
            href={monster.source_url}
            target="_blank"
            rel="noreferrer"
            style={styles.sourceLink}
          >
            元データを見る
          </a>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 8px 30px rgba(15,23,42,0.05)",
    marginBottom: "18px",
  },
  heroHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  heroMain: {
    minWidth: 0,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  systemTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "11px",
    fontWeight: 700,
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
    fontSize: "12px",
    color: "#64748b",
  },
  sourceRow: {
    marginTop: "14px",
  },
  sourceLink: {
    fontSize: "12px",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 700,
  },
};