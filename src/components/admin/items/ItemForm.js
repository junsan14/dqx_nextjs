"use client";

import { useEffect, useMemo, useState } from "react";
import ItemFormFields from "./ItemFormFields";
import { createItem, deleteItem, updateItem } from "@/lib/items";

export default function ItemForm({
  initialData = null,
  mode = "create",
  categories = [],
  onSaved,
  onDeleted,
  theme,
}) {
  const mergedTheme = useMemo(() => normalizeItemTheme(theme), [theme]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    buy_price: "",
    sell_price: "",
    category: "",
    drop_monsters: [],
  });

  useEffect(() => {
    setForm({
      name: initialData?.name ?? "",
      buy_price: initialData?.buy_price ?? "",
      sell_price: initialData?.sell_price ?? "",
      category: initialData?.category ?? "",
      drop_monsters: (initialData?.drop_monsters ?? []).map((row, index) => ({
        id: row.id ?? null,
        monster_id: row.monster_id,
        drop_type: row.drop_type || "normal",
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
        buy_price:
          form.buy_price === "" || form.buy_price === null
            ? null
            : Number(form.buy_price),
        sell_price:
          form.sell_price === "" || form.sell_price === null
            ? null
            : Number(form.sell_price),
        category: form.category.trim() || null,
        drop_monsters: form.drop_monsters.map((row, index) => ({
          id: row.id ?? null,
          monster_id: row.monster_id,
          drop_type: row.drop_type === "rare" ? "rare" : "normal",
          sort_order: index + 1,
        })),
      };

      const nextErrors = {};
      if (!payload.name) nextErrors.name = "名前は必須";

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setSaving(false);
        return;
      }

      let saved;

      if (mode === "edit" && initialData?.id) {
        saved = await updateItem(initialData.id, payload);
        setMessage("更新した");
        alert("更新した");
      } else {
        saved = await createItem(payload);
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
      await deleteItem(initialData.id);
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
        <div>
          <h2 style={titleStyle(mergedTheme)}>
            {mode === "edit" ? "アイテム編集" : "アイテム新規追加"}
          </h2>
          {initialData?.id ? (
            <div style={idStyle(mergedTheme)}>ID: {initialData.id}</div>
          ) : null}
        </div>
      </div>

      <ItemFormFields
        form={form}
        setForm={setForm}
        errors={errors}
        categories={categories}
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

function normalizeItemTheme(theme) {
  return {
    title: theme?.title ?? theme?.pageText ?? "#111827",
    subText: theme?.subText ?? theme?.mutedText ?? "#64748b",
    message: theme?.subText ?? theme?.text ?? "#334155",
    primaryBg: theme?.primaryBg ?? "#111111",
    primaryText: theme?.primaryText ?? "#ffffff",
    primaryBorder: theme?.primaryBorder ?? "#111111",
    dangerBg: theme?.dangerBg ?? "#ffffff",
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
  minWidth: 0,
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
