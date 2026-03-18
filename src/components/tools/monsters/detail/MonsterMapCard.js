"use client";

import { useEffect, useMemo, useState } from "react";
import MonsterMapOverlay from "./MonsterMapOverlay";

const AREA_PREVIEW_COUNT = 2;

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
  return String(
    mapItem?.continent_name ??
      mapItem?.continent ??
      mapItem?.continentLabel ??
      ""
  ).trim();
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
    previewAreaTags.length > 0 ||
    displayTimes.length > 0 ||
    summary.layerNames.length > 0;

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

              <div style={styles.timeTagWrap}>
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
      gap: "14px",
    },
    topRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "14px",
    },
    topRowMobile: {
      flexDirection: "column",
      alignItems: "stretch",
    },
    titleWrap: {
      minWidth: 0,
      flex: 1,
    },
    titleLine: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "8px 10px",
    },
    mapTitle: {
      margin: 0,
      fontSize: "18px",
      lineHeight: 1.35,
      fontWeight: 900,
      color: isDark ? "#f8fafc" : "#111827",
      wordBreak: "break-word",
    },
    continentText: {
      display: "inline-flex",
      alignItems: "center",
      minHeight: "28px",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
    },
    layerSwitchRow: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: "8px",
      flexShrink: 0,
    },
    layerSwitchRowMobile: {
      justifyContent: "flex-start",
    },
    layerSwitchButton: {
      appearance: "none",
      border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
      background: isDark ? "#0b1220" : "#f8fafc",
      color: isDark ? "#cbd5e1" : "#334155",
      borderRadius: "999px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: 800,
      cursor: "pointer",
    },
    layerSwitchButtonActive: {
      background: isDark ? "#4f46e5" : "#111827",
      color: "#fff",
      border: isDark ? "1px solid #6366f1" : "1px solid #111827",
      boxShadow: isDark
        ? "0 10px 22px rgba(99,102,241,0.24)"
        : "0 8px 18px rgba(17,24,39,0.12)",
    },
    spawnInfoSection: {
      display: "grid",
      gap: "12px",
      padding: isDark ? "14px" : "13px",
      borderRadius: "16px",
      background: isDark
        ? "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.96) 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      border: isDark ? "1px solid rgba(71,85,105,0.85)" : "1px solid #dbe4f0",
      boxShadow: isDark
        ? "0 14px 30px rgba(2,6,23,0.34), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 10px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
    },
    spawnInfoRow: {
      display: "flex",
      justifyContent:"sapce-between"
    },
    spawnInfoLabel: {
      minWidth: "42px",
      paddingTop: "6px",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.04em",
      color: isDark ? "#94a3b8" : "#64748b",
      flexShrink: 0,
    },
    spawnInfoLabelSub: {
      minWidth: "42px",
      paddingTop: "4px",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.04em",
      color: isDark ? "#94a3b8" : "#64748b",
      flexShrink: 0,
    },
    spawnMetaWrap: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent:"space-between"
      

    },
    spawnMetaWrapTag: {
      display: "flex",
      flexWrap: "wrap",
      gap: "1px",
      minWidth: 0,
    },
    timeTagWrap: {
      display: "flex",
      flexWrap: "wrap",
      gap: "1px",
      minWidth: 0,
    },
    tag: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "32px",
      padding: "2px 11px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 900,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      boxSizing: "border-box",
    },
    tagArea: {
      background: isDark ? "rgba(30,41,59,0.95)" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
      border: isDark ? "1px solid rgba(100,116,139,0.7)" : "1px solid #cbd5e1",
      boxShadow: isDark
        ? "0 6px 16px rgba(2,6,23,0.28)"
        : "0 4px 12px rgba(15,23,42,0.08)",
    },
    tagNight: {
      background: isDark ? "rgba(91,33,182,0.22)" : "#f5f3ff",
      color: isDark ? "#c4b5fd" : "#6d28d9",
      border: isDark ? "1px solid rgba(167,139,250,0.35)" : "1px solid #ddd6fe",
      boxShadow: isDark
        ? "0 6px 16px rgba(46,16,101,0.26)"
        : "0 4px 12px rgba(109,40,217,0.10)",
    },
    tagDay: {
      background: isDark ? "rgba(180,83,9,0.18)" : "#fff7ed",
      color: isDark ? "#fdba74" : "#c2410c",
      border: isDark ? "1px solid rgba(251,191,36,0.28)" : "1px solid #fed7aa",
      boxShadow: isDark
        ? "0 6px 16px rgba(120,53,15,0.20)"
        : "0 4px 12px rgba(194,65,12,0.08)",
    },
    tagAnytime: {
      background: isDark ? "rgba(4,120,87,0.18)" : "#ecfdf5",
      color: isDark ? "#86efac" : "#047857",
      border: isDark ? "1px solid rgba(52,211,153,0.26)" : "1px solid #a7f3d0",
      boxShadow: isDark
        ? "0 6px 16px rgba(6,78,59,0.18)"
        : "0 4px 12px rgba(4,120,87,0.08)",
    },
    coordsToggleButton: {
      appearance: "none",
      border: isDark ? "1px solid rgba(129,140,248,0.45)" : "1px solid #c7d2fe",
      background: isDark ? "rgba(79,70,229,0.16)" : "#eef2ff",
      color: isDark ? "#c7d2fe" : "#4338ca",
      borderRadius: "999px",
      minHeight: "32px",
      padding: "7px 11px",
      fontSize: "12px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: isDark
        ? "0 6px 16px rgba(79,70,229,0.18)"
        : "0 4px 12px rgba(79,70,229,0.10)",
    },
    coordsAccordion: {
      display: "grid",
      gap: "10px",
      padding: "12px",
      borderRadius: "14px",
      background: isDark ? "rgba(2,6,23,0.58)" : "rgba(248,250,252,0.96)",
      border: isDark ? "1px solid rgba(51,65,85,0.85)" : "1px solid #dbe4f0",
      boxShadow: isDark
        ? "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 22px rgba(2,6,23,0.18)"
        : "inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 20px rgba(15,23,42,0.06)",
    },
    coordsCloseButton: {
      appearance: "none",
      alignSelf: "flex-start",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
      background: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#cbd5e1" : "#334155",
      borderRadius: "999px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: isDark
        ? "0 6px 16px rgba(2,6,23,0.18)"
        : "0 4px 12px rgba(15,23,42,0.06)",
    },
    mapWrap: {
      minWidth: 0,
      width: "100%",
    },
  };
}