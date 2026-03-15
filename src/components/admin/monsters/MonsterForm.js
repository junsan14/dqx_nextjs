"use client";

export default function MonsterForm({ monster, onChange, theme }) {
  function setField(key, value) {
    onChange({
      ...monster,
      [key]: value,
    });
  }

  return (
    <>
      <style>{`
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

      <section className="monster-form-card" style={cardStyle(theme)}>
        <h2 className="monster-form-title" style={titleStyle(theme)}>
          基本情報
        </h2>

        <div className="monster-form-grid" style={gridStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle(theme)}>表示順</span>
            <input
              type="number"
              value={monster?.display_order ?? 0}
              onChange={(e) => setField("display_order", Number(e.target.value))}
              className="monster-form-input"
              style={inputStyle(theme)}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle(theme)}>名前</span>
            <input
              type="text"
              value={monster?.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              className="monster-form-input"
              style={inputStyle(theme)}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle(theme)}>系統</span>
            <input
              type="text"
              value={monster?.system_type ?? ""}
              onChange={(e) => setField("system_type", e.target.value)}
              className="monster-form-input"
              style={inputStyle(theme)}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle(theme)}>参照URL</span>
            <input
              type="text"
              value={monster?.source_url ?? ""}
              onChange={(e) => setField("source_url", e.target.value)}
              className="monster-form-input"
              style={inputStyle(theme)}
            />
          </label>
        </div>
      </section>
    </>
  );
}

const cardStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 14,
  padding: 20,
});

const titleStyle = (theme) => ({
  margin: "0 0 16px",
  fontSize: 20,
  color: theme.title,
});

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 0,
};

const labelStyle = (theme) => ({
  fontSize: 14,
  fontWeight: 700,
  color: theme.subText,
});

const inputStyle = (theme) => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${theme.inputBorder}`,
  background: theme.inputBg,
  color: theme.inputText,
  boxSizing: "border-box",
});
