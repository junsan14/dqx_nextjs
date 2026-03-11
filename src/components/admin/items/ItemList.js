"use client";

export default function ItemList({
  items = [],
  loading = false,
  selectedId = null,
  onSelect,
}) {
  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!items.length) {
    return <div style={emptyStyle}>アイテムがない</div>;
  }

  return (
    <div style={listStyle}>
      {items.map((item) => {
        const active = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            style={{
              ...rowStyle,
              ...(active ? activeRowStyle : {}),
            }}
          >
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div style={subStyle}>
              ID: {item.id}
              {item.category ? ` / ${item.category}` : ""}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const listStyle = {
  display: "grid",
  gap: 8,
};

const rowStyle = {
  textAlign: "left",
  padding: 12,
  border: "1px solid #ddd",
  borderRadius: 10,
  background: "#fff",
  cursor: "pointer",
};

const activeRowStyle = {
  border: "1px solid #111",
  background: "#f5f5f5",
};

const subStyle = {
  marginTop: 6,
  fontSize: 13,
  color: "#666",
};

const emptyStyle = {
  padding: 16,
  color: "#666",
};