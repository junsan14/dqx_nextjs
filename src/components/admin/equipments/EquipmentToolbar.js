"use client";

import styles from "./EquipmentForm.module.css";

export default function EquipmentToolbar({
  loading,
  saving,
  rowsCount,
  onReload,
}) {
  return (
    <div className={styles.toolbar}>
      <button
        onClick={onReload}
        disabled={loading || saving}
        className={styles.button}
      >
        再読み込み
      </button>
      <span className={styles.toolbarMeta}>rows: {rowsCount}</span>
    </div>
  );
}