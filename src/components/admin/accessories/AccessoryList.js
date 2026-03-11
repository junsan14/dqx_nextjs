"use client";

export default function AccessoryList({
  accessories = [],
  loading = false,
  selectedId = null,
  onSelect,
}) {
  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!accessories.length) {
    return <div style={emptyStyle}>データがない</div>;
  }

  return (
    <div style={listStyle}>
      {accessories.map((accessory) => {
        const active = Number(selectedId) === Number(accessory.id);

        return (
          <button
            key={accessory.id}
            type="button"
            onClick={() => onSelect(accessory.id)}
            style={{
              ...itemStyle,
              ...(active ? activeItemStyle : null),
            }}
          >
            <div style={titleStyle}>{accessory.name || "名称未設定"}</div>
            <div style={metaStyle}>
              {accessory.slot || "-"} / {accessory.accessory_type || "-"}
            </div>
            <div style={subStyle}>{accessory.item_id || "-"}</div>
          </button>
        );
      })}
    </div>
  );
}

const listStyle = {
  display: "grid",
  gap: 8,
  maxHeight: "calc(100vh - 240px)",
  overflow: "auto",
};

const itemStyle = {
  textAlign: "left",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  cursor: "pointer",
};

const activeItemStyle = {
  border: "2px solid #1976d2",
  background: "#f4f9ff",
};

const titleStyle = {
  fontWeight: 700,
  marginBottom: 4,
};

const metaStyle = {
  fontSize: 12,
  color: "#555",
  marginBottom: 4,
};

const subStyle = {
  fontSize: 12,
  color: "#777",
};

const emptyStyle = {
  padding: "16px 8px",
  color: "#666",
};