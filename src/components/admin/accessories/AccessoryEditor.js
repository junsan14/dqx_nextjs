"use client";

import MonsterPicker from "@/components/admin/shared/MonsterPicker";

const DROP_TYPE_OPTIONS = [
  { value: "normal", label: "通常" },
  { value: "rare", label: "レア" },
  { value: "steal", label: "ぬすむ" },
  { value: "other", label: "その他" },
];

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 700 }}>{label}</div>
      {children}
    </label>
  );
}

export default function AccessoryEditor({
  row,
  saving,
  deleting,
  onChange,
  onSave,
  onDelete,
}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{row.name || "未命名アクセサリ"}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </button>
          <button onClick={onDelete} disabled={deleting}>
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <Field label="名前">
          <input
            value={row.name ?? ""}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>

        <Field label="かな">
          <input
            value={row.kana ?? ""}
            onChange={(e) => onChange({ kana: e.target.value })}
          />
        </Field>

        <Field label="スロット">
          <input
            value={row.slot ?? ""}
            onChange={(e) => onChange({ slot: e.target.value })}
            placeholder="顔 / 首 / 指 / 他"
          />
        </Field>

        <Field label="カテゴリ">
          <input
            value={row.category ?? ""}
            onChange={(e) => onChange({ category: e.target.value })}
          />
        </Field>

        <Field label="レアリティ">
          <input
            type="number"
            value={row.rarity ?? ""}
            onChange={(e) => onChange({ rarity: e.target.value })}
          />
        </Field>

        <Field label="買値">
          <input
            type="number"
            value={row.buy_price ?? ""}
            onChange={(e) => onChange({ buy_price: e.target.value })}
          />
        </Field>

        <Field label="売値">
          <input
            type="number"
            value={row.sell_price ?? ""}
            onChange={(e) => onChange({ sell_price: e.target.value })}
          />
        </Field>

        <Field label="参照URL">
          <input
            value={row.source_url ?? ""}
            onChange={(e) => onChange({ source_url: e.target.value })}
          />
        </Field>
      </div>

      <Field label="効果テキスト">
        <textarea
          rows={4}
          value={row.effect_text ?? ""}
          onChange={(e) => onChange({ effect_text: e.target.value })}
        />
      </Field>

      <Field label="説明">
        <textarea
          rows={4}
          value={row.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>

      <Field label="メモ">
        <textarea
          rows={4}
          value={row.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Field>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>落とすモンスター</div>

        <MonsterPicker
          value={row.drop_monsters ?? []}
          onChange={(nextRows) => onChange({ drop_monsters: nextRows })}
          defaultDropType="normal"
          dropTypeOptions={DROP_TYPE_OPTIONS}
          enableDropTypeSelect={true}
          titleWhenEmpty="まだモンスターが登録されていない"
        />
      </div>
    </div>
  );
}