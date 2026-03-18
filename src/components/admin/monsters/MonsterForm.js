"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function MonsterForm({
  monster,
  onChange,
  theme,
  parentCandidates = [],
  onSearchParents,
}) {
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const [parentKeyword, setParentKeyword] = useState(
    monster?.reincarnation_parent_name ?? ""
  );
  const [parentOpen, setParentOpen] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    setParentKeyword(monster?.reincarnation_parent_name ?? "");
  }, [monster?.reincarnation_parent_name, monster?.id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setParentOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!parentOpen) return;

    const keyword = String(parentKeyword ?? "").trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!keyword) {
      setLoadingParents(false);
      onSearchParents?.("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingParents(true);
        await onSearchParents?.(keyword);
      } finally {
        setLoadingParents(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [parentKeyword, parentOpen, onSearchParents]);

  const safeCandidates = useMemo(() => {
    const currentId = Number(monster?.id ?? 0);

    return (Array.isArray(parentCandidates) ? parentCandidates : [])
      .filter((row) => Number(row?.id ?? 0) > 0)
      .filter((row) => Number(row.id) !== currentId)
      .map((row) => ({
        id: Number(row.id),
        name: row.name ?? "",
        display_order: Number(row.display_order ?? row.monster_no ?? 0),
      }));
  }, [parentCandidates, monster?.id]);

  const patch = (key, value) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectParent = (row) => {
    onChange((prev) => ({
      ...prev,
      reincarnation_parent_id: row?.id ?? null,
      reincarnation_parent_name: row?.name ?? null,
      is_reincarnated: Boolean(row?.id),
    }));

    setParentKeyword(row?.name ?? "");
    setParentOpen(false);
  };

  const clearParent = () => {
    onChange((prev) => ({
      ...prev,
      reincarnation_parent_id: null,
      reincarnation_parent_name: null,
      is_reincarnated: false,
    }));

    setParentKeyword("");
    setParentOpen(false);
    onSearchParents?.("");
  };

  const handleParentInputChange = (event) => {
    const value = event.target.value;
    setParentKeyword(value);
    setParentOpen(true);

    onChange((prev) => ({
      ...prev,
      reincarnation_parent_id: null,
      reincarnation_parent_name: null,
      is_reincarnated: false,
    }));
  };

  const handleParentFocus = () => {
    setParentOpen(true);
  };

  const handleParentKeyDown = (event) => {
    if (event.key === "Escape") {
      setParentOpen(false);
    }
  };

  return (
    <section style={cardStyle(theme)}>
      <h2 style={titleStyle(theme)}>基本情報</h2>

      <div style={gridStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle(theme)}>表示順</span>
          <input
            type="number"
            min="1"
            value={monster?.display_order ?? ""}
            onChange={(e) => patch("display_order", Number(e.target.value || 0))}
            style={inputStyle(theme)}
          />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle(theme)}>名前</span>
          <input
            type="text"
            value={monster?.name ?? ""}
            onChange={(e) => patch("name", e.target.value)}
            style={inputStyle(theme)}
          />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle(theme)}>系統</span>
          <input
            type="text"
            value={monster?.system_type ?? ""}
            onChange={(e) => patch("system_type", e.target.value)}
            style={inputStyle(theme)}
          />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle(theme)}>参照URL</span>
          <input
            type="text"
            value={monster?.source_url ?? ""}
            onChange={(e) => patch("source_url", e.target.value)}
            style={inputStyle(theme)}
          />
        </label>

        <div
          ref={containerRef}
          style={{ ...fieldStyle, gridColumn: "1 / -1", position: "relative" }}
        >
          <span style={labelStyle(theme)}>転生元モンスター</span>

          <div style={searchRowStyle}>
            <input
              type="text"
              value={parentKeyword}
              onChange={handleParentInputChange}
              onFocus={handleParentFocus}
              onKeyDown={handleParentKeyDown}
              placeholder="モンスター名を入力して候補から選ぶ"
              style={inputStyle(theme)}
            />

            <button
              type="button"
              onClick={clearParent}
              style={clearButtonStyle(theme)}
            >
              クリア
            </button>
          </div>

          {parentOpen && (
            <div style={suggestionBoxStyle(theme)}>
              {loadingParents ? (
                <div style={suggestionEmptyStyle(theme)}>検索中...</div>
              ) : safeCandidates.length > 0 ? (
                safeCandidates.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => selectParent(row)}
                    style={suggestionItemStyle(theme)}
                  >
                    <span style={suggestionNameStyle(theme)}>{row.name}</span>
                    <span style={suggestionMetaStyle(theme)}>
                      {row.display_order > 0 ? `No.${row.display_order}` : ""}
                    </span>
                  </button>
                ))
              ) : (
                <div style={suggestionEmptyStyle(theme)}>候補なし</div>
              )}
            </div>
          )}
        </div>

        {monster?.reincarnation_parent_name && monster?.reincarnation_parent_id ? (
          <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <span style={labelStyle(theme)}>転生状態</span>
            <div style={badgeStyle(theme)}>
              転生モンスター / 元: {monster.reincarnation_parent_name}
            </div>
          </div>
        ) : (
          <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <span style={labelStyle(theme)}>転生状態</span>
            <div style={mutedBoxStyle(theme)}>通常モンスター</div>
          </div>
        )}
      </div>
    </section>
  );
}

const cardStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

const titleStyle = (theme) => ({
  margin: 0,
  fontSize: 18,
  color: theme.title,
});

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 0,
};

const labelStyle = (theme) => ({
  fontSize: 13,
  fontWeight: 700,
  color: theme.mutedText,
});

const inputStyle = (theme) => ({
  width: "100%",
  minHeight: 42,
  borderRadius: 10,
  border: `1px solid ${theme.softBorder}`,
  background: theme.softBg,
  color: theme.text,
  padding: "10px 12px",
  outline: "none",
});

const searchRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
};

const clearButtonStyle = (theme) => ({
  minHeight: 42,
  borderRadius: 10,
  border: `1px solid ${theme.softBorder}`,
  background: theme.cardBg,
  color: theme.text,
  padding: "0 12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const suggestionBoxStyle = (theme) => ({
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  marginTop: 6,
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 12,
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  overflow: "hidden",
  zIndex: 30,
  maxHeight: 280,
  overflowY: "auto",
});

const suggestionItemStyle = (theme) => ({
  width: "100%",
  border: "none",
  borderBottom: `1px solid ${theme.softBorder}`,
  background: "transparent",
  color: theme.text,
  padding: "10px 12px",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
});

const suggestionNameStyle = (theme) => ({
  color: theme.text,
  fontWeight: 600,
});

const suggestionMetaStyle = (theme) => ({
  color: theme.mutedText,
  fontSize: 12,
  flexShrink: 0,
});

const suggestionEmptyStyle = (theme) => ({
  padding: "12px",
  color: theme.mutedText,
});

const badgeStyle = (theme) => ({
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  borderRadius: 10,
  border: `1px solid ${theme.selectedBorder}`,
  background: theme.selectedBg,
  color: theme.text,
  padding: "10px 12px",
  fontWeight: 700,
});

const mutedBoxStyle = (theme) => ({
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  borderRadius: 10,
  border: `1px solid ${theme.softBorder}`,
  background: theme.softBg,
  color: theme.mutedText,
  padding: "10px 12px",
});