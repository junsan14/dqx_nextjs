"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const GRID_COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const GRID_SIZE = 8;

export default function MonsterDetailPage({ params }) {
  const monsterId = params?.id;

  const [monster, setMonster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!monsterId) return;

    const fetchMonster = async () => {
      try {
        setLoading(true);
        setErrorText("");

        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/api/monsters/${monsterId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`モンスター詳細の取得に失敗した: ${res.status}`);
        }

        const data = await res.json();
        setMonster(data);
      } catch (error) {
        console.error(error);
        setErrorText("モンスター詳細を取得できなかった");
      } finally {
        setLoading(false);
      }
    };

    fetchMonster();
  }, [monsterId]);

  const normalDrops = useMemo(() => monster?.normal_drops ?? [], [monster]);
  const rareDrops = useMemo(() => monster?.rare_drops ?? [], [monster]);
  const orbDrops = useMemo(() => monster?.orb_drops ?? [], [monster]);
  const equipmentDrops = useMemo(() => monster?.equipment_drops ?? [], [monster]);
  const mapSpawns = useMemo(() => monster?.maps ?? [], [monster]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.centerBox}>読み込み中...</div>
      </main>
    );
  }

  if (errorText || !monster) {
    return (
      <main style={styles.page}>
        <div style={styles.centerBox}>
          <p style={styles.errorText}>{errorText || "データが見つからなかった"}</p>
          <Link href="/tools/monsters" style={styles.backLink}>
            ← 検索へ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topNav}>
          <Link href="/tools/monsters" style={styles.backLink}>
            ← 検索へ戻る
          </Link>
        </div>

        <section style={styles.heroCard}>
          <div style={styles.heroHeader}>
            <div style={styles.heroMain}>
              <div style={styles.nameRow}>
                <h1 style={styles.title}>{monster.name}</h1>
                {monster.system_type ? (
                  <span style={styles.systemTag}>{monster.system_type}</span>
                ) : null}
              </div>

              <div style={styles.metaRow}>
                {monster.monster_no ? <span>No. {monster.monster_no}</span> : null}
              </div>
            </div>
          </div>

          {monster.source_url ? (
            <div style={styles.sourceRow}>
              <a
                href={monster.source_url}
                target="_blank"
                rel="noreferrer"
                style={styles.sourceLink}
              >
                元データを見る
              </a>
            </div>
          ) : null}
        </section>

        <section style={styles.infoGrid}>
          <InfoCard title="通常ドロップ">
            <DropList items={normalDrops} />
          </InfoCard>

          <InfoCard title="レアドロップ">
            <DropList items={rareDrops} />
          </InfoCard>

          <InfoCard title="宝珠">
            <OrbList items={orbDrops} />
          </InfoCard>

          <InfoCard title="装備">
            <DropList items={equipmentDrops} />
          </InfoCard>
        </section>

        <section style={styles.mapSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>出現場所</h2>
            <p style={styles.sectionLead}>マップ画像の上に出現エリアを表示</p>
          </div>

          {mapSpawns.length === 0 ? (
            <div style={styles.emptyCard}>出現場所データなし</div>
          ) : (
            <div style={styles.mapList}>
              {mapSpawns.map((mapItem) => (
                <MapCard key={mapItem.id} mapItem={mapItem} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, children }) {
  return (
    <section style={styles.infoCard}>
      <h2 style={styles.cardHeading}>{title}</h2>
      {children}
    </section>
  );
}

function DropList({ items }) {
  if (!items || items.length === 0) {
    return <p style={styles.emptyInline}>なし</p>;
  }

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item?.name;
        if (!label) return null;

        return (
          <span key={`${label}-${index}`} style={styles.tag}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function OrbList({ items }) {
  if (!items || items.length === 0) {
    return <p style={styles.emptyInline}>なし</p>;
  }

  return (
    <div style={styles.tagList}>
      {items.map((orb, index) => {
        if (!orb?.name) return null;

        return (
          <span key={`${orb.name}-${index}`} style={styles.tag}>
            {orb.name}
            {orb.color ? ` (${orb.color})` : ""}
          </span>
        );
      })}
    </div>
  );
}

function MapCard({ mapItem }) {
  return (
    <article style={styles.mapCard}>
      <div style={styles.mapHeader}>
        <h3 style={styles.mapTitle}>{mapItem.name}</h3>
      </div>

      <div style={styles.mapContent}>
        <div style={styles.mapCanvasWrap}>
          <MapImageOverlay spawns={mapItem.spawns ?? []} imagePath={mapItem.image_path} />
        </div>

        <div style={styles.mapInfoSide}>
          {mapItem.spawns?.map((spawn) => (
            <div key={spawn.id} style={styles.spawnRow}>
              <div style={styles.spawnAreaLine}>
                <span style={styles.spawnLabel}>エリア</span>
                <span style={styles.spawnValue}>{formatAreaText(spawn.area)}</span>
              </div>

              {joinDisplayValue(spawn.spawn_time) ? (
                <div style={styles.spawnAreaLine}>
                  <span style={styles.spawnLabel}>時間</span>
                  <span style={styles.spawnValue}>
                    {joinDisplayValue(spawn.spawn_time)}
                  </span>
                </div>
              ) : null}

              {joinDisplayValue(spawn.note) ? (
                <div style={styles.spawnNote}>{joinDisplayValue(spawn.note)}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function MapImageOverlay({ spawns, imagePath }) {
  const resolvedImageUrl = buildImageUrl(imagePath);
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

function buildImageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
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

function formatAreaText(area) {
  const list = parseAreaList(area).map(normalizeAreaCell).filter(Boolean);
  return list.length > 0 ? list.join(", ") : "不明";
}

function joinDisplayValue(value) {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(" / ");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || trimmed === "[]") return "";

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => String(v).trim())
          .filter(Boolean)
          .join(" / ");
      }

      if (typeof parsed === "string") {
        return parsed.trim();
      }
    } catch (_) {
      return trimmed;
    }

    return trimmed;
  }

  return String(value);
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    color: "#111827",
    padding: "24px 16px 56px",
  },
  container: {
    maxWidth: "1120px",
    margin: "0 auto",
  },
  topNav: {
    marginBottom: "14px",
  },
  backLink: {
    color: "#475569",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 700,
  },
  centerBox: {
    maxWidth: "720px",
    margin: "80px auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "32px 20px",
    textAlign: "center",
  },
  errorText: {
    margin: "0 0 12px",
    fontSize: "14px",
    color: "#b91c1c",
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 8px 30px rgba(15,23,42,0.05)",
    marginBottom: "18px",
  },
  heroHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  heroMain: {
    minWidth: 0,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  systemTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "11px",
    fontWeight: 700,
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
    fontSize: "12px",
    color: "#64748b",
  },
  sourceRow: {
    marginTop: "14px",
  },
  sourceLink: {
    fontSize: "12px",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  infoCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },
  cardHeading: {
    margin: "0 0 10px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f3f6fb",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 600,
  },
  emptyInline: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
  },
  mapSection: {
    marginTop: "8px",
  },
  sectionHeader: {
    marginBottom: "12px",
  },
  sectionTitle: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: 800,
  },
  sectionLead: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },
  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    fontSize: "13px",
    color: "#94a3b8",
  },
  mapList: {
    display: "grid",
    gap: "16px",
  },
  mapCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },
  mapHeader: {
    marginBottom: "12px",
  },
  mapTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
  },
  mapContent: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 1fr) minmax(260px, 340px)",
    gap: "16px",
    alignItems: "start",
  },
  mapCanvasWrap: {
    position: "relative",
  },
  mapImageFrame: {
    width: "100%",
  },
  mapImageBox: {
    position: "relative",
    width: "100%",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #dbe1ea",
    background: "#fff",
  },
  mapImage: {
    display: "block",
    width: "100%",
    height: "auto",
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
  mapInfoSide: {
    display: "grid",
    gap: "10px",
  },
  spawnRow: {
    border: "1px solid #edf2f7",
    borderRadius: "14px",
    padding: "12px",
    background: "#fafcff",
  },
  spawnAreaLine: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    marginBottom: "6px",
  },
  spawnLabel: {
    minWidth: "42px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
  },
  spawnValue: {
    fontSize: "12px",
    color: "#111827",
    lineHeight: 1.6,
  },
  spawnNote: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#475569",
    lineHeight: 1.7,
  },
};