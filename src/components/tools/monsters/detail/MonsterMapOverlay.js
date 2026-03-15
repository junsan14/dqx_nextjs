import Link from "next/link";
import Image from "next/image";
import { getMonsterAssetUrl } from "@/lib/monsters";

const GRID_SIZE = 8;

const MAP_CROP = {
  scale: 1,
  offsetX: "4.3%",
  offsetY: "4.5%",
};

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
  const resolvedImageUrl = getMonsterAssetUrl(imagePath);

  const bubbles = buildMergedGroups(collectUniqueCells(spawns))
    .map(getBubblePosition)
    .filter(Boolean);

  if (!resolvedImageUrl) {
    return <div style={styles.noImageBox}>画像なし</div>;
  }

  const content = (
    <div style={styles.mapImageFrame}>
      <div style={styles.mapImageBox}>
        <div style={styles.imageInner}>
          <div
            style={{
              ...styles.imageCropInner,
              transform: `translate(-${MAP_CROP.offsetX}, -${MAP_CROP.offsetY}) scale(${MAP_CROP.scale})`,
            }}
          >
            <Image
              src={resolvedImageUrl}
              alt="map"
              fill={false}
              width={700}
              height={700}
              sizes="100vw"
              style={styles.mapImage}
              priority={false}
            />
          </div>
        </div>

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
      </div>
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

const styles = {
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
    background: "#f8fafc",
  },
  imageInner: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
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
  },
  bubbleLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  spawnBubble: {
    position: "absolute",
    borderRadius: "999px",
    transform: "translate(-50%, -50%)",
    background:
      "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.52) 0%, rgba(59,130,246,0.42) 48%, rgba(37,99,235,0.28) 74%, rgba(37,99,235,0.12) 100%)",
    border: "3px solid rgba(30,64,175,0.78)",
    boxShadow:
      "0 0 0 4px rgba(255,255,255,0.82), 0 12px 28px rgba(30,64,175,0.30), inset 0 0 28px rgba(255,255,255,0.30)",
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
    color: "#0f172a",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "999px",
    padding: "2px 5px",
    lineHeight: 1.1,
    boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
    whiteSpace: "nowrap",
  },
  noImageBox: {
    borderRadius: "18px",
    background: "#f8fafc",
    aspectRatio: "1 / 1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 700,
  },
};