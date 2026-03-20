"use client";

import { useEffect, useMemo, useState } from "react";
import MonsterMapOverlay from "./MonsterMapOverlay";

const AREA_PREVIEW_COUNT = 2;

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

function getStyles() {
  return {
    card: {
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      overflow: "hidden",
      background: "var(--soft-bg)",
      borderRadius: "18px",
      padding: "16px",
      boxShadow:
        "0 10px 28px color-mix(in srgb, var(--page-text) 8%, transparent)",
      height: "100%",
      minHeight: "100%",
      border: `1px solid var(--card-border)`,
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
      color: "var(--text-title)",
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
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
      border: `1px solid var(--tag-border)`,
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
      border: `1px solid var(--panel-border)`,
      background: "var(--secondary-bg)",
      color: "var(--secondary-text)",
      borderRadius: "999px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: 800,
      cursor: "pointer",
    },
    layerSwitchButtonActive: {
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
      border: `1px solid var(--primary-border)`,
      boxShadow:
        "0 10px 22px color-mix(in srgb, var(--primary-border) 16%, transparent)",
    },
    spawnInfoSection: {
      display: "grid",
      gap: "12px",
      padding: "14px",
      borderRadius: "16px",
      background: "var(--panel-bg)",
      border: `1px solid var(--panel-border)`,
      boxShadow:
        "0 14px 30px color-mix(in srgb, var(--page-text) 8%, transparent)",
    },
    spawnInfoRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
    },
    spawnInfoLabel: {
      minWidth: "42px",
      paddingTop: "6px",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.04em",
      color: "var(--text-muted)",
    },
    spawnInfoLabelSub: {
      minWidth: "42px",
      paddingTop: "4px",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.04em",
      color: "var(--text-muted)",
    },
    spawnMetaWrap: {
      minWidth: 0,
      flex: 1,
      display: "grid",
      gap: "8px",
    },
    spawnMetaWrapTag: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    timeTagWrap: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    tag: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "28px",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
      lineHeight: 1.2,
      border: `1px solid var(--tag-border)`,
    },
    tagArea: {
      background: "var(--tag-bg)",
      color: "var(--tag-text)",
    },
    tagNight: {
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
    },
    tagDay: {
      background: "var(--selected-bg)",
      color: "var(--secondary-text)",
      border: `1px solid var(--selected-border)`,
    },
    tagAnytime: {
      background: "var(--warning-bg)",
      color: "var(--warning-text)",
      border: `1px solid var(--warning-border)`,
    },
    coordsToggleButton: {
      appearance: "none",
      border: `1px solid var(--input-border)`,
      background: "var(--input-bg)",
      color: "var(--input-text)",
      borderRadius: "999px",
      minHeight: "28px",
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: 900,
      cursor: "pointer",
    },
    coordsAccordion: {
      display: "grid",
      gap: "10px",
      paddingTop: "4px",
      borderTop: `1px dashed var(--soft-border)`,
    },
    coordsCloseButton: {
      appearance: "none",
      alignSelf: "flex-start",
      border: `1px solid var(--panel-border)`,
      background: "var(--panel-bg)",
      color: "var(--text-sub)",
      borderRadius: "999px",
      padding: "7px 12px",
      fontSize: "12px",
      fontWeight: 800,
      cursor: "pointer",
    },
    mapWrap: {
      minWidth: 0,
    },
  };
}

export default function MonsterMapCard({ mapItem }) {
  const isMobile = useIsMobile();
  const styles = useMemo(() => getStyles(), []);

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
          href={mapItem?.url}
        />
      </div>
    </article>
  );
}