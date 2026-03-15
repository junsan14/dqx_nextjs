"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMonsterDetail, searchMonsters } from "@/lib/monsters";
import MonsterSearchHero from "./MonsterSearchHero";
import MonsterSearchCard from "./MonsterSearchCard";
import MonsterDetailHero from "@/components/tools/monsters/detail/MonsterDetailHero";
import MonsterDropSection from "@/components/tools/monsters/detail/MonsterDropSection";
import MonsterMapSection from "@/components/tools/monsters/detail/MonsterMapSection";

const SEARCH_OPTIONS = [
  { value: "monster", label: "モンスター" },
  { value: "orb", label: "オーブ" },
  { value: "item", label: "アイテム" },
  { value: "equipment", label: "装備" },
];

function MonstersSearchPageLoading() {
  return (
    <div style={loadingStyles.pageWrap}>
      <section style={loadingStyles.searchCard}>
        <div style={loadingStyles.segmentRow}>
          <div style={{ ...loadingStyles.pill, width: 92 }} />
          <div style={{ ...loadingStyles.pill, width: 86 }} />
          <div style={{ ...loadingStyles.pill, width: 86 }} />
          <div style={{ ...loadingStyles.pill, width: 86 }} />
        </div>

        <div style={loadingStyles.searchInputWrap}>
          <div style={loadingStyles.searchIcon}>⌕</div>
          <div style={loadingStyles.searchInputSkeleton} />
        </div>

        <div style={loadingStyles.statusRow}>
          <div style={{ ...loadingStyles.line, width: 72, height: 12 }} />
        </div>
      </section>

      <section style={loadingStyles.list}>
        {Array.from({ length: 6 }).map((_, index) => (
          <article key={index} style={loadingStyles.card}>
            <div style={loadingStyles.cardInner}>
              <div style={loadingStyles.thumb} />

              <div style={loadingStyles.content}>
                <div style={{ ...loadingStyles.line, width: "38%", height: 20 }} />
                <div
                  style={{
                    ...loadingStyles.line,
                    width: "24%",
                    height: 13,
                    marginTop: 10,
                  }}
                />
                <div
                  style={{
                    ...loadingStyles.line,
                    width: "72%",
                    height: 13,
                    marginTop: 14,
                  }}
                />

                <div style={loadingStyles.metaRow}>
                  <div style={{ ...loadingStyles.badge, width: 84 }} />
                  <div style={{ ...loadingStyles.badge, width: 68 }} />
                  <div style={{ ...loadingStyles.badge, width: 94 }} />
                </div>
              </div>

              <div style={loadingStyles.chevron} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MonsterDetailLoading() {
  return (
    <div style={loadingStyles.detailCard}>
      <div style={loadingStyles.detailHero}>
        <div style={loadingStyles.detailHeroThumb} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...loadingStyles.line, width: "42%", height: 22 }} />
          <div
            style={{
              ...loadingStyles.line,
              width: "20%",
              height: 13,
              marginTop: 10,
            }}
          />
          <div
            style={{
              ...loadingStyles.line,
              width: "64%",
              height: 13,
              marginTop: 14,
            }}
          />
        </div>
      </div>

      <div style={loadingStyles.detailSection}>
        <div style={{ ...loadingStyles.line, width: 120, height: 16 }} />
        <div style={loadingStyles.detailList}>
          <div style={{ ...loadingStyles.line, width: "100%", height: 14 }} />
          <div style={{ ...loadingStyles.line, width: "88%", height: 14 }} />
          <div style={{ ...loadingStyles.line, width: "76%", height: 14 }} />
        </div>
      </div>

      <div style={loadingStyles.detailSection}>
        <div style={{ ...loadingStyles.line, width: 140, height: 16 }} />
        <div style={loadingStyles.mapGrid}>
          <div style={loadingStyles.mapBox} />
          <div style={loadingStyles.mapBox} />
        </div>
      </div>
    </div>
  );
}

export default function MonstersSearchClient() {
  const [searchType, setSearchType] = useState("monster");
  const [keyword, setKeyword] = useState("");
  const [monsters, setMonsters] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [detailErrors, setDetailErrors] = useState({});

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const itemRefs = useRef({});

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
    isInitial = false,
  } = {}) => {
    try {
      setLoading(true);

      const list = await searchMonsters(searchKeyword, currentSearchType);

      setMonsters(list);
      setSuggestions(buildUniqueSuggestions(list));
      setSearched(true);
      setExpandedId(null);
    } catch (error) {
      console.error(error);
      setMonsters([]);
      setSuggestions([]);
      setSearched(true);
      setExpandedId(null);
    } finally {
      setLoading(false);
      if (isInitial) setInitialLoading(false);
    }
  };

  function restoreCardPosition(monsterId, beforeTop) {
    if (beforeTop == null) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = itemRefs.current[monsterId];
        if (!el) return;

        const afterTop = el.getBoundingClientRect().top;
        const diff = afterTop - beforeTop;

        if (Math.abs(diff) <= 1) return;

        window.scrollBy({
          top: diff,
          left: 0,
          behavior: "auto",
        });
      });
    });
  }

  async function handleToggleDetail(monsterId) {
    if (!monsterId) return;

    const clickedEl = itemRefs.current[monsterId];
    const beforeTop = clickedEl?.getBoundingClientRect().top ?? null;

    const nextOpen = expandedId !== monsterId;
    setExpandedId(nextOpen ? monsterId : null);

    restoreCardPosition(monsterId, beforeTop);

    if (!nextOpen || detailCache[monsterId]) return;

    try {
      setDetailLoadingId(monsterId);
      setDetailErrors((prev) => {
        const next = { ...prev };
        delete next[monsterId];
        return next;
      });

      const detail = await fetchMonsterDetail(monsterId);

      setDetailCache((prev) => ({
        ...prev,
        [monsterId]: detail,
      }));

      restoreCardPosition(monsterId, beforeTop);
    } catch (error) {
      console.error(error);
      setDetailErrors((prev) => ({
        ...prev,
        [monsterId]: "モンスター詳細を取得できなかった",
      }));
      restoreCardPosition(monsterId, beforeTop);
    } finally {
      setDetailLoadingId((current) => (current === monsterId ? null : current));
    }
  }

  useEffect(() => {
    runSearch({
      keyword: "",
      searchType: "monster",
      isInitial: true,
    });
  }, []);

  useEffect(() => {
    if (initialLoading) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      runSearch({ keyword, searchType });
    }, keyword.length >= 2 ? 180 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, searchType, initialLoading]);

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

  if (initialLoading) {
    return (
      <main style={styles.page}>
        <MonsterSearchHero />
        <MonstersSearchPageLoading />

        <style jsx global>{`
          @keyframes monsterSearchShimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </main>
    );
  }

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
          <p style={styles.emptyText}>キーワードを変えて試してください</p>
        </div>
      )}

      {monsters.length > 0 && (
        <section style={styles.list}>
          {monsters.map((monster) => {
            const isOpen = expandedId === monster.id;
            const detail = detailCache[monster.id];
            const errorText = detailErrors[monster.id];
            const isDetailLoading = detailLoadingId === monster.id;

            return (
              <article
                key={monster.id}
                ref={(el) => {
                  itemRefs.current[monster.id] = el;
                }}
                style={{
                  ...styles.listItem,
                  ...(isOpen ? styles.listItemOpen : {}),
                  ...(loading ? styles.listItemLoading : {}),
                }}
              >
                <MonsterSearchCard
                  monster={monster}
                  searchType={searchType}
                  formatSubText={formatSubText}
                  isOpen={isOpen}
                  onClick={() => handleToggleDetail(monster.id)}
                />

                {isOpen && (
                  <div style={styles.detailWrap}>
                    {isDetailLoading && !detail ? (
                      <MonsterDetailLoading />
                    ) : errorText ? (
                      <div style={styles.errorCard}>{errorText}</div>
                    ) : detail ? (
                      <div style={styles.detailCard}>
                        <MonsterDetailHero monster={detail} />
                        <MonsterDropSection
                          normalDrops={detail.normal_drops ?? []}
                          rareDrops={detail.rare_drops ?? []}
                          orbDrops={detail.orb_drops ?? []}
                          equipmentDrops={detail.equipment_drops ?? []}
                        />
                        <MonsterMapSection maps={detail.maps ?? []} />
                      </div>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      <style jsx global>{`
        @keyframes monsterSearchShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </main>
  );
}

const shimmer = {
  background:
    "linear-gradient(90deg, rgba(226,232,240,0.9) 0%, rgba(241,245,249,1) 50%, rgba(226,232,240,0.9) 100%)",
  backgroundSize: "200% 100%",
  animation: "monsterSearchShimmer 1.4s ease-in-out infinite",
};

const loadingStyles = {
  pageWrap: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
    minWidth: 0,
    boxSizing: "border-box",
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
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "28px",
  },
  segmentRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "14px",
  },
  pill: {
    height: "40px",
    borderRadius: "999px",
    ...shimmer,
  },
  searchInputWrap: {
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
  searchInputSkeleton: {
    width: "100%",
    height: "58px",
    borderRadius: "18px",
    ...shimmer,
  },
  statusRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
  },
  list: {
    display: "grid",
    gap: "16px",
    width: "100%",
  },
  card: {
    borderRadius: "24px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.75)",
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
    overflow: "hidden",
  },
  cardInner: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0,1fr) 24px",
    gap: "16px",
    alignItems: "center",
    padding: "18px",
  },
  thumb: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    ...shimmer,
  },
  content: {
    minWidth: 0,
  },
  line: {
    borderRadius: "999px",
    ...shimmer,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  badge: {
    height: "28px",
    borderRadius: "999px",
    ...shimmer,
  },
  chevron: {
    width: "18px",
    height: "18px",
    borderRadius: "999px",
    ...shimmer,
    justifySelf: "end",
  },
  detailCard: {
    borderRadius: "0 0 24px 24px",
    padding: "18px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #c7d2fe",
    borderTop: "1px solid rgba(199,210,254,0.55)",
    boxShadow: "0 14px 34px rgba(79,70,229,0.08)",
    width: "100%",
    boxSizing: "border-box",
  },
  detailHero: {
    display: "grid",
    gridTemplateColumns: "88px minmax(0,1fr)",
    gap: "16px",
    alignItems: "center",
  },
  detailHeroThumb: {
    width: "88px",
    height: "88px",
    borderRadius: "24px",
    ...shimmer,
  },
  detailSection: {
    marginTop: "22px",
  },
  detailList: {
    display: "grid",
    gap: "10px",
    marginTop: "12px",
  },
  mapGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: "12px",
    marginTop: "12px",
  },
  mapBox: {
    height: "96px",
    borderRadius: "18px",
    ...shimmer,
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 42%, #f8fafc 100%)",
    padding: "28px 16px 64px",
    color: "#0f172a",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  searchSection: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    position: "relative",
    zIndex: 10,
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
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "visible",
    zIndex: 60,
  },
  segment: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "14px",
    minWidth: 0,
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
    maxWidth: "100%",
    boxSizing: "border-box",
    transition: "all 0.18s ease",
  },
  segmentButtonActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
    boxShadow: "0 10px 24px rgba(17,24,39,0.18)",
  },
  searchArea: {
    position: "relative",
    minWidth: 0,
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
    minWidth: 0,
    maxWidth: "100%",
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
    zIndex: 999,
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
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
    minWidth: 0,
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
    boxSizing: "border-box",
  },
  suggestionMain: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  statusRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
    minWidth: 0,
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
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
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
  list: {
    margin: "0 auto",
    display: "grid",
    gap: "16px",
    width: "100%",
    maxWidth: "1100px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  listItem: {
    display: "grid",
    gap: 0,
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
    transition: "opacity 0.18s ease",
  },
  listItemOpen: {
    gap: 0,
  },
  listItemLoading: {
    opacity: 0.7,
  },
  detailWrap: {
    display: "grid",
    gap: 0,
    marginTop: 0,
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  detailCard: {
    borderRadius: "0 0 24px 24px",
    padding: "18px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #c7d2fe",
    borderTop: "1px solid rgba(199,210,254,0.55)",
    boxShadow: "0 14px 34px rgba(79,70,229,0.08)",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  errorCard: {
    borderRadius: "0 0 20px 20px",
    padding: "20px",
    background: "#fff",
    border: "1px solid #fecaca",
    borderTop: "1px solid rgba(254,202,202,0.7)",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 700,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    boxSizing: "border-box",
  },
};