"use client";

import { useEffect, useState } from "react";
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
} from "@/lib/monsters";
import { fetchItems } from "@/lib/items";
import { fetchOrbs } from "@/lib/orbs";
import { fetchEquipments } from "@/lib/equipments";
import { fetchAccessories } from "@/lib/accessories";
import { fetchMaps } from "@/lib/maps";
import { fetchMonsterMapSpawns } from "@/lib/monsterMapSpawns";

export default function MonsterEditorPage() {
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [monsters, setMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(emptyMonster());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [items, setItems] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [maps, setMaps] = useState([]);

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

      let saved = null;

      if (selectedMonster?.id) {
        saved = await updateMonster(selectedMonster.id, payload);
      } else {
        saved = await createMonster(payload);
      }

      setSelectedMonster(normalizeMonster(saved));
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
      return;
    }

    const ok = window.confirm(`「${selectedMonster.name}」を削除する?`);
    if (!ok) return;

    try {
      await deleteMonster(selectedMonster.id);
      setSelectedMonster(emptyMonster());
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

      <div className="monster-editor-page" style={styles.page}>
        <MonsterSearchSidebar
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

        <main className="monster-editor-main" style={styles.main}>
          <div className="monster-editor-header" style={styles.header}>
            <div style={styles.headerText}>
              <h1 className="monster-editor-title" style={styles.title}>
                モンスター編集
              </h1>
              <p className="monster-editor-desc" style={styles.desc}>
                基本情報・ドロップ・生息地をまとめて編集する
              </p>
            </div>

            <div className="monster-editor-actions" style={styles.actions}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={styles.saveButton}
              >
                {saving ? "保存中..." : "保存"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                style={styles.deleteButton}
              >
                削除
              </button>
            </div>
          </div>

          {loadingDetail ? (
            <div style={styles.loading}>詳細読み込み中...</div>
          ) : (
            <div className="monster-editor-content" style={styles.content}>
              <MonsterForm
                monster={selectedMonster}
                onChange={setSelectedMonster}
              />

              <MonsterDropsEditor
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
                spawns={selectedMonster?.spawns ?? []}
                maps={maps}
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

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    alignItems: "flex-start",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  headerText: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: "#0f172a",
  },
  desc: {
    margin: "6px 0 0",
    color: "#64748b",
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  saveButton: {
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 16px",
    cursor: "pointer",
    minHeight: 42,
    display: "inline-flex",
    alignItems: "center",
  },
  deleteButton: {
    border: "1px solid #ef4444",
    background: "#fff",
    color: "#b91c1c",
    borderRadius: 10,
    padding: "10px 16px",
    cursor: "pointer",
    minHeight: 42,
    display: "inline-flex",
    alignItems: "center",
  },
  loading: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },
};