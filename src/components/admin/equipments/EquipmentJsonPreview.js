"use client";

import styles from "./EquipmentForm.module.css";

export default function EquipmentJsonPreview({ payload }) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionTitle}>JSON確認用</div>
      <pre className={styles.pre}>{JSON.stringify(payload, null, 2)}</pre>
    </section>
  );
}