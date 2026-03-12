"use client";

import styles from "./EquipmentForm.module.css";
import { cx, str } from "./equipmentFormHelpers";

export default function EquipmentListPanel({
  query,
  setQuery,
  displayEntries,
  selectedKey,
  selectedRow,
  setSelectedKey,
}) {
  return (
    <aside className={cx(styles.card, styles.sidebarCard)}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="検索（名前 / 部位 / グループ名）"
        className={styles.input}
      />

      <div className={styles.entryList}>
        {displayEntries.map((entry) => {
          if (entry.__kind === "group") {
            const groupActive =
              str(selectedRow?.groupId).trim() === str(entry.groupId).trim();

            return (
              <div key={entry.__key} className={styles.groupEntry}>
                <button
                  onClick={() => setSelectedKey(entry.rows[0]?.__key ?? "")}
                  className={cx(
                    styles.entryButton,
                    groupActive && styles.entryButtonActive
                  )}
                >
                  <div className={styles.entryTitle}>{entry.label}</div>
                  <div className={styles.entryMeta}>
                    {`${entry.groupKind || "group"} / ${entry.items.length}件`}
                  </div>
                </button>

                <div className={styles.groupChildren}>
                  {entry.items.map((item) => {
                    const childActive = selectedKey === item.__key;
                    return (
                      <button
                        key={item.__key}
                        onClick={() => setSelectedKey(item.__key)}
                        className={cx(
                          styles.entryChildButton,
                          childActive && styles.entryChildButtonActive
                        )}
                      >
                        <div className={styles.entryChildSlot}>
                          {item.slot || "部位なし"}
                        </div>
                        <div className={styles.entryChildName}>
                          {item.itemName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active = selectedKey === entry.__key;

          return (
            <button
              key={entry.__key}
              onClick={() => setSelectedKey(entry.__key)}
              className={cx(styles.entryButton, active && styles.entryButtonActive)}
            >
              <div className={styles.entryTitle}>{entry.label}</div>
              <div className={styles.entryMeta}>
                {`${entry.row?.slot ?? ""} / Lv${entry.row?.equipLevel ?? "-"} / ${
                  entry.row?.equipmentTypeName ?? ""
                }`}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}