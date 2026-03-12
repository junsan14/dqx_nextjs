"use client";

import { useEffect, useMemo, useState } from "react";
import { stringifyCoords } from "./monsterEditorHelpers";

const COLS_8 = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS_8 = [1, 2, 3, 4, 5, 6, 7, 8];

const COLS_4 = ["A-B", "C-D", "E-F", "G-H"];
const ROWS_4 = [1, 2, 3, 4];

const SPAWN_TIME_OPTIONS = [
  { value: "normal", label: "通常" },
  { value: "day", label: "昼" },
  { value: "night", label: "夜" },
  { value: "always", label: "常時" },
  { value: "unknown", label: "不明" },
];

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return apiUrl.replace(/\/$/, "");
}

const API_URL = getApiUrl();

function resolveImageUrl(path = "") {
  const value = String(path ?? "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return `${API_URL}/${value}`;
}

function makeSpawn() {
  return {
    id: null,
    __key: `new-spawn-${Date.now()}-${Math.random()}`,
    map_id: "",
    map_name: "",
    map_image_url: "",
    area: "[]",
    coords: [],
    spawn_time: "normal",
    note: "",
    grid_mode: "block",
  };
}

function normalizeMapRow(row = {}) {
  const rawImagePath =
    row?.image_path ??
    row?.image_url ??
    row?.map_image_url ??
    row?.map_image_path ??
    "";

  return {
    id: row?.id ?? null,
    name: row?.name ?? row?.map_name ?? "",
    image_path: rawImagePath,
    image_url: resolveImageUrl(rawImagePath),
  };
}

function sortCoords(coords = []) {
  return [...coords].sort((a, b) => {
    const colA = String(a).charCodeAt(0);
    const colB = String(b).charCodeAt(0);
    if (colA !== colB) return colA - colB;

    const rowA = Number(String(a).slice(1));
    const rowB = Number(String(b).slice(1));
    return rowA - rowB;
  });
}

function toggleCoordSet(currentCoords = [], targetCoords = []) {
  const current = new Set(currentCoords);
  const targets = targetCoords.filter(Boolean);

  if (targets.length === 0) {
    return sortCoords(Array.from(current));
  }

  const allSelected = targets.every((coord) => current.has(coord));

  if (allSelected) {
    targets.forEach((coord) => current.delete(coord));
  } else {
    targets.forEach((coord) => current.add(coord));
  }

  return sortCoords(Array.from(current));
}

function getCoordsFor4x4Cell(colIndex, rowIndex) {
  const leftCol = COLS_8[colIndex * 2];
  const rightCol = COLS_8[colIndex * 2 + 1];
  const topRow = rowIndex * 2 + 1;
  const bottomRow = rowIndex * 2 + 2;

  return [
    `${leftCol}${topRow}`,
    `${leftCol}${bottomRow}`,
    `${rightCol}${topRow}`,
    `${rightCol}${bottomRow}`,
  ];
}

function is4x4CellActive(coords = [], colIndex, rowIndex) {
  const targetCoords = getCoordsFor4x4Cell(colIndex, rowIndex);
  return targetCoords.every((coord) => coords.includes(coord));
}

function cellLabel8(col, row) {
  return `${col}${row}`;
}

function SpawnMapGrid({ mapImageUrl = "", coords = [], onToggle, gridMode = "block" }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function updateViewportMode() {
      setIsMobile(window.innerWidth <= 640);
    }

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  const useSingleGrid = gridMode === "single";

  const overlayStyle = useSingleGrid
    ? isMobile
      ? styles.gridOverlaySingleMobile
      : styles.gridOverlaySingle
    : isMobile
      ? styles.gridOverlayMobile
      : styles.gridOverlay;

  return (
    <div style={styles.mapCard}>
      <div className="monster-spawns-map-board" style={styles.mapBoard}>
        {mapImageUrl ? (
          <img src={mapImageUrl} alt="map" style={styles.mapImage} />
        ) : (
          <div style={styles.mapEmpty}>マップ画像なし</div>
        )}

        {useSingleGrid ? (
          <div style={overlayStyle}>
            {ROWS_8.map((row) =>
              COLS_8.map((col) => {
                const label = cellLabel8(col, row);
                const active = coords.includes(label);

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onToggle([label])}
                    style={{
                      ...styles.gridCellSingle,
                      ...(active ? styles.gridCellActive : {}),
                    }}
                    title={label}
                  >
                    <span
                      style={{
                        ...styles.gridCellLabelSingle,
                        ...(isMobile ? styles.gridCellLabelSingleMobile : {}),
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div style={overlayStyle}>
            {ROWS_4.map((row, rowIndex) =>
              COLS_4.map((colLabel, colIndex) => {
                const blockCoords = getCoordsFor4x4Cell(colIndex, rowIndex);
                const active = is4x4CellActive(coords, colIndex, rowIndex);
                const label = `${colLabel}${row}`;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onToggle(blockCoords)}
                    style={{
                      ...styles.gridCell,
                      ...(active ? styles.gridCellActive : {}),
                    }}
                    title={`${label} → ${blockCoords.join(", ")}`}
                  >
                    <span
                      style={{
                        ...styles.gridCellLabel,
                        ...(isMobile ? styles.gridCellLabelMobile : {}),
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpawnCard({ spawn, maps, onChange, onRemove }) {
  const selectedMap = useMemo(() => {
    return maps.find((row) => Number(row.id) === Number(spawn?.map_id)) ?? null;
  }, [maps, spawn?.map_id]);

  useEffect(() => {
    if (!selectedMap) return;

    const nextName = selectedMap.name ?? "";
    const nextImage = selectedMap.image_url ?? "";

    if (
      nextName !== (spawn?.map_name ?? "") ||
      nextImage !== (spawn?.map_image_url ?? "")
    ) {
      onChange({
        ...spawn,
        map_name: nextName,
        map_image_url: nextImage,
      });
    }
  }, [selectedMap, spawn, onChange]);

  function setField(key, value) {
    onChange({
      ...spawn,
      [key]: value,
    });
  }

  function handleToggleCoords(targetCoords) {
    const nextCoords = toggleCoordSet(spawn?.coords ?? [], targetCoords);

    onChange({
      ...spawn,
      coords: nextCoords,
      area: stringifyCoords(nextCoords),
    });
  }

  function setGridMode(nextMode) {
    onChange({
      ...spawn,
      grid_mode: nextMode,
    });
  }

  return (
    <div className="monster-spawns-card" style={styles.spawnCard}>
      <div style={styles.spawnCardHeader}>
        <h3 style={styles.spawnTitle}>{spawn?.map_name || "生息地"}</h3>

        <button type="button" onClick={onRemove} style={styles.removeButton}>
          削除
        </button>
      </div>

      <div style={styles.modeRow}>
        <span style={styles.modeLabel}>選択モード</span>

        <div style={styles.modeButtons}>
          <button
            type="button"
            onClick={() => setGridMode("block")}
            style={{
              ...styles.modeButton,
              ...(spawn?.grid_mode !== "single" ? styles.modeButtonActive : {}),
            }}
          >
            4マス
          </button>

          <button
            type="button"
            onClick={() => setGridMode("single")}
            style={{
              ...styles.modeButton,
              ...(spawn?.grid_mode === "single" ? styles.modeButtonActive : {}),
            }}
          >
            1マス
          </button>
        </div>
      </div>

      <div className="monster-spawns-form-grid" style={styles.formGrid}>
        <label style={styles.field}>
          <span style={styles.label}>マップ</span>
          <select
            value={spawn?.map_id ?? ""}
            onChange={(e) => {
              const nextId = e.target.value;
              const nextMap =
                maps.find((row) => String(row.id) === String(nextId)) ?? null;

              onChange({
                ...spawn,
                map_id: nextId ? Number(nextId) : "",
                map_name: nextMap?.name ?? "",
                map_image_url: nextMap?.image_url ?? "",
              });
            }}
            style={styles.input}
          >
            <option value="">選択してください</option>
            {maps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.name}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>出現時間</span>
          <select
            value={spawn?.spawn_time ?? "normal"}
            onChange={(e) => setField("spawn_time", e.target.value)}
            style={styles.input}
          >
            {SPAWN_TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={styles.field}>
        <span style={styles.label}>coords</span>
        <textarea
          value={JSON.stringify(spawn?.coords ?? [])}
          readOnly
          style={styles.textareaReadonly}
        />
      </label>

      <label style={styles.field}>
        <span style={styles.label}>メモ</span>
        <textarea
          value={spawn?.note ?? ""}
          onChange={(e) => setField("note", e.target.value)}
          style={styles.textarea}
          rows={3}
        />
      </label>

      <SpawnMapGrid
        mapImageUrl={spawn?.map_image_url ?? ""}
        coords={spawn?.coords ?? []}
        onToggle={handleToggleCoords}
        gridMode={spawn?.grid_mode ?? "block"}
      />
    </div>
  );
}

export default function MonsterSpawnsEditor({
  spawns = [],
  maps = [],
  onChange,
}) {
  const mapOptions = useMemo(
    () => (Array.isArray(maps) ? maps.map(normalizeMapRow) : []),
    [maps]
  );

  function setNextSpawns(nextSpawns) {
    onChange(nextSpawns);
  }

  function addSpawn() {
    setNextSpawns([...(spawns ?? []), makeSpawn()]);
  }

  function updateSpawn(spawnKey, nextSpawn) {
    setNextSpawns(
      (spawns ?? []).map((spawn) =>
        spawn.__key === spawnKey ? nextSpawn : spawn
      )
    );
  }

  function removeSpawn(spawnKey) {
    setNextSpawns((spawns ?? []).filter((spawn) => spawn.__key !== spawnKey));
  }

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .monster-spawns-card {
            padding: 14px !important;
          }

          .monster-spawns-form-grid {
            grid-template-columns: 1fr !important;
          }

          .monster-spawns-map-board {
            border-radius: 12px !important;
          }
        }

        @media (max-width: 640px) {
          .monster-spawns-map-board {
            aspect-ratio: 1 / 1 !important;
          }
        }
      `}</style>

      <section style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>生息地編集</h2>
            <p style={styles.desc}>
              基本は4マス、必要なときだけ1マスで精密選択する
            </p>
          </div>

          <button type="button" onClick={addSpawn} style={styles.addButton}>
            生息地を追加
          </button>
        </div>

        {spawns.length === 0 ? (
          <div style={styles.empty}>生息地は未登録</div>
        ) : (
          <div style={styles.list}>
            {spawns.map((spawn) => (
              <SpawnCard
                key={spawn.__key}
                spawn={spawn}
                maps={mapOptions}
                onChange={(nextSpawn) => updateSpawn(spawn.__key, nextSpawn)}
                onRemove={() => removeSpawn(spawn.__key)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const styles = {
  wrapper: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 20,
    color: "#111827",
  },
  desc: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 14,
  },
  addButton: {
    border: "1px solid #111827",
    background: "#111827",
    color: "#ffffff",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    minHeight: 42,
  },
  empty: {
    padding: 16,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#64748b",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  spawnCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  spawnCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  spawnTitle: {
    margin: 0,
    fontSize: 18,
    color: "#0f172a",
  },
  removeButton: {
    border: "1px solid #ef4444",
    background: "#ffffff",
    color: "#b91c1c",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    minHeight: 38,
  },
  modeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  modeButtons: {
    display: "inline-flex",
    gap: 8,
    flexWrap: "wrap",
  },
  modeButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    minHeight: 38,
  },
  modeButtonActive: {
    border: "1px solid #2563eb",
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 80,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
    resize: "vertical",
  },
  textareaReadonly: {
    width: "100%",
    minHeight: 72,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    boxSizing: "border-box",
    resize: "vertical",
  },
  mapCard: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  mapBoard: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #cbd5e1",
    background: "#e2e8f0",
  },
  mapImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    objectPosition: "center 90%",
  },
  mapEmpty: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 700,
  },

  // 4マスモード PC
  gridOverlay: {
    position: "absolute",
    top: "28px",
    left: "21px",
    right: "0px",
    bottom: "0px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(4, 1fr)",
  },

  // 4マスモード SP
  gridOverlayMobile: {
    position: "absolute",
    top: "13px",
    left: "11px",
    right: "0px",
    bottom: "0px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(4, 1fr)",
  },

  // 1マスモード PC
  gridOverlaySingle: {
    position: "absolute",
    top: "28px",
    left: "21px",
    right: "0px",
    bottom: "0px",
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridTemplateRows: "repeat(8, 1fr)",
  },

  // 1マスモード SP
  gridOverlaySingleMobile: {
    position: "absolute",
    top: "18px",
    left: "12px",
    right: "4px",
    bottom: "4px",
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridTemplateRows: "repeat(8, 1fr)",
  },

  gridCell: {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.10)",
    cursor: "pointer",
    padding: 0,
    margin: 0,
    outline: "none",
    position: "relative",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
    minWidth: 0,
    minHeight: 0,
    touchAction: "manipulation",
  },
  gridCellSingle: {
    border: "1px solid rgba(255,255,255,0.28)",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    padding: 0,
    margin: 0,
    outline: "none",
    position: "relative",
    transition: "background 0.15s ease, box-shadow 0.15s ease",
    minWidth: 0,
    minHeight: 0,
    touchAction: "manipulation",
  },
  gridCellActive: {
    background: "rgba(37, 99, 235, 0.38)",
    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.75)",
  },
  gridCellLabel: {
    position: "absolute",
    top: 6,
    left: 6,
    fontSize: 11,
    fontWeight: 800,
    color: "#ffffff",
    textShadow: "0 1px 2px rgba(0,0,0,0.45)",
    pointerEvents: "none",
  },
  gridCellLabelMobile: {
    top: 4,
    left: 4,
    fontSize: 11,
  },
  gridCellLabelSingle: {
    position: "absolute",
    top: 3,
    left: 3,
    fontSize: 9,
    fontWeight: 800,
    color: "#ffffff",
    textShadow: "0 1px 2px rgba(0,0,0,0.45)",
    pointerEvents: "none",
  },
  gridCellLabelSingleMobile: {
    top: 2,
    left: 2,
    fontSize: 8,
  },
};