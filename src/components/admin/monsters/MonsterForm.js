"use client";

export default function MonsterForm({ monster, onChange }) {
  function setField(key, value) {
    onChange({
      ...monster,
      [key]: value,
    });
  }

  return (
    <>
      <style jsx>{`
        @media (max-width: 640px) {
          .monster-form-card {
            padding: 14px !important;
          }

          .monster-form-title {
            font-size: 18px !important;
            margin-bottom: 14px !important;
          }

          .monster-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .monster-form-input {
            font-size: 16px !important;
          }
        }
      `}</style>

      <section className="monster-form-card" style={styles.card}>
        <h2 className="monster-form-title" style={styles.title}>
          基本情報
        </h2>

        <div className="monster-form-grid" style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>表示順</span>
            <input
              type="number"
              value={monster?.display_order ?? 0}
              onChange={(e) => setField("display_order", Number(e.target.value))}
              className="monster-form-input"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>名前</span>
            <input
              type="text"
              value={monster?.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              className="monster-form-input"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>系統</span>
            <input
              type="text"
              value={monster?.system_type ?? ""}
              onChange={(e) => setField("system_type", e.target.value)}
              className="monster-form-input"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>参照URL</span>
            <input
              type="text"
              value={monster?.source_url ?? ""}
              onChange={(e) => setField("source_url", e.target.value)}
              className="monster-form-input"
              style={styles.input}
            />
          </label>
        </div>
      </section>
    </>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
  },
  title: {
    margin: "0 0 16px",
    fontSize: 20,
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
  },
};