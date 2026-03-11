"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAccessory, fetchAccessories } from "@/lib/accessories";
import AccessoryList from "./AccessoryList";
import AccessoryForm from "./AccessoryForm";

export default function AccessoriesEditorClient() {
  const [accessories, setAccessories] = useState([]);
  const [initialAccessories, setInitialAccessories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const slots = useMemo(() => {
    return [...new Set(
      initialAccessories
        .map((item) => (item.slot ?? "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "ja"));
  }, [initialAccessories]);

  const accessoryTypes = useMemo(() => {
    return [...new Set(
      initialAccessories
        .map((item) => (item.accessory_type ?? "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "ja"));
  }, [initialAccessories]);

  async function loadAccessories(q = "") {
    setLoading(true);
    try {
      const list = await fetchAccessories(q);
      setAccessories(list);

      if (!q) {
        setInitialAccessories(list);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "アクセサリ一覧取得失敗");
    } finally {
      setLoading(false);
    }
  }

  async function loadAccessoryDetail(id) {
    if (!id) {
      setSelectedAccessory(null);
      return;
    }

    setDetailLoading(true);
    try {
      const accessory = await fetchAccessory(id);
      setSelectedAccessory(accessory);
    } catch (error) {
      console.error(error);
      alert(error.message || "アクセサリ詳細取得失敗");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadAccessories("");
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedAccessory(null);
      return;
    }

    loadAccessoryDetail(selectedId);
  }, [selectedId]);

  async function handleSearch(e) {
    e.preventDefault();
    await loadAccessories(keyword);
  }

  async function handleSaved(saved) {
    await loadAccessories(keyword);
    await loadAccessories("");

    if (saved?.id) {
      setSelectedId(saved.id);
      await loadAccessoryDetail(saved.id);
    }
  }

  async function handleDeleted(deletedId) {
    await loadAccessories(keyword);
    await loadAccessories("");

    if (selectedId === deletedId) {
      setSelectedId(null);
      setSelectedAccessory(null);
    }
  }

  function handleClickNew() {
    setSelectedId(null);
    setSelectedAccessory(null);
  }

  return (
    <div style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={panelStyle}>
          <div style={listHeaderStyle}>
            <h1 style={{ margin: 0, fontSize: 24 }}>アクセサリ編集</h1>
            <button type="button" onClick={handleClickNew} style={newButtonStyle}>
              新規追加
            </button>
          </div>

          <form onSubmit={handleSearch} style={searchRowStyle}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="名前・種別・slotで検索"
              style={inputStyle}
            />
            <button type="submit" style={searchButtonStyle}>
              検索
            </button>
          </form>

          <AccessoryList
            accessories={accessories}
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
            <AccessoryForm
              mode={selectedId ? "edit" : "create"}
              initialData={selectedAccessory}
              slots={slots}
              accessoryTypes={accessoryTypes}
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