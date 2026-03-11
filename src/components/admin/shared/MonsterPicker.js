"use client";

import { useEffect, useMemo, useState } from "react";
import { lookupMonsters } from "@/lib/monsters";

export default function MonsterPicker({
  value = [],
  onChange,
  defaultDropType = "normal",
  dropTypeOptions = [],
  enableDropTypeSelect = true,
  titleWhenEmpty = "まだモンスターが登録されていない",
}) {
  const [keyword, setKeyword] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);

  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  useEffect(() => {
    if (!keyword.trim()) {
      setCandidates([]);
      return;
    }

    let ignore = false;

    async function run() {
      setSearching(true);

      try {
        const result = await lookupMonsters(keyword);
        if (!ignore) setCandidates(result);
      } catch (error) {
        console.error(error);
        if (!ignore) setCandidates([]);
      } finally {
        if (!ignore) setSearching(false);
      }
    }

    const timer = setTimeout(run, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [keyword]);

  function normalizeRows(nextRows) {
    return nextRows.map((row, index) => ({
      ...row,
      drop_type: row.drop_type || defaultDropType,
      sort_order: index + 1,
    }));
  }

  function addMonster(monster) {
    const current = Array.isArray(value) ? value : [];
    const exists = current.some((x) => Number(x.monster_id) === Number(monster.id));
    if (exists) return;

    onChange(
      normalizeRows([
        ...current,
        {
          monster_id: monster.id,
          drop_type: defaultDropType,
          sort_order: current.length + 1,
          monster,
        },
      ])
    );

    setKeyword("");
    setCandidates([]);
  }

  function removeMonster(monsterId) {
    const current = Array.isArray(value) ? value : [];
    onChange(
      normalizeRows(
        current.filter((x) => Number(x.monster_id) !== Number(monsterId))
      )
    );
  }

  function moveMonster(monsterId, direction) {
    const current = [...(Array.isArray(value) ? value : [])];
    const index = current.findIndex((x) => Number(x.monster_id) === Number(monsterId));
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];

    onChange(normalizeRows(current));
  }

  function updateDropType(monsterId, nextDropType) {
    const current = Array.isArray(value) ? value : [];
    onChange(
      normalizeRows(
        current.map((row) =>
          Number(row.monster_id) === Number(monsterId)
            ? { ...row, drop_type: nextDropType }
            : row
        )
      )
    );
  }

  return (
    <div style={wrapStyle}>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="モンスター名 / 系統 / monster_no で検索"
        style={inputStyle}
      />

      {searching ? <div style={mutedStyle}>検索中...</div> : null}

      {!!candidates.length && (
        <div style={candidateWrapStyle}>
          {candidates.map((monster) => (
            <button
              key={monster.id}
              type="button"
              style={candidateButtonStyle}
              onClick={() => addMonster(monster)}
            >
              <div style={candidateMainStyle}>
                <div style={{ fontWeight: 700 }}>{monster.name}</div>
                <div style={metaStyle}>
                  No:{monster.monster_no ?? "-"} / {monster.system_type || "系統なし"}
                </div>
              </div>
              <div style={addLabelStyle}>追加</div>
            </button>
          ))}
        </div>
      )}

      {!rows.length ? (
        <div style={mutedStyle}>{titleWhenEmpty}</div>
      ) : (
        <div style={listStyle}>
          {rows.map((row, index) => (
            <div key={row.monster_id} style={dropItemStyle}>
              <div style={dropInfoStyle}>
                <div style={{ fontWeight: 700 }}>
                  {row.monster?.name || `monster_id: ${row.monster_id}`}
                </div>
                <div style={metaStyle}>
                  No:{row.monster?.monster_no ?? "-"} / {row.monster?.system_type || "系統なし"}
                </div>
              </div>

              <div style={controlAreaStyle}>
                {enableDropTypeSelect ? (
                  <label style={selectWrapStyle}>
                    <span style={controlLabelStyle}>ドロップ種別</span>
                    <select
                      value={row.drop_type || defaultDropType}
                      onChange={(e) => updateDropType(row.monster_id, e.target.value)}
                      style={selectStyle}
                    >
                      {dropTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div style={fixedTypeBadgeStyle}>
                    {row.drop_type || defaultDropType}
                  </div>
                )}

                <div style={dropActionStyle}>
                  <button
                    type="button"
                    onClick={() => moveMonster(row.monster_id, "up")}
                    disabled={index === 0}
                    style={miniButtonStyle}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMonster(row.monster_id, "down")}
                    disabled={index === rows.length - 1}
                    style={miniButtonStyle}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMonster(row.monster_id)}
                    style={removeButtonStyle}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const wrapStyle = {
  display: "grid",
  gap: 10,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 16,
  boxSizing: "border-box",
};

const mutedStyle = {
  fontSize: 14,
  color: "#666",
};

const metaStyle = {
  fontSize: 12,
  color: "#666",
};

const candidateWrapStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  overflow: "hidden",
  display: "grid",
};

const candidateButtonStyle = {
  border: "none",
  borderBottom: "1px solid #eee",
  background: "#fff",
  padding: 10,
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const candidateMainStyle = {
  display: "grid",
  gap: 4,
};

const addLabelStyle = {
  fontSize: 12,
  color: "#1976d2",
  whiteSpace: "nowrap",
};

const listStyle = {
  display: "grid",
  gap: 8,
};

const dropItemStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
};

const dropInfoStyle = {
  minWidth: 0,
  display: "grid",
  gap: 4,
  flex: 1,
};

const controlAreaStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const selectWrapStyle = {
  display: "grid",
  gap: 4,
};

const controlLabelStyle = {
  fontSize: 12,
  color: "#666",
};

const selectStyle = {
  border: "1px solid #ccc",
  background: "#fff",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 14,
};

const fixedTypeBadgeStyle = {
  fontSize: 12,
  color: "#555",
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "6px 10px",
  background: "#f7f7f7",
};

const dropActionStyle = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const miniButtonStyle = {
  border: "1px solid #ccc",
  background: "#fff",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};

const removeButtonStyle = {
  border: "1px solid #c62828",
  background: "#fff",
  color: "#c62828",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};