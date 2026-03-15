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
  theme,
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

      <aside className="monster-search-sidebar" style={sidebarStyle(theme)}>
        <div style={headerStyle}>
          <h2 className="monster-search-sidebar-title" style={titleStyle(theme)}>
            モンスター
          </h2>

          <div
            className="monster-search-sidebar-header-actions"
            style={headerActionsStyle}
          >
            <button
              type="button"
              onClick={onCreateNew}
              className="monster-search-sidebar-new"
              style={newButtonStyle(theme)}
            >
              新規
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="monster-search-sidebar-toggle"
              style={toggleButtonStyle(theme)}
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
              style={inputStyle(theme)}
            />

            <div className="monster-search-sidebar-list" style={listStyle}>
              {loading ? (
                <div style={emptyStyle(theme)}>読み込み中...</div>
              ) : monsters.length === 0 ? (
                <div style={emptyStyle(theme)}>モンスターなし</div>
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
                        ...itemStyle(theme),
                        ...(active ? itemActiveStyle(theme) : {}),
                      }}
                    >
                      <div style={itemTopStyle}>
                        <strong style={itemNameStyle}>{monster.name}</strong>
                        <span style={orderStyle(theme)}>
                          #{monster.display_order ?? 0}
                        </span>
                      </div>

                      <div style={metaStyle(theme)}>
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

const sidebarStyle = (theme) => ({
  width: 320,
  minWidth: 320,
  borderRight: `1px solid ${theme.cardBorder}`,
  borderBottom: `1px solid ${theme.cardBorder}`,
  padding: 16,
  background: theme.cardBg,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  height: "100vh",
  position: "sticky",
  top: 0,
  overflow: "hidden",
});

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const titleStyle = (theme) => ({
  margin: 0,
  fontSize: 20,
  color: theme.title,
});

const headerActionsStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const newButtonStyle = (theme) => ({
  border: `1px solid ${theme.primaryBorder}`,
  background: theme.primaryBg,
  color: theme.primaryText,
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  minHeight: 38,
  flexShrink: 0,
});

const toggleButtonStyle = (theme) => ({
  border: `1px solid ${theme.inputBorder}`,
  background: theme.secondaryBg,
  color: theme.text,
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  minHeight: 38,
  flexShrink: 0,
});

const inputStyle = (theme) => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${theme.inputBorder}`,
  background: theme.inputBg,
  color: theme.inputText,
  boxSizing: "border-box",
});

const listStyle = {
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minHeight: 0,
};

const itemStyle = (theme) => ({
  textAlign: "left",
  border: `1px solid ${theme.cardBorder}`,
  background: theme.cardBg,
  borderRadius: 10,
  padding: 12,
  cursor: "pointer",
  minWidth: 0,
});

const itemActiveStyle = (theme) => ({
  background: theme.selectedBg,
  border: `1px solid ${theme.selectedBorder}`,
});

const itemTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
};

const itemNameStyle = {
  minWidth: 0,
  wordBreak: "break-word",
};

const orderStyle = (theme) => ({
  color: theme.mutedText,
  fontSize: 12,
  flexShrink: 0,
});

const metaStyle = (theme) => ({
  marginTop: 6,
  fontSize: 13,
  color: theme.mutedText,
  wordBreak: "break-word",
});

const emptyStyle = (theme) => ({
  padding: 12,
  color: theme.mutedText,
});
