"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./EquipmentForm.module.css";
import {
  ensureGridSize,
  denormalizeGrid,
  getGridPreset,
  isDisabledCell,
  normalizeGrid,
  safeJsonParse,
  toJsonString,
  str,
} from "./equipmentFormHelpers";

export default function EquipmentGridPanel({
  row,
  syncGroup = false,
  onPatch,
  onGroupPatch,
}) {
  const [gridRows, setGridRows] = useState(1);
  const [gridCols, setGridCols] = useState(1);
  const [grid2d, setGrid2d] = useState([[""]]);

  const parsed = useMemo(() => {
    if (!row) {
      return {
        nextRows: 1,
        nextCols: 1,
        nextGrid: [[""]],
      };
    }

    const preset = getGridPreset(row.slotGridType);
    const colsHint = preset?.cols ?? Number(row.slotGridCols ?? 0) ?? 0;
    const gridLike = safeJsonParse(row.slotGridJson, null);
    const norm = normalizeGrid(gridLike, colsHint);

    const nextRows = preset?.rows ?? (norm.rows > 0 ? norm.rows : 1);
    const nextCols = preset?.cols ?? (norm.cols > 0 ? norm.cols : 1);
    const nextGrid = ensureGridSize(norm.grid, nextRows, nextCols);

    return {
      nextRows,
      nextCols,
      nextGrid,
    };
  }, [row?.__key, row?.slotGridType, row?.slotGridJson, row?.slotGridCols]);

  useEffect(() => {
    setGridRows(parsed.nextRows);
    setGridCols(parsed.nextCols);
    setGrid2d(parsed.nextGrid);
  }, [parsed]);

  function patchGrid(data) {
    if (syncGroup && typeof onGroupPatch === "function") {
      onGroupPatch(data);
      return;
    }
    onPatch?.(data);
  }

  function applyGridResize(nextRows, nextCols) {
    const r = Math.max(0, Number(nextRows) || 0);
    const c = Math.max(0, Number(nextCols) || 0);
    const resized = ensureGridSize(grid2d, r, c);

    setGridRows(r);
    setGridCols(c);
    setGrid2d(resized);

    const den = denormalizeGrid(resized);

    patchGrid({
      slotGridCols: c ? String(c) : "",
      slotGridJson: den == null ? "" : toJsonString(den, "[]"),
    });
  }

  function updateGridCell(r, c, value) {
    const next = ensureGridSize(grid2d, gridRows, gridCols).map((rowArr) => [
      ...rowArr,
    ]);

    next[r][c] = value;
    setGrid2d(next);

    const den = denormalizeGrid(next);

    patchGrid({
      slotGridJson: den == null ? "" : toJsonString(den, "[]"),
    });
  }

  function handleGridPaste(startR, startC, text) {
    const raw = str(text).replace(/\r\n?/g, "\n");
    if (!raw) return;

    const lines = raw.split("\n").filter((x) => x.length > 0);
    if (!lines.length) return;

    const pasted = lines.map((line) => line.split("\t"));
    const pasteRows = pasted.length;
    const pasteCols = Math.max(...pasted.map((r) => r.length), 0);

    const nextRows = Math.max(gridRows, startR + pasteRows);
    const nextCols = Math.max(gridCols, startC + pasteCols);
    const nextGrid = ensureGridSize(grid2d, nextRows, nextCols).map((rowArr) => [
      ...rowArr,
    ]);

    for (let r = 0; r < pasteRows; r++) {
      for (let c = 0; c < pasted[r].length; c++) {
        nextGrid[startR + r][startC + c] = pasted[r][c];
      }
    }

    setGridRows(nextRows);
    setGridCols(nextCols);
    setGrid2d(nextGrid);

    const den = denormalizeGrid(nextGrid);

    patchGrid({
      slotGridCols: nextCols ? String(nextCols) : "",
      slotGridJson: den == null ? "" : toJsonString(den, "[]"),
    });
  }

  if (!row) return null;

  return (
    <section className={styles.card}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>数値編集</div>
        <div className={styles.sectionMeta}>
          {gridRows} × {gridCols}
        </div>
      </div>

      <div className={styles.gridEditorControls}>
        <label className={styles.gridMiniField}>
          <span className={styles.label}>rows</span>
          <input
            type="number"
            className={styles.gridMiniInput}
            value={gridRows}
            onChange={(e) => applyGridResize(e.target.value, gridCols)}
          />
        </label>

        <label className={styles.gridMiniField}>
          <span className={styles.label}>cols</span>
          <input
            type="number"
            className={styles.gridMiniInput}
            value={gridCols}
            onChange={(e) => applyGridResize(gridRows, e.target.value)}
          />
        </label>
      </div>

      <div className={styles.gridEditorOuter}>
        <div
          className={styles.gridEditorPlainCompact}
          style={{
            gridTemplateColumns: `repeat(${Math.max(gridCols, 1)}, 78px)`,
          }}
        >
          {Array.from({ length: gridRows }).flatMap((_, r) =>
            Array.from({ length: gridCols }).map((__, c) => {
              const disabled = isDisabledCell(row.slotGridType, r, c);

              return (
                <input
                  key={`${r}-${c}`}
                  className={`${styles.gridCellInputSquare} ${
                    disabled ? styles.gridCellInputSquareDisabled : ""
                  }`}
                  value={grid2d?.[r]?.[c] ?? ""}
                  disabled={disabled}
                  onChange={(e) => updateGridCell(r, c, e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData?.getData("text") ?? "";
                    if (!text) return;
                    e.preventDefault();
                    handleGridPaste(r, c, text);
                  }}
                />
              );
            })
          )}
        </div>
      </div>

    </section>
  );
}