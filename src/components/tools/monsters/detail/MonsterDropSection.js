function DropList({ items }) {
  if (!items || items.length === 0) {
    return <p style={styles.emptyInline}>なし</p>;
  }

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item?.name;
        if (!label) return null;

        return (
          <span key={`${label}-${index}`} style={styles.tag}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function OrbList({ items }) {
  if (!items || items.length === 0) {
    return <p style={styles.emptyInline}>なし</p>;
  }

  return (
    <div style={styles.tagList}>
      {items.map((orb, index) => {
        if (!orb?.name) return null;

        return (
          <span key={`${orb.name}-${index}`} style={styles.tag}>
            {orb.name}
            {orb.color ? ` (${orb.color})` : ""}
          </span>
        );
      })}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <section style={styles.infoCard}>
      <h2 style={styles.cardHeading}>{title}</h2>
      {children}
    </section>
  );
}

export default function MonsterDropSection({
  normalDrops,
  rareDrops,
  orbDrops,
  equipmentDrops,
}) {
  return (
    <section style={styles.infoGrid}>
      <InfoCard title="通常ドロップ">
        <DropList items={normalDrops} />
      </InfoCard>

      <InfoCard title="レアドロップ">
        <DropList items={rareDrops} />
      </InfoCard>

      <InfoCard title="宝珠">
        <OrbList items={orbDrops} />
      </InfoCard>

      <InfoCard title="装備">
        <DropList items={equipmentDrops} />
      </InfoCard>
    </section>
  );
}

const styles = {
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  infoCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },
  cardHeading: {
    margin: "0 0 10px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f3f6fb",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 600,
  },
  emptyInline: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
  },
};