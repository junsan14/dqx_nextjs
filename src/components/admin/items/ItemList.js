"use client";

import { useMemo } from "react";

export default function ItemList({
  items = [],
  loading = false,
  selectedId = null,
  onSelect,
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeItemListTheme(theme), [theme]);

  if (loading) {
    return <div style={loadingStyle(mergedTheme)}>読み込み中...</div>;
  }

  if (!items.length) {
    return <div style={emptyStyle(mergedTheme)}>アイテムがない</div>;
  }

  return (
    <div style={listStyle}>
      {items.map((item) => {
        const active = Number(item.id) === Number(selectedId);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            style={{
              ...rowStyle(mergedTheme),
              ...(active ? activeRowStyle(mergedTheme) : {}),
            }}
          >
            <div style={nameStyle(mergedTheme)}>{item.name}</div>
            <div style={subStyle(mergedTheme)}>
              ID: {item.id}
              {item.category ? ` / ${item.category}` : ""}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function normalizeItemListTheme(theme) {
  return {
    text: theme?.text ?? theme?.pageText ?? "#111827",
    subText: theme?.subText ?? theme?.mutedText ?? "#666",
    empty: theme?.mutedText ?? theme?.subText ?? "#666",
    rowBg: theme?.cardBg ?? "#fff",
    rowBorder: theme?.cardBorder ?? "#ddd",
    activeBorder: theme?.selectedBorder ?? theme?.primaryBorder ?? "#111",
    activeBg: theme?.selectedBg ?? "#f5f5f5",
  };
}

const listStyle = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const rowStyle = (theme) => ({
  textAlign: "left",
  padding: 12,
  border: `1px solid ${theme.rowBorder}`,
  borderRadius: 10,
  background: theme.rowBg,
  cursor: "pointer",
  width: "100%",
  minWidth: 0,
});

const activeRowStyle = (theme) => ({
  border: `1px solid ${theme.activeBorder}`,
  background: theme.activeBg,
});

const nameStyle = (theme) => ({
  fontWeight: 700,
  wordBreak: "break-word",
  color: theme.text,
});

const subStyle = (theme) => ({
  marginTop: 6,
  fontSize: 13,
  color: theme.subText,
  wordBreak: "break-word",
});

const emptyStyle = (theme) => ({
  padding: 16,
  color: theme.empty,
});

const loadingStyle = (theme) => ({
  color: theme.subText,
});
