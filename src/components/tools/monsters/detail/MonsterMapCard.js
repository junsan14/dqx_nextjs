"use client";

import { useEffect, useMemo, useState } from "react";
import MonsterMapOverlay from "./MonsterMapOverlay";

const AREA_PREVIEW_COUNT = 4;

function joinDisplayValue(value) {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean).join(" / ");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return "";

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean).join(" / ");
      }

      if (typeof parsed === "string") return parsed.trim();
    } catch (_) {
      return trimmed;
    }

    return trimmed;
  }

  return String(value);
}

function normalizeSpawnTime(value) {
  const v = String(value ?? "").trim().toLowerCase();

  if (v.includes("night") || v.includes("夜")) return "夜";
  if (v.includes("day") || v.includes("昼") || v.includes("日中")) return "日中";
  if (v.includes("normal") || v.includes("always") || v.includes("いつでも")) return "いつでも";

  return String(value ?? "").trim();
}

function normalizeLayerName(value) {
  return String(value ?? "").trim();
}

function splitSlashValues(text = "") {
  return String(text)
    .split("/")
    .map((x) => x.trim())
    .filter(Boolean);
}

function shouldHideLayerNames(layerNames = []) {
  if (!Array.isArray(layerNames) || layerNames.length === 0) return true;
  if (layerNames.length === 1 && layerNames[0] === "地上") return true;
  return false;
}

function getSpawnLayerName(spawn = {}) {
  return normalizeLayerName(spawn?.map_layer_name ?? spawn?.layer_name ?? "");
}

function getSpawnImagePath(spawn = {}, mapItem = {}) {
  return (
    spawn?.map_image_path ??
    spawn?.map_image_url ??
    mapItem?.image_path ??
    mapItem?.image_url ??
    ""
  );
}

function parseAreaList(area) {
  if (!area) return [];

  if (Array.isArray(area)) {
    return area.map((v) => String(v).trim()).filter(Boolean);
  }

  if (typeof area === "string") {
    const trimmed = area.trim();
    if (!trimmed || trimmed === "[]") return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch (_) {
      return trimmed
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function buildSummary(mapItem) {
  const spawns = Array.isArray(mapItem?.spawns) ? mapItem.spawns : [];
  const timeSet = new Set();
  const layerSet = new Set();

  for (const spawn of spawns) {
    const timeText = joinDisplayValue(spawn?.spawn_time);
    if (timeText) {
      for (const time of splitSlashValues(timeText)) {
        const normalized = normalizeSpawnTime(time);
        if (normalized) timeSet.add(normalized);
      }
    }

    const layerText = getSpawnLayerName(spawn);
    if (layerText) {
      for (const name of splitSlashValues(layerText)) {
        const normalized = normalizeLayerName(name);
        if (normalized) layerSet.add(normalized);
      }
    }
  }

  const layerNames = Array.from(layerSet);

  return {
    times: Array.from(timeSet),
    layerNames: shouldHideLayerNames(layerNames) ? [] : layerNames,
  };
}

function buildLayerGroups(mapItem) {
  const spawns = Array.isArray(mapItem?.spawns) ? mapItem.spawns : [];
  const groups = new Map();

  for (const spawn of spawns) {
    const layerName = getSpawnLayerName(spawn);

    if (!layerName || layerName === "地上") {
      continue;
    }

    if (!groups.has(layerName)) {
      groups.set(layerName, {
        layerName,
        imagePath: getSpawnImagePath(spawn, mapItem),
        spawns: [],
      });
    }

    const current = groups.get(layerName);
    current.spawns.push(spawn);

    if (!current.imagePath) {
      current.imagePath = getSpawnImagePath(spawn, mapItem);
    }
  }

  return Array.from(groups.values());
}

function buildAreaTags(spawns = []) {
  const tags = [];
  const seen = new Set();

  for (const spawn of spawns) {
    const areas = parseAreaList(spawn?.area ?? spawn?.coords);

    for (const area of areas) {
      const normalized = String(area).trim().toUpperCase();
      if (!normalized) continue;
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      tags.push(normalized);
    }
  }

  return tags;
}

function useIsMobile(breakpoint = 920) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

export default function MonsterMapCard({ mapItem }) {
  const isMobile = useIsMobile();
  const summary = useMemo(() => buildSummary(mapItem), [mapItem]);
  const layerGroups = useMemo(() => buildLayerGroups(mapItem), [mapItem]);

  const hasLayerSwitch = layerGroups.length > 0;

  const [activeLayerName, setActiveLayerName] = useState(
    layerGroups[0]?.layerName ?? ""
  );
  const [coordsExpanded, setCoordsExpanded] = useState(false);

  useEffect(() => {
    if (!hasLayerSwitch) {
      setActiveLayerName("");
      return;
    }

    const exists = layerGroups.some((group) => group.layerName === activeLayerName);
    if (!exists) {
      setActiveLayerName(layerGroups[0]?.layerName ?? "");
    }
  }, [activeLayerName, hasLayerSwitch, layerGroups]);

  useEffect(() => {
    setCoordsExpanded(false);
  }, [mapItem?.id, activeLayerName]);

  const activeLayerGroup = useMemo(() => {
    if (!hasLayerSwitch) return null;
    return (
      layerGroups.find((group) => group.layerName === activeLayerName) ??
      layerGroups[0] ??
      null
    );
  }, [activeLayerName, hasLayerSwitch, layerGroups]);

  const displaySpawns = hasLayerSwitch
    ? activeLayerGroup?.spawns ?? []
    : mapItem?.spawns ?? [];

  const displayImagePath = hasLayerSwitch
    ? activeLayerGroup?.imagePath ?? mapItem?.image_path ?? ""
    : mapItem?.image_path ?? mapItem?.image_url ?? "";

  const areaTags = useMemo(() => buildAreaTags(displaySpawns), [displaySpawns]);
  const displayTimes = summary.times;

  const previewAreaTags = areaTags.slice(0, AREA_PREVIEW_COUNT);
  const hiddenAreaTags = areaTags.slice(AREA_PREVIEW_COUNT);
  const hasHiddenCoords = hiddenAreaTags.length > 0;

  return (
    <article style={styles.card}>
      <div
        style={{
          ...styles.topRow,
          ...(isMobile ? styles.topRowMobile : {}),
        }}
      >
        <div style={styles.titleWrap}>
          <h3 style={styles.mapTitle}>{mapItem?.name || "マップ"}</h3>

          {displayTimes.length > 0 ? (
            <div style={styles.timeTagWrap}>
              {displayTimes.map((time) => (
                <span
                  key={time}
                  style={{
                    ...styles.tag,
                    ...(time === "夜" ? styles.tagNight : {}),
                    ...((time === "日中" || time === "昼") ? styles.tagDay : {}),
                  }}
                >
                  {time}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {hasLayerSwitch ? (
          <div
            style={{
              ...styles.layerSwitchRow,
              ...(isMobile ? styles.layerSwitchRowMobile : {}),
            }}
          >
            {layerGroups.map((group) => {
              const active = group.layerName === activeLayerName;

              return (
                <button
                  key={group.layerName}
                  type="button"
                  onClick={() => setActiveLayerName(group.layerName)}
                  style={{
                    ...styles.layerSwitchButton,
                    ...(active ? styles.layerSwitchButtonActive : {}),
                  }}
                >
                  {group.layerName}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {areaTags.length > 0 ? (
        <div style={styles.coordsSection}>
          <div style={styles.areaRow}>
            {previewAreaTags.map((area) => (
              <span key={area} style={{ ...styles.tag, ...styles.tagArea }}>
                {area}
              </span>
            ))}

            {!coordsExpanded && hasHiddenCoords ? (
              <button
                type="button"
                onClick={() => setCoordsExpanded(true)}
                style={styles.coordsToggleButton}
              >
                +{hiddenAreaTags.length}
              </button>
            ) : null}
          </div>

          {coordsExpanded && hasHiddenCoords ? (
            <div style={styles.coordsAccordion}>
              <div style={styles.areaRow}>
                {hiddenAreaTags.map((area) => (
                  <span key={area} style={{ ...styles.tag, ...styles.tagArea }}>
                    {area}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCoordsExpanded(false)}
                style={styles.coordsCloseButton}
              >
                閉じる
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={styles.mapWrap}>
        <MonsterMapOverlay
          spawns={displaySpawns}
          imagePath={displayImagePath}
        />
      </div>
    </article>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    background: "#fff",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    height: "100%",
    minHeight: "100%",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    minWidth: 0,
    flexWrap: "nowrap",
  },
  topRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  titleWrap: {
    minWidth: 0,
    flex: "1 1 auto",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  mapTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1.35,
    color: "#111827",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  timeTagWrap: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
  },
  layerSwitchRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    flex: "0 0 auto",
    maxWidth: "100%",
    marginLeft: "auto",
  },
  layerSwitchRowMobile: {
    justifyContent: "flex-start",
    marginLeft: 0,
  },
  layerSwitchButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.2,
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  layerSwitchButtonActive: {
    background: "#2563eb",
    color: "#fff",
    border: "1px solid #2563eb",
    boxShadow: "0 8px 20px rgba(37,99,235,0.18)",
  },
  coordsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },
  areaRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    minWidth: 0,
    alignItems: "center",
  },
  coordsAccordion: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingTop: "2px",
  },
  tag: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3730a3",
    maxWidth: "100%",
    boxSizing: "border-box",
    border: "1px solid transparent",
    lineHeight: 1.35,
  },
  tagArea: {
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
  },
  tagDay: {
    background: "#ffedd5",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  tagNight: {
    background: "#111827",
    color: "#ffffff",
    border: "1px solid #374151",
  },
  coordsToggleButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#475569",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1.35,
  },
  coordsCloseButton: {
    alignSelf: "flex-start",
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  mapWrap: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
  },
};