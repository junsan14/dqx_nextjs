import { getMonsterAssetUrl } from "@/lib/monsters";

const GRID_SIZE = 8;

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

  return { col, row, key: normalized };
}

function normalizeSpawnGroups(spawns = []) {
  return spawns
    .map((spawn, index) => {
      const cells = parseAreaList(spawn?.area)
        .map(normalizeAreaCell)
        .filter(Boolean);

      const uniqueCells = Array.from(new Set(cells));

      if (uniqueCells.length === 0) return null;

      return {
        id: spawn?.id ?? `spawn-${index}`,
        cells: uniqueCells,
        label: uniqueCells.join(", "),
      };
    })
    .filter(Boolean);
}

function getMergedBubblePosition(group) {
  const parsed = (group?.cells ?? []).map(parseCell).filter(Boolean);
  if (parsed.length === 0) return null;

  const cols = parsed.map((p) => p.col);
  const rows = parsed.map((p) => p.row);

  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);

  const spanCols = maxCol - minCol + 1;
  const spanRows = maxRow - minRow + 1;
  const coordCount = parsed.length;

  const cellPercent = 100 / GRID_SIZE;
  const rangeLeft = minCol * cellPercent;
  const rangeTop = minRow * cellPercent;
  const rangeWidth = spanCols * cellPercent;
  const rangeHeight = spanRows * cellPercent;

  const growthScale = Math.min(1 + (coordCount - 1) * 0.14, 2.25);

  const baseWidth = Math.max(rangeWidth * 0.82, cellPercent * 1.12);
  const baseHeight = Math.max(rangeHeight * 0.82, cellPercent * 1.12);

  const bubbleWidth = Math.min(baseWidth * growthScale, 96);
  const bubbleHeight = Math.min(baseHeight * growthScale, 96);

  const centerX = rangeLeft + rangeWidth / 2;
  const centerY = rangeTop + rangeHeight / 2;

  return {
    key: group.id,
    label: group.label,
    left: centerX,
    top: centerY,
    width: bubbleWidth,
    height: bubbleHeight,
  };
}

export default function MonsterMapOverlay({ spawns, imagePath }) {
  const resolvedImageUrl = getMonsterAssetUrl(imagePath);
  const bubbles = normalizeSpawnGroups(spawns)
    .map(getMergedBubblePosition)
    .filter(Boolean);

  if (!resolvedImageUrl) {
    return <div style={styles.noImageBox}>画像なし</div>;
  }

  return (
    <div style={styles.mapImageFrame}>
      <div style={styles.mapImageBox}>
        <img src={resolvedImageUrl} alt="map" style={styles.mapImage} />
        <div style={styles.bubbleLayer}>
          {bubbles.map((bubble, index) => (
            <div
              key={`${bubble.key}-${index}`}
              title={bubble.label}
              style={{
                ...styles.spawnBubble,
                left: `${bubble.left}%`,
                top: `${bubble.top}%`,
                width: `${bubble.width}%`,
                height: `${bubble.height}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  mapImageFrame: {
    width: "100%",
  },
  mapImageBox: {
  position: "relative",
  width: "100%",
  aspectRatio: "1 / 1",   // ← 正方形
  borderRadius: "18px",
  overflow: "hidden",
  border: "1px solid #dbe1ea",
  background: "#fff",
},
  mapImage: {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",      // ← 切り取り
  objectPosition: "center 100%", // ← 上を少しカット
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
  },
  noImageBox: {
    borderRadius: "18px",
    border: "1px solid #dbe1ea",
    background: "#f8fafc",
    minHeight: "240px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 700,
  },
};