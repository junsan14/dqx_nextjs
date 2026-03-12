"use client";

export default function MonsterSearchSidebar({
  monsters = [],
  selectedId = null,
  keyword = "",
  loading = false,
  onKeywordChange,
  onSelect,
  onCreateNew,
  isOpen = true,
  onToggle,
}) {
  return (
    <>
      <style jsx>{`
        @media (max-width: 960px) {
          .monster-search-sidebar {
            width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            max-height: none !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 20;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb !important;
            padding: 12px !important;
            gap: 10px !important;
            box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
          }

          .monster-search-sidebar-list {
            max-height: 32vh !important;
          }
        }

        @media (max-width: 640px) {
          .monster-search-sidebar {
            padding: 10px !important;
          }

          .monster-search-sidebar-title {
            font-size: 18px !important;
          }

          .monster-search-sidebar-header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .monster-search-sidebar-new,
          .monster-search-sidebar-toggle {
            padding: 8px 10px !important;
          }

          .monster-search-sidebar-input {
            font-size: 16px !important;
          }

          .monster-search-sidebar-item {
            padding: 10px !important;
          }
        }
      `}</style>

      <aside className="monster-search-sidebar" style={styles.sidebar}>
        <div style={styles.header}>
          <h2 className="monster-search-sidebar-title" style={styles.title}>
            モンスター
          </h2>

          <div
            className="monster-search-sidebar-header-actions"
            style={styles.headerActions}
          >
            <button
              type="button"
              onClick={onCreateNew}
              className="monster-search-sidebar-new"
              style={styles.newButton}
            >
              新規
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="monster-search-sidebar-toggle"
              style={styles.toggleButton}
            >
              {isOpen ? "閉じる" : "開く"}
            </button>
          </div>
        </div>

        {isOpen && (
          <>
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="モンスター名で検索"
              className="monster-search-sidebar-input"
              style={styles.input}
            />

            <div className="monster-search-sidebar-list" style={styles.list}>
              {loading ? (
                <div style={styles.empty}>読み込み中...</div>
              ) : monsters.length === 0 ? (
                <div style={styles.empty}>モンスターなし</div>
              ) : (
                monsters.map((monster) => {
                  const active = Number(selectedId) === Number(monster.id);

                  return (
                    <button
                      key={monster.id}
                      type="button"
                      onClick={() => onSelect(monster)}
                      className="monster-search-sidebar-item"
                      style={{
                        ...styles.item,
                        ...(active ? styles.itemActive : {}),
                      }}
                    >
                      <div style={styles.itemTop}>
                        <strong style={styles.itemName}>{monster.name}</strong>
                        <span style={styles.order}>
                          #{monster.display_order ?? 0}
                        </span>
                      </div>

                      <div style={styles.meta}>
                        {monster.system_type || "系統なし"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

const styles = {
  sidebar: {
    width: 320,
    minWidth: 320,
    borderRight: "1px solid #e5e7eb",
    padding: 16,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    height: "100vh",
    position: "sticky",
    top: 0,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
  },
  headerActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  newButton: {
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    minHeight: 38,
    flexShrink: 0,
  },
  toggleButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    minHeight: 38,
    flexShrink: 0,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
  },
  list: {
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 0,
  },
  item: {
    textAlign: "left",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    padding: 12,
    cursor: "pointer",
    minWidth: 0,
  },
  itemActive: {
    background: "#eff6ff",
    border: "1px solid #2563eb",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  itemName: {
    minWidth: 0,
    wordBreak: "break-word",
  },
  order: {
    color: "#64748b",
    fontSize: 12,
    flexShrink: 0,
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    wordBreak: "break-word",
  },
  empty: {
    padding: 12,
    color: "#64748b",
  },
};