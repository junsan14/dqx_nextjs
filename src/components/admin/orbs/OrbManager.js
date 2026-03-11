"use client";

import { useMemo, useState } from "react";
import OrbList from "./OrbList";
import OrbForm from "./OrbForm";
import { fetchOrb, fetchOrbs } from "@/lib/orbs";

export default function OrbManager({ initialOrbs = [] }) {
  const [orbs, setOrbs] = useState(initialOrbs);
  const [selectedOrb, setSelectedOrb] = useState(null);
  const [loadingOrb, setLoadingOrb] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [message, setMessage] = useState("");

  const selectedId = selectedOrb?.id ?? null;

  const sortedOrbs = useMemo(() => {
    return [...orbs].sort((a, b) => {
      if ((a.color || "") !== (b.color || "")) {
        return (a.color || "").localeCompare(b.color || "", "ja");
      }
      return (a.name || "").localeCompare(b.name || "", "ja");
    });
  }, [orbs]);

  async function handleSelectOrb(id) {
    setLoadingOrb(true);
    setMessage("");

    try {
      const orb = await fetchOrb(id);
      setSelectedOrb(orb);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "オーブ取得失敗");
    } finally {
      setLoadingOrb(false);
    }
  }

  async function handleNew() {
    setSelectedOrb(null);
    setMessage("");
  }

  async function handleSearch() {
    setLoadingList(true);
    setMessage("");

    try {
      const list = await fetchOrbs(search);
      setOrbs(list);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "一覧取得失敗");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleReloadAndSelect(savedOrb = null) {
    const list = await fetchOrbs(search);
    setOrbs(list);

    if (savedOrb?.id) {
      setSelectedOrb(savedOrb);
    } else {
      setSelectedOrb(null);
    }
  }

  async function handleDeleted(deletedId) {
    const next = orbs.filter((x) => x.id !== deletedId);
    setOrbs(next);

    if (selectedId === deletedId) {
      setSelectedOrb(null);
    }

    setMessage("削除した");
  }

  return (
    <div style={layoutStyle}>
      <aside style={sidebarStyle}>
        <div style={toolbarStyle}>
          <button type="button" onClick={handleNew} style={newButtonStyle}>
            ＋ 新規追加
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="名前・色で検索"
              style={searchInputStyle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loadingList}
              style={searchButtonStyle}
            >
              {loadingList ? "検索中..." : "検索"}
            </button>
          </div>
        </div>

        <OrbList
          orbs={sortedOrbs}
          selectedId={selectedId}
          onSelect={handleSelectOrb}
        />
      </aside>

      <section style={contentStyle}>
        {message ? <div style={messageStyle}>{message}</div> : null}

        {loadingOrb ? (
          <div>読み込み中...</div>
        ) : (
          <OrbForm
            mode={selectedOrb?.id ? "edit" : "create"}
            initialData={selectedOrb}
            onSaved={handleReloadAndSelect}
            onDeleted={handleDeleted}
          />
        )}
      </section>
    </div>
  );
}

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: 20,
  alignItems: "start",
};

const sidebarStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  background: "#fff",
  overflow: "hidden",
  position: "sticky",
  top: 16,
  maxHeight: "calc(100vh - 48px)",
  display: "grid",
  gridTemplateRows: "auto 1fr",
};

const toolbarStyle = {
  padding: 12,
  borderBottom: "1px solid #eee",
  display: "grid",
  gap: 10,
};

const contentStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  background: "#fff",
  padding: 20,
  minHeight: 400,
};

const messageStyle = {
  marginBottom: 12,
  fontSize: 14,
};

const newButtonStyle = {
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
};

const searchInputStyle = {
  flex: 1,
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
};

const searchButtonStyle = {
  border: "1px solid #ccc",
  background: "#f7f7f7",
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
};