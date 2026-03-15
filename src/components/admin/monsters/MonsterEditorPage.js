"use client";

import { useEffect, useMemo, useState } from "react";
import MonsterSearchSidebar from "./MonsterSearchSidebar";
import MonsterForm from "./MonsterForm";
import MonsterDropsEditor from "./MonsterDropsEditor";
import MonsterSpawnsEditor from "./MonsterSpawnsEditor";
import {
  emptyMonster,
  normalizeMonster,
  buildMonsterPayload,
} from "./monsterEditorHelpers";
import {
  searchMonsters,
  fetchMonsterDetail,
  createMonster,
  updateMonster,
  deleteMonster,
  fetchMonstersAroundDisplayOrder,
} from "@/lib/monsters";
import { fetchItems } from "@/lib/items";
import { fetchOrbs } from "@/lib/orbs";
import { fetchEquipments } from "@/lib/equipments";
import { fetchAccessories } from "@/lib/accessories";
import { fetchMaps } from "@/lib/maps";
import {
  fetchMonsterMapSpawns,
  saveMonsterMapSpawns,
  normalizeMapRow,
} from "@/lib/monsterMapSpawns";
import {
  usePrefersDarkMode,
  getMonsterEditorTheme,
} from "../theme";

export default function MonsterEditorPage() {
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingAround, setLoadingAround] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [monsters, setMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(emptyMonster());
  const [initialSpawns, setInitialSpawns] = useState([]);
  const [aroundMonsters, setAroundMonsters] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [items, setItems] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [maps, setMaps] = useState([]);

  const isDark = usePrefersDarkMode();
  const theme = useMemo(() => getMonsterEditorTheme(isDark), [isDark]);

  const mapOptions = useMemo(
    () => (Array.isArray(maps) ? maps.map(normalizeMapRow) : []),
    [maps]
  );

  const orderPreviewRows = useMemo(() => {
    const currentOrder = Number(selectedMonster?.display_order ?? 0);
    if (!currentOrder) {
      return { above: [], below: [], current: null };
    }

    const sorted = [...(Array.isArray(aroundMonsters) ? aroundMonsters : [])].sort(
      (a, b) => {
        const orderDiff =
          Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0);
        if (orderDiff !== 0) return orderDiff;

        return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "ja");
      }
    );

    const above = sorted
      .filter((monster) => Number(monster?.display_order ?? 0) < currentOrder)
      .slice(-2)
      .map((monster) => ({
        id: monster?.id ?? null,
        name: monster?.name ?? "",
        display_order: Number(monster?.display_order ?? 0),
      }));

    const below = sorted
      .filter((monster) => Number(monster?.display_order ?? 0) > currentOrder)
      .slice(0, 2)
      .map((monster) => ({
        id: monster?.id ?? null,
        name: monster?.name ?? "",
        display_order: Number(monster?.display_order ?? 0),
      }));

    const sameOrderRows = sorted
      .filter((monster) => Number(monster?.display_order ?? 0) === currentOrder)
      .map((monster) => ({
        id: monster?.id ?? null,
        name: monster?.name ?? "",
        display_order: Number(monster?.display_order ?? 0),
      }));

    const current = {
      id: selectedMonster?.id ?? null,
      name: selectedMonster?.name?.trim() || "新しいモンスター",
      display_order: currentOrder,
      conflicts: sameOrderRows,
    };

    return { above, below, current };
  }, [aroundMonsters, selectedMonster]);

  async function loadMonsters(nextKeyword = "") {
    try {
      setLoadingList(true);
      const rows = await searchMonsters(nextKeyword, "monster");
      setMonsters(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error(error);
      alert(error.message || "モンスター一覧取得失敗");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadMasters() {
    try {
      const [itemRows, orbRows, equipmentRows, accessoryRows, mapRows] =
        await Promise.all([
          fetchItems(""),
          fetchOrbs(""),
          fetchEquipments(""),
          fetchAccessories(""),
          fetchMaps(""),
        ]);

      setItems(Array.isArray(itemRows) ? itemRows : []);
      setOrbs(Array.isArray(orbRows) ? orbRows : []);
      setEquipments(Array.isArray(equipmentRows) ? equipmentRows : []);
      setAccessories(Array.isArray(accessoryRows) ? accessoryRows : []);
      setMaps(Array.isArray(mapRows) ? mapRows : []);
    } catch (error) {
      console.error(error);
      alert("各種マスタ取得失敗");
    }
  }

  useEffect(() => {
    loadMonsters("");
    loadMasters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMonsters(keyword);
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 960) {
        setSidebarOpen(true);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadAroundMonsters() {
      const displayOrder = Number(selectedMonster?.display_order ?? 0);

      if (!displayOrder) {
        setAroundMonsters([]);
        return;
      }

      try {
        setLoadingAround(true);

        const rows = await fetchMonstersAroundDisplayOrder(displayOrder, {
          range: 5,
          excludeId: selectedMonster?.id ?? null,
        });

        setAroundMonsters(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error(error);
        setAroundMonsters([]);
      } finally {
        setLoadingAround(false);
      }
    }

    loadAroundMonsters();
  }, [selectedMonster?.display_order, selectedMonster?.id]);

  async function handleSelect(monster) {
    if (!monster?.id) return;

    try {
      setLoadingDetail(true);

      const [row, spawnRows] = await Promise.all([
        fetchMonsterDetail(monster.id),
        fetchMonsterMapSpawns(monster.id),
      ]);

      const normalized = normalizeMonster({
        ...(row ?? {}),
        spawns: spawnRows,
      });

      setSelectedMonster(normalized);
      setInitialSpawns(Array.isArray(spawnRows) ? spawnRows : []);

      if (typeof window !== "undefined" && window.innerWidth <= 960) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "詳細取得失敗");
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleCreateNew() {
    setSelectedMonster(emptyMonster());
    setInitialSpawns([]);
    setAroundMonsters([]);

    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setSidebarOpen(false);
    }
  }

  async function handleSave() {
    try {
      const payload = buildMonsterPayload(selectedMonster);

      if (!payload.name) {
        alert("名前は必須");
        return;
      }

      setSaving(true);

      let savedMonster = null;

      if (selectedMonster?.id) {
        savedMonster = await updateMonster(selectedMonster.id, payload);
      } else {
        savedMonster = await createMonster(payload);
      }

      const monsterId = savedMonster?.id;

      if (!monsterId) {
        throw new Error("モンスター保存後のID取得に失敗");
      }

      const nextSpawns = Array.isArray(selectedMonster?.spawns)
        ? selectedMonster.spawns
        : [];

      await saveMonsterMapSpawns(monsterId, nextSpawns, initialSpawns);

      const [freshMonster, freshSpawns] = await Promise.all([
        fetchMonsterDetail(monsterId),
        fetchMonsterMapSpawns(monsterId),
      ]);

      setSelectedMonster(
        normalizeMonster({
          ...(freshMonster ?? savedMonster ?? {}),
          spawns: freshSpawns,
        })
      );
      setInitialSpawns(Array.isArray(freshSpawns) ? freshSpawns : []);

      await loadMonsters(keyword);
      alert("保存した");
    } catch (error) {
      console.error(error);
      alert(error.message || "保存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedMonster?.id) {
      setSelectedMonster(emptyMonster());
      setInitialSpawns([]);
      setAroundMonsters([]);
      return;
    }

    const ok = window.confirm(`「${selectedMonster.name}」を削除する?`);
    if (!ok) return;

    try {
      await deleteMonster(selectedMonster.id);
      setSelectedMonster(emptyMonster());
      setInitialSpawns([]);
      setAroundMonsters([]);
      await loadMonsters(keyword);
      alert("削除した");
    } catch (error) {
      console.error(error);
      alert(error.message || "削除失敗");
    } finally {
      if (typeof window !== "undefined" && window.innerWidth <= 960) {
        setSidebarOpen(true);
      }
    }
  }

  return (
    <>
      <style jsx>{`
        @media (max-width: 960px) {
          .monster-editor-page {
            flex-direction: column;
          }

          .monster-editor-main {
            padding: 16px !important;
          }
        }

        @media (max-width: 640px) {
          .monster-editor-main {
            padding: 12px !important;
          }

          .monster-editor-header {
            margin-bottom: 16px !important;
          }

          .monster-editor-title {
            font-size: 24px !important;
          }

          .monster-editor-desc {
            font-size: 14px !important;
          }

          .monster-editor-actions {
            width: 100%;
          }

          .monster-editor-actions button {
            flex: 1 1 0;
            justify-content: center;
          }

          .monster-editor-content {
            gap: 12px !important;
          }
        }
      `}</style>

      <div className="monster-editor-page" style={pageStyle(theme)}>
        <MonsterSearchSidebar
          theme={theme}
          monsters={monsters}
          selectedId={selectedMonster?.id}
          keyword={keyword}
          loading={loadingList}
          onKeywordChange={setKeyword}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="monster-editor-main" style={mainStyle}>
          <div className="monster-editor-header" style={headerStyle}>
            <div style={headerTextStyle}>
              <h1 className="monster-editor-title" style={titleStyle(theme)}>
                モンスター編集
              </h1>
              <p className="monster-editor-desc" style={descStyle(theme)}>
                基本情報・ドロップ・生息地をまとめて編集する
              </p>
            </div>

            <div className="monster-editor-actions" style={actionsStyle}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={saveButtonStyle(theme)}
              >
                {saving ? "保存中..." : "保存"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                style={deleteButtonStyle(theme)}
              >
                削除
              </button>
            </div>
          </div>

          {loadingDetail ? (
            <div style={loadingStyle(theme)}>詳細読み込み中...</div>
          ) : (
            <div className="monster-editor-content" style={contentStyle}>
              <MonsterForm
                monster={selectedMonster}
                onChange={setSelectedMonster}
                theme={theme}
              />

              <section style={orderPreviewCardStyle(theme)}>
                <div style={orderPreviewHeaderStyle}>
                  <h2 style={orderPreviewTitleStyle(theme)}>表示順の前後プレビュー</h2>
                  <p style={orderPreviewDescStyle(theme)}>
                    上に2件、下に2件を縦並びで表示する
                  </p>
                </div>

                {Number(selectedMonster?.display_order ?? 0) > 0 ? (
                  loadingAround ? (
                    <div style={orderPreviewEmptyStyle(theme)}>
                      前後モンスターを読み込み中...
                    </div>
                  ) : (
                    <div style={orderPreviewColumnStyle}>
                      {orderPreviewRows.above.length > 0 ? (
                        orderPreviewRows.above.map((row) => (
                          <div
                            key={`above-${row.id ?? row.display_order}`}
                            style={orderPreviewRowStyle(theme)}
                          >
                            <div style={orderPreviewOrderStyle(theme)}>
                              {row.display_order}
                            </div>
                            <div style={orderPreviewBodyStyle}>
                              <div style={orderPreviewNameStyle(theme)}>
                                {row.name || "名称未設定"}
                              </div>
                              <div style={orderPreviewMetaStyle(theme)}>
                                上のモンスター
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={orderPreviewGhostStyle(theme)}>
                          上側にモンスターなし
                        </div>
                      )}

                      {orderPreviewRows.current ? (
                        <div style={orderPreviewCurrentStyle(theme)}>
                          <div style={orderPreviewOrderCurrentStyle(theme)}>
                            {orderPreviewRows.current.display_order}
                          </div>
                          <div style={orderPreviewBodyStyle}>
                            <div style={orderPreviewNameCurrentStyle(theme)}>
                              {orderPreviewRows.current.name}
                            </div>
                            <div style={orderPreviewMetaCurrentStyle(theme)}>
                              編集中のモンスター
                            </div>
                            {Array.isArray(orderPreviewRows.current.conflicts) &&
                            orderPreviewRows.current.conflicts.length > 0 ? (
                              <div style={orderPreviewConflictListStyle}>
                                {orderPreviewRows.current.conflicts.map((row) => (
                                  <div
                                    key={`conflict-${row.id ?? row.name}`}
                                    style={orderPreviewConflictItemStyle(theme)}
                                  >
                                    同順番: {row.name || "名称未設定"}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {orderPreviewRows.below.length > 0 ? (
                        orderPreviewRows.below.map((row) => (
                          <div
                            key={`below-${row.id ?? row.display_order}`}
                            style={orderPreviewRowStyle(theme)}
                          >
                            <div style={orderPreviewOrderStyle(theme)}>
                              {row.display_order}
                            </div>
                            <div style={orderPreviewBodyStyle}>
                              <div style={orderPreviewNameStyle(theme)}>
                                {row.name || "名称未設定"}
                              </div>
                              <div style={orderPreviewMetaStyle(theme)}>
                                下のモンスター
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={orderPreviewGhostStyle(theme)}>
                          下側にモンスターなし
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div style={orderPreviewEmptyStyle(theme)}>
                    表示順を入力すると前後のモンスターが見える
                  </div>
                )}
              </section>

              <MonsterDropsEditor
                theme={theme}
                drops={selectedMonster?.drops ?? []}
                onChange={(nextDrops) =>
                  setSelectedMonster((prev) => ({
                    ...prev,
                    drops: nextDrops,
                  }))
                }
                items={items}
                orbs={orbs}
                equipments={equipments}
                accessories={accessories}
              />

              <MonsterSpawnsEditor
                theme={theme}
                spawns={selectedMonster?.spawns ?? []}
                maps={mapOptions}
                onChange={(nextSpawns) =>
                  setSelectedMonster((prev) => ({
                    ...prev,
                    spawns: nextSpawns,
                  }))
                }
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const mainStyle = {
  flex: 1,
  minWidth: 0,
  padding: 24,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const headerTextStyle = {
  minWidth: 0,
};

const actionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const contentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minWidth: 0,
};

const orderPreviewHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const orderPreviewColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const orderPreviewBodyStyle = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 4,
};

const orderPreviewConflictListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 4,
};

const pageStyle = (theme) => ({
  display: "flex",
  minHeight: "100vh",
  background: theme.pageBg,
  color: theme.pageText,
  alignItems: "flex-start",
});

const titleStyle = (theme) => ({
  margin: 0,
  fontSize: 28,
  color: theme.title,
});

const descStyle = (theme) => ({
  margin: "6px 0 0",
  color: theme.mutedText,
});

const saveButtonStyle = (theme) => ({
  border: `1px solid ${theme.primaryBorder}`,
  background: theme.primaryBg,
  color: theme.primaryText,
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
});

const deleteButtonStyle = (theme) => ({
  border: `1px solid ${theme.dangerBorder}`,
  background: theme.dangerBg,
  color: theme.dangerText,
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
});

const loadingStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 14,
  padding: 20,
  color: theme.pageText,
});

const orderPreviewCardStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
});

const orderPreviewTitleStyle = (theme) => ({
  margin: 0,
  fontSize: 18,
  color: theme.title,
});

const orderPreviewDescStyle = (theme) => ({
  margin: 0,
  fontSize: 14,
  color: theme.mutedText,
});

const orderPreviewRowStyle = (theme) => ({
  display: "flex",
  alignItems: "stretch",
  gap: 12,
  border: `1px solid ${theme.softBorder}`,
  borderRadius: 12,
  background: theme.softBg,
  padding: 12,
  minWidth: 0,
});

const orderPreviewCurrentStyle = (theme) => ({
  display: "flex",
  alignItems: "stretch",
  gap: 12,
  border: `2px solid ${theme.selectedBorder}`,
  borderRadius: 12,
  background: theme.selectedBg,
  padding: 12,
  minWidth: 0,
});

const orderPreviewOrderStyle = (theme) => ({
  width: 44,
  minWidth: 44,
  height: 44,
  borderRadius: 999,
  background: theme.primaryBg,
  color: theme.primaryText,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 15,
});

const orderPreviewOrderCurrentStyle = (theme) => ({
  width: 48,
  minWidth: 48,
  height: 48,
  borderRadius: 999,
  background: theme.selectedBorder,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 16,
});

const orderPreviewNameStyle = (theme) => ({
  fontSize: 15,
  fontWeight: 700,
  color: theme.text,
  wordBreak: "break-word",
});

const orderPreviewNameCurrentStyle = (theme) => ({
  fontSize: 16,
  fontWeight: 800,
  color: theme.text,
  wordBreak: "break-word",
});

const orderPreviewMetaStyle = (theme) => ({
  fontSize: 12,
  color: theme.mutedText,
});

const orderPreviewMetaCurrentStyle = (theme) => ({
  fontSize: 12,
  color: theme.secondaryText,
  fontWeight: 700,
});

const orderPreviewConflictItemStyle = (theme) => ({
  fontSize: 12,
  color: theme.warningText,
  background: theme.warningBg,
  border: `1px solid ${theme.warningBorder}`,
  borderRadius: 8,
  padding: "4px 8px",
});

const orderPreviewGhostStyle = (theme) => ({
  border: `1px dashed ${theme.ghostBorder}`,
  borderRadius: 12,
  background: theme.ghostBg,
  color: theme.mutedText,
  padding: 12,
  fontSize: 14,
});

const orderPreviewEmptyStyle = (theme) => ({
  border: `1px dashed ${theme.ghostBorder}`,
  borderRadius: 12,
  background: theme.ghostBg,
  color: theme.mutedText,
  padding: 16,
  fontSize: 14,
});
