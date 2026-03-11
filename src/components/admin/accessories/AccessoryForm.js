"use client";

import { useEffect, useState } from "react";
import {
  createAccessory,
  updateAccessory,
  deleteAccessory,
} from "@/lib/accessories";
import MonsterPicker from "@/components/admin/shared/MonsterPicker";

const DROP_TYPE_OPTIONS = [
  { value: "normal", label: "通常" },
  { value: "rare", label: "レア" },
  { value: "steal", label: "ぬすむ" },
  { value: "other", label: "その他" },
];

function createEmptyForm() {
  return {
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
  mode = "create",
  initialData = null,
  slots = [],
  accessoryTypes = [],
  onSaved,
  onDeleted,
}) {
  const [form, setForm] = useState(createEmptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        item_id: initialData.item_id ?? "",
        name: initialData.name ?? "",
        item_kind: initialData.item_kind ?? "accessory",
        slot: initialData.slot ?? "",
        accessory_type: initialData.accessory_type ?? "",
        equip_level: initialData.equip_level ?? "",
        description: initialData.description ?? "",
        effects_json: Array.isArray(initialData.effects_json) ? initialData.effects_json : [],
        synthesis_effects_json: Array.isArray(initialData.synthesis_effects_json)
          ? initialData.synthesis_effects_json
          : [],
        obtain_methods_json: Array.isArray(initialData.obtain_methods_json)
          ? initialData.obtain_methods_json
          : [],
        image_url: initialData.image_url ?? "",
        source_url: initialData.source_url ?? "",
        detail_url: initialData.detail_url ?? "",
        drop_monsters: Array.isArray(initialData.drop_monsters)
          ? initialData.drop_monsters
          : [],
      });
      return;
    }

    setForm(createEmptyForm());
  }, [mode, initialData]);

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
        equip_level:
          form.equip_level === "" || form.equip_level == null
            ? null
            : Number(form.equip_level),
      };

      const saved =
        mode === "edit" && initialData?.id
          ? await updateAccessory(initialData.id, payload)
          : await createAccessory(payload);

      alert(mode === "edit" ? "アクセサリを更新した" : "アクセサリを作成した");
      onSaved?.(saved);
    } catch (error) {
      console.error(error);
      alert(error.message || "保存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;

    const ok = window.confirm("このアクセサリを削除する？");
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteAccessory(initialData.id);
      alert("アクセサリを削除した");
      onDeleted?.(initialData.id);
    } catch (error) {
      console.error(error);
      alert(error.message || "削除失敗");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>
          {mode === "edit" ? "アクセサリ編集" : "アクセサリ新規作成"}
        </h2>

        <div style={actionStyle}>
          <button type="submit" disabled={saving} style={saveButtonStyle}>
            {saving ? "保存中..." : "保存"}
          </button>

          {mode === "edit" ? (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              style={deleteButtonStyle}
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={gridStyle}>
        <Field label="item_id">
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

        <Field label="item_kind">
          <input
            value={form.item_kind}
            onChange={(e) => updateField("item_kind", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="slot">
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

        <Field label="accessory_type">
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

        <Field label="equip_level">
          <input
            type="number"
            value={form.equip_level}
            onChange={(e) => updateField("equip_level", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="image_url">
          <input
            value={form.image_url}
            onChange={(e) => updateField("image_url", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="source_url">
          <input
            value={form.source_url}
            onChange={(e) => updateField("source_url", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="detail_url">
          <input
            value={form.detail_url}
            onChange={(e) => updateField("detail_url", e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="説明">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          style={textareaStyle}
        />
      </Field>

      <Field label="effects_json">
        <textarea
          rows={5}
          value={arrayToText(form.effects_json)}
          onChange={(e) => updateField("effects_json", textToArray(e.target.value))}
          style={textareaStyle}
        />
      </Field>

      <Field label="synthesis_effects_json">
        <textarea
          rows={5}
          value={arrayToText(form.synthesis_effects_json)}
          onChange={(e) =>
            updateField("synthesis_effects_json", textToArray(e.target.value))
          }
          style={textareaStyle}
        />
      </Field>

      <Field label="obtain_methods_json">
        <textarea
          rows={5}
          value={arrayToText(form.obtain_methods_json)}
          onChange={(e) =>
            updateField("obtain_methods_json", textToArray(e.target.value))
          }
          style={textareaStyle}
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
    </form>
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
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const actionStyle = {
  display: "flex",
  gap: 8,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const fieldStyle = {
  display: "grid",
  gap: 6,
};

const labelStyle = {
  fontWeight: 700,
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  resize: "vertical",
};

const saveButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

const deleteButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #c62828",
  background: "#fff",
  color: "#c62828",
  cursor: "pointer",
};