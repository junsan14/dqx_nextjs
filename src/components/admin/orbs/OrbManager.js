"use client";

import { useEffect, useMemo, useState } from "react";
import OrbList from "./OrbList";
import OrbForm from "./OrbForm";
import { fetchOrb, fetchOrbs } from "@/lib/orbs";
import {
  getMonsterEditorTheme,
  usePrefersDarkMode,
} from "../theme";

export default function OrbManager({ initialOrbs = [] }) {
  const [orbs, setOrbs] = useState(initialOrbs);
  const [selectedOrb, setSelectedOrb] = useState(null);
  const [loadingOrb, setLoadingOrb] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [message, setMessage] = useState("");

  const [isMobile, setIsMobile] = useState(false);
  const [listOpen, setListOpen] = useState(true);

  const isDark = usePrefersDarkMode();
  const theme = useMemo(() => getMonsterEditorTheme(isDark), [isDark]);

  const selectedId = selectedOrb?.id ?? null;

  const sortedOrbs = useMemo(() => {
    return [...orbs].sort((a, b) => {
      if ((a.color || "") !== (b.color || "")) {
        return (a.color || "").localeCompare(b.color || "", "ja");
      }
      return (a.name || "").localeCompare(b.name || "", "ja");
    });
  }, [orbs]);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);

      if (!mobile) {
        setListOpen(true);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleSelectOrb(id) {
    setLoadingOrb(true);
    setMessage("");

    try {
      const orb = await fetchOrb(id);
      setSelectedOrb(orb);

      if (isMobile) {
        setListOpen(false);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "オーブ取得失敗");
    } finally {
      setLoadingOrb(false);
    }
  }

  function handleNew() {
    setSelectedOrb(null);
    setMessage("");

    if (isMobile) {
      setListOpen(false);
    }
  }

  async function handleSearch() {
    setLoadingList(true);
    setMessage("");

    try {
      const list = await fetchOrbs(search);
      setOrbs(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "一覧取得失敗");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleReloadAndSelect(savedOrb = null) {
    setMessage("");

    try {
      const list = await fetchOrbs(search);
      setOrbs(Array.isArray(list) ? list : []);

      if (savedOrb?.id) {
        const latest = await fetchOrb(savedOrb.id);
        setSelectedOrb(latest);

        if (isMobile) {
          setListOpen(false);
        }
      } else {
        setSelectedOrb(null);

        if (isMobile) {
          setListOpen(true);
        }
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "一覧更新失敗");
    }
  }

  async function handleDeleted(deletedId) {
    const next = orbs.filter((x) => x.id !== deletedId);
    setOrbs(next);

    if (selectedId === deletedId) {
      setSelectedOrb(null);
    }

    setMessage("削除した");

    if (isMobile) {
      setListOpen(true);
    }
  }

  function openList() {
    setListOpen(true);
  }

  const showSidebar = !isMobile || listOpen;

  return (
    <div style={layoutStyle(isMobile, theme)}>
      {showSidebar ? (
        <aside style={sidebarStyle(isMobile, theme)}>
          <div style={toolbarStyle(theme)}>
            <div style={topActionRowStyle(isMobile)}>
              <button type="button" onClick={handleNew} style={newButtonStyle(theme)}>
                ＋ 新規追加
              </button>

              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setListOpen(false)}
                  style={subButtonStyle(theme)}
                >
                  閉じる
                </button>
              ) : null}
            </div>

            <div style={searchRowStyle(isMobile)}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="名前・色で検索"
                style={searchInputStyle(theme)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={loadingList}
                style={searchButtonStyle(isMobile, theme)}
              >
                {loadingList ? "検索中..." : "検索"}
              </button>
            </div>
          </div>

          <div style={listAreaStyle(isMobile)}>
            <OrbList
              orbs={sortedOrbs}
              selectedId={selectedId}
              onSelect={handleSelectOrb}
              theme={theme}
            />
          </div>
        </aside>
      ) : null}

      <section style={contentStyle(isMobile, theme)}>
        {isMobile && !listOpen ? (
          <div style={mobileTopBarStyle}>
            <button type="button" onClick={openList} style={subButtonStyle(theme)}>
              一覧を開く
            </button>

            <button type="button" onClick={handleNew} style={newButtonStyle(theme)}>
              新規追加
            </button>
          </div>
        ) : null}

        {message ? <div style={messageStyle(theme)}>{message}</div> : null}

        {loadingOrb ? (
          <div style={loadingTextStyle(theme)}>読み込み中...</div>
        ) : (
          <OrbForm
            mode={selectedOrb?.id ? "edit" : "create"}
            initialData={selectedOrb}
            onSaved={handleReloadAndSelect}
            onDeleted={handleDeleted}
            theme={theme}
          />
        )}
      </section>
    </div>
  );
}

function layoutStyle(isMobile, theme) {
  return {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "320px minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
    color: theme.pageText,
  };
}

function sidebarStyle(isMobile, theme) {
  return {
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 12,
    background: theme.panelBg,
    overflow: "hidden",
    position: isMobile ? "static" : "sticky",
    top: isMobile ? "auto" : 16,
    maxHeight: isMobile ? "none" : "calc(100vh - 48px)",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    minWidth: 0,
  };
}

const toolbarStyle = (theme) => ({
  padding: 12,
  borderBottom: `1px solid ${theme.cardBorder}`,
  display: "grid",
  gap: 10,
});

function topActionRowStyle(isMobile) {
  return {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: isMobile ? "space-between" : "flex-start",
  };
}

function searchRowStyle(isMobile) {
  return {
    display: "flex",
    gap: 8,
    flexDirection: isMobile ? "column" : "row",
  };
}

function listAreaStyle(isMobile) {
  return {
    maxHeight: isMobile ? "50vh" : "calc(100vh - 160px)",
    overflowY: "auto",
  };
}

function contentStyle(isMobile, theme) {
  return {
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 12,
    background: theme.panelBg,
    padding: isMobile ? 14 : 20,
    minHeight: 400,
    minWidth: 0,
    color: theme.pageText,
  };
}

const mobileTopBarStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
};

const messageStyle = (theme) => ({
  marginBottom: 12,
  fontSize: 14,
  color: theme.subText,
});

const newButtonStyle = (theme) => ({
  border: `1px solid ${theme.primaryBorder}`,
  background: theme.primaryBg,
  color: theme.primaryText,
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontWeight: 700,
});

const subButtonStyle = (theme) => ({
  border: `1px solid ${theme.inputBorder}`,
  background: theme.inputBg,
  color: theme.text,
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontWeight: 700,
});

const searchInputStyle = (theme) => ({
  flex: 1,
  width: "100%",
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 16,
  minWidth: 0,
  boxSizing: "border-box",
  background: theme.inputBg,
  color: theme.inputText,
});

function searchButtonStyle(isMobile, theme) {
  return {
    border: `1px solid ${theme.secondaryBorder}`,
    background: theme.secondaryBg,
    color: theme.secondaryText,
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
    whiteSpace: "nowrap",
    fontWeight: 700,
  };
}

const loadingTextStyle = (theme) => ({
  color: theme.subText,
});
