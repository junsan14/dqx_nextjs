"use client";

import { useMemo } from "react";

export default function AccessoryList({
  accessories = [],
  loading = false,
  selectedId = null,
  onSelect,
  isMobile = false,
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeAccessoryListTheme(theme), [theme]);

  if (loading) {
    return <div style={{ color: mergedTheme.metaText }}>読み込み中...</div>;
  }

  if (!accessories.length) {
    return <div style={emptyStyle(mergedTheme)}>データがない</div>;
  }

  return (
    <div style={listStyle(isMobile)}>
      {accessories.map((accessory) => {
        const active = Number(selectedId) === Number(accessory.id);

        return (
          <button
            key={accessory.id}
            type="button"
            onClick={() => onSelect(accessory.id)}
            style={{
              ...itemStyle(mergedTheme),
              ...(active ? activeItemStyle(mergedTheme) : null),
            }}
          >
            <div style={titleStyle(mergedTheme)}>
              {accessory.name || "名称未設定"}
            </div>
            <div style={metaStyle(mergedTheme)}>
              {accessory.slot || "-"} / {accessory.accessory_type || "-"}
            </div>
            <div style={subStyle(mergedTheme)}>{accessory.item_id || "-"}</div>
          </button>
        );
      })}
    </div>
  );
}

function normalizeAccessoryListTheme(theme) {
  return {
    empty: theme?.mutedText ?? theme?.subText ?? "#64748b",
    itemBg: theme?.cardBg ?? "#ffffff",
    itemBorder: theme?.cardBorder ?? "#dddddd",
    itemText: theme?.text ?? theme?.pageText ?? "#111827",
    metaText: theme?.subText ?? "#475569",
    subText: theme?.mutedText ?? "#64748b",
    activeBorder: theme?.selectedBorder ?? theme?.secondaryBorder ?? "#1976d2",
    activeBg: theme?.selectedBg ?? "#eff6ff",
  };
}

const listStyle = (isMobile) => ({
  display: "grid",
  gap: 8,
  maxHeight: isMobile ? "none" : "calc(100vh - 240px)",
  overflow: isMobile ? "visible" : "auto",
});

const itemStyle = (theme) => ({
  textAlign: "left",
  border: `1px solid ${theme.itemBorder}`,
  borderRadius: 10,
  padding: 12,
  background: theme.itemBg,
  cursor: "pointer",
  minWidth: 0,
});

const activeItemStyle = (theme) => ({
  border: `2px solid ${theme.activeBorder}`,
  background: theme.activeBg,
});

const titleStyle = (theme) => ({
  fontWeight: 700,
  marginBottom: 4,
  wordBreak: "break-word",
  color: theme.itemText,
});

const metaStyle = (theme) => ({
  fontSize: 12,
  color: theme.metaText,
  marginBottom: 4,
  wordBreak: "break-word",
});

const subStyle = (theme) => ({
  fontSize: 12,
  color: theme.subText,
  wordBreak: "break-all",
});

const emptyStyle = (theme) => ({
  padding: "16px 8px",
  color: theme.empty,
});
