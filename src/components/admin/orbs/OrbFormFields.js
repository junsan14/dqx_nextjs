"use client";

import { useMemo } from "react";
import MonsterPicker from "@/components/admin/shared/MonsterPicker";
import { ORB_COLORS } from "@/lib/orbs";

export default function OrbFormFields({
  form,
  setForm,
  errors = {},
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeOrbFieldTheme(theme), [theme]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div style={wrapStyle}>
      <div style={fieldStyle}>
        <label htmlFor="name" style={labelStyle(mergedTheme)}>名前</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          style={inputStyle(mergedTheme)}
          placeholder="例: 炎の宝珠"
        />
        {errors.name ? <div style={errorStyle(mergedTheme)}>{errors.name}</div> : null}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="color" style={labelStyle(mergedTheme)}>色</label>
        <select
          id="color"
          name="color"
          value={form.color}
          onChange={onChange}
          style={inputStyle(mergedTheme)}
        >
          <option value="">選択してください</option>
          {ORB_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        {errors.color ? <div style={errorStyle(mergedTheme)}>{errors.color}</div> : null}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="effect" style={labelStyle(mergedTheme)}>効果</label>
        <textarea
          id="effect"
          name="effect"
          value={form.effect}
          onChange={onChange}
          rows={8}
          style={textareaStyle(mergedTheme)}
          placeholder="効果を入力"
        />
        {errors.effect ? <div style={errorStyle(mergedTheme)}>{errors.effect}</div> : null}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={labelStyle(mergedTheme)}>落とすモンスター</label>

        <MonsterPicker
          value={form.drop_monsters}
          defaultDropType="orb"
          enableDropTypeSelect={false}
          dropTypeOptions={[]}
          titleWhenEmpty="まだ登録されていない"
          theme={theme}
          onChange={(rows) =>
            setForm((prev) => ({
              ...prev,
              drop_monsters: rows.map((row, index) => ({
                ...row,
                drop_type: "orb",
                sort_order: index + 1,
              })),
            }))
          }
        />
      </div>
    </div>
  );
}

function normalizeOrbFieldTheme(theme) {
  return {
    label: theme?.subText ?? theme?.text ?? "#334155",
    inputBg: theme?.inputBg ?? "#ffffff",
    inputBorder: theme?.inputBorder ?? "#ccc",
    inputText: theme?.inputText ?? theme?.text ?? "#111827",
    error: theme?.dangerText ?? "#c62828",
  };
}

const wrapStyle = {
  display: "grid",
  gap: 20,
};

const fieldStyle = {
  display: "grid",
  gap: 6,
};

const labelStyle = (theme) => ({
  fontWeight: 700,
  color: theme.label,
  fontSize: 14,
});

const inputStyle = (theme) => ({
  width: "100%",
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 16,
  boxSizing: "border-box",
  background: theme.inputBg,
  color: theme.inputText,
});

const textareaStyle = (theme) => ({
  ...inputStyle(theme),
  resize: "vertical",
});

const errorStyle = (theme) => ({
  color: theme.error,
  fontSize: 13,
});
