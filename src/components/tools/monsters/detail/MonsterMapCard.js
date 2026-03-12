"use client";

import { useMemo } from "react";
import MonsterMapOverlay from "./MonsterMapOverlay";

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

function buildSummary(mapItem) {
  const spawns = Array.isArray(mapItem?.spawns) ? mapItem.spawns : [];

  const areaSet = new Set();
  const timeSet = new Set();
  const noteSet = new Set();

  for (const spawn of spawns) {
    const areaText = formatAreaText(spawn?.area);
    if (areaText) areaSet.add(areaText);

    const timeText = joinDisplayValue(spawn?.spawn_time);
    if (timeText) timeSet.add(timeText);

    const noteText = joinDisplayValue(spawn?.note);
    if (noteText) noteSet.add(noteText);
  }

  return {
    areas: Array.from(areaSet),
    times: Array.from(timeSet),
    notes: Array.from(noteSet),
  };
}

export default function MonsterMapCard({ mapItem, mobile = false }) {
  const summary = useMemo(() => buildSummary(mapItem), [mapItem]);

  return (
    <article
      style={{
        ...styles.card,
        ...(mobile ? styles.cardMobile : {}),
      }}
    >
      <div style={styles.header}>
        <h3 style={styles.title}>{mapItem?.name || "マップ"}</h3>
      </div>

      <div style={styles.metaBlock}>
        <div style={styles.metaRow}>
          <span style={styles.metaLabel}>エリア</span>
          <span style={styles.metaValue}>
            {summary.areas.length ? summary.areas.join(" / ") : "不明"}
          </span>
        </div>

        {summary.times.length ? (
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>時間</span>
            <span style={styles.metaValue}>{summary.times.join(" / ")}</span>
          </div>
        ) : null}

        {summary.notes.length ? (
          <div style={styles.noteList}>
            {summary.notes.map((note, index) => (
              <div key={`${note}-${index}`} style={styles.noteText}>
                {note}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={styles.mapWrap}>
        <MonsterMapOverlay
          spawns={mapItem?.spawns ?? []}
          imagePath={mapItem?.image_path ?? ""}
        />
      </div>
    </article>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    minWidth: 0,
  },
  cardMobile: {
    width: "86vw",
    minWidth: "86vw",
    maxWidth: "86vw",
    scrollSnapAlign: "start",
    flex: "0 0 auto",
  },
  header: {
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.4,
  },
  metaBlock: {
    display: "grid",
    gap: "8px",
    marginBottom: "14px",
    padding: "12px",
    borderRadius: "14px",
    background: "#f8fbff",
    border: "1px solid #e6eef8",
  },
  metaRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },
  metaLabel: {
    minWidth: "42px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    lineHeight: 1.7,
    flexShrink: 0,
  },
  metaValue: {
    fontSize: "13px",
    color: "#111827",
    lineHeight: 1.7,
    wordBreak: "break-word",
  },
  noteList: {
    display: "grid",
    gap: "6px",
    marginTop: "2px",
  },
  noteText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: 1.8,
    wordBreak: "break-word",
  },
  mapWrap: {
    minWidth: 0,
  },
};