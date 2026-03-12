"use client";

import styles from "./EquipmentForm.module.css";

export default function EquipmentEffectsPanel({
  effects,
  onAdd,
  onUpdate,
  onDelete,
}) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>効果</div>
        <button onClick={onAdd} className={styles.button}>
          効果追加
        </button>
      </div>

      <div className={styles.stack}>
        {effects.map((effect, i) => (
          <div key={i} className={styles.materialRow}>
            <div className={styles.materialNameWrap}>
              <input
                value={typeof effect === "string" ? effect : JSON.stringify(effect)}
                onChange={(e) => onUpdate(i, e.target.value)}
                placeholder="効果"
                className={styles.input}
              />
            </div>
            <div />
            <div />
            <button
              onClick={() => onDelete(i)}
              className={styles.buttonDanger}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}