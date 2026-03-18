"use client";

import { useEffect, useMemo, useState } from "react";
import MonsterMapOverlay from "./MonsterMapOverlay";

const AREA_PREVIEW_COUNT = 3;

function usePrefersDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => setIsDark(media.matches);

    applyTheme();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }

    media.addListener(applyTheme);
    return () => media.removeListener(applyTheme);
  }, []);

  return isDark;
}

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
  if (v.includes("normal") || v.includes("always") || v.includes("いつでも")) {
    return "いつでも";
  }

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

function getContinentName(mapItem = {}) {
  return (
    String(
      mapItem?.continent_name ??
        mapItem?.continent ??
        mapItem?.continentLabel ??
        ""
    ).trim()
  );
}

export default function MonsterMapCard({ mapItem }) {
  const isMobile = useIsMobile();
  const isDark = usePrefersDark();
  const styles = getStyles(isDark);

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
  const continentName = getContinentName(mapItem);

  const previewAreaTags = areaTags.slice(0, AREA_PREVIEW_COUNT);
  const hiddenAreaTags = areaTags.slice(AREA_PREVIEW_COUNT);
  const hasHiddenCoords = hiddenAreaTags.length > 0;

  const hasSpawnMeta =
    previewAreaTags.length > 0 || displayTimes.length > 0 || summary.layerNames.length > 0;

  return (
    <article style={styles.card}>
      <div
        style={{
          ...styles.topRow,
          ...(isMobile ? styles.topRowMobile : {}),
        }}
      >
        <div style={styles.titleWrap}>
          <div style={styles.titleLine}>
            <h3 style={styles.mapTitle}>{mapItem?.name || "マップ"}</h3>

            {continentName ? (
              <span style={styles.continentText}>{continentName}</span>
            ) : null}
          </div>
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

      {hasSpawnMeta ? (
        <div style={styles.spawnInfoSection}>
          <div style={styles.spawnInfoRow}>
            <span style={styles.spawnInfoLabel}>生息</span>

            <div style={styles.spawnMetaWrap}>
              <div style={styles.spawnMetaWrapTag}>
                {previewAreaTags.map((area) => (
                  <div key={area} style={{ ...styles.tag, ...styles.tagArea }}>
                    {area}
                  </div>
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
              <div>
                {displayTimes.map((time) => (
                  <div
                    key={time}
                    style={{
                      ...styles.tag,
                      ...(time === "夜" ? styles.tagNight : {}),
                      ...((time === "日中" || time === "昼") ? styles.tagDay : {}),
                      ...(time === "いつでも" ? styles.tagAnytime : {}),
                    }}
                  >
                    {time}
                  </div>
                ))}
              </div>

           
             
            </div>
          </div>

          {coordsExpanded && hasHiddenCoords ? (
            <div style={styles.coordsAccordion}>
              <div style={styles.spawnInfoRow}>
                <span style={styles.spawnInfoLabelSub}>追加</span>

                <div style={styles.spawnMetaWrap}>
                  {hiddenAreaTags.map((area) => (
                    <span key={area} style={{ ...styles.tag, ...styles.tagArea }}>
                      {area}
                    </span>
                  ))}
                </div>
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

function getStyles(isDark) {
  return {
    card: {
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      overflow: "hidden",
      background: isDark ? "#0f172a" : "#fff",
      borderRadius: "18px",
      padding: "16px",
      boxShadow: isDark
        ? "0 10px 28px rgba(2,6,23,0.30)"
        : "0 8px 24px rgba(15,23,42,0.04)",
      height: "100%",
      minHeight: "100%",
      border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
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
    titleLine: {
      display: "flex",
      alignItems: "baseline",
      gap: "8px",
      flexWrap: "wrap",
      minWidth: 0,
    },
    mapTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 800,
      lineHeight: 1.35,
      color: isDark ? "#f8fafc" : "#111827",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    },
    continentText: {
      fontSize: "12px",
      fontWeight: 600,
      lineHeight: 1.4,
      color: isDark ? "#94a3b8" : "#64748b",
      whiteSpace: "normal",
      wordBreak: "break-word",
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
      border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
      background: isDark ? "#111827" : "#f8fafc",
      color: isDark ? "#cbd5e1" : "#334155",
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
      background: isDark ? "#4f46e5" : "#2563eb",
      color: "#fff",
      border: isDark ? "1px solid #4f46e5" : "1px solid #2563eb",
      boxShadow: isDark
        ? "0 8px 20px rgba(79,70,229,0.28)"
        : "0 8px 20px rgba(37,99,235,0.18)",
    },
    spawnInfoSection: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minWidth: 0,
      padding: "10px 12px",
      borderRadius: "14px",
      background: isDark ? "rgba(2,6,23,0.42)" : "#f8fafc",
      border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
    },
    spawnInfoRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      minWidth: 0,
    },
    spawnInfoLabel: {
      flex: "0 0 auto",
      minWidth: "32px",
      fontSize: "11px",
      fontWeight: 800,
 
      color: isDark ? "#93c5fd" : "#2563eb",
    },
    spawnInfoLabelSub: {
      flex: "0 0 auto",
      minWidth: "32px",
      fontSize: "11px",
      fontWeight: 800,
      lineHeight: 1.9,
      color: isDark ? "#64748b" : "#94a3b8",
    },
    spawnMetaWrap: {
      display: "flex",

      width:"100%",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent:"space-between",
      minWidth: 0,
    },
    spawnMetaWrapTag: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent:"space-between",
      minWidth: 0,
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
      background: isDark ? "rgba(99,102,241,0.16)" : "#eef2ff",
      color: isDark ? "#c7d2fe" : "#3730a3",
      maxWidth: "100%",
      boxSizing: "border-box",
      border: "1px solid transparent",
      lineHeight: 1.35,
    },
    tagArea: {
      background: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#cbd5e1" : "#334155",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
    },
    tagLayer: {
      background: isDark ? "rgba(148,163,184,0.12)" : "#f1f5f9",
      color: isDark ? "#cbd5e1" : "#475569",
      border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
    },
    tagDay: {
      background: isDark ? "rgba(251,146,60,0.16)" : "#ffedd5",
      color: isDark ? "#fdba74" : "#c2410c",
      border: isDark ? "1px solid rgba(251,146,60,0.28)" : "1px solid #fdba74",
    },
    tagNight: {
      background: isDark ? "#020617" : "#111827",
      color: "#ffffff",
      border: isDark ? "1px solid #334155" : "1px solid #374151",
    },
    tagAnytime: {
      background: isDark ? "rgba(34,197,94,0.16)" : "#dcfce7",
      color: isDark ? "#86efac" : "#166534",
      border: isDark ? "1px solid rgba(34,197,94,0.30)" : "1px solid #86efac",
    },
    coordsToggleButton: {
      appearance: "none",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
      background: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#cbd5e1" : "#475569",
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 700,
      cursor: "pointer",

    },
    coordsCloseButton: {
      alignSelf: "flex-start",
      appearance: "none",
      border: "none",
      background: "transparent",
      color: isDark ? "#94a3b8" : "#64748b",
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
}