"use client";

import styles from "./EquipmentForm.module.css";

export default function LabeledField({ label, children }) {
  return (
    <label className={styles.field}>
      <div className={styles.label}>{label}</div>
      {children}
    </label>
  );
}