"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchItem, fetchItems } from "@/lib/items";
import ItemList from "./ItemList";
import ItemForm from "./ItemForm";

export default function ItemsEditorClient() {
  const [items, setItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const categories = useMemo(() => {
    return [...new Set(
      initialItems
        .map((item) => (item.category ?? "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "ja"));
  }, [initialItems]);

  async function loadItems(q = "") {
    setLoading(true);
    try {
      const list = await fetchItems(q);
      setItems(list);

      if (!q) {
        setInitialItems(list);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "アイテム一覧取得失敗");
    } finally {
      setLoading(false);
    }
  }

  async function loadItemDetail(id) {
    if (!id) {
      setSelectedItem(null);
      return;
    }

    setDetailLoading(true);
    try {
      const item = await fetchItem(id);
      setSelectedItem(item);
    } catch (error) {
      console.error(error);
      alert(error.message || "アイテム詳細取得失敗");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadItems("");
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }

    loadItemDetail(selectedId);
  }, [selectedId]);

  async function handleSearch(e) {
    e.preventDefault();
    await loadItems(keyword);
  }

  async function handleSaved(saved) {
    await loadItems(keyword);
    await loadItems("");

    if (saved?.id) {
      setSelectedId(saved.id);
      await loadItemDetail(saved.id);
    }
  }

  async function handleDeleted(deletedId) {
    await loadItems(keyword);
    await loadItems("");

    if (selectedId === deletedId) {
      setSelectedId(null);
      setSelectedItem(null);
    }
  }

  function handleClickNew() {
    setSelectedId(null);
    setSelectedItem(null);
  }

  return (
    <div style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={panelStyle}>
          <div style={listHeaderStyle}>
            <h1 style={{ margin: 0, fontSize: 24 }}>アイテム編集</h1>
            <button type="button" onClick={handleClickNew} style={newButtonStyle}>
              新規追加
            </button>
          </div>

          <form onSubmit={handleSearch} style={searchRowStyle}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="名前・カテゴリで検索"
              style={inputStyle}
            />
            <button type="submit" style={searchButtonStyle}>
              検索
            </button>
          </form>

          <ItemList
            items={items}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </aside>

      <main style={mainStyle}>
        <div style={panelStyle}>
          {detailLoading ? (
            <div>読み込み中...</div>
          ) : (
            <ItemForm
              mode={selectedId ? "edit" : "create"}
              initialData={selectedItem}
              categories={categories}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          )}
        </div>
      </main>
    </div>
  );
}

const pageStyle = {
  display: "grid",
  gridTemplateColumns: "360px 1fr",
  gap: 20,
  alignItems: "start",
};

const sidebarStyle = {
  minWidth: 0,
};

const mainStyle = {
  minWidth: 0,
};

const panelStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  background: "#fff",
  padding: 16,
};

const listHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};

const searchRowStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 12,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};

const searchButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const newButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #1976d2",
  background: "#fff",
  color: "#1976d2",
  cursor: "pointer",
  whiteSpace: "nowrap",
};