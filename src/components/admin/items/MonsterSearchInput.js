"use client";

import { useEffect, useState } from "react";
import { searchMonsters } from "@/lib/orbs";

export default function MonsterSearchInput({ onSelect }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = keyword.trim();

      if (!q) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const list = await searchMonsters(q);
        setResults(list);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div style={wrapStyle}>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="モンスター名で検索"
        style={inputStyle}
      />

      {loading ? <div style={statusStyle}>検索中...</div> : null}

      {!!results.length && (
        <div style={resultsStyle}>
          {results.map((monster) => (
            <button
              key={monster.id}
              type="button"
              onClick={() => {
                onSelect?.(monster);
                setKeyword("");
                setResults([]);
              }}
              style={resultButtonStyle}
            >
              <div style={{ fontWeight: 700 }}>{monster.name}</div>
              <div style={subStyle}>
                {monster.monster_no ? `No.${monster.monster_no} / ` : ""}
                {monster.system_type || ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const wrapStyle = {
  display: "grid",
  gap: 8,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};

const statusStyle = {
  fontSize: 13,
  color: "#666",
};

const resultsStyle = {
  display: "grid",
  gap: 8,
  maxHeight: 260,
  overflowY: "auto",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 8,
};

const resultButtonStyle = {
  textAlign: "left",
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};

const subStyle = {
  marginTop: 4,
  fontSize: 13,
  color: "#666",
};