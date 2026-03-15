"use client";

import { useMemo } from "react";

export default function OrbList({
  orbs = [],
  selectedId,
  onSelect,
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeOrbListTheme(theme), [theme]);

  if (!orbs.length) {
    return <div style={emptyStyle(mergedTheme)}>オーブがない</div>;
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
              ...itemStyle(mergedTheme),
              ...(active ? activeItemStyle(mergedTheme) : {}),
            }}
          >
            <div style={nameStyle(mergedTheme)}>{orb.name}</div>
            <div style={metaStyle(mergedTheme)}>
              {orb.color || "色なし"} / ID: {orb.id}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function normalizeOrbListTheme(theme) {
  return {
    empty: theme?.mutedText ?? theme?.subText ?? "#666",
    itemBg: theme?.cardBg ?? theme?.panelBg ?? "#fff",
    itemBorder: theme?.cardBorder ?? theme?.panelBorder ?? "#ddd",
    itemText: theme?.text ?? theme?.pageText ?? "#111827",
    metaText: theme?.subText ?? "#666",
    activeBorder: theme?.selectedBorder ?? theme?.primaryBorder ?? "#111",
    activeBg: theme?.selectedBg ?? "#f3f7ff",
  };
}

const listWrapStyle = {
  display: "grid",
  gap: 8,
  padding: 8,
};

const emptyStyle = (theme) => ({
  padding: 16,
  color: theme.empty,
});

const itemStyle = (theme) => ({
  display: "grid",
  gap: 4,
  width: "100%",
  textAlign: "left",
  padding: 12,
  border: `1px solid ${theme.itemBorder}`,
  borderRadius: 10,
  background: theme.itemBg,
  cursor: "pointer",
  color: theme.itemText,
});

const activeItemStyle = (theme) => ({
  background: theme.activeBg,
  borderColor: theme.activeBorder,
});

const nameStyle = (theme) => ({
  fontSize: 15,
  fontWeight: 700,
  wordBreak: "break-word",
  color: theme.itemText,
});

const metaStyle = (theme) => ({
  fontSize: 12,
  color: theme.metaText,
  wordBreak: "break-word",
});
