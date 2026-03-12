"use client";

import React from "react";
import styles from "./EquipmentForm.module.css";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Labeled({ label, children }) {
  return (
    <label className={styles.field}>
      <div className={styles.label}>{label}</div>
      {children}
    </label>
  );
}

export default function EquipmentEditor({
  selectedRow,
  saving,
  syncGroup,
  setSyncGroup,
  saveSelected,
  deleteCurrentItem,
  deleteCurrentGroup,
  isSelectedGrouped,
  equipmentTypeOptions = [],
  jobOverrideModeOptions = ["inherit", "add", "replace"],
  setSelectedRowPatch,
  setGroupPatch,
  materials,
  addMaterial,
  materialQuery,
  setMaterialQuery,
  materialCandidates,
  setMaterialName,
  updateMaterial,
  deleteMaterial,
  gridRows,
  gridCols,
  applyGridResize,
  grid2d,
  isDisabledCell,
  updateGridCell,
  handleGridPaste,
}) {
  if (!selectedRow) {
    return <section className={styles.card}>左から装備を選んでくれ</section>;
  }

  return (
    <>
      <section className={styles.card}>
        <div className={styles.sectionActions}>
          <div className={styles.sectionActionsLeft}>
            <button onClick={saveSelected} disabled={saving} className={styles.button}>
              保存
            </button>
            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={syncGroup}
                onChange={(e) => setSyncGroup(e.target.checked)}
              />
              グループ同期
            </label>
          </div>

          <div className={styles.sectionActionsRight}>
            <button
              onClick={deleteCurrentItem}
              disabled={saving}
              className={styles.buttonDanger}
            >
              単体削除
            </button>
            {isSelectedGrouped && (
              <button
                onClick={deleteCurrentGroup}
                disabled={saving}
                className={styles.buttonDanger}
              >
                セット削除
              </button>
            )}
          </div>
        </div>

        <div className={styles.formGrid4}>
          <Labeled label="itemId">
            <input
              value={selectedRow.itemId}
              onChange={(e) => setSelectedRowPatch({ itemId: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="itemName">
            <input
              value={selectedRow.itemName}
              onChange={(e) => setSelectedRowPatch({ itemName: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="equipmentType">
            <select
              value={selectedRow.equipmentTypeId}
              onChange={(e) =>
                setSelectedRowPatch({ equipmentTypeId: e.target.value })
              }
              className={styles.input}
            >
              <option value="">（選択）</option>
              {equipmentTypeOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label="jobOverrideMode">
            <select
              value={selectedRow.jobOverrideMode}
              onChange={(e) =>
                setSelectedRowPatch({ jobOverrideMode: e.target.value })
              }
              className={styles.input}
            >
              {jobOverrideModeOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label="slot">
            <input
              value={selectedRow.slot}
              onChange={(e) => setSelectedRowPatch({ slot: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="craftLevel">
            <input
              type="number"
              value={selectedRow.craftLevel}
              onChange={(e) => setGroupPatch({ craftLevel: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="equipLevel">
            <input
              type="number"
              value={selectedRow.equipLevel}
              onChange={(e) => setGroupPatch({ equipLevel: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="recipeBook">
            <input
              value={selectedRow.recipeBook}
              onChange={(e) => setGroupPatch({ recipeBook: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="recipePlace">
            <input
              value={selectedRow.recipePlace}
              onChange={(e) => setGroupPatch({ recipePlace: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="slotGridType">
            <input
              value={selectedRow.slotGridType}
              onChange={(e) =>
                setSelectedRowPatch({ slotGridType: e.target.value })
              }
              className={styles.input}
            />
          </Labeled>

          <Labeled label="slotGridCols">
            <input
              type="number"
              value={selectedRow.slotGridCols}
              onChange={(e) =>
                setSelectedRowPatch({ slotGridCols: e.target.value })
              }
              className={styles.input}
            />
          </Labeled>

          <Labeled label="groupKind">
            <input
              value={selectedRow.groupKind}
              onChange={(e) => setSelectedRowPatch({ groupKind: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="groupId">
            <input
              value={selectedRow.groupId}
              onChange={(e) => setSelectedRowPatch({ groupId: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="groupName">
            <input
              value={selectedRow.groupName}
              onChange={(e) => setGroupPatch({ groupName: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="sourceUrl">
            <input
              value={selectedRow.sourceUrl}
              onChange={(e) => setSelectedRowPatch({ sourceUrl: e.target.value })}
              className={styles.input}
            />
          </Labeled>

          <Labeled label="detailUrl">
            <input
              value={selectedRow.detailUrl}
              onChange={(e) => setSelectedRowPatch({ detailUrl: e.target.value })}
              className={styles.input}
            />
          </Labeled>
        </div>

        <div className={styles.stack}>
          <Labeled label="description">
            <textarea
              value={selectedRow.description}
              onChange={(e) => setSelectedRowPatch({ description: e.target.value })}
              className={styles.textarea}
              rows={5}
            />
          </Labeled>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>素材</div>
          <button onClick={addMaterial} className={styles.button}>
            素材追加
          </button>
        </div>

        <div className={styles.stack}>
          <input
            value={materialQuery}
            onChange={(e) => setMaterialQuery(e.target.value)}
            placeholder="素材候補検索"
            className={styles.input}
          />

          {materials.map((m, i) => (
            <div key={i} className={styles.materialRow}>
              <div className={styles.materialNameWrap}>
                <input
                  value={m.name}
                  onChange={(e) => setMaterialName(i, e.target.value)}
                  placeholder="素材名"
                  className={styles.input}
                  list={`material-candidates-${i}`}
                />
                <datalist id={`material-candidates-${i}`}>
                  {materialCandidates.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <input
                type="number"
                value={m.qty}
                onChange={(e) => updateMaterial(i, "qty", e.target.value)}
                placeholder="数量"
                className={styles.input}
              />

              <button
                onClick={() => deleteMaterial(i)}
                className={styles.buttonDanger}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.gridResizeRow}>
          <div className={styles.sectionTitle}>slotGrid</div>

          <label className={styles.inlineField}>
            rows
            <input
              type="number"
              value={gridRows}
              onChange={(e) =>
                applyGridResize(Number(e.target.value) || 0, gridCols)
              }
              className={cx(styles.input, styles.inputSmall)}
            />
          </label>

          <label className={styles.inlineField}>
            cols
            <input
              type="number"
              value={gridCols}
              onChange={(e) =>
                applyGridResize(gridRows, Number(e.target.value) || 0)
              }
              className={cx(styles.input, styles.inputSmall)}
            />
          </label>
        </div>

        <div className={styles.gridTableWrap}>
          <table className={styles.gridTable}>
            <tbody>
              {Array.from({ length: gridRows }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: gridCols }).map((__, c) => {
                    const disabled = isDisabledCell(
                      selectedRow.slotGridType,
                      r,
                      c
                    );

                    return (
                      <td key={`${r}-${c}`} className={styles.gridCell}>
                        <input
                          value={grid2d?.[r]?.[c] ?? ""}
                          disabled={disabled}
                          onChange={(e) => updateGridCell(r, c, e.target.value)}
                          onPaste={(e) => {
                            e.preventDefault();
                            handleGridPaste(
                              r,
                              c,
                              e.clipboardData.getData("text")
                            );
                          }}
                          className={cx(
                            styles.gridInput,
                            disabled && styles.gridInputDisabled
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}