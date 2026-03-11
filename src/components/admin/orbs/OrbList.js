export default function OrbList({ orbs = [], selectedId, onSelect }) {
  if (!orbs.length) {
    return <div style={emptyStyle}>オーブがない</div>;
  }

  return (
    <div style={listWrapStyle}>
      {orbs.map((orb) => {
        const active = orb.id === selectedId;

        return (
          <button
            key={orb.id}
            type="button"
            onClick={() => onSelect(orb.id)}
            style={{
              ...itemStyle,
              ...(active ? activeItemStyle : {}),
            }}
          >
            <div style={nameStyle}>{orb.name}</div>
            <div style={metaStyle}>
              {orb.color || "色なし"} / ID: {orb.id}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const listWrapStyle = {
  overflowY: "auto",
};

const emptyStyle = {
  padding: 16,
  color: "#666",
};

const itemStyle = {
  display: "grid",
  gap: 4,
  width: "100%",
  textAlign: "left",
  padding: 12,
  border: "none",
  borderBottom: "1px solid #f0f0f0",
  background: "#fff",
  cursor: "pointer",
};

const activeItemStyle = {
  background: "#f3f7ff",
};

const nameStyle = {
  fontSize: 15,
  fontWeight: 700,
};

const metaStyle = {
  fontSize: 12,
  color: "#666",
};