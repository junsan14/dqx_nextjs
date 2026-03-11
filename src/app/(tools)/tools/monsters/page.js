"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const SEARCH_OPTIONS = [
  { value: "monster", label: "モンスター" },
  { value: "orb", label: "オーブ" },
  { value: "item", label: "アイテム" },
  { value: "equipment", label: "装備" },
];

export default function MonstersPage() {
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
    if (searchType === "monster") {
      return monster.name;
    }

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

  const searchMonsters = async ({
    keyword: searchKeyword = "",
    searchType: currentSearchType = "monster",
  } = {}) => {
    try {
      setLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      const query = new URLSearchParams({
        keyword: searchKeyword,
        search_type: currentSearchType,
      });

      const url = `${baseUrl}/api/monsters/search?${query.toString()}`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`モンスター取得に失敗した: ${res.status}`);
      }

      const data = await res.json();
      const list = data.data ?? data ?? [];

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
    searchMonsters({ keyword: "", searchType });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchMonsters({
        keyword,
        searchType,
      });
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

  const handleSuggestionClick = (label) => {
    setKeyword(label);
    setShowSuggestions(false);

    searchMonsters({
      keyword: label,
      searchType,
    });
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroGlow} />
        <p style={styles.kicker}>DQX MONSTER DATABASE</p>
        <h1 style={styles.title}>モンスター検索</h1>
        <p style={styles.lead}>
          モンスター名、オーブ、アイテム、装備名から
          <br />
          関連モンスターをすばやく探せる
        </p>
      </section>

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
                  ...(searchType === option.value
                    ? styles.segmentButtonActive
                    : {}),
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
                        <div style={styles.suggestionMain}>
                          {suggestion.label}
                        </div>
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
              href={`/tools/monsters/${monster.id}`}
              style={styles.card}
            >
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>{monster.name}</h2>
                  {monster.monster_no && (
                    <p style={styles.monsterNo}>No. {monster.monster_no}</p>
                  )}
                </div>
                <span style={styles.arrow}>→</span>
              </div>

              <div style={styles.metaRow}>
                {monster.system_type && (
                  <span style={styles.typeChip}>{monster.system_type}</span>
                )}

                {searchType === "orb" && (monster.matched_color || monster.orb_color) && (
                  <span style={styles.colorChip}>
                    {monster.matched_color || monster.orb_color}
                  </span>
                )}
              </div>

              {formatSubText(monster) && (
                <p style={styles.subText}>{formatSubText(monster)}</p>
              )}
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
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 42%, #f8fafc 100%)",
    padding: "28px 16px 64px",
    color: "#0f172a",
  },
  hero: {
    maxWidth: "1100px",
    margin: "0 auto 22px",
    position: "relative",
    padding: "24px 4px 8px",
  },
  heroGlow: {
    position: "absolute",
    top: "-40px",
    right: "10%",
    width: "220px",
    height: "220px",
    background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  kicker: {
    margin: "0 0 10px",
    fontSize: "12px",
    letterSpacing: "0.18em",
    color: "#6366f1",
    fontWeight: 800,
  },
  title: {
    margin: "0 0 10px",
    fontSize: "clamp(34px, 6vw, 58px)",
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  lead: {
    margin: 0,
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.7,
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
    transition: "all .18s ease",
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
  card: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    borderRadius: "24px",
    padding: "18px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.88)",
    boxShadow: "0 14px 34px rgba(15,23,42,0.07)",
    transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  monsterNo: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: 700,
  },
  arrow: {
    fontSize: "18px",
    color: "#94a3b8",
    fontWeight: 800,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  },
  typeChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: 800,
  },
  colorChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "7px 10px",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid #e2e8f0",
  },
  subText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
    minHeight: "24px",
  },
};