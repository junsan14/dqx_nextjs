"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMonsterAssetUrl } from "@/lib/monsters";

const GRID_SIZE = 8;

const MAP_CROP = {
  scale: 1,
  offsetX: "4.3%",
  offsetY: "4.5%",
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
      shortLabel:
        rectCells.length === 1
          ? rectCells[0].label
          : `${rectCells[0].label}〜${rectCells[rectCells.length - 1].label}`,
    });
  }

  return groups;
}

function getBubblePosition(group) {
  const cellPercent = 100 / GRID_SIZE;

  const widthCells = group.maxCol - group.minCol + 1;
  const heightCells = group.maxRow - group.minRow + 1;

  const left = group.minCol * cellPercent + (widthCells * cellPercent) / 2;
  const top = group.minRow * cellPercent + (heightCells * cellPercent) / 2;

  const width = widthCells * cellPercent * 0.92;
  const height = heightCells * cellPercent * 0.92;

  return {
    key: group.label,
    label: group.label,
    shortLabel: group.shortLabel,
    left,
    top,
    width,
    height,
    isMerged: group.cells.length > 1,
  };
}

export default function MonsterMapOverlay({
  spawns = [],
  imagePath,
  href,
}) {
  const isDark = usePrefersDark();
  const styles = getStyles(isDark);

  const resolvedImageUrl = useMemo(() => getMonsterAssetUrl(imagePath), [imagePath]);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [resolvedImageUrl]);

  const bubbles = useMemo(() => {
    return buildMergedGroups(collectUniqueCells(spawns))
      .map(getBubblePosition)
      .filter(Boolean);
  }, [spawns]);

  if (!resolvedImageUrl) {
    return <div style={styles.noImageBox}>画像なし</div>;
  }

  const content = (
    <div style={styles.mapImageFrame}>
      <div style={styles.mapImageBox}>
        <div
          style={{
            ...styles.imageInner,
            opacity: imageLoaded ? 1 : 0,
          }}
        >
          <div
            style={{
              ...styles.imageCropInner,
              transform: `translate(-${MAP_CROP.offsetX}, -${MAP_CROP.offsetY}) scale(${MAP_CROP.scale})`,
            }}
          >
            <Image
              key={resolvedImageUrl}
              src={resolvedImageUrl}
              alt="map"
              fill={false}
              width={700}
              height={700}
              sizes="100vw"
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

        {imageLoaded && (
          <div style={styles.bubbleLayer}>
            {bubbles.map((bubble) => (
              <div
                key={bubble.key}
                title={bubble.label}
                style={{
                  ...styles.spawnBubble,
                  ...(bubble.isMerged ? styles.spawnBubbleMerged : {}),
                  left: `${bubble.left}%`,
                  top: `${bubble.top}%`,
                  width: `${bubble.width}%`,
                  height: `${bubble.height}%`,
                }}
              >
                <span style={styles.bubbleText}>{bubble.shortLabel}</span>
              </div>
            ))}
          </div>
        )}
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

  if (href) {
    return (
      <Link href={href} style={styles.linkWrap}>
        {content}
      </Link>
    );
  }

  return content;
}

function getStyles(isDark) {
  return {
    mapImageFrame: {
      width: "100%",
    },
    linkWrap: {
      display: "block",
      textDecoration: "none",
    },
    mapImageBox: {
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: "18px",
      overflow: "hidden",
      background: isDark ? "#020617" : "#e5e7eb",
      border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
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
      inset: 0,
      width: "108%",
      height: "108%",
      transformOrigin: "top left",
    },
    mapImage: {
      display: "block",
      width: "100%",
      height: "100%",
      filter: isDark ? "brightness(0.92)" : "none",
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
    },
    spawnBubbleMerged: {
      borderRadius: "999px",
    },
    bubbleText: {
      fontSize: "10px",
      fontWeight: 800,
      color: isDark ? "#e2e8f0" : "#0f172a",
      background: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.9)",
      borderRadius: "999px",
      padding: "2px 5px",
      lineHeight: 1.1,
      boxShadow: isDark
        ? "0 2px 8px rgba(2,6,23,0.32)"
        : "0 2px 8px rgba(15,23,42,0.12)",
      whiteSpace: "nowrap",
      border: isDark ? "1px solid rgba(71,85,105,0.7)" : "1px solid transparent",
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
    },
  };
}