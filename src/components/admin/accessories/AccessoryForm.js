"use client";

import { useEffect, useState } from "react";
import MonsterPicker from "@/components/admin/shared/MonsterPicker";

const DROP_TYPE_OPTIONS = [
  { value: "normal", label: "通常" },
  { value: "rare", label: "レア" },
  { value: "steal", label: "ぬすむ" },
  { value: "other", label: "その他" },
];

function createEmptyForm() {
  return {
    id: null,
    item_id: "",
    name: "",
    item_kind: "accessory",
    slot: "",
    accessory_type: "",
    equip_level: "",
    description: "",
    effects_json: [],
    synthesis_effects_json: [],
    obtain_methods_json: [],
    image_url: "",
    source_url: "",
    detail_url: "",
    drop_monsters: [],
  };
}

function arrayToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToArray(value) {
  return String(value)
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AccessoryForm({
  accessory,
  onChange,
  slots = [],
  accessoryTypes = [],
  isMobile = false,
}) {
  const [form, setForm] = useState(createEmptyForm());

  useEffect(() => {
    if (accessory) {
      setForm({
        id: accessory.id ?? null,
        item_id: accessory.item_id ?? "",
        name: accessory.name ?? "",
        item_kind: accessory.item_kind ?? "accessory",
        slot: accessory.slot ?? "",
        accessory_type: accessory.accessory_type ?? "",
        equip_level:
          accessory.equip_level === null || accessory.equip_level === undefined
            ? ""
            : accessory.equip_level,
        description: accessory.description ?? "",
        effects_json: Array.isArray(accessory.effects_json)
          ? accessory.effects_json
          : [],
        synthesis_effects_json: Array.isArray(accessory.synthesis_effects_json)
          ? accessory.synthesis_effects_json
          : [],
        obtain_methods_json: Array.isArray(accessory.obtain_methods_json)
          ? accessory.obtain_methods_json
          : [],
        image_url: accessory.image_url ?? "",
        source_url: accessory.source_url ?? "",
        detail_url: accessory.detail_url ?? "",
        drop_monsters: Array.isArray(accessory.drop_monsters)
          ? accessory.drop_monsters
          : [],
      });
      return;
    }

    setForm(createEmptyForm());
  }, [accessory]);

  function updateForm(nextForm) {
    setForm(nextForm);
    onChange?.(nextForm);
  }

  function updateField(key, value) {
    updateForm({
      ...form,
      [key]: value,
    });
  }

  return (
    <div style={formStyle}>
      <div style={headerStyle(isMobile)}>
        <h2 style={headingStyle}>
          {form?.id ? "アクセサリ編集" : "アクセサリ新規作成"}
        </h2>
      </div>

      <div style={gridStyle(isMobile)}>
        <Field label="アイテムID">
          <input
            value={form.item_id}
            onChange={(e) => updateField("item_id", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="名前">
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="部位">
          <>
            <input
              list="accessory-slot-list"
              value={form.slot}
              onChange={(e) => updateField("slot", e.target.value)}
              style={inputStyle}
            />
            <datalist id="accessory-slot-list">
              {slots.map((slot) => (
                <option key={slot} value={slot} />
              ))}
            </datalist>
          </>
        </Field>

        <Field label="アクセサリータイプ">
          <>
            <input
              list="accessory-type-list"
              value={form.accessory_type}
              onChange={(e) => updateField("accessory_type", e.target.value)}
              style={inputStyle}
            />
            <datalist id="accessory-type-list">
              {accessoryTypes.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </>
        </Field>
      </div>

      <Field label="装備レベル">
        <input
          type="number"
          value={form.equip_level}
          onChange={(e) => updateField("equip_level", e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="説明">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          style={textareaStyle}
        />
      </Field>

      <Field label="効果">
        <textarea
          rows={5}
          value={arrayToText(form.effects_json)}
          onChange={(e) => updateField("effects_json", textToArray(e.target.value))}
          style={textareaStyle}
        />
      </Field>

      <Field label="付く合成効果">
        <textarea
          rows={5}
          value={arrayToText(form.synthesis_effects_json)}
          onChange={(e) =>
            updateField("synthesis_effects_json", textToArray(e.target.value))
          }
          style={textareaStyle}
        />
      </Field>

      <Field label="補足">
        <textarea
          rows={5}
          value={arrayToText(form.obtain_methods_json)}
          onChange={(e) =>
            updateField("obtain_methods_json", textToArray(e.target.value))
          }
          style={textareaStyle}
        />
      </Field>

      <Field label="画像URL">
        <input
          value={form.image_url}
          onChange={(e) => updateField("image_url", e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="参照元URL">
        <input
          value={form.source_url}
          onChange={(e) => updateField("source_url", e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="詳細URL">
        <input
          value={form.detail_url}
          onChange={(e) => updateField("detail_url", e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="落とすモンスター">
        <MonsterPicker
          value={form.drop_monsters ?? []}
          onChange={(nextRows) => updateField("drop_monsters", nextRows)}
          defaultDropType="normal"
          dropTypeOptions={DROP_TYPE_OPTIONS}
          enableDropTypeSelect={true}
          titleWhenEmpty="まだモンスターが登録されていない"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={fieldStyle}>
      <div style={labelStyle}>{label}</div>
      {children}
    </label>
  );
}

const formStyle = {
  display: "grid",
  gap: 16,
  minWidth: 0,
  color: "var(--text-main)",
};

const headerStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  justifyContent: "space-between",
  alignItems: isMobile ? "stretch" : "center",
  gap: 12,
});

const headingStyle = {
  margin: 0,
  lineHeight: 1.3,
  color: "var(--text-title)",
};

const gridStyle = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
  gap: 12,
});

const fieldStyle = {
  display: "grid",
  gap: 6,
  minWidth: 0,
};

const labelStyle = {
  fontWeight: 700,
  fontSize: 14,
  color: "var(--text-sub)",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  border: "1px solid var(--input-border)",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  background: "var(--input-bg)",
  color: "var(--input-text)",
};

const textareaStyle = {
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  border: "1px solid var(--input-border)",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  resize: "vertical",
  background: "var(--input-bg)",
  color: "var(--input-text)",
};