"use client";

import { useEffect, useMemo, useState } from "react";
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
  isMobile = false,
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeAccessoryTheme(theme), [theme]);

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
        effects_json: Array.isArray(initialData.effects_json)
          ? initialData.effects_json
          : [],
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
    <form onSubmit={handleSubmit} style={formStyle(mergedTheme)}>
      <div style={headerStyle(isMobile)}>
        <h2 style={headingStyle(mergedTheme)}>
          {mode === "edit" ? "アクセサリ編集" : "アクセサリ新規作成"}
        </h2>

        <div style={actionStyle(isMobile)}>
          <button
            type="submit"
            disabled={saving}
            style={saveButtonStyle(isMobile, mergedTheme)}
          >
            {saving ? "保存中..." : "保存"}
          </button>

          {mode === "edit" ? (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              style={deleteButtonStyle(isMobile, mergedTheme)}
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={gridStyle(isMobile)}>
        <Field label="アイテムID" theme={mergedTheme}>
          <input
            value={form.item_id}
            onChange={(e) => updateField("item_id", e.target.value)}
            style={inputStyle(mergedTheme)}
          />
        </Field>

        <Field label="名前" theme={mergedTheme}>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            style={inputStyle(mergedTheme)}
          />
        </Field>

        <Field label="部位" theme={mergedTheme}>
          <>
            <input
              list="accessory-slot-list"
              value={form.slot}
              onChange={(e) => updateField("slot", e.target.value)}
              style={inputStyle(mergedTheme)}
            />
            <datalist id="accessory-slot-list">
              {slots.map((slot) => (
                <option key={slot} value={slot} />
              ))}
            </datalist>
          </>
        </Field>

        <Field label="アクセサリータイプ" theme={mergedTheme}>
          <>
            <input
              list="accessory-type-list"
              value={form.accessory_type}
              onChange={(e) => updateField("accessory_type", e.target.value)}
              style={inputStyle(mergedTheme)}
            />
            <datalist id="accessory-type-list">
              {accessoryTypes.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </>
        </Field>
      </div>

      <Field label="説明" theme={mergedTheme}>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          style={textareaStyle(mergedTheme)}
        />
      </Field>

      <Field label="効果" theme={mergedTheme}>
        <textarea
          rows={5}
          value={arrayToText(form.effects_json)}
          onChange={(e) => updateField("effects_json", textToArray(e.target.value))}
          style={textareaStyle(mergedTheme)}
        />
      </Field>

      <Field label="付く合成効果" theme={mergedTheme}>
        <textarea
          rows={5}
          value={arrayToText(form.synthesis_effects_json)}
          onChange={(e) =>
            updateField("synthesis_effects_json", textToArray(e.target.value))
          }
          style={textareaStyle(mergedTheme)}
        />
      </Field>

      <Field label="補足" theme={mergedTheme}>
        <textarea
          rows={5}
          value={arrayToText(form.obtain_methods_json)}
          onChange={(e) =>
            updateField("obtain_methods_json", textToArray(e.target.value))
          }
          style={textareaStyle(mergedTheme)}
        />
      </Field>

      <Field label="落とすモンスター" theme={mergedTheme}>
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

function Field({ label, children, theme }) {
  return (
    <label style={fieldStyle}>
      <div style={labelStyle(theme)}>{label}</div>
      {children}
    </label>
  );
}

function normalizeAccessoryTheme(theme) {
  return {
    text: theme?.text ?? theme?.pageText ?? "#111827",
    heading: theme?.title ?? "#111827",
    label: theme?.subText ?? theme?.text ?? "#334155",
    inputBg: theme?.inputBg ?? "#ffffff",
    inputBorder: theme?.inputBorder ?? "#cbd5e1",
    inputText: theme?.inputText ?? "#111827",
    saveBg: theme?.primaryBg ?? "#111111",
    saveText: theme?.primaryText ?? "#ffffff",
    saveBorder: theme?.primaryBorder ?? "#111111",
    deleteBg: theme?.dangerBg ?? "#ffffff",
    deleteText: theme?.dangerText ?? "#b91c1c",
    deleteBorder: theme?.dangerBorder ?? "#ef4444",
  };
}

const formStyle = (theme) => ({
  display: "grid",
  gap: 16,
  minWidth: 0,
  color: theme.text,
});

const headerStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  justifyContent: "space-between",
  alignItems: isMobile ? "stretch" : "center",
  gap: 12,
});

const headingStyle = (theme) => ({
  margin: 0,
  lineHeight: 1.3,
  color: theme.heading,
});

const actionStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  gap: 8,
  width: isMobile ? "100%" : "auto",
});

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

const labelStyle = (theme) => ({
  fontWeight: 700,
  fontSize: 14,
  color: theme.label,
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

const textareaStyle = (theme) => ({
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  resize: "vertical",
  background: theme.inputBg,
  color: theme.inputText,
});

const saveButtonStyle = (isMobile, theme) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.saveBorder}`,
  background: theme.saveBg,
  color: theme.saveText,
  cursor: "pointer",
  width: isMobile ? "100%" : "auto",
  fontWeight: 700,
});

const deleteButtonStyle = (isMobile, theme) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.deleteBorder}`,
  background: theme.deleteBg,
  color: theme.deleteText,
  cursor: "pointer",
  width: isMobile ? "100%" : "auto",
  fontWeight: 700,
});
