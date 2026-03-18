"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchItem, fetchItems } from "@/lib/items";
import ItemList from "./ItemList";
import ItemForm from "./ItemForm";
import {
  getMonsterEditorTheme,
  usePrefersDarkMode,
} from "../theme";

export default function ItemsEditorClient() {
  const [items, setItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);

  const isDark = usePrefersDarkMode();
  const theme = useMemo(() => getMonsterEditorTheme(isDark), [isDark]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        initialItems
          .map((item) => (item.category ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "ja"));
  }, [initialItems]);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      setSearchOpen((prev) => {
        if (!mobile) return true;
        return prev;
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      if (isMobile) {
        setSearchOpen(false);
      }
    }
  }

  async function handleDeleted(deletedId) {
    await loadItems(keyword);
    await loadItems("");

    if (selectedId === deletedId) {
      setSelectedId(null);
      setSelectedItem(null);
    }

    if (isMobile) {
      setSearchOpen(true);
    }
  }

  function handleClickNew() {
    setSelectedId(null);
    setSelectedItem(null);

    if (isMobile) {
      setSearchOpen(false);
    }
  }

  function handleSelectItem(id) {
    setSelectedId(id);

    if (isMobile) {
      setSearchOpen(false);
    }
  }

  function handleOpenSearch() {
    setSearchOpen(true);
  }

  const showSidebar = !isMobile || searchOpen;

  return (
    <div style={pageStyle(isMobile, theme)}>
      {showSidebar ? (
        <aside style={sidebarStyle(isMobile)}>
          <div style={panelStyle(theme)}>
            <div style={listHeaderStyle(isMobile)}>
              <h1 style={titleStyle(isMobile, theme)}>アイテム編集</h1>

              <div style={headerActionsStyle}>
                <button
                  type="button"
                  onClick={handleClickNew}
                  style={newButtonStyle(theme)}
                >
                  新規追加
                </button>

                {isMobile ? (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    style={subButtonStyle(theme)}
                  >
                    閉じる
                  </button>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSearch} style={searchRowStyle(isMobile)}>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="名前・カテゴリで検索"
                style={inputStyle(theme)}
              />
              <button type="submit" style={searchButtonStyle(isMobile, theme)}>
                検索
              </button>
            </form>

            <ItemList
              items={items}
              loading={loading}
              selectedId={selectedId}
              onSelect={handleSelectItem}
              theme={theme}
            />
          </div>
        </aside>
      ) : null}

      <main style={mainStyle}>
        {isMobile && !searchOpen ? (
          <div style={mobileTopBarStyle}>
            <button
              type="button"
              onClick={handleOpenSearch}
              style={subButtonStyle(theme)}
            >
              検索を開く
            </button>

            <button
              type="button"
              onClick={handleClickNew}
              style={newButtonStyle(theme)}
            >
              新規追加
            </button>
          </div>
        ) : null}

        <div style={panelStyle(theme)}>
          {detailLoading ? (
            <div style={loadingTextStyle(theme)}>読み込み中...</div>
          ) : (
            <ItemForm
              mode={selectedId ? "edit" : "create"}
              initialData={selectedItem}
              categories={categories}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              theme={theme}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function pageStyle(isMobile, theme) {
  return {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "360px minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
    color: theme.pageText,
    minWidth: 0,
  };
}

const sidebarStyle = (isMobile) => ({
  minWidth: 0,
  position: isMobile ? "static" : "sticky",
  top: isMobile ? "auto" : 16,
  alignSelf: "start",
});

const mainStyle = {
  minWidth: 0,
};

const panelStyle = (theme) => ({
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 12,
  background: theme.panelBg,
  padding: 16,
  color: theme.pageText,
  minWidth: 0,
});

function listHeaderStyle(isMobile) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: 12,
    marginBottom: 12,
  };
}

const titleStyle = (isMobile, theme) => ({
  margin: 0,
  fontSize: isMobile ? 22 : 24,
  color: theme.title,
});

const headerActionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

function searchRowStyle(isMobile) {
  return {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: 8,
    marginBottom: 12,
  };
}

const inputStyle = (theme) => ({
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box",
  background: theme.inputBg,
  color: theme.inputText,
});

function searchButtonStyle(isMobile, theme) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${theme.primaryBorder}`,
    background: theme.primaryBg,
    color: theme.primaryText,
    cursor: "pointer",
    whiteSpace: "nowrap",
    width: isMobile ? "100%" : "auto",
    fontWeight: 700,
  };
}

const newButtonStyle = (theme) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.secondaryBorder}`,
  background: theme.secondaryBg,
  color: theme.secondaryText,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontWeight: 700,
});

const subButtonStyle = (theme) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.inputBorder}`,
  background: theme.inputBg,
  color: theme.text,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontWeight: 700,
});

const mobileTopBarStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
};

const loadingTextStyle = (theme) => ({
  color: theme.subText,
});
