"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchMonsters } from "@/lib/monsters";
import MonsterSearchHero from "./MonsterSearchHero";
import MonsterSearchCard from "./MonsterSearchCard";

const SEARCH_OPTIONS = [
  { value: "monster", label: "モンスター" },
  { value: "orb", label: "オーブ" },
  { value: "item", label: "アイテム" },
  { value: "equipment", label: "装備" },
];

export default function MonstersSearchClient() {
  const [searchType, setSearchType] = useState("monster");
  const [keyword, setKeyword] = useState("");
  const [monsters, setMonsters] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const currentLabel = useMemo(() => {
    return SEARCH_OPTIONS.find((x) => x.value === searchType)?.label ?? "検索";
  }, [searchType]);

  const extractNameFromMatchText = (text) => {
    if (!text) return null;
    const parts = String(text).split(":");
    return parts.length > 1 ? parts.slice(1).join(":").trim() : text;
  };

  const formatSuggestionName = (monster) => {
    if (searchType === "monster") return monster.name;

    if (searchType === "orb") {
      return (
        monster.matched_name ||
        monster.orb_name ||
        extractNameFromMatchText(monster.match_text) ||
        monster.name
      );
    }

    if (searchType === "item" || searchType === "equipment") {
      return (
        monster.matched_name ||
        extractNameFromMatchText(monster.match_text) ||
        monster.name
      );
    }

    return monster.name;
  };

  const buildUniqueSuggestions = (list) => {
    const map = new Map();

    for (const monster of list) {
      const suggestionName = formatSuggestionName(monster)?.trim();
      if (!suggestionName) continue;

      if (!map.has(suggestionName)) {
        map.set(suggestionName, {
          id: monster.id,
          label: suggestionName,
        });
      }
    }

    return Array.from(map.values()).slice(0, 8);
  };

  const formatSubText = (monster) => {
    if (searchType === "orb") {
      const orbName =
        monster.matched_name ||
        monster.orb_name ||
        extractNameFromMatchText(monster.match_text);

      const orbColor = monster.matched_color || monster.orb_color;

      if (orbName && orbColor) return `${orbName} ・ ${orbColor}`;
      if (orbName) return orbName;
      if (orbColor) return orbColor;
      return null;
    }

    if (searchType === "item" || searchType === "equipment") {
      return monster.matched_name || extractNameFromMatchText(monster.match_text);
    }

    return monster.system_type || null;
  };

  const runSearch = async ({
    keyword: searchKeyword = "",
    searchType: currentSearchType = "monster",
  } = {}) => {
    try {
      setLoading(true);
      const list = await searchMonsters(searchKeyword, currentSearchType);
      setMonsters(list);
      setSuggestions(buildUniqueSuggestions(list));
      setSearched(true);
    } catch (error) {
      console.error(error);
      setMonsters([]);
      setSuggestions([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch({ keyword: "", searchType: "monster" });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      runSearch({ keyword, searchType });
    }, keyword.length >= 2 ? 180 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, searchType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (label) => {
    setKeyword(label);
    setShowSuggestions(false);
    runSearch({
      keyword: label,
      searchType,
    });
  };

  return (
    <main style={styles.page}>
      <MonsterSearchHero />

      <section style={styles.searchSection}>
        <div style={styles.searchCard}>
          <div style={styles.segment}>
            {SEARCH_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSearchType(option.value);
                  setShowSuggestions(true);
                }}
                style={{
                  ...styles.segmentButton,
                  ...(searchType === option.value ? styles.segmentButtonActive : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div style={styles.searchArea} ref={wrapperRef}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder={`${currentLabel}で検索`}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowSuggestions(false);
                }
              }}
              style={styles.input}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div style={styles.suggestionBox}>
                <div style={styles.suggestionHeader}>候補</div>
                <ul style={styles.suggestionList}>
                  {suggestions.map((suggestion) => (
                    <li key={`suggest-${suggestion.label}`}>
                      <button
                        type="button"
                        style={styles.suggestionButton}
                        onClick={() => handleSuggestionClick(suggestion.label)}
                      >
                        <div style={styles.suggestionMain}>{suggestion.label}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={styles.statusRow}>
            <span style={styles.statusText}>
              {loading ? "検索中..." : `${monsters.length}件`}
            </span>
          </div>
        </div>
      </section>

      {!loading && searched && monsters.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>◌</div>
          <h2 style={styles.emptyTitle}>見つからなかった</h2>
          <p style={styles.emptyText}>キーワードを変えて試してみてくれ</p>
        </div>
      )}

      {!loading && monsters.length > 0 && (
        <section style={styles.grid}>
          {monsters.map((monster) => (
            <Link
              key={monster.id}
              href={`/tools/monster-search/${monster.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <MonsterSearchCard
                monster={monster}
                searchType={searchType}
                formatSubText={formatSubText}
              />
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 42%, #f8fafc 100%)",
    padding: "28px 16px 64px",
    color: "#0f172a",
  },
  searchSection: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
  },
  searchCard: {
    position: "relative",
    border: "1px solid rgba(255,255,255,0.75)",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
  },
  segment: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "14px",
  },
  segmentButton: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  segmentButtonActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
    boxShadow: "0 10px 24px rgba(17,24,39,0.18)",
  },
  searchArea: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "18px",
    zIndex: 2,
  },
  input: {
    width: "100%",
    height: "58px",
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: "16px",
    padding: "0 18px 0 46px",
    outline: "none",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  suggestionBox: {
    position: "absolute",
    top: "64px",
    left: 0,
    right: 0,
    background: "rgba(255,255,255,0.97)",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
    overflow: "hidden",
    zIndex: 20,
  },
  suggestionHeader: {
    padding: "12px 14px 8px",
    fontSize: "12px",
    fontWeight: 800,
    color: "#64748b",
    letterSpacing: "0.08em",
  },
  suggestionList: {
    margin: 0,
    padding: "0 0 6px",
    listStyle: "none",
  },
  suggestionButton: {
    width: "100%",
    display: "block",
    textAlign: "left",
    padding: "12px 14px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    borderTop: "1px solid #f1f5f9",
  },
  suggestionMain: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
  },
  statusRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
  },
  statusText: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 700,
  },
  empty: {
    maxWidth: "1100px",
    margin: "24px auto 0",
    borderRadius: "24px",
    padding: "38px 18px",
    textAlign: "center",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid #e2e8f0",
  },
  emptyIcon: {
    fontSize: "28px",
    color: "#94a3b8",
    marginBottom: "8px",
  },
  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
    fontWeight: 900,
  },
  emptyText: {
    margin: 0,
    color: "#64748b",
  },
  grid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
};