"use client";

import { useMemo } from "react";
import { applyMonsterThemeToStyleTree } from "../theme";

export default function MapListPane({
  maps = [],
  loading = false,
  selectedId = null,
  onSelect,
  theme,
}) {
  const styles = useMemo(() => getComponentStyles(theme), [theme]);

  if (loading) {
    return <div style={styles.empty}>読み込み中...</div>;
  }

  if (!maps.length) {
    return <div style={styles.empty}>マップがまだない</div>;
  }

  return (
    <div style={styles.list}>
      {maps.map((row) => {
        const active = Number(row.id) === Number(selectedId);

        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect?.(row.id)}
            style={{
              ...styles.item,
              ...(active ? styles.itemActive : null),
            }}
          >
            <div style={styles.itemTitle}>{row.name || "名称未設定"}</div>
            <div style={styles.meta}>
              {row.continent || "-"} / {row.map_type || "-"}
            </div>
            <div style={styles.subMeta}>
              レイヤー {Array.isArray(row.layers) ? row.layers.length : 0} 件
            </div>
          </button>
        );
      })}
    </div>
  );
}

const baseStyles = {
  list: {
    display: "grid",
    gap: "10px",
    maxHeight: "min(60vh, 560px)",
    overflowY: "auto",
    minWidth: 0,
  },
  item: {
    textAlign: "left",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: "14px",
    padding: "12px",
    cursor: "pointer",
    width: "100%",
    minWidth: 0,
  },
  itemActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  itemTitle: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
    wordBreak: "break-word",
  },
  meta: {
    fontSize: "13px",
    color: "#475569",
    marginBottom: "2px",
    wordBreak: "break-word",
  },
  subMeta: {
    fontSize: "12px",
    color: "#64748b",
  },
  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    padding: "18px",
    color: "#64748b",
    background: "#fff",
  },
};

function getComponentStyles(theme) {
  return applyMonsterThemeToStyleTree(baseStyles, theme);
}
