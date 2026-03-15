"use client";

import { useEffect, useMemo, useState } from "react";
import OrbFormFields from "./OrbFormFields";
import { createOrb, deleteOrb, updateOrb } from "@/lib/orbs";

export default function OrbForm({
  initialData = null,
  mode = "create",
  onSaved,
  onDeleted,
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeOrbTheme(theme), [theme]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    color: "",
    effect: "",
    drop_monsters: [],
  });

  useEffect(() => {
    setForm({
      name: initialData?.name ?? "",
      color: initialData?.color ?? "",
      effect: initialData?.effect ?? "",
      drop_monsters: (initialData?.drop_monsters ?? []).map((row, index) => ({
        id: row.id ?? null,
        monster_id: row.monster_id,
        sort_order: row.sort_order || index + 1,
        monster: row.monster || null,
      })),
    });
    setMessage("");
    setErrors({});
  }, [initialData]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        color: form.color || null,
        effect: form.effect.trim() || null,
        drop_monsters: form.drop_monsters.map((row, index) => ({
          monster_id: row.monster_id,
          drop_type: "orb",
          sort_order: index + 1,
        })),
      };

      const nextErrors = {};
      if (!payload.name) nextErrors.name = "名前は必須";
      if (!payload.color) nextErrors.color = "色は必須";

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setSaving(false);
        return;
      }

      let saved;

      if (mode === "edit" && initialData?.id) {
        saved = await updateOrb(initialData.id, payload);
        setMessage("更新した");
        alert("更新した");
      } else {
        saved = await createOrb(payload);
        setMessage("新規追加した");
        alert("新規追加した");
      }

      if (onSaved) {
        await onSaved(saved);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "保存失敗");
      alert(error.message || "保存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function onClickDelete() {
    if (!initialData?.id) return;

    const ok = window.confirm(`「${initialData.name}」を削除する?`);
    if (!ok) return;

    setDeleting(true);
    setMessage("");

    try {
      await deleteOrb(initialData.id);
      setMessage("削除した");
      alert("削除した");

      if (onDeleted) {
        await onDeleted(initialData.id);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "削除失敗");
      alert(error.message || "削除失敗");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={formWrapStyle}>
      <div style={headerStyle}>
        <div style={{ minWidth: 0 }}>
          <h2 style={titleStyle(mergedTheme)}>
            {mode === "edit" ? "オーブ編集" : "オーブ新規追加"}
          </h2>
          {initialData?.id ? (
            <div style={idStyle(mergedTheme)}>ID: {initialData.id}</div>
          ) : null}
        </div>
      </div>

      <OrbFormFields
        form={form}
        setForm={setForm}
        errors={errors}
        theme={theme}
      />

      <div style={actionsStyle}>
        <button type="submit" disabled={saving} style={saveButtonStyle(mergedTheme)}>
          {saving ? "保存中..." : mode === "edit" ? "更新する" : "新規追加する"}
        </button>

        {mode === "edit" && initialData?.id ? (
          <button
            type="button"
            disabled={deleting}
            onClick={onClickDelete}
            style={deleteButtonStyle(mergedTheme)}
          >
            {deleting ? "削除中..." : "削除"}
          </button>
        ) : null}

        {message ? <div style={messageStyle(mergedTheme)}>{message}</div> : null}
      </div>
    </form>
  );
}

function normalizeOrbTheme(theme) {
  return {
    title: theme?.title ?? theme?.pageText ?? "#111827",
    subText: theme?.subText ?? theme?.mutedText ?? "#666",
    message: theme?.subText ?? theme?.text ?? "#334155",
    primaryBg: theme?.primaryBg ?? "#111",
    primaryText: theme?.primaryText ?? "#fff",
    primaryBorder: theme?.primaryBorder ?? "#111",
    dangerBg: theme?.dangerBg ?? "#fff",
    dangerText: theme?.dangerText ?? "#c62828",
    dangerBorder: theme?.dangerBorder ?? "#c62828",
  };
}

const formWrapStyle = {
  display: "grid",
  gap: 20,
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const titleStyle = (theme) => ({
  margin: 0,
  fontSize: 22,
  color: theme.title,
});

const idStyle = (theme) => ({
  marginTop: 6,
  fontSize: 13,
  color: theme.subText,
});

const actionsStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const saveButtonStyle = (theme) => ({
  padding: "10px 16px",
  borderRadius: 8,
  border: `1px solid ${theme.primaryBorder}`,
  background: theme.primaryBg,
  color: theme.primaryText,
  cursor: "pointer",
  fontWeight: 700,
});

const deleteButtonStyle = (theme) => ({
  padding: "10px 16px",
  borderRadius: 8,
  border: `1px solid ${theme.dangerBorder}`,
  background: theme.dangerBg,
  color: theme.dangerText,
  cursor: "pointer",
  fontWeight: 700,
});

const messageStyle = (theme) => ({
  fontSize: 14,
  color: theme.message,
});
