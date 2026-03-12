"use client";

import { useMemo, useState } from "react";
import styles from "./EquipmentForm.module.css";

export default function EquipmentMaterialsPanel({
  materials = [],
  allItems = [],
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [keyword, setKeyword] = useState("");

  const itemOptions = useMemo(() => {
    return Array.isArray(allItems) ? allItems : [];
  }, [allItems]);

  function getMaterialItemId(mat) {
    return mat?.item_id ?? mat?.itemId ?? "";
  }

  function findItemNameById(itemId) {
    if (itemId == null || itemId === "") return "";
    const found = itemOptions.find((item) => String(item.id) === String(itemId));
    return found?.name ?? "";
  }

  function getDisplayMaterialName(mat) {
    const rawName = mat?.name ?? mat?.item_name ?? mat?.itemName ?? "";
    if (String(rawName).trim()) return rawName;
    return findItemNameById(getMaterialItemId(mat));
  }

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return [];

    return itemOptions
      .filter((item) => String(item?.name ?? "").toLowerCase().includes(q))
      .slice(0, 20);
  }, [itemOptions, keyword]);

  function addMaterialFromItem(item) {
    if (!item) return;

    onAdd({
      item_id: Number(item.id),
      count: 1,
    });

    setKeyword("");
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>素材</div>
      </div>

      <div className={styles.materialSearchBox}>
        <input
          type="text"
          className={styles.inputCompactWide}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="素材を検索して追加"
        />

        {keyword.trim() ? (
          <div className={styles.materialSearchResults}>
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.materialSearchItem}
                  onClick={() => addMaterialFromItem(item)}
                >
                  {item.name}
                </button>
              ))
            ) : (
              <div className={styles.materialSearchEmpty}>該当なし</div>
            )}
          </div>
        ) : null}
      </div>

      {!materials.length ? (
        <div className={styles.mutedText}>素材なし</div>
      ) : (
        <div className={styles.materialTableWrap}>
          <div className={styles.materialTableHead}>
            <div className={styles.materialCellName}>素材</div>
            <div className={styles.materialCellCount}>個数</div>
            <div className={styles.materialCellAction}></div>
          </div>

          <div className={styles.materialTableBody}>
            {materials.map((mat, index) => (
              <div key={index} className={styles.materialTableRow}>
                <div className={styles.materialCellName}>
                  <input
                    className={styles.inputCompact}
                    value={getDisplayMaterialName(mat)}
                    onChange={(e) => onUpdate(index, "name", e.target.value)}
                    placeholder="素材名"
                  />
                </div>

                <div className={styles.materialCellCount}>
                  <input
                    type="number"
                    className={styles.inputCompactXs}
                    value={mat?.count ?? 1}
                    onChange={(e) => onUpdate(index, "count", e.target.value)}
                  />
                </div>

                <div className={styles.materialCellAction}>
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => onDelete(index)}
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
  );
}