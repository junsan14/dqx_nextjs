"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeMapRow } from "@/lib/monsterMapSpawns";
import { applyMonsterThemeToStyleTree } from "../theme";
import Image from "next/image";
const COLS_8 = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS_8 = [1, 2, 3, 4, 5, 6, 7, 8];

const COLS_4 = ["A", "B", "C", "D"];
const ROWS_4 = [1, 2, 3, 4];

const SPAWN_TIME_OPTIONS = [
  { value: "normal", label: "通常" },
  { value: "day", label: "昼のみ" },
  { value: "night", label: "夜のみ" },
  { value: "always", label: "常時" },
];

function makeSpawn() {
  return {
    id: null,
    __key: `new-spawn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    monster_id: null,
    map_id: "",
    map_layer_id: "",
    map_name: "",
    map_layer_name: "",
    map_image_url: "",
    area: "[]",
    coords: [],
    spawn_time: "normal",
    note: "",
    grid_mode: "block",
  };
}

function stringifyCoords(coords = []) {
  return JSON.stringify(coords);
}

function uniqCoords(coords = []) {
  return [
    ...new Set(
      (coords ?? []).map((value) => String(value ?? "").trim()).filter(Boolean)
    ),
  ];
}

function toggleCoordSet(currentCoords = [], targetCoords = []) {
  const current = uniqCoords(currentCoords);
  const targets = uniqCoords(targetCoords);

  const hasAll = targets.every((coord) => current.includes(coord));

  if (hasAll) {
    return current.filter((coord) => !targets.includes(coord));
  }

  return uniqCoords([...current, ...targets]);
}

function getCoordsFor4x4Cell(colIndex, rowIndex) {
  const startCol = colIndex * 2;
  const startRow = rowIndex * 2;
  const coords = [];

  for (let y = startRow; y < startRow + 2; y += 1) {
    for (let x = startCol; x < startCol + 2; x += 1) {
      coords.push(`${COLS_8[x]}${ROWS_8[y]}`);
    }
  }

  return coords;
}

function get4x4CellMiniMap(coords = [], colIndex, rowIndex) {
  const activeSet = new Set(uniqCoords(coords));
  const blockCoords = getCoordsFor4x4Cell(colIndex, rowIndex);

  return blockCoords.map((coord) => ({
    coord,
    active: activeSet.has(coord),
  }));
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

function SpawnMapGrid({
  mapImageUrl = "",
  coords = [],
  onToggle,
  gridMode = "block",
  styles,
}) {
  const activeSet = useMemo(() => new Set(uniqCoords(coords)), [coords]);
  const isMobile = isMobileViewport();
  const overlayStyle =
    gridMode === "single" ? styles.singleOverlay : styles.gridOverlay;

  return (
    <div style={styles.mapBoardWrap}>
      <div className="monster-spawns-map-board" style={styles.mapBoard}>
        {mapImageUrl ? (
          <Image src={mapImageUrl} alt="map" style={styles.mapImage}  fill/>
        ) : (
          <div style={styles.mapPlaceholder}>マップ画像なし</div>
        )}

        {gridMode === "single" ? (
          <div style={overlayStyle}>
            {ROWS_8.map((row) =>
              COLS_8.map((col) => {
                const label = `${col}${row}`;
                const active = activeSet.has(label);

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
                const miniCells = get4x4CellMiniMap(coords, colIndex, rowIndex);
                const hasAnyActive = miniCells.some((cell) => cell.active);
                const label = `${colLabel}${row}`;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onToggle(blockCoords)}
                    style={{
                      ...styles.gridCell,
                      ...(hasAnyActive ? styles.gridCellPartialActive : {}),
                    }}
                    title={`${label} → ${blockCoords.join(", ")}`}
                  >
                    <div style={styles.gridCellMiniMap}>
                      {miniCells.map((cell) => (
                        <span
                          key={cell.coord}
                          style={{
                            ...styles.gridCellMini,
                            ...(cell.active ? styles.gridCellMiniActive : {}),
                          }}
                        />
                      ))}
                    </div>

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

function getLayerLabel(layer = {}, index = 0) {
  const explicit = String(layer?.layer_name ?? "").trim();
  if (explicit) return explicit;

  if (layer?.floor_no !== null && layer?.floor_no !== undefined) {
    const floorNo = Number(layer.floor_no);
    if (floorNo === 0) return "地上";
    if (floorNo < 0) return `地下${Math.abs(floorNo)}階`;
    return `${floorNo}階`;
  }

  return `階層${index + 1}`;
}

function normalizeLayerDisplayName(name = "") {
  return String(name ?? "").trim();
}

function getDisplayLayerNamesForMap(map = null) {
  const layers = Array.isArray(map?.layers) ? map.layers : [];

  const uniqueNames = [
    ...new Set(
      layers
        .map((layer, index) => getLayerLabel(layer, index))
        .map(normalizeLayerDisplayName)
        .filter(Boolean)
    ),
  ];

  if (uniqueNames.length === 0) return [];
  if (uniqueNames.length === 1 && uniqueNames[0] === "地上") return [];

  return uniqueNames;
}

function shouldHideLayerSelect(map = null) {
  const layers = Array.isArray(map?.layers) ? map.layers : [];
  if (layers.length === 0) return true;

  const displayNames = getDisplayLayerNamesForMap(map);
  return displayNames.length === 0;
}

function getDefaultLayerForMap(map = null) {
  const layers = Array.isArray(map?.layers) ? map.layers : [];
  if (layers.length === 0) return null;
  return layers[0] ?? null;
}

function MapSearchInput({
  maps = [],
  selectedContinent = "",
  selectedMap = null,
  onSelect,
  styles,
}) {
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setKeyword("");
    setOpen(false);
  }, [selectedContinent]);

  useEffect(() => {
    if (selectedMap?.name) {
      setKeyword(selectedMap.name);
    } else {
      setKeyword("");
    }
  }, [selectedMap]);

  const continentMaps = useMemo(() => {
    const list = Array.isArray(maps) ? maps : [];
    if (!selectedContinent) return [];
    return list.filter(
      (map) => String(map?.continent ?? "") === String(selectedContinent)
    );
  }, [maps, selectedContinent]);

  const filteredMaps = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return continentMaps
      .filter((map) => {
        if (String(map?.map_type ?? "") === "town") return false;

        const name = String(map?.name ?? "").toLowerCase();
        if (!q) return true;

        return name.includes(q);
      })
      .slice(0, 30);
  }, [continentMaps, keyword]);

  return (
    <div ref={wrapRef} style={styles.mapSearchWrap}>
      <input
        type="text"
        value={keyword}
        placeholder={
          selectedContinent ? "その大陸の地名を入力" : "先に大陸を選択"
        }
        onChange={(e) => {
          if (!selectedContinent) return;
          setKeyword(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (selectedContinent) setOpen(true);
        }}
        style={{
          ...styles.input,
          ...(!selectedContinent ? styles.inputDisabled : {}),
        }}
        disabled={!selectedContinent}
      />

      {open && selectedContinent ? (
        <div style={styles.mapSearchDropdown}>
          {filteredMaps.length > 0 ? (
            filteredMaps.map((map) => (
              <button
                key={map.id}
                type="button"
                onClick={() => {
                  onSelect(map);
                  setKeyword(map.name ?? "");
                  setOpen(false);
                }}
                style={styles.mapSearchItem}
              >
                <div style={styles.mapSearchItemName}>{map.name}</div>
              </button>
            ))
          ) : (
            <div style={styles.mapSearchEmpty}>見つからない</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SpawnCard({
  spawn,
  maps,
  onChange,
  onRemove,
  layerNamesForMap = [],
  styles,
}) {
  const selectedMap = useMemo(() => {
    return maps.find((row) => Number(row.id) === Number(spawn?.map_id)) ?? null;
  }, [maps, spawn?.map_id]);

  const [selectedContinent, setSelectedContinent] = useState(
    selectedMap?.continent ?? ""
  );

  useEffect(() => {
    if (selectedMap?.continent) {
      setSelectedContinent(selectedMap.continent);
    }
  }, [selectedMap?.continent]);

  const continentOptions = useMemo(() => {
    const values = [
      ...new Set(
        (maps ?? [])
          .map((map) => String(map?.continent ?? "").trim())
          .filter(Boolean)
      ),
    ];

    return values.sort((a, b) => a.localeCompare(b, "ja"));
  }, [maps]);

  const selectedLayer = useMemo(() => {
    const layers = selectedMap?.layers ?? [];
    if (!layers.length) return null;

    if (spawn?.map_layer_id) {
      const matched =
        layers.find((row) => Number(row.id) === Number(spawn.map_layer_id)) ??
        null;
      if (matched) return matched;
    }

    return getDefaultLayerForMap(selectedMap);
  }, [selectedMap, spawn?.map_layer_id]);

  const hideLayerSelect = useMemo(
    () => shouldHideLayerSelect(selectedMap),
    [selectedMap]
  );

  useEffect(() => {
    if (!selectedMap) return;

    const nextName = selectedMap.name ?? "";
    const nextLayerId = selectedLayer?.id ?? "";
    const nextLayerName = selectedLayer ? getLayerLabel(selectedLayer) : "";
    const nextImage =
      selectedLayer?.image_url ??
      selectedMap?.image_url ??
      spawn?.map_image_url ??
      "";

    if (
      nextName !== (spawn?.map_name ?? "") ||
      String(nextLayerId ?? "") !== String(spawn?.map_layer_id ?? "") ||
      nextLayerName !== (spawn?.map_layer_name ?? "") ||
      nextImage !== (spawn?.map_image_url ?? "")
    ) {
      onChange({
        ...spawn,
        map_name: nextName,
        map_layer_id: nextLayerId || "",
        map_layer_name: nextLayerName,
        map_image_url: nextImage,
      });
    }
  }, [selectedMap, selectedLayer, spawn, onChange]);

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

  function handleChangeContinent(nextContinent) {
    setSelectedContinent(nextContinent);

    const currentMapContinent = selectedMap?.continent ?? "";

    if (!nextContinent) {
      onChange({
        ...spawn,
        map_id: "",
        map_name: "",
        map_layer_id: "",
        map_layer_name: "",
        map_image_url: "",
      });
      return;
    }

    if (currentMapContinent && currentMapContinent !== nextContinent) {
      onChange({
        ...spawn,
        map_id: "",
        map_name: "",
        map_layer_id: "",
        map_layer_name: "",
        map_image_url: "",
      });
    }
  }

  return (
    <div className="monster-spawns-card" style={styles.spawnCard}>
      <div style={styles.spawnCardHeader}>
        <div style={styles.spawnHeaderMain}>
          <h3 style={styles.spawnTitle}>{spawn?.map_name || "生息地"}</h3>

          {layerNamesForMap.length > 0 ? (
            <div style={styles.layerListWrap}>
              {layerNamesForMap.map((name) => (
                <span key={name} style={styles.layerBadge}>
                  {name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

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
          <span style={styles.label}>大陸</span>
          <select
            value={selectedContinent}
            onChange={(e) => handleChangeContinent(e.target.value)}
            style={styles.input}
          >
            <option value="">選択してください</option>
            {continentOptions.map((continent) => (
              <option key={continent} value={continent}>
                {continent}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.label}>地名</span>

          <MapSearchInput
            maps={maps}
            selectedContinent={selectedContinent}
            selectedMap={selectedMap}
            onSelect={(nextMap) => {
              const firstLayer = getDefaultLayerForMap(nextMap);

              onChange({
                ...spawn,
                map_id: nextMap?.id ?? "",
                map_name: nextMap?.name ?? "",
                map_layer_id: firstLayer?.id ?? "",
                map_layer_name: firstLayer ? getLayerLabel(firstLayer, 0) : "",
                map_image_url:
                  firstLayer?.image_url ?? nextMap?.image_url ?? "",
              });
            }}
            styles={styles}
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>階層</span>
          <select
            value={spawn?.map_layer_id ?? ""}
            onChange={(e) => {
              const nextLayerId = e.target.value;
              const nextLayer =
                selectedMap?.layers?.find(
                  (row) => String(row.id) === String(nextLayerId)
                ) ?? null;

              onChange({
                ...spawn,
                map_layer_id: nextLayerId ? Number(nextLayerId) : "",
                map_layer_name: nextLayer ? getLayerLabel(nextLayer) : "",
                map_image_url:
                  nextLayer?.image_url ?? selectedMap?.image_url ?? "",
              });
            }}
            style={{
              ...styles.input,
              ...(hideLayerSelect ? styles.inputDisabled : {}),
            }}
            disabled={
              !selectedMap ||
              !(selectedMap?.layers?.length > 0) ||
              hideLayerSelect
            }
          >
            {!selectedMap ? (
              <option value="">先に地名を選択</option>
            ) : hideLayerSelect ? (
              <option value="">階層なし</option>
            ) : (
              (selectedMap.layers ?? []).map((layer, index) => (
                <option key={layer.id} value={layer.id}>
                  {getLayerLabel(layer, index)}
                </option>
              ))
            )}
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
        <span style={styles.label}>生息エリア</span>
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
        styles={styles}
      />
    </div>
  );
}

export default function MonsterSpawnsEditor({
  spawns = [],
  maps = [],
  onChange,
  theme,
}) {
  const styles = useMemo(() => getComponentStyles(theme), [theme]);
  const mapOptions = useMemo(
    () => (Array.isArray(maps) ? maps.map(normalizeMapRow) : []),
    [maps]
  );

  const displayLayerNamesByMapId = useMemo(() => {
    const grouped = new Map();

    for (const map of mapOptions) {
      const mapId = String(map?.id ?? "").trim();
      if (!mapId) continue;

      grouped.set(mapId, getDisplayLayerNamesForMap(map));
    }

    return grouped;
  }, [mapOptions]);

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
      <style>{`
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
            <p style={styles.desc}>先に大陸を選んでから地名を検索する</p>
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
                layerNamesForMap={
                  displayLayerNamesByMapId.get(String(spawn?.map_id ?? "")) ?? []
                }
                onChange={(nextSpawn) => updateSpawn(spawn.__key, nextSpawn)}
                onRemove={() => removeSpawn(spawn.__key)}
                styles={styles}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const baseStyles = {
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
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: "#ffffff",
  },
  spawnCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  spawnHeaderMain: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  spawnTitle: {
    margin: 0,
    fontSize: 18,
    color: "#111827",
    wordBreak: "break-word",
  },
  spawnLayerText: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },
  layerListWrap: {
    marginTop: 2,
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  layerBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 24,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  removeButton: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    minHeight: 38,
    flexShrink: 0,
  },
  modeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  modeButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  modeButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    minHeight: 36,
  },
  modeButtonActive: {
    borderColor: "#111827",
    background: "#111827",
    color: "#ffffff",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    minHeight: 42,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    background: "#ffffff",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  },
  inputDisabled: {
    background: "#f8fafc",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  textarea: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: 12,
    background: "#ffffff",
    color: "#111827",
    outline: "none",
    resize: "vertical",
    minHeight: 84,
    boxSizing: "border-box",
  },
  textareaReadonly: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 12,
    background: "#f8fafc",
    color: "#334155",
    outline: "none",
    resize: "vertical",
    minHeight: 56,
    boxSizing: "border-box",
  },
  mapBoardWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  mapBoard: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
  },
  mapImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#64748b",
    fontSize: 14,
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(4, 1fr)",
  },
  singleOverlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridTemplateRows: "repeat(8, 1fr)",
  },
  gridCell: {
    position: "relative",
    border: "1px solid rgba(255,255,255,0.65)",
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 6,
    cursor: "pointer",
  },
  gridCellSingle: {
    position: "relative",
    border: "1px solid rgba(255,255,255,0.5)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 2,
    cursor: "pointer",
  },
  gridCellActive: {
    background: "rgba(37, 99, 235, 0.35)",
  },
  gridCellPartialActive: {
    background: "rgba(37, 99, 235, 0.2)",
  },
  gridCellMiniMap: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gridTemplateRows: "repeat(2, 1fr)",
    gap: 2,
    width: 24,
    height: 24,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    padding: 2,
  },
  gridCellMini: {
    borderRadius: 2,
    background: "rgba(255,255,255,0.45)",
  },
  gridCellMiniActive: {
    background: "rgba(37, 99, 235, 0.9)",
  },
  gridCellLabel: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    background: "rgba(255,255,255,0.78)",
    padding: "2px 6px",
    borderRadius: 999,
  },
  gridCellLabelMobile: {
    fontSize: 11,
    padding: "1px 5px",
  },
  gridCellLabelSingle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
    background: "rgba(255,255,255,0.78)",
    padding: "1px 4px",
    borderRadius: 999,
  },
  gridCellLabelSingleMobile: {
    fontSize: 9,
    padding: "1px 3px",
  },
  mapSearchWrap: {
    position: "relative",
  },
  mapSearchDropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 30,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
    maxHeight: 240,
    overflow: "auto",
  },
  mapSearchItem: {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "10px 12px",
    textAlign: "left",
    cursor: "pointer",
  },
  mapSearchItemName: {
    fontSize: 14,
    color: "#111827",
  },
  mapSearchEmpty: {
    padding: 12,
    color: "#64748b",
    fontSize: 14,
  },
};

function getComponentStyles(theme) {
  return applyMonsterThemeToStyleTree(baseStyles, theme);
}
