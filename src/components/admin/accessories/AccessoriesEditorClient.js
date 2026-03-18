"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAccessory, fetchAccessories } from "@/lib/accessories";
import AccessoryList from "./AccessoryList";
import AccessoryForm from "./AccessoryForm";
import {
  getMonsterEditorTheme,
  usePrefersDarkMode,
} from "../theme";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const update = () => setIsMobile(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [breakpoint]);

  return isMobile;
}

export default function AccessoriesEditorClient() {
  const [accessories, setAccessories] = useState([]);
  const [initialAccessories, setInitialAccessories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hideSearchList, setHideSearchList] = useState(false);

  const isMobile = useIsMobile(900);
  const isDark = usePrefersDarkMode();
  const theme = useMemo(() => getMonsterEditorTheme(isDark), [isDark]);

  const slots = useMemo(() => {
    return [
      ...new Set(
        initialAccessories
          .map((item) => (item.slot ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "ja"));
  }, [initialAccessories]);

  const accessoryTypes = useMemo(() => {
    return [
      ...new Set(
        initialAccessories
          .map((item) => (item.accessory_type ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "ja"));
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

  useEffect(() => {
    if (isMobile) {
      setHideSearchList(false);
    }
  }, [isMobile]);

  async function handleSearch(e) {
    e.preventDefault();
    setHideSearchList(false);
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
    setHideSearchList(false);
  }

  function handleSelectAccessory(id) {
    setSelectedId(id);

    if (isMobile) {
      setHideSearchList(true);
    }
  }

  function handleKeywordChange(value) {
    setKeyword(value);
    setHideSearchList(false);
  }

  return (
    <div style={pageStyle(isMobile, theme)}>
      <aside style={sidebarStyle(isMobile)}>
        <div style={panelStyle(isMobile, theme)}>
          <div style={listHeaderStyle(isMobile)}>
            <h1 style={titleStyle(theme)}>アクセサリ編集</h1>
            <button
              type="button"
              onClick={handleClickNew}
              style={newButtonStyle(isMobile, theme)}
            >
              新規追加
            </button>
          </div>

          <form onSubmit={handleSearch} style={searchRowStyle(isMobile)}>
            <input
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder="名前・種別・slotで検索"
              style={inputStyle(theme)}
            />
            <button type="submit" style={searchButtonStyle(isMobile, theme)}>
              検索
            </button>
          </form>

          {!hideSearchList ? (
            <AccessoryList
              accessories={accessories}
              loading={loading}
              selectedId={selectedId}
              onSelect={handleSelectAccessory}
              isMobile={isMobile}
              theme={theme}
            />
          ) : (
            <button
              type="button"
              onClick={() => setHideSearchList(false)}
              style={reopenButtonStyle(theme)}
            >
              候補を再表示
            </button>
          )}
        </div>
      </aside>

      <main style={mainStyle}>
        <div style={panelStyle(isMobile, theme)}>
          {detailLoading ? (
            <div style={{ color: theme.pageText }}>読み込み中...</div>
          ) : (
            <AccessoryForm
              mode={selectedId ? "edit" : "create"}
              initialData={selectedAccessory}
              slots={slots}
              accessoryTypes={accessoryTypes}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              isMobile={isMobile}
              theme={theme}
            />
          )}
        </div>
      </main>
    </div>
  );
}

const pageStyle = (isMobile, theme) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "340px minmax(0, 1fr)",
  gap: isMobile ? 12 : 20,
  alignItems: "start",
  color: theme.pageText,
});

const sidebarStyle = (isMobile) => ({
  minWidth: 0,
  position: isMobile ? "static" : "sticky",
  top: isMobile ? "auto" : 16,
  alignSelf: "start",
});

const mainStyle = {
  minWidth: 0,
};

const panelStyle = (isMobile, theme) => ({
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 12,
  background: theme.panelBg,
  padding: isMobile ? 12 : 16,
  boxSizing: "border-box",
  color: theme.pageText,
});

const listHeaderStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  justifyContent: "space-between",
  alignItems: isMobile ? "stretch" : "center",
  gap: 12,
  marginBottom: 12,
});

const titleStyle = (theme) => ({
  margin: 0,
  fontSize: 24,
  lineHeight: 1.3,
  color: theme.title,
});

const searchRowStyle = (isMobile) => ({
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  gap: 8,
  marginBottom: 12,
});

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

const searchButtonStyle = (isMobile, theme) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.primaryBorder}`,
  background: theme.primaryBg,
  color: theme.primaryText,
  cursor: "pointer",
  whiteSpace: "nowrap",
  width: isMobile ? "100%" : "auto",
  fontWeight: 700,
});

const newButtonStyle = (isMobile, theme) => ({
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.secondaryBorder}`,
  background: theme.secondaryBg,
  color: theme.secondaryText,
  cursor: "pointer",
  whiteSpace: "nowrap",
  width: isMobile ? "100%" : "auto",
  fontWeight: 700,
});

const reopenButtonStyle = (theme) => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${theme.softBorder ?? theme.subtleBorder ?? theme.inputBorder}`,
  background: theme.softBg ?? theme.subtleBg ?? theme.inputBg,
  color: theme.subText ?? theme.subtleText ?? theme.text,
  cursor: "pointer",
  fontWeight: 700,
});
