"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureGridSize,
  denormalizeGrid,
  getGridPreset,
  isDisabledCell,
  normalizeGrid,
  safeJsonParse,
  toJsonString,
  str,
  buildApiPayload,
} from "./equipmentFormHelpers";

export default function EquipmentDetailsPanel({
  row,
  allItems = [],
  materials = [],
  effects = [],
  onPatch,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onAddEffect,
  onUpdateEffect,
  onDeleteEffect,
}) {
  const [gridRows, setGridRows] = useState(1);
  const [gridCols, setGridCols] = useState(1);
  const [grid2d, setGrid2d] = useState([[""]]);
  const [keyword, setKeyword] = useState("");

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

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return [];

    return (Array.isArray(allItems) ? allItems : [])
      .filter((item) => String(item?.name ?? "").toLowerCase().includes(q))
      .slice(0, 20);
  }, [allItems, keyword]);

  if (!row) {
    return null;
  }

  function patchGrid(data) {
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

  function getMaterialItemId(mat) {
    return mat?.item_id ?? mat?.itemId ?? "";
  }

  function findItemNameById(itemId) {
    if (itemId == null || itemId === "") return "";
    const found = allItems.find((item) => String(item.id) === String(itemId));
    return found?.name ?? "";
  }

  function getDisplayMaterialName(mat) {
    const rawName = mat?.name ?? mat?.item_name ?? mat?.itemName ?? "";
    if (String(rawName).trim()) return rawName;
    return findItemNameById(getMaterialItemId(mat));
  }

  function addMaterialFromItem(item) {
    if (!item) return;

    onAddMaterial({
      item_id: Number(item.id),
      count: 1,
    });

    setKeyword("");
  }

  const payload = buildApiPayload(row);

  return (
    <div style={styles.stack}>
      <section style={styles.card}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>数値編集</div>
          <div style={styles.sectionMeta}>
            {gridRows} × {gridCols}
          </div>
        </div>

        <div style={styles.gridControlRow}>
          <label style={styles.miniField}>
            <span style={styles.label}>rows</span>
            <input
              type="number"
              style={styles.miniInput}
              value={gridRows}
              onChange={(e) => applyGridResize(e.target.value, gridCols)}
            />
          </label>

          <label style={styles.miniField}>
            <span style={styles.label}>cols</span>
            <input
              type="number"
              style={styles.miniInput}
              value={gridCols}
              onChange={(e) => applyGridResize(gridRows, e.target.value)}
            />
          </label>
        </div>

        <div style={styles.gridOuter}>
          <div
            style={{
              ...styles.gridPlain,
              gridTemplateColumns: `repeat(${Math.max(gridCols, 1)}, 78px)`,
            }}
          >
            {Array.from({ length: gridRows }).flatMap((_, r) =>
              Array.from({ length: gridCols }).map((__, c) => {
                const disabled = isDisabledCell(row.slotGridType, r, c);

                return (
                  <input
                    key={`${r}-${c}`}
                    style={gridCellStyle(disabled)}
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

      <section style={styles.card}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>素材</div>
        </div>

        <div style={styles.materialSearchBox}>
          <input
            type="text"
            style={styles.inputCompactWide}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="素材を検索して追加"
          />

          {keyword.trim() ? (
            <div style={styles.materialSearchResults}>
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    style={styles.materialSearchItem}
                    onClick={() => addMaterialFromItem(item)}
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <div style={styles.materialSearchEmpty}>該当なし</div>
              )}
            </div>
          ) : null}
        </div>

        {!materials.length ? (
          <div style={styles.mutedText}>素材なし</div>
        ) : (
          <div style={styles.materialTableWrap}>
            <div style={styles.materialTableHead}>
              <div style={styles.materialCellName}>素材</div>
              <div style={styles.materialCellCount}>個数</div>
            </div>

            <div style={styles.materialTableBody}>
              {materials.map((mat, index) => (
                <div key={index} style={styles.materialTableRow}>
                  <div style={styles.materialCellName}>
                    <input
                      style={styles.inputCompact}
                      value={getDisplayMaterialName(mat)}
                      onChange={(e) => onUpdateMaterial(index, "name", e.target.value)}
                      placeholder="素材名"
                    />
                  </div>

                  <div style={styles.materialCellCount}>
                    <input
                      type="number"
                      style={styles.inputCompactXs}
                      value={mat?.count ?? 1}
                      onChange={(e) => onUpdateMaterial(index, "count", e.target.value)}
                    />
                  </div>

                  <div style={styles.materialCellAction}>
                    <button
                      type="button"
                      style={dangerButtonStyle()}
                      onClick={() => onDeleteMaterial(index)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>効果</div>
          <button type="button" style={secondaryButtonStyle()} onClick={onAddEffect}>
            効果追加
          </button>
        </div>

        <div style={styles.stackSmall}>
          {effects.map((effect, i) => (
            <div key={i} style={styles.materialRow}>
              <div style={styles.materialNameWrap}>
                <input
                  value={typeof effect === "string" ? effect : JSON.stringify(effect)}
                  onChange={(e) => onUpdateEffect(i, e.target.value)}
                  placeholder="効果"
                  style={styles.input}
                />
              </div>

              <button
                type="button"
                style={dangerButtonStyle()}
                onClick={() => onDeleteEffect(i)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>JSON確認用</div>
        <pre style={styles.pre}>{JSON.stringify(payload, null, 2)}</pre>
      </section>
    </div>
  );
}

const styles = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },

  stackSmall: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 0,
  },

  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text-title)",
  },

  sectionMeta: {
    color: "var(--text-muted)",
    fontSize: 13,
  },

  gridControlRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  miniField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  miniInput: {
    width: 90,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "8px 10px",
  },

  label: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontWeight: 700,
  },

  gridOuter: {
    overflowX: "auto",
  },

  gridPlain: {
    display: "grid",
    gap: 8,
  },

  materialSearchBox: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  materialSearchResults: {
    border: "1px solid var(--soft-border)",
    background: "var(--soft-bg)",
    borderRadius: 10,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  materialSearchItem: {
    border: "1px solid var(--soft-border)",
    background: "var(--card-bg)",
    color: "var(--text-main)",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    textAlign: "left",
  },

  materialSearchEmpty: {
    color: "var(--text-muted)",
    fontSize: 13,
  },

  input: {
    boxSizing: "border-box",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "10px 12px",
    width: "100%",
  },

  inputCompact: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "10px 12px",
  },

  inputCompactWide: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "10px 12px",
  },

  inputCompactXs: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "10px 12px",
  },

  mutedText: {
    color: "var(--text-muted)",
    fontSize: 13,
  },

  materialTableWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  materialTableHead: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 90px 100px",
    gap: 8,
    alignItems: "center",
    color: "var(--text-muted)",
    fontSize: 12,
    fontWeight: 700,
  },

  materialTableBody: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  materialTableRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 90px 100px",
    gap: 8,
    alignItems: "center",
    minWidth: 0,
  },

  materialCellName: {
    minWidth: 0,
  },

  materialCellCount: {
    minWidth: 0,
  },

  materialCellAction: {
    minWidth: 0,
  },

  materialRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    minWidth: 0,
  },

  materialNameWrap: {
    flex: 1,
    minWidth: 0,
  },

  pre: {
    margin: 0,
    padding: 12,
    borderRadius: 10,
    background: "var(--soft-bg)",
    border: "1px solid var(--soft-border)",
    color: "var(--text-main)",
    overflowX: "auto",
    fontSize: 12,
    lineHeight: 1.5,
  },
};

const gridCellStyle = (disabled) => ({
  width: 78,
  height: 44,
  border: "1px solid var(--input-border)",
  borderRadius: 10,
  background: disabled ? "var(--input-disabled-bg)" : "var(--input-bg)",
  color: disabled ? "var(--text-muted)" : "var(--input-text)",
  padding: "8px 10px",
  boxSizing: "border-box",
});

const secondaryButtonStyle = () => ({
  border: "1px solid var(--soft-border)",
  background: "var(--soft-bg)",
  color: "var(--text-main)",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
});

const dangerButtonStyle = () => ({
  border: "1px solid var(--danger-border)",
  background: "var(--danger-bg)",
  color: "var(--danger-text)",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 700,
});