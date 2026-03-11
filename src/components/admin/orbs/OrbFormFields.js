"use client";

import MonsterPicker from "@/components/admin/shared/MonsterPicker";
import { ORB_COLORS } from "@/lib/orbs";

export default function OrbFormFields({
  form,
  setForm,
  errors = {},
}) {
  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="name">名前</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          style={inputStyle}
          placeholder="例: 炎の宝珠"
        />
        {errors.name ? <div style={errorStyle}>{errors.name}</div> : null}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="color">色</label>
        <select
          id="color"
          name="color"
          value={form.color}
          onChange={onChange}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {ORB_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        {errors.color ? <div style={errorStyle}>{errors.color}</div> : null}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="effect">効果</label>
        <textarea
          id="effect"
          name="effect"
          value={form.effect}
          onChange={onChange}
          rows={8}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder="効果を入力"
        />
        {errors.effect ? <div style={errorStyle}>{errors.effect}</div> : null}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <label>落とすモンスター</label>

        <MonsterPicker
          value={form.drop_monsters}
          defaultDropType="orb"
          enableDropTypeSelect={false}
          dropTypeOptions={[]}
          titleWhenEmpty="まだ登録されていない"
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

const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 16,
  boxSizing: "border-box",
};

const errorStyle = {
  color: "#c62828",
  fontSize: 13,
};