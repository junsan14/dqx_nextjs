"use client";

import { useEffect, useMemo, useState } from "react";
import MonsterPicker from "@/components/admin/shared/MonsterPicker";

export default function ItemFormFields({
  form,
  setForm,
  errors = {},
  categories = [],
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeItemFieldTheme(theme), [theme]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <div style={wrapStyle}>
      <section style={sectionStyle(mergedTheme)}>
        <h3 style={sectionTitleStyle(mergedTheme)}>基本情報</h3>

        <div style={gridStyle(isMobile)}>
          <label style={labelStyle}>
            <span style={labelTextStyle(mergedTheme)}>名前</span>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              style={inputStyle(mergedTheme)}
              placeholder="アイテム名"
            />
            {errors.name ? <span style={errorStyle(mergedTheme)}>{errors.name}</span> : null}
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle(mergedTheme)}>カテゴリ</span>
            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              style={inputStyle(mergedTheme)}
              placeholder="素材 / 消費アイテム など"
              list="item-category-list"
            />
            <datalist id="item-category-list">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle(mergedTheme)}>買値</span>
            <input
              type="number"
              value={form.buy_price}
              onChange={(e) => updateField("buy_price", e.target.value)}
              style={inputStyle(mergedTheme)}
              placeholder="0"
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle(mergedTheme)}>売値</span>
            <input
              type="number"
              value={form.sell_price}
              onChange={(e) => updateField("sell_price", e.target.value)}
              style={inputStyle(mergedTheme)}
              placeholder="0"
            />
          </label>
        </div>
      </section>

      <section style={sectionStyle(mergedTheme)}>
        <h3 style={sectionTitleStyle(mergedTheme)}>このアイテムを落とすモンスター</h3>

        <MonsterPicker
          value={form.drop_monsters}
          defaultDropType="normal"
          enableDropTypeSelect={true}
          dropTypeOptions={[
            { value: "normal", label: "通常" },
            { value: "rare", label: "レア" },
          ]}
          titleWhenEmpty="まだ登録されていない"
          onChange={(rows) =>
            setForm((prev) => ({
              ...prev,
              drop_monsters: rows,
            }))
          }
        />
      </section>
    </div>
  );
}

function normalizeItemFieldTheme(theme) {
  return {
    sectionBg: theme?.cardBg ?? theme?.panelBg ?? "#ffffff",
    sectionBorder: theme?.cardBorder ?? theme?.panelBorder ?? "#e5e7eb",
    title: theme?.title ?? theme?.pageText ?? "#111827",
    label: theme?.subText ?? theme?.text ?? "#334155",
    inputBg: theme?.inputBg ?? "#ffffff",
    inputBorder: theme?.inputBorder ?? "#cbd5e1",
    inputText: theme?.inputText ?? "#111827",
    error: theme?.dangerText ?? "#c62828",
  };
}

const wrapStyle = {
  display: "grid",
  gap: 24,
  minWidth: 0,
};

const sectionStyle = (theme) => ({
  display: "grid",
  gap: 12,
  background: theme.sectionBg,
  border: `1px solid ${theme.sectionBorder}`,
  borderRadius: 14,
  padding: 16,
  minWidth: 0,
});

const sectionTitleStyle = (theme) => ({
  margin: 0,
  fontSize: 18,
  color: theme.title,
});

function gridStyle(isMobile) {
  return {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "minmax(0, 1fr)"
      : "repeat(2, minmax(0, 1fr))",
    gap: 12,
  };
}

const labelStyle = {
  display: "grid",
  gap: 8,
  fontSize: 14,
  minWidth: 0,
};

const labelTextStyle = (theme) => ({
  color: theme.label,
  fontWeight: 700,
});

const inputStyle = (theme) => ({
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  background: theme.inputBg,
  color: theme.inputText,
});

const errorStyle = (theme) => ({
  color: theme.error,
  fontSize: 13,
});
