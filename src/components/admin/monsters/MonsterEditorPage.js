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
import { useAuth } from "@/hooks/auth";

export default function MonsterEditorPage() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin);

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

  const [parentCandidates, setParentCandidates] = useState([]);

  const isDark = usePrefersDarkMode();
  const rawTheme = useMemo(() => getMonsterEditorTheme(isDark), [isDark]);

  const theme = useMemo(
    () => ({
      pageBg: rawTheme?.pageBg ?? "#f8fafc",
      pageText: rawTheme?.pageText ?? rawTheme?.text ?? "#0f172a",
      cardBg: rawTheme?.cardBg ?? "#ffffff",
      cardBorder: rawTheme?.cardBorder ?? "#e2e8f0",
      title: rawTheme?.title ?? "#0f172a",
      text: rawTheme?.text ?? "#111827",
      mutedText: rawTheme?.mutedText ?? "#64748b",
      softBorder: rawTheme?.softBorder ?? "#e2e8f0",
      softBg: rawTheme?.softBg ?? "#f8fafc",
      selectedBorder: rawTheme?.selectedBorder ?? "#93c5fd",
      selectedBg: rawTheme?.selectedBg ?? "#eff6ff",
      primaryBorder: rawTheme?.primaryBorder ?? "#93c5fd",
      primaryBg: rawTheme?.primaryBg ?? "#dbeafe",
      primaryText: rawTheme?.primaryText ?? "#1d4ed8",
      dangerBorder: rawTheme?.dangerBorder ?? "#fecaca",
      dangerBg: rawTheme?.dangerBg ?? "#fee2e2",
      dangerText: rawTheme?.dangerText ?? "#b91c1c",
      disabledBorder: rawTheme?.softBorder ?? "#cbd5e1",
      disabledBg: rawTheme?.softBg ?? "#e2e8f0",
      disabledText: rawTheme?.mutedText ?? "#64748b",
      inputBorder: rawTheme?.inputBorder ?? rawTheme?.softBorder ?? "#cbd5e1",
      inputBg: rawTheme?.inputBg ?? rawTheme?.softBg ?? "#ffffff",
      inputText: rawTheme?.inputText ?? rawTheme?.text ?? "#111827",
      secondaryBg: rawTheme?.secondaryBg ?? rawTheme?.softBg ?? "#f8fafc",
    }),
    [rawTheme]
  );

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

  async function searchReincarnationParents(nextKeyword = "") {
    const next = String(nextKeyword ?? "").trim();

    if (!next) {
      setParentCandidates([]);
      return;
    }

    try {
      const rows = await searchMonsters(next, "monster");
      const normalized = Array.isArray(rows) ? rows : [];
      const currentId = Number(selectedMonster?.id ?? 0);

      setParentCandidates(
        normalized
          .filter((row) => Number(row?.id ?? 0) > 0)
          .filter((row) => Number(row?.id ?? 0) !== currentId)
          .slice(0, 20)
      );
    } catch (error) {
      console.error(error);
      setParentCandidates([]);
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
      setParentCandidates([]);

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
    if (!isAdmin) return;

    setSelectedMonster(emptyMonster());
    setInitialSpawns([]);
    setAroundMonsters([]);
    setParentCandidates([]);

    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setSidebarOpen(false);
    }
  }

  async function handleSave() {
    try {
      const payload = buildMonsterPayload(selectedMonster);

      if (!selectedMonster?.id && !isAdmin) {
        alert("新規追加は管理者のみ");
        return;
      }

      if (!payload.name) {
        alert("名前は必須");
        return;
      }

      setSaving(true);

      let monsterId = selectedMonster?.id ?? null;
      let savedMonster = null;

      if (monsterId) {
        if (isAdmin) {
          savedMonster = await updateMonster(monsterId, payload);
        }

        await saveMonsterMapSpawns(
          monsterId,
          Array.isArray(selectedMonster?.spawns) ? selectedMonster.spawns : [],
          initialSpawns
        );
      } else {
        savedMonster = await createMonster(payload);
        monsterId = savedMonster?.id ?? null;

        if (!monsterId) {
          throw new Error("モンスター保存後のID取得に失敗");
        }

        await saveMonsterMapSpawns(
          monsterId,
          Array.isArray(selectedMonster?.spawns) ? selectedMonster.spawns : [],
          initialSpawns
        );
      }

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
      setParentCandidates([]);

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
    if (!isAdmin) return;

    if (!selectedMonster?.id) {
      setSelectedMonster(emptyMonster());
      setInitialSpawns([]);
      setAroundMonsters([]);
      setParentCandidates([]);
      return;
    }

    const ok = window.confirm(`「${selectedMonster.name}」を削除する?`);
    if (!ok) return;

    try {
      await deleteMonster(selectedMonster.id);
      setSelectedMonster(emptyMonster());
      setInitialSpawns([]);
      setAroundMonsters([]);
      setParentCandidates([]);
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

  const saveDisabled = saving;
  const deleteDisabled = saving || !isAdmin || !selectedMonster?.id;
  const createDisabled = !isAdmin;

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        @media (max-width: 960px) {
          .monster-editor-page {
            flex-direction: column;
            min-height: auto !important;
          }

          .monster-editor-main {
            width: 100% !important;
            min-width: 0 !important;
            padding: 16px !important;
            overflow-x: hidden !important;
          }
        }

        @media (max-width: 640px) {
          .monster-editor-main {
            padding: 12px !important;
          }

          .monster-editor-header {
            margin-bottom: 16px !important;
            flex-direction: column !important;
            align-items: stretch !important;
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
        }
      `}</style>

      <div className="monster-editor-page" style={pageStyle(theme)}>
        <MonsterSearchSidebar
          theme={theme}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          keyword={keyword}
          onKeywordChange={setKeyword}
          monsters={monsters}
          selectedId={selectedMonster?.id ?? null}
          loading={loadingList}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          createDisabled={createDisabled}
          createLabel={!isAdmin ? "新規追加（管理者のみ）" : "新規追加"}
        />

        <main className="monster-editor-main" style={mainStyle}>
          <header className="monster-editor-header" style={headerStyle}>
            <div style={headerTextStyle}>
              <h1 className="monster-editor-title" style={titleStyle(theme)}>
                モンスター管理
              </h1>
              <p className="monster-editor-desc" style={descStyle(theme)}>
                モンスター基本情報、ドロップ、出現マップを管理する
              </p>
              {!isAdmin && (
                <p style={adminNoticeStyle(theme)}>
                  基本情報の編集・削除・新規追加は管理者のみ。出現情報の保存は可能。
                </p>
              )}
            </div>

            <div className="monster-editor-actions" style={actionsStyle}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveDisabled}
                aria-disabled={saveDisabled}
                style={saveButtonStyle(theme, saveDisabled)}
              >
                {saving ? "保存中..." : "保存"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteDisabled}
                title={!isAdmin ? "管理者のみ削除できます" : ""}
                aria-disabled={deleteDisabled}
                style={deleteButtonStyle(theme, deleteDisabled)}
              >
                削除
              </button>
            </div>
          </header>

          {loadingDetail ? (
            <div style={loadingStyle(theme)}>読み込み中...</div>
          ) : (
            <div style={contentStyle}>
             <MonsterForm
              monster={selectedMonster}
              onChange={setSelectedMonster}
              theme={theme}
              parentCandidates={parentCandidates}
              onSearchParents={searchReincarnationParents}
              disabled={!isAdmin}
              defaultOpen={false}
            >
              <OrderPreviewCard
                theme={theme}
                loading={loadingAround}
                rows={orderPreviewRows}
                embedded
              />
            </MonsterForm>

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

function OrderPreviewCard({ theme, loading, rows }) {
  return (
    <section style={cardStyle(theme)}>
      <div style={orderPreviewHeaderStyle}>
        <h2 style={sectionTitleStyle(theme)}>表示順プレビュー</h2>
        <p style={sectionDescStyle(theme)}>前後の表示順を確認できる</p>
      </div>

      {loading ? (
        <div style={mutedPanelStyle(theme)}>読み込み中...</div>
      ) : (
        <div style={orderPreviewGridStyle}>
          <div style={orderPreviewColumnStyle}>
            <div style={columnTitleStyle(theme)}>前</div>
            {(rows?.above ?? []).length > 0 ? (
              rows.above.map((row) => (
                <div
                  key={`above-${row.id ?? row.display_order}`}
                  style={rowCardStyle(theme)}
                >
                  <div style={rowNameStyle(theme)}>{row.name}</div>
                  <div style={rowMetaStyle(theme)}>No.{row.display_order}</div>
                </div>
              ))
            ) : (
              <div style={mutedPanelStyle(theme)}>なし</div>
            )}
          </div>

          <div style={orderPreviewBodyStyle}>
            <div style={columnTitleStyle(theme)}>現在</div>
            <div style={currentRowCardStyle(theme)}>
              <div style={rowNameStyle(theme)}>
                {rows?.current?.name ?? "未設定"}
              </div>
              <div style={rowMetaStyle(theme)}>
                No.{rows?.current?.display_order ?? "-"}
              </div>

              {(rows?.current?.conflicts ?? []).length > 0 && (
                <div style={orderPreviewConflictListStyle}>
                  <div style={conflictTitleStyle(theme)}>同じ表示順</div>
                  {rows.current.conflicts.map((row) => (
                    <div
                      key={`conflict-${row.id ?? row.name}`}
                      style={conflictItemStyle(theme)}
                    >
                      {row.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={orderPreviewColumnStyle}>
            <div style={columnTitleStyle(theme)}>後</div>
            {(rows?.below ?? []).length > 0 ? (
              rows.below.map((row) => (
                <div
                  key={`below-${row.id ?? row.display_order}`}
                  style={rowCardStyle(theme)}
                >
                  <div style={rowNameStyle(theme)}>{row.name}</div>
                  <div style={rowMetaStyle(theme)}>No.{row.display_order}</div>
                </div>
              ))
            ) : (
              <div style={mutedPanelStyle(theme)}>なし</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const mainStyle = {
  flex: 1,
  minWidth: 0,
  padding: 24,
  overflowX: "hidden",
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
  minWidth: 0,
};

const orderPreviewBodyStyle = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 8,
};

const orderPreviewConflictListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 8,
};

const orderPreviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const pageStyle = (theme) => ({
  display: "flex",
  minHeight: "100vh",
  background: theme.pageBg,
  color: theme.pageText,
  alignItems: "flex-start",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
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

const adminNoticeStyle = (theme) => ({
  margin: "8px 0 0",
  color: theme.mutedText,
  fontSize: 13,
});

const saveButtonStyle = (theme, disabled = false) => ({
  border: `1px solid ${
    disabled ? theme.disabledBorder : theme.primaryBorder
  }`,
  background: disabled ? theme.disabledBg : theme.primaryBg,
  color: disabled ? theme.disabledText : theme.primaryText,
  borderRadius: 10,
  padding: "10px 16px",
  cursor: disabled ? "not-allowed" : "pointer",
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: disabled ? 0.6 : 1,
});

const deleteButtonStyle = (theme, disabled = false) => ({
  border: `1px solid ${
    disabled ? theme.disabledBorder : theme.dangerBorder
  }`,
  background: disabled ? theme.disabledBg : theme.dangerBg,
  color: disabled ? theme.disabledText : theme.dangerText,
  borderRadius: 10,
  padding: "10px 16px",
  cursor: disabled ? "not-allowed" : "pointer",
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: disabled ? 0.6 : 1,
});

const loadingStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 14,
  padding: 20,
  color: theme.pageText,
});

const cardStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minWidth: 0,
});

const sectionTitleStyle = (theme) => ({
  margin: 0,
  fontSize: 18,
  color: theme.title,
});

const sectionDescStyle = (theme) => ({
  margin: 0,
  color: theme.mutedText,
  fontSize: 13,
});

const mutedPanelStyle = (theme) => ({
  border: `1px solid ${theme.softBorder}`,
  background: theme.softBg,
  color: theme.mutedText,
  borderRadius: 10,
  padding: "12px 14px",
});

const columnTitleStyle = (theme) => ({
  fontSize: 13,
  fontWeight: 700,
  color: theme.mutedText,
});

const rowCardStyle = (theme) => ({
  border: `1px solid ${theme.softBorder}`,
  background: theme.softBg,
  borderRadius: 10,
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minWidth: 0,
});

const currentRowCardStyle = (theme) => ({
  border: `1px solid ${theme.selectedBorder}`,
  background: theme.selectedBg,
  borderRadius: 10,
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minWidth: 0,
});

const rowNameStyle = (theme) => ({
  color: theme.text,
  fontWeight: 700,
  wordBreak: "break-word",
});

const rowMetaStyle = (theme) => ({
  color: theme.mutedText,
  fontSize: 12,
});

const conflictTitleStyle = (theme) => ({
  color: theme.mutedText,
  fontSize: 12,
  fontWeight: 700,
});

const conflictItemStyle = (theme) => ({
  color: theme.text,
  fontSize: 13,
  wordBreak: "break-word",
});