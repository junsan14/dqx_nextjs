"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonsterImageCropper from "./MonsterImageCropper";
import { getMonsterAssetUrl } from "@/lib/monsters";

export default function MonsterForm({
  monster,
  onChange,
  parentCandidates = [],
  onSearchParents,
  disabled = false,
  defaultOpen = false,
  children = null,
}) {
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const [parentKeyword, setParentKeyword] = useState(
    monster?.reincarnation_parent_name ?? ""
  );
  const [parentOpen, setParentOpen] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

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
    if (!parentOpen || disabled) return;

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
  }, [parentKeyword, parentOpen, onSearchParents, disabled]);

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
    if (disabled) return;

    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectParent = (row) => {
    if (disabled) return;

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
    if (disabled) return;

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
    if (disabled) return;

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
    if (disabled) return;
    setParentOpen(true);
  };

  const handleParentKeyDown = (event) => {
    if (event.key === "Escape") {
      setParentOpen(false);
    }
  };

  return (
    <section style={cardStyle()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={accordionButtonStyle()}
        aria-expanded={open}
      >
        <div style={accordionHeaderMainStyle}>
          <h2 style={titleStyle()}>基本情報</h2>
        </div>

        <div style={accordionRightStyle}>
          <span style={accordionHintStyle()}>
            {open ? "閉じる" : "開く"}
          </span>
          <span style={accordionIconStyle(open)}>⌄</span>
        </div>
      </button>

      {open && (
        <div style={accordionBodyStyle}>
          <div style={gridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle()}>表示順</span>
              <input
                type="number"
                min="1"
                value={monster?.display_order ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  patch("display_order", Number(e.target.value || 0))
                }
                style={inputStyle(disabled)}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle()}>名前</span>
              <input
                type="text"
                value={monster?.name ?? ""}
                disabled={disabled}
                onChange={(e) => patch("name", e.target.value)}
                style={inputStyle(disabled)}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle()}>系統</span>
              <input
                type="text"
                value={monster?.system_type ?? ""}
                disabled={disabled}
                onChange={(e) => patch("system_type", e.target.value)}
                style={inputStyle(disabled)}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle()}>参照URL</span>
              <input
                type="text"
                value={monster?.source_url ?? ""}
                disabled={disabled}
                onChange={(e) => patch("source_url", e.target.value)}
                style={inputStyle(disabled)}
              />
            </label>

            <div
              ref={containerRef}
              style={{
                ...fieldStyle,
                gridColumn: "1 / -1",
                position: "relative",
              }}
            >
              <span style={labelStyle()}>転生元モンスター</span>

              <div style={searchRowStyle}>
                <input
                  type="text"
                  value={parentKeyword}
                  disabled={disabled}
                  onChange={handleParentInputChange}
                  onFocus={handleParentFocus}
                  onKeyDown={handleParentKeyDown}
                  placeholder="モンスター名を入力して候補から選ぶ"
                  style={inputStyle(disabled)}
                />

                <button
                  type="button"
                  onClick={clearParent}
                  disabled={disabled}
                  style={clearButtonStyle(disabled)}
                >
                  クリア
                </button>
              </div>

              {!disabled && parentOpen && (
                <div style={suggestionBoxStyle()}>
                  {loadingParents ? (
                    <div style={suggestionEmptyStyle()}>検索中...</div>
                  ) : safeCandidates.length > 0 ? (
                    safeCandidates.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => selectParent(row)}
                        style={suggestionItemStyle()}
                      >
                        <span style={suggestionNameStyle()}>{row.name}</span>
                        <span style={suggestionMetaStyle()}>
                          {row.display_order > 0 ? `No.${row.display_order}` : ""}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div style={suggestionEmptyStyle()}>候補なし</div>
                  )}
                </div>
              )}
            </div>

            {monster?.reincarnation_parent_name && monster?.reincarnation_parent_id ? (
              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <span style={labelStyle()}>転生状態</span>
                <div style={badgeStyle()}>
                  転生モンスター / 元: {monster.reincarnation_parent_name}
                </div>
              </div>
            ) : (
              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <span style={labelStyle()}>転生状態</span>
                <div style={mutedBoxStyle()}>通常モンスター</div>
              </div>
            )}
          </div>
          <div style={embeddedSectionStyle()}>
            <MonsterImageCropper
              value={
                monster?.image_preview_url ||
                getMonsterAssetUrl(monster?.image_path || "")
              }
              aspect={1}
              disabled={disabled}
              onApply={({ file, previewUrl }) =>
                onChange((prev) => ({
                  ...prev,
                  image_file: file,
                  image_preview_url: previewUrl,
                  remove_image: false,
                }))
              }
            />
          </div>

          {children ? (
            <div style={embeddedSectionStyle()}>
              {children}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

const cardStyle = () => ({
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 0,
});

const accordionButtonStyle = () => ({
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  cursor: "pointer",
  textAlign: "left",
});

const accordionHeaderMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  minWidth: 0,
};

const accordionRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const accordionHintStyle = () => ({
  color: "var(--text-muted)",
  fontSize: 12,
  fontWeight: 700,
});

const accordionIconStyle = (open) => ({
  color: "var(--text-muted)",
  fontSize: 18,
  lineHeight: 1,
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 0.2s ease",
});

const accordionBodyStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginTop: 16,
};

const embeddedSectionStyle = () => ({
  borderTop: "1px solid var(--soft-border)",
  paddingTop: 16,
});

const titleStyle = () => ({
  margin: 0,
  fontSize: 18,
  color: "var(--text-title)",
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

const labelStyle = () => ({
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-muted)",
});

const inputStyle = (disabled = false) => ({
  width: "100%",
  minHeight: 42,
  borderRadius: 10,
  border: "1px solid var(--soft-border)",
  background: disabled ? "var(--input-disabled-bg)" : "var(--soft-bg)",
  color: disabled ? "var(--text-muted)" : "var(--text-main)",
  padding: "10px 12px",
  outline: "none",
  cursor: disabled ? "not-allowed" : "text",
  opacity: disabled ? 0.8 : 1,
});

const searchRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
};

const clearButtonStyle = (disabled = false) => ({
  minHeight: 42,
  borderRadius: 10,
  border: "1px solid var(--soft-border)",
  background: disabled ? "var(--input-disabled-bg)" : "var(--card-bg)",
  color: disabled ? "var(--text-muted)" : "var(--text-main)",
  padding: "0 12px",
  cursor: disabled ? "not-allowed" : "pointer",
  whiteSpace: "nowrap",
  opacity: disabled ? 0.8 : 1,
});

const suggestionBoxStyle = () => ({
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  marginTop: 6,
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: 12,
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  overflow: "hidden",
  zIndex: 30,
  maxHeight: 280,
  overflowY: "auto",
});

const suggestionItemStyle = () => ({
  width: "100%",
  border: "none",
  borderBottom: "1px solid var(--soft-border)",
  background: "transparent",
  color: "var(--text-main)",
  padding: "10px 12px",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
});

const suggestionNameStyle = () => ({
  color: "var(--text-main)",
  fontWeight: 600,
});

const suggestionMetaStyle = () => ({
  color: "var(--text-muted)",
  fontSize: 12,
  flexShrink: 0,
});

const suggestionEmptyStyle = () => ({
  padding: "12px",
  color: "var(--text-muted)",
});

const badgeStyle = () => ({
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  borderRadius: 10,
  border: "1px solid var(--selected-border)",
  background: "var(--selected-bg)",
  color: "var(--text-main)",
  padding: "10px 12px",
  fontWeight: 700,
});

const mutedBoxStyle = () => ({
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  borderRadius: 10,
  border: "1px solid var(--soft-border)",
  background: "var(--soft-bg)",
  color: "var(--text-muted)",
  padding: "10px 12px",
});