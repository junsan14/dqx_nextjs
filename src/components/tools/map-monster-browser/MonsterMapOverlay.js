"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { resolveMapImageUrl } from "@/lib/maps";

const GRID_SIZE = 8;
const ORIGINAL_IMAGE_WIDTH = 490;
const ORIGINAL_IMAGE_HEIGHT = 565;
const CROP_TOP_PX = ORIGINAL_IMAGE_HEIGHT - ORIGINAL_IMAGE_WIDTH;

const TOP_AXIS_PX = 2;
const LEFT_AXIS_PX = 2.5;
const RIGHT_TRIM_PX = 0;
const BOTTOM_TRIM_PX = 0;

const TOOLTIP_EDGE_THRESHOLD = 18;

const GRID_SOURCE_X = LEFT_AXIS_PX;
const GRID_SOURCE_Y = CROP_TOP_PX + TOP_AXIS_PX;

const GRID_SOURCE_SIZE = Math.min(
  ORIGINAL_IMAGE_WIDTH - LEFT_AXIS_PX - RIGHT_TRIM_PX,
  ORIGINAL_IMAGE_HEIGHT - GRID_SOURCE_Y - BOTTOM_TRIM_PX
);

const MAP_CROP = {
  sourceX: GRID_SOURCE_X,
  sourceY: GRID_SOURCE_Y,
  sourceSize: GRID_SOURCE_SIZE,
  widthPercent: (ORIGINAL_IMAGE_WIDTH / GRID_SOURCE_SIZE) * 100,
  heightPercent: (ORIGINAL_IMAGE_HEIGHT / GRID_SOURCE_SIZE) * 100,
  offsetXPercent: (GRID_SOURCE_X / ORIGINAL_IMAGE_WIDTH) * 100,
  offsetYPercent: (GRID_SOURCE_Y / ORIGINAL_IMAGE_HEIGHT) * 100,
};

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

function useIsMobile(breakpoint = 920) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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

function parseAreaList(area) {
  if (!area) return [];

  if (Array.isArray(area)) return area;

  if (typeof area === "string") {
    try {
      const parsed = JSON.parse(area);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return area
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeAreaCell(value) {
  if (!value) return null;

  const raw = String(value).trim().toUpperCase().replace(/[^A-H1-8]/g, "");
  const match = raw.match(/^([A-H])([1-8])$/);
  if (!match) return null;

  return `${match[1]}${match[2]}`;
}

function parseCell(cell) {
  const normalized = normalizeAreaCell(cell);
  if (!normalized) return null;

  const col = normalized.charCodeAt(0) - "A".charCodeAt(0);
  const row = Number(normalized.slice(1)) - 1;

  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;

  return {
    col,
    row,
    key: normalized,
    label: normalized,
  };
}

function collectUniqueCells(spawns = []) {
  const seen = new Set();
  const result = [];

  spawns.forEach((spawn) => {
    const cells = parseAreaList(spawn?.area ?? spawn?.coords)
      .map(normalizeAreaCell)
      .filter(Boolean);

    for (const cell of cells) {
      if (seen.has(cell)) continue;
      seen.add(cell);

      const parsed = parseCell(cell);
      if (parsed) result.push(parsed);
    }
  });

  return result;
}

function makeCellMap(cells = []) {
  const map = new Map();

  for (const cell of cells) {
    map.set(`${cell.col}:${cell.row}`, cell);
  }

  return map;
}

function hasAllCellsInRect(cellMap, minCol, maxCol, minRow, maxRow) {
  for (let col = minCol; col <= maxCol; col += 1) {
    for (let row = minRow; row <= maxRow; row += 1) {
      if (!cellMap.has(`${col}:${row}`)) {
        return false;
      }
    }
  }

  return true;
}

function compareCells(a, b) {
  const colDiff = a.col - b.col;
  if (colDiff !== 0) return colDiff;
  return a.row - b.row;
}

function buildShortLabel(rectCells = []) {
  if (!rectCells.length) return "";

  const sorted = [...rectCells].sort(compareCells);

  if (sorted.length === 1) return sorted[0].label;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (first.row === last.row) return `${first.label}〜${last.label}`;
  if (first.col === last.col) return `${first.label}〜${last.label}`;

  return `${first.label}〜${last.label}`;
}

function buildRectLabel(cells = []) {
  return cells
    .map((cell) => cell.label)
    .sort((a, b) => a.localeCompare(b, "ja"))
    .join(", ");
}

function buildMergedGroups(cells = []) {
  const cellMap = makeCellMap(cells);
  const used = new Set();
  const groups = [];

  const sortedCells = [...cells].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  for (const startCell of sortedCells) {
    const startKey = `${startCell.col}:${startCell.row}`;
    if (used.has(startKey)) continue;

    let bestRect = {
      minCol: startCell.col,
      maxCol: startCell.col,
      minRow: startCell.row,
      maxRow: startCell.row,
      area: 1,
    };

    for (let maxCol = startCell.col; maxCol < GRID_SIZE; maxCol += 1) {
      for (let maxRow = startCell.row; maxRow < GRID_SIZE; maxRow += 1) {
        const width = maxCol - startCell.col + 1;
        const height = maxRow - startCell.row + 1;
        const area = width * height;

        if (area <= bestRect.area) continue;

        if (
          hasAllCellsInRect(
            cellMap,
            startCell.col,
            maxCol,
            startCell.row,
            maxRow
          )
        ) {
          bestRect = {
            minCol: startCell.col,
            maxCol,
            minRow: startCell.row,
            maxRow,
            area,
          };
        }
      }
    }

    const rectCells = [];

    for (let col = bestRect.minCol; col <= bestRect.maxCol; col += 1) {
      for (let row = bestRect.minRow; row <= bestRect.maxRow; row += 1) {
        const key = `${col}:${row}`;
        const cell = cellMap.get(key);

        if (cell && !used.has(key)) {
          rectCells.push(cell);
          used.add(key);
        }
      }
    }

    groups.push({
      cells: rectCells,
      minCol: bestRect.minCol,
      maxCol: bestRect.maxCol,
      minRow: bestRect.minRow,
      maxRow: bestRect.maxRow,
      label: buildRectLabel(rectCells),
      shortLabel: buildShortLabel(rectCells),
    });
  }

  return groups;
}

function normalizeMetaValue(value) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  if (text === "[]" || text === "null" || text === "undefined") return "";
  return text;
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

function bubbleContainsSpawn(group, spawn) {
  const bubbleCellSet = new Set(group.cells.map((cell) => cell.label));
  const spawnCells = parseAreaList(spawn?.area ?? spawn?.coords)
    .map(normalizeAreaCell)
    .filter(Boolean);

  return spawnCells.some((cell) => bubbleCellSet.has(cell));
}

function joinUniqueValues(values = []) {
  const uniq = [];
  const seen = new Set();

  for (const value of values) {
    const normalized = normalizeMetaValue(value);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    uniq.push(normalized);
  }

  return uniq.join(" / ");
}

function buildMonsterLines(spawns = [], monstersById = {}) {
  const map = new Map();

  for (const spawn of spawns) {
    const monster = monstersById?.[spawn.monster_id];
    const monsterName = monster?.name || `monster_id: ${spawn.monster_id}`;
    const key = `${spawn.monster_id}:${spawn.spawn_time ?? ""}:${spawn.spawn_count ?? ""}:${spawn.symbol_count ?? ""}`;

    if (!map.has(key)) {
      map.set(key, {
        monsterName,
        spawnTime: normalizeSpawnTime(spawn?.spawn_time),
        spawnCount: normalizeMetaValue(spawn?.spawn_count),
        symbolCount: normalizeMetaValue(spawn?.symbol_count),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    String(a.monsterName).localeCompare(String(b.monsterName), "ja")
  );
}

function getBubblePosition(group, spawns = [], monstersById = {}) {
  const cellPercent = 100 / GRID_SIZE;

  const widthCells = group.maxCol - group.minCol + 1;
  const heightCells = group.maxRow - group.minRow + 1;

  const left = group.minCol * cellPercent + (widthCells * cellPercent) / 2;
  const top = group.minRow * cellPercent + (heightCells * cellPercent) / 2;

  const width = widthCells * cellPercent * 0.9;
  const height = heightCells * cellPercent * 0.9;

  const relatedSpawns = (spawns ?? []).filter((spawn) =>
    bubbleContainsSpawn(group, spawn)
  );

  const symbolCount = joinUniqueValues(
    relatedSpawns.map((spawn) => spawn?.symbol_count)
  );

  const spawnCount = joinUniqueValues(
    relatedSpawns.map((spawn) => spawn?.spawn_count)
  );

  const spawnTimes = joinUniqueValues(
    relatedSpawns
      .map((spawn) => normalizeSpawnTime(spawn?.spawn_time))
      .filter(Boolean)
  );

  return {
    key: group.label,
    label: group.label,
    shortLabel: group.shortLabel,
    left,
    top,
    width,
    height,
    isMerged: group.cells.length > 1,
    symbolCount,
    spawnCount,
    spawnTimes,
    relatedSpawns,
    monsterLines: buildMonsterLines(relatedSpawns, monstersById),
  };
}

function getTooltipPlacement(bubble) {
  if (!bubble) {
    return {
      vertical: "top",
      horizontal: "center",
    };
  }

  const vertical = bubble.top <= TOOLTIP_EDGE_THRESHOLD ? "bottom" : "top";

  let horizontal = "center";
  if (bubble.left <= TOOLTIP_EDGE_THRESHOLD) {
    horizontal = "right";
  } else if (bubble.left >= 100 - TOOLTIP_EDGE_THRESHOLD) {
    horizontal = "left";
  }

  return {
    vertical,
    horizontal,
  };
}

function getDesktopTooltipStyle(bubble, styles) {
  const placement = getTooltipPlacement(bubble);

  let transform = "translate(-50%, -100%)";
  let paddingTop = "0px";
  let paddingBottom = "10px";

  if (placement.vertical === "bottom") {
    transform = "translate(-50%, 0)";
    paddingTop = "10px";
    paddingBottom = "0px";
  }

  if (placement.horizontal === "right") {
    transform =
      placement.vertical === "bottom"
        ? "translate(0, 0)"
        : "translate(0, -100%)";
  }

  if (placement.horizontal === "left") {
    transform =
      placement.vertical === "bottom"
        ? "translate(-100%, 0)"
        : "translate(-100%, -100%)";
  }

  return {
    ...styles.hoverTooltip,
    left: `${bubble.left}%`,
    top: `${bubble.top}%`,
    transform,
    paddingTop,
    paddingBottom,
  };
}

function BubbleInfoContent({ bubble, styles }) {
  if (!bubble) return null;

  return (
    <div style={styles.infoCardContent}>
      <div style={styles.infoRows}>
        {bubble.symbolCount ? (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>シンボル数</span>
            <span style={styles.infoValue}>{bubble.symbolCount}</span>
          </div>
        ) : null}

        {bubble.spawnCount ? (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>出現数</span>
            <span style={styles.infoValue}>{bubble.spawnCount}</span>
          </div>
        ) : null}

        {bubble.spawnTimes ? (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>出現時間</span>
            <span style={styles.infoValue}>{bubble.spawnTimes}</span>
          </div>
        ) : null}
      </div>

      {bubble.monsterLines?.length ? (
        <div style={styles.monsterSection}>
          <div style={styles.monsterSectionTitle}>出現モンスター</div>

          <div style={styles.monsterList}>
            {bubble.monsterLines.map((line, index) => (
              <div key={`${line.monsterName}-${index}`} style={styles.monsterListItem}>
                <div style={styles.monsterName}>{line.monsterName}</div>

                <div style={styles.monsterMeta}>
                  {line.spawnTime ? <span>時間: {line.spawnTime}</span> : null}
                  {line.spawnCount ? <span>出現数: {line.spawnCount}</span> : null}
                  {line.symbolCount ? <span>シンボル: {line.symbolCount}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MonsterMapOverlay({
  spawns = [],
  imagePath = "",
  size = "sm",
  monstersById = {},
}) {
  const isDark = usePrefersDark();
  const isMobile = useIsMobile();
  const styles = getStyles(isDark, size);

  const resolvedImageUrl = useMemo(
    () => resolveMapImageUrl(imagePath),
    [imagePath]
  );

  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredBubbleKey, setHoveredBubbleKey] = useState("");
  const [selectedBubbleKey, setSelectedBubbleKey] = useState("");

  useEffect(() => {
    setImageLoaded(false);
  }, [resolvedImageUrl]);

  useEffect(() => {
    setHoveredBubbleKey("");
    setSelectedBubbleKey("");
  }, [spawns]);

  const cells = useMemo(() => collectUniqueCells(spawns), [spawns]);

  const bubbles = useMemo(() => {
    return buildMergedGroups(cells)
      .map((group) => getBubblePosition(group, spawns, monstersById))
      .filter(Boolean);
  }, [cells, spawns, monstersById]);

  const activeDesktopBubble = useMemo(() => {
    if (!hoveredBubbleKey) return null;
    return bubbles.find((bubble) => bubble.key === hoveredBubbleKey) ?? null;
  }, [bubbles, hoveredBubbleKey]);

  const activeMobileBubble = useMemo(() => {
    if (!selectedBubbleKey) return null;
    return bubbles.find((bubble) => bubble.key === selectedBubbleKey) ?? null;
  }, [bubbles, selectedBubbleKey]);

  function handleBubbleClick(bubbleKey) {
    if (!isMobile) return;
    setSelectedBubbleKey((prev) => (prev === bubbleKey ? "" : bubbleKey));
  }

  if (!resolvedImageUrl) {
    return (
      <div style={styles.mapCard}>
        <div style={styles.noImageBox}>画像なし</div>
      </div>
    );
  }

  return (
    <div style={styles.mapCard}>
      <div style={styles.mapImageFrame}>
        <div
          style={styles.mapImageBox}
          onClick={() => {
            if (isMobile) setSelectedBubbleKey("");
          }}
        >
          <div
            style={{
              ...styles.imageInner,
              opacity: imageLoaded ? 1 : 0,
            }}
          >
            <div
              style={{
                ...styles.imageCropInner,
                width: `${MAP_CROP.widthPercent}%`,
                height: `${MAP_CROP.heightPercent}%`,
                transform: `translate(-${MAP_CROP.offsetXPercent}%, -${MAP_CROP.offsetYPercent}%)`,
              }}
            >
              <Image
                key={resolvedImageUrl}
                src={resolvedImageUrl}
                alt="map"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                style={styles.mapImage}
                priority={false}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </div>

          {!imageLoaded && (
            <div style={styles.loadingOverlay}>
              <div style={styles.loadingShimmer} />
              <div style={styles.loadingText}>読み込み中...</div>
            </div>
          )}

          {imageLoaded && bubbles.length > 0 && (
            <div style={styles.bubbleLayer}>
              {bubbles.map((bubble) => {
                const isSelected = selectedBubbleKey === bubble.key;

                return (
                  <button
                    key={bubble.key}
                    type="button"
                    title={bubble.label}
                    aria-label={`${bubble.label} の詳細`}
                    onMouseEnter={() => {
                      if (!isMobile) setHoveredBubbleKey(bubble.key);
                    }}
                    onMouseLeave={() => {
                      if (!isMobile) setHoveredBubbleKey("");
                    }}
                    onFocus={() => {
                      if (!isMobile) setHoveredBubbleKey(bubble.key);
                    }}
                    onBlur={() => {
                      if (!isMobile) setHoveredBubbleKey("");
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBubbleClick(bubble.key);
                    }}
                    style={{
                      ...styles.spawnBubble,
                      ...(bubble.isMerged ? styles.spawnBubbleMerged : {}),
                      ...(isSelected ? styles.spawnBubbleSelected : {}),
                      left: `${bubble.left}%`,
                      top: `${bubble.top}%`,
                      width: `${bubble.width}%`,
                      height: `${bubble.height}%`,
                    }}
                  >
                    <span style={styles.bubbleInner}>
                      <span style={styles.bubbleText}>{bubble.shortLabel}</span>
                      <span style={styles.bubbleHintIcon} aria-hidden="true">
                        👆
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isMobile && imageLoaded && activeDesktopBubble ? (
            <div style={getDesktopTooltipStyle(activeDesktopBubble, styles)}>
              <BubbleInfoContent bubble={activeDesktopBubble} styles={styles} />
            </div>
          ) : null}
        </div>

        {isMobile && imageLoaded && activeMobileBubble ? (
          <div style={styles.mobileInfoWrap}>
            <div style={styles.mobileInfoCard}>
              <button
                type="button"
                onClick={() => setSelectedBubbleKey("")}
                style={styles.mobileInfoClose}
                aria-label="閉じる"
              >
                ×
              </button>

              <div style={styles.mobileInfoTop}>
                <div style={styles.mobileInfoBody}>
                  <BubbleInfoContent bubble={activeMobileBubble} styles={styles} />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes monsterMapShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

function getStyles(isDark, size = "sm") {
  const isSmall = size === "sm";

  return {
    mapCard: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      height: "100%",
      maxWidth: isSmall ? "460px" : "720px",
      margin: "0 auto",
    },
    mapImageFrame: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    mapImageBox: {
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: "18px",
      overflow: "hidden",
      background: isDark ? "#020617" : "#e5e7eb",
      border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
      flexShrink: 0,
      touchAction: "pan-y",
      WebkitUserSelect: "none",
      userSelect: "none",
    },
    loadingOverlay: {
      position: "absolute",
      inset: 0,
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      background: isDark
        ? "rgba(2,6,23,0.92)"
        : "rgba(226,232,240,0.92)",
    },
    loadingShimmer: {
      width: "100%",
      height: "100%",
      position: "absolute",
      inset: 0,
      background: isDark
        ? "linear-gradient(90deg, rgba(15,23,42,0.88) 0%, rgba(30,41,59,0.98) 50%, rgba(15,23,42,0.88) 100%)"
        : "linear-gradient(90deg, rgba(203,213,225,0.85) 0%, rgba(226,232,240,0.98) 50%, rgba(203,213,225,0.85) 100%)",
      backgroundSize: "200% 100%",
      animation: "monsterMapShimmer 1.2s ease-in-out infinite",
    },
    loadingText: {
      position: "relative",
      zIndex: 1,
      fontSize: "13px",
      fontWeight: 700,
      color: isDark ? "#cbd5e1" : "#475569",
      background: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.86)",
      borderRadius: "999px",
      padding: "6px 10px",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
    },
    imageInner: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      transition: "opacity 0.18s ease",
      zIndex: 1,
    },
    imageCropInner: {
      position: "absolute",
      top: 0,
      left: 0,
    },
    mapImage: {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "fill",
      filter: isDark ? "brightness(0.92)" : "none",
      pointerEvents: "none",
    },
    bubbleLayer: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 2,
    },
    spawnBubble: {
      position: "absolute",
      borderRadius: "999px",
      transform: "translate(-50%, -50%)",
      background: isDark
        ? "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.42) 0%, rgba(59,130,246,0.34) 48%, rgba(37,99,235,0.22) 74%, rgba(37,99,235,0.10) 100%)"
        : "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.52) 0%, rgba(59,130,246,0.42) 48%, rgba(37,99,235,0.28) 74%, rgba(37,99,235,0.12) 100%)",
      border: isDark
        ? "3px solid rgba(96,165,250,0.68)"
        : "3px solid rgba(30,64,175,0.78)",
      boxShadow: isDark
        ? "0 0 0 3px rgba(15,23,42,0.88), 0 10px 24px rgba(2,6,23,0.42), inset 0 0 24px rgba(255,255,255,0.10)"
        : "0 0 0 4px rgba(255,255,255,0.82), 0 12px 28px rgba(30,64,175,0.30), inset 0 0 28px rgba(255,255,255,0.30)",
      backdropFilter: "blur(1px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2px",
      textAlign: "center",
      pointerEvents: "auto",
      cursor: "pointer",
      appearance: "none",
      transition: "transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease",
    },
    spawnBubbleMerged: {
      borderRadius: "999px",
    },
    spawnBubbleSelected: {
      transform: "translate(-50%, -50%) scale(1.05)",
      boxShadow: isDark
        ? "0 0 0 3px rgba(15,23,42,0.88), 0 0 0 6px rgba(96,165,250,0.25), 0 14px 28px rgba(2,6,23,0.46)"
        : "0 0 0 4px rgba(255,255,255,0.82), 0 0 0 7px rgba(59,130,246,0.18), 0 14px 30px rgba(30,64,175,0.32)",
    },
    bubbleInner: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      pointerEvents: "none",
    },
    bubbleText: {
      fontSize: isSmall ? "10px" : "11px",
      fontWeight: 800,
      color: isDark ? "#e2e8f0" : "#0f172a",
      background: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.9)",
      borderRadius: "999px",
      padding: "3px 7px",
      lineHeight: 1.1,
      boxShadow: isDark
        ? "0 2px 8px rgba(2,6,23,0.32)"
        : "0 2px 8px rgba(15,23,42,0.12)",
      whiteSpace: "nowrap",
      border: isDark
        ? "1px solid rgba(71,85,105,0.7)"
        : "1px solid transparent",
    },
    bubbleHintIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      borderRadius: "999px",
      fontSize: "11px",
      lineHeight: 1,
      background: isDark ? "rgba(59,130,246,0.95)" : "rgba(37,99,235,0.92)",
      color: "#ffffff",
      boxShadow: isDark
        ? "0 3px 10px rgba(2,6,23,0.45)"
        : "0 3px 10px rgba(37,99,235,0.24)",
      transform: "translateY(-1px)",
    },
    hoverTooltip: {
      position: "absolute",
      zIndex: 4,
      minWidth: "220px",
      maxWidth: "320px",
      pointerEvents: "none",
    },
    mobileInfoWrap: {
      position: "relative",
      paddingTop: "2px",
    },
    mobileInfoCard: {
      position: "relative",
      width: "100%",
      borderRadius: "16px",
      background: isDark ? "#020617" : "#ffffff",
      border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
      boxShadow: isDark
        ? "0 10px 24px rgba(2,6,23,0.35)"
        : "0 10px 24px rgba(15,23,42,0.10)",
      padding: "14px 14px 12px",
      boxSizing: "border-box",
      overflow: "visible",
    },
    mobileInfoTop: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "12px",
      width: "100%",
    },
    mobileInfoBody: {
      minWidth: 0,
      flex: 1,
    },
    mobileInfoClose: {
      appearance: "none",
      position: "absolute",
      top: "8px",
      right: "8px",
      border: "none",
      background: isDark ? "#0f172a" : "#f8fafc",
      color: isDark ? "#e2e8f0" : "#334155",
      width: "28px",
      height: "28px",
      borderRadius: "999px",
      fontSize: "18px",
      fontWeight: 700,
      lineHeight: 1,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      boxShadow: "none",
      zIndex: 2,
    },
    infoCardContent: {
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "0",
      borderRadius: "14px",
      background: "transparent",
      boxShadow: "none",
      backdropFilter: "none",
      width: "100%",
      boxSizing: "border-box",
      paddingRight: "28px",
    },
    infoRows: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      minWidth: 0,
    },
    infoRow: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "12px",
      minWidth: 0,
    },
    infoLabel: {
      flex: "0 0 auto",
      fontSize: "11px",
      fontWeight: 800,
      color: isDark ? "#93c5fd" : "#1d4ed8",
      lineHeight: 1.5,
    },
    infoValue: {
      minWidth: 0,
      textAlign: "right",
      fontSize: "12px",
      fontWeight: 700,
      color: isDark ? "#cbd5e1" : "#334155",
      lineHeight: 1.5,
      wordBreak: "break-word",
    },
    monsterSection: {
      borderTop: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
      paddingTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    monsterSectionTitle: {
      fontSize: "11px",
      fontWeight: 800,
      color: isDark ? "#93c5fd" : "#1d4ed8",
    },
    monsterList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    monsterListItem: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      padding: "8px",
      borderRadius: "10px",
      background: isDark ? "#0f172a" : "#f8fafc",
    },
    monsterName: {
      fontSize: "12px",
      fontWeight: 800,
      color: isDark ? "#f8fafc" : "#0f172a",
    },
    monsterMeta: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      fontSize: "11px",
      color: isDark ? "#cbd5e1" : "#475569",
    },
    noImageBox: {
      borderRadius: "18px",
      background: isDark ? "#020617" : "#f8fafc",
      aspectRatio: "1 / 1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: isDark ? "#64748b" : "#94a3b8",
      fontSize: "13px",
      fontWeight: 700,
      border: isDark ? "1px solid #334155" : "1px solid transparent",
      maxWidth: isSmall ? "460px" : "720px",
      margin: "0 auto",
    },
  };
}