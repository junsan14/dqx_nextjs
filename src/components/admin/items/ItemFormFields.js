"use client";

import MonsterPicker from "@/components/admin/shared/MonsterPicker";

export default function ItemFormFields({
  form,
  setForm,
  errors = {},
  categories = [],
}) {
  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }
console.log(form)
  return (
    <div style={wrapStyle}>
      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>基本情報</h3>

        <div style={gridStyle}>
          <label style={labelStyle}>
            <span>名前</span>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              style={inputStyle}
              placeholder="アイテム名"
            />
            {errors.name ? <span style={errorStyle}>{errors.name}</span> : null}
          </label>

          <label style={labelStyle}>
            <span>カテゴリ</span>
            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              style={inputStyle}
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
            <span>買値</span>
            <input
              type="number"
              value={form.buy_price}
              onChange={(e) => updateField("buy_price", e.target.value)}
              style={inputStyle}
              placeholder="0"
            />
          </label>

          <label style={labelStyle}>
            <span>売値</span>
            <input
              type="number"
              value={form.sell_price}
              onChange={(e) => updateField("sell_price", e.target.value)}
              style={inputStyle}
              placeholder="0"
            />
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>このアイテムを落とすモンスター</h3>

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

const wrapStyle = {
  display: "grid",
  gap: 24,
};

const sectionStyle = {
  display: "grid",
  gap: 12,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 18,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const labelStyle = {
  display: "grid",
  gap: 8,
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};

const errorStyle = {
  color: "#c62828",
  fontSize: 13,
};