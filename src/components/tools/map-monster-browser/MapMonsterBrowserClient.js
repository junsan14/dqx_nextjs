"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMaps, fetchMapOptions } from "@/lib/maps";
import { fetchMonsterMapSpawns } from "@/lib/monsterMapSpawns";
import { fetchMonsterDetail } from "@/lib/monsters";
import MonsterMapOverlay, {
  getStyles as getMonsterMapOverlayStyles,
} from "./MonsterMapOverlay";
import PageHeroTitle from "@/components/PageHeroTitle";
import MapMonsterBrowserSkeleton from "@/components/ui/MapMonsterBrowserSkeleton";
import {
  MdOutlineSwipe,
  MdOutlineSwipeLeft,
  MdOutlineSwipeRight,
} from "react-icons/md";
function uniqBy(array, keyGetter) {
  const map = new Map();

  for (const item of array) {
    const key = keyGetter(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeKana(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u30A1-\u30F6]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60)
    )
    .toLowerCase()
    .trim();
}

function parseAreaList(area) {
  if (!area) return [];

  if (Array.isArray(area)) return area;

  if (typeof area === "string") {
    try {
      const parsed = JSON.parse(area);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return area
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function sortJa(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "ja");
}

function useIsMobile(breakpoint = 1200) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

function isBrowsableMapType(mapType) {
  const value = normalizeText(mapType).toLowerCase();

  return (
    value === "field" ||
    value === "dungeon" ||
    value === "フィールド" ||
    value === "ダンジョン"
  );
}

function getRelatedMonsterIds(targetMonsterId, monsters = {}) {
  const ids = new Set();

  if (!targetMonsterId) return ids;

  const selected = monsters[targetMonsterId];
  const selectedId = Number(targetMonsterId);

  ids.add(selectedId);

  if (selected?.reincarnation_parent_id) {
    ids.add(Number(selected.reincarnation_parent_id));
  }

  for (const monster of Object.values(monsters)) {
    if (!monster?.id) continue;

    const monsterId = Number(monster.id);
    const parentId = Number(monster.reincarnation_parent_id);

    if (parentId && parentId === selectedId) {
      ids.add(monsterId);
    }

    if (
      selected?.reincarnation_parent_id &&
      parentId === Number(selected.reincarnation_parent_id)
    ) {
      ids.add(monsterId);
    }
  }

  return ids;
}

function getMapMonsterBrowserStyles() {
  return {
    page: {
      background: "var(--page-bg)",
      color: "var(--page-text)",
      marginBottom:"50px"
    },
    filterPanel: {
      border: "1px solid var(--panel-border)",
      background: "var(--soft-bg)",
    },
    labelText: {
      color: "var(--text-sub)",
    },
    selectInput: {
      border: "1px solid var(--input-border)",
      background: "var(--input-bg)",
      color: "var(--input-text)",
    },
    textInput: {
      border: "1px solid var(--input-border)",
      background: "var(--input-bg)",
      color: "var(--input-text)",
    },
    dropdownPanel: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      boxShadow: "0 20px 40px rgba(15, 23, 42, 0.14)",
    },
    dropdownEmpty: {
      color: "var(--text-muted)",
    },
    dropdownItemActive: {
      background: "var(--selected-bg)",
      color: "var(--text-main)",
    },
    dropdownItemIdle: {
      color: "var(--text-main)",
    },
    loadingBox: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      color: "var(--text-muted)",
    },
    errorBox: {
      border: "1px solid var(--soft-danger-border)",
      background: "var(--soft-danger-bg)",
      color: "var(--danger-text)",
    },
    asideCard: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    continentText: {
      color: "var(--text-muted)",
    },
    mapTitle: {
      color: "var(--text-title)",
    },
    countText: {
      color: "var(--text-muted)",
    },
    sectionTitle: {
      color: "var(--text-sub)",
    },
    selectedSystemText: {
      color: "var(--secondary-text)",
    },
    emptyDashed: {
      border: "1px dashed var(--soft-border)",
      background: "var(--soft-bg)",
      color: "var(--text-muted)",
    },
    card: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
    },
    cardHeader: {
      borderBottom: "1px solid var(--card-border)",
    },
    cardHeaderTitle: {
      color: "var(--text-title)",
    },
    cardHeaderSub: {
      color: "var(--text-muted)",
    },

    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "10px",
    },
    statBox: {
      width: "100%",
      borderRadius: "14px",
      border: "1px solid var(--card-border)",
      background: "color-mix(in srgb, var(--soft-bg) 92%, transparent)",
      padding: "10px 12px",
      display: "grid",
      gap: "6px",
      minWidth: 0,
    },
    statLabel: {
      fontSize: "11px",
      fontWeight: 800,
      color: "var(--text-muted)",
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    },
    statValue: {
      fontSize: "14px",
      lineHeight: 1.45,
      color: "var(--text-main)",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
    },

    areaWrap: {
      border: "1px solid var(--card-border)",
      background: "var(--soft-bg)",
    },
    areaTitle: {
      color: "var(--secondary-text)",
    },
    areaEmpty: {
      color: "var(--text-muted)",
    },
    areaBadge: {
      border: "1px solid var(--tag-border)",
      background: "var(--card-bg)",
      color: "var(--tag-text)",
      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
    },
    areaMoreButton: {
      border: "1px dashed var(--soft-border)",
      background: "transparent",
      color: "var(--secondary-text)",
      cursor: "pointer",
    },

    spawnCardDesktop: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      minWidth: "320px",
      width: "320px",
      maxWidth: "320px",
      scrollSnapAlign: "start",
      flexShrink: 0,
    },
    spawnCardMobile: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      width: "100%",
      minWidth: "100%",
      maxWidth: "100%",
      scrollSnapAlign: "start",
      flexShrink: 0,
      boxSizing: "border-box",
    },
    monsterName: {
      color: "var(--text-title)",
      lineHeight: 1.35,
      wordBreak: "break-word",
    },
    monsterNameLine: {
      display: "block",
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
    badgeSystemActive: {
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
    },
    badgeSystemIdle: {
      background: "var(--soft-bg)",
      color: "var(--text-sub)",
    },
    badgeReincarnated: {
      background: "var(--warning-bg)",
      color: "var(--warning-text)",
    },
    detailLink: {
      border: "1px solid var(--secondary-border)",
      background: "var(--secondary-bg)",
      color: "var(--secondary-text)",
    },

    mapAndCardsDesktop: {
      gridTemplateColumns: "minmax(320px, 410px) minmax(0, 1fr)",
      gap: "16px",
      alignItems: "center",
      minWidth: 0,
      minHeight: "100%",
    },
    mapDesktopBox: {
      width: "100%",
      maxWidth: "410px",
      minWidth: 0,
      alignSelf: "center",
    },
    mapMobileBox: {
      width: "100%",
      minWidth: 0,
    },
    cardsDesktopScrollerWrap: {
      minWidth: 0,
      overflow: "hidden",
      alignSelf: "center",
    },
    cardsDesktopScroller: {
      display: "flex",
      gap: "14px",
      width: "100%",
      maxWidth: "100%",
      overflowX: "auto",
      paddingBottom: "8px",
      paddingRight: "28px",
      scrollSnapType: "x proximity",
      WebkitOverflowScrolling: "touch",
      boxSizing: "border-box",
    },

    cardsMobileScrollerOuter: {
      width: "100%",
      overflow: "hidden",
    },
    cardsMobileScroller: {
      display: "flex",
      gap: "12px",
      overflowX: "auto",
      paddingBottom: "6px",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      width: "100%",
      boxSizing: "border-box",
    },

    chipDefaultIdle: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      color: "var(--text-main)",
    },
    chipDefaultEmphasized: {
      border: "1px solid var(--selected-border)",
      background: "var(--selected-bg)",
      color: "var(--text-main)",
    },
    chipDefaultActive: {
      border: "1px solid var(--primary-border)",
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
    },
    chipSubtleIdle: {
      border: "1px solid var(--soft-border)",
      background: "var(--soft-bg)",
      color: "var(--text-main)",
    },
    chipSubtleEmphasized: {
      border: "1px solid var(--secondary-border)",
      background: "var(--secondary-bg)",
      color: "var(--secondary-text)",
    },
    chipSubtleActive: {
      border: "1px solid var(--primary-border)",
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
    },
    reincarnationMiniBadge: {
      background: "var(--warning-border)",
      color: "var(--primary-text)",
    },
    layerTabActive: {
      border: "1px solid var(--primary-border)",
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
    },
    layerTabIdle: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      color: "var(--text-main)",
    },
    mobileLayerHeader: {
      display: "grid",
      gap: "12px",
    },
    mobileLayerTabs: {
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      paddingBottom: "2px",
      WebkitOverflowScrolling: "touch",
    },
    pageColumnsDesktop: {
      alignItems: "stretch",
    },
    rightColumnDesktop: {
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
      
    swipeHint: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 12px",
      borderRadius: "999px",

      
      color: "var(--text-muted)",
      fontSize: "12px",
      fontWeight: 700,
      lineHeight: 1,
      whiteSpace: "nowrap",
      width: "fit-content",
      maxWidth: "100%",
    },
    swipeHintIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      opacity: 0.95,
      flexShrink: 0,
    },
    swipeHintText: {
      display: "inline-block",
      lineHeight: 1.2,
    },
    swipeHintWrap: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "8px",
    },
  };
}

function getHoverBackground() {
  return "var(--hover-bg)";
}

function MonsterChip({
  active = false,
  onClick,
  children,
  variant = "default",
  emphasized = false,
  className = "",
  styles,
}) {
  const base =
    "rounded-full border px-3 py-1.5 text-sm transition whitespace-nowrap";

  const variantStyle =
    variant === "subtle"
      ? active
        ? styles.chipSubtleActive
        : emphasized
        ? styles.chipSubtleEmphasized
        : styles.chipSubtleIdle
      : active
      ? styles.chipDefaultActive
      : emphasized
      ? styles.chipDefaultEmphasized
      : styles.chipDefaultIdle;

  return (
    <button
      type="button"
      onClick={onClick}
      className={base + " " + className}
      style={variantStyle}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = getHoverBackground();
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, variantStyle);
      }}
    >
      {children}
    </button>
  );
}

function StatBox({ label, value, styles }) {
  if (!normalizeText(value)) return null;

  return (
    <div style={styles.statBox}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function AreaBadgeList({ area, styles, initialLimit = 4 }) {
  const [expanded, setExpanded] = useState(false);

  const cells = parseAreaList(area)
    .map((cell) => String(cell ?? "").trim().toUpperCase())
    .filter(Boolean);

  if (cells.length === 0) {
    return (
      <div className="rounded-2xl px-3 py-3" style={styles.areaWrap}>
        <div className="text-sm" style={styles.areaEmpty}>
          エリア情報なし
        </div>
      </div>
    );
  }

  const visibleCells = expanded ? cells : cells.slice(0, initialLimit);
  const hiddenCount = Math.max(0, cells.length - visibleCells.length);

  return (
    <div className="rounded-2xl px-3 py-3" style={styles.areaWrap}>
      <div className="mb-2 text-xs font-semibold" style={styles.areaTitle}>
        生息エリア
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleCells.map((cell, index) => (
          <span
            key={`${cell}-${index}`}
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={styles.areaBadge}
          >
            {cell}
          </span>
        ))}

        {hiddenCount > 0 && !expanded ? (
          <button
            type="button"
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={styles.areaMoreButton}
            onClick={() => setExpanded(true)}
          >
            すべて見る
          </button>
        ) : null}

        {expanded && cells.length > initialLimit ? (
          <button
            type="button"
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={styles.areaMoreButton}
            onClick={() => setExpanded(false)}
          >
            閉じる
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SearchableMapSelect({
  disabled = false,
  value = "",
  onChange,
  options = [],
  placeholder = "地名を検索",
  styles,
}) {
  const rootRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((option) => String(option.id) === String(value)) ?? null;
  }, [options, value]);

  useEffect(() => {
    setInputValue(selectedOption?.name ?? "");
  }, [selectedOption]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const keyword = normalizeKana(inputValue);
    const base = [...options].sort((a, b) => sortJa(a.name, b.name));

    if (!keyword) return base.slice(0, 30);

    return base
      .filter((option) => normalizeKana(option.name).includes(keyword))
      .slice(0, 30);
  }, [options, inputValue]);

  function handleSelect(option) {
    onChange?.(String(option.id));
    setInputValue(option.name);
    setOpen(false);
  }

  function handleInputChange(next) {
    setInputValue(next);
    setOpen(true);

    const exact = options.find(
      (option) => normalizeText(option.name) === normalizeText(next)
    );

    if (!next.trim()) {
      onChange?.("");
      return;
    }

    if (!exact) onChange?.("");
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl px-3 py-2 text-base outline-none md:text-sm"
        style={{
          ...styles.textInput,
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filteredOptions.length > 0) {
            e.preventDefault();
            handleSelect(filteredOptions[0]);
          }
        }}
      />

      {open && !disabled ? (
        <div
          className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl p-2"
          style={styles.dropdownPanel}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={styles.dropdownEmpty}>
              候補なし
            </div>
          ) : (
            filteredOptions.map((option) => {
              const active = String(option.id) === String(value);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition"
                  style={active ? styles.dropdownItemActive : styles.dropdownItemIdle}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = getHoverBackground();
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(
                      e.currentTarget.style,
                      active ? styles.dropdownItemActive : styles.dropdownItemIdle
                    );
                  }}
                >
                  <span>{option.name}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function MonsterSpawnCard({
  spawn,
  monster,
  emphasized = false,
  styles,
  mobile = false,
}) {
  const cardStyle = mobile ? styles.spawnCardMobile : styles.spawnCardDesktop;

  return (
    <article className="overflow-hidden rounded-2xl" style={cardStyle}>
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold" style={styles.monsterName}>
              <span style={styles.monsterNameLine}>
                {monster?.name || "不明なモンスター"}
              </span>
            </h3>

            {monster?.system_type ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={emphasized ? styles.badgeSystemActive : styles.badgeSystemIdle}
              >
                {monster.system_type}
              </span>
            ) : null}

            {monster?.is_reincarnated ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={styles.badgeReincarnated}
              >
                転生
              </span>
            ) : null}
          </div>
        </div>

        {monster?.id ? (
          <Link
            href={`/tools/monster-search/${monster.id}?from=zukan`}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition"
            style={styles.detailLink}
          >
            詳細
          </Link>
        ) : null}
      </div>

      <div className="px-4">
        <div style={styles.statGrid}>
          <StatBox label="出現数" value={spawn?.spawn_count} styles={styles} />
          <StatBox label="シンボル数" value={spawn?.symbol_count} styles={styles} />
          <StatBox label="時間帯" value={spawn?.spawn_time} styles={styles} />
        </div>
      </div>

      <div className="px-4 pt-3">
        <StatBox label="メモ" value={spawn?.note} styles={styles} />
      </div>

      <div className="px-4 pb-4 pt-3">
        <AreaBadgeList area={spawn?.area} styles={styles} />
      </div>
    </article>
  );
}

function MonsterSpawnCarousel({
  spawns,
  monstersById,
  selectedSystemType,
  styles,
  mobile = false,
}) {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateScrollState() {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      const currentLeft = el.scrollLeft;

      setCanScrollLeft(currentLeft > 4);
      setCanScrollRight(currentLeft < maxScrollLeft - 4);
    }

    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [spawns, mobile]);

  if (!spawns.length) return null;

  const showSwipeHint = spawns.length > 1;

  let HintIcon = MdOutlineSwipe;
  

  if (canScrollLeft && canScrollRight) {
    HintIcon = MdOutlineSwipe;
  } else if (canScrollRight) {
    HintIcon = MdOutlineSwipeRight;
  } else if (canScrollLeft) {
    HintIcon = MdOutlineSwipeLeft;
  }

  const scroller = (
    <div
      ref={scrollerRef}
      style={mobile ? styles.cardsMobileScroller : styles.cardsDesktopScroller}
      className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {spawns.map((spawn, index) => {
        const monster = monstersById[spawn.monster_id];
        const emphasized =
          normalizeText(selectedSystemType) &&
          normalizeText(monster?.system_type) === normalizeText(selectedSystemType);

        return (
          <MonsterSpawnCard
            key={spawn.__key || `${spawn.monster_id}-${index}`}
            spawn={spawn}
            monster={monster}
            emphasized={Boolean(emphasized)}
            styles={styles}
            mobile={mobile}
          />
        );
      })}
    </div>
  );

  const hint = showSwipeHint ? (
    <div style={styles.swipeHintWrap}>
      <div style={styles.swipeHint}>
        <span style={styles.swipeHintIcon}>
          <HintIcon />
        </span>
      </div>
    </div>
  ) : null;

  if (mobile) {
    return (
      <div style={styles.cardsMobileScrollerOuter}>
        {hint}
        {scroller}
      </div>
    );
  }

  return (
    <div style={styles.cardsDesktopScrollerWrap}>
      {hint}
      {scroller}
    </div>
  );
}
function MapWithCards({
  layer,
  spawns,
  monstersById,
  selectedSystemType,
  styles,
  isMobile,
}) {
  if (isMobile) {
    return (
      <div className="grid gap-4">
        <div style={styles.mapMobileBox}>
          <MonsterMapOverlay
            imagePath={layer?.image_path || layer?.image_url || ""}
            spawns={spawns}
            monstersById={monstersById}
            showMonsterNameInBubble
          />
        </div>

        <MonsterSpawnCarousel
          spawns={spawns}
          monstersById={monstersById}
          selectedSystemType={selectedSystemType}
          styles={styles}
          mobile
        />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", ...styles.mapAndCardsDesktop }}>
      <div style={styles.mapDesktopBox}>
        <MonsterMapOverlay
          imagePath={layer?.image_path || layer?.image_url || ""}
          spawns={spawns}
          monstersById={monstersById}
          showMonsterNameInBubble
        />
      </div>

      <MonsterSpawnCarousel
        spawns={spawns}
        monstersById={monstersById}
        selectedSystemType={selectedSystemType}
        styles={styles}
      />
    </div>
  );
}

function LayerSection({
  layer,
  spawns,
  monstersById,
  selectedMonsterId,
  selectedSystemType,
  relatedSelectedMonsterIds,
  styles,
  isMobile,
}) {
  const filteredLayerSpawns = useMemo(() => {
    return spawns.filter((spawn) => {
      const monster = monstersById[spawn.monster_id];

      if (
        selectedMonsterId &&
        !relatedSelectedMonsterIds.has(Number(spawn.monster_id))
      ) {
        return false;
      }

      if (
        selectedSystemType &&
        normalizeText(monster?.system_type) !== normalizeText(selectedSystemType)
      ) {
        return false;
      }

      return true;
    });
  }, [
    spawns,
    monstersById,
    selectedMonsterId,
    selectedSystemType,
    relatedSelectedMonsterIds,
  ]);

  if (filteredLayerSpawns.length === 0) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl"
      style={{
        ...styles.card,
        height: isMobile ? "auto" : "100%",
        display: isMobile ? "block" : "flex",
        flexDirection: isMobile ? undefined : "column",
      }}
    >
      <div className="px-4 py-3" style={styles.cardHeader}>
        <div className="text-sm font-semibold" style={styles.cardHeaderTitle}>
          {layer?.layer_name || `階層 ${layer?.floor_no ?? ""}`}
        </div>
      </div>

      <div
        className="p-4"
        style={{
          flex: isMobile ? undefined : 1,
          display: isMobile ? "block" : "flex",
          alignItems: isMobile ? undefined : "center",
        }}
      >
        <MapWithCards
          layer={layer}
          spawns={filteredLayerSpawns}
          monstersById={monstersById}
          selectedSystemType={selectedSystemType}
          styles={styles}
          isMobile={isMobile}
        />
      </div>
    </section>
  );
}

function LayerCarousel({
  sections,
  monstersById,
  selectedSystemType,
  styles,
  isMobile,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [sections]);

  if (sections.length === 0) return null;

  const current = sections[activeIndex] ?? null;
  if (!current) return null;

  if (isMobile) {
    return (
      <section className="overflow-hidden rounded-2xl" style={styles.card}>
        <div className="px-4 py-3" style={styles.cardHeader}>
          <div style={styles.mobileLayerHeader}>
            <div className="text-xs" style={styles.cardHeaderSub}>
              {activeIndex + 1} / {sections.length}
            </div>

            <div
              style={styles.mobileLayerTabs}
              className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {sections.map((section, index) => {
                const active = index === activeIndex;

                return (
                  <button
                    key={section.layer.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-sm transition"
                    style={active ? styles.layerTabActive : styles.layerTabIdle}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = getHoverBackground();
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(
                        e.currentTarget.style,
                        active ? styles.layerTabActive : styles.layerTabIdle
                      );
                    }}
                  >
                    {section.layer.layer_name || `階層 ${section.layer.floor_no}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4">
          <MapWithCards
            layer={current.layer}
            spawns={current.spawns}
            monstersById={monstersById}
            selectedSystemType={selectedSystemType}
            styles={styles}
            isMobile
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl"
      style={{
        ...styles.card,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="px-4 py-3" style={styles.cardHeader}>
        <div className="mt-4 flex flex-wrap gap-2">
          {sections.map((section, index) => {
            const active = index === activeIndex;

            return (
              <button
                key={section.layer.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="rounded-full px-3 py-1.5 text-sm transition"
                style={active ? styles.layerTabActive : styles.layerTabIdle}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = getHoverBackground();
                }}
                onMouseLeave={(e) => {
                  Object.assign(
                    e.currentTarget.style,
                    active ? styles.layerTabActive : styles.layerTabIdle
                  );
                }}
              >
                {section.layer.layer_name || `階層 ${section.layer.floor_no}`}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="p-4"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <MapWithCards
          layer={current.layer}
          spawns={current.spawns}
          monstersById={monstersById}
          selectedSystemType={selectedSystemType}
          styles={styles}
          isMobile={false}
        />
      </div>
    </section>
  );
}

export default function MapMonsterBrowserClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [maps, setMaps] = useState([]);
  const [continents, setContinents] = useState([]);
  const [allSpawns, setAllSpawns] = useState([]);
  const [monsterMaster, setMonsterMaster] = useState({});

  const [selectedContinent, setSelectedContinent] = useState("");
  const [selectedMapId, setSelectedMapId] = useState("");
  const [selectedLayerId, setSelectedLayerId] = useState("all");
  const [selectedMonsterId, setSelectedMonsterId] = useState("");
  const [selectedSystemType, setSelectedSystemType] = useState("");

  const isMobile = useIsMobile();

  const styles = useMemo(
    () => ({
      ...getMonsterMapOverlayStyles(),
      ...getMapMonsterBrowserStyles(),
    }),
    []
  );

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      setLoading(true);
      setError("");

      try {
        const [mapOptions, mapRows, spawnRows] = await Promise.all([
          fetchMapOptions(),
          fetchMaps(),
          fetchMonsterMapSpawns(),
        ]);

        if (ignore) return;

        const nextContinents = Array.isArray(mapOptions?.continents)
          ? mapOptions.continents.filter(Boolean).sort(sortJa)
          : [];

        const nextMaps = Array.isArray(mapRows)
          ? mapRows.filter((row) => isBrowsableMapType(row?.map_type))
          : [];

        setMaps(nextMaps);
        setAllSpawns(Array.isArray(spawnRows) ? spawnRows : []);
        setContinents(
          nextContinents.length > 0
            ? [...nextContinents].sort(sortJa)
            : uniqBy(
                nextMaps.filter((row) => row?.continent),
                (row) => row.continent
              )
                .map((row) => row.continent)
                .sort(sortJa)
        );
      } catch (err) {
        console.error(err);
        if (!ignore) setError(err?.message || "データ取得に失敗");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      ignore = true;
    };
  }, []);

  const mapsInContinent = useMemo(() => {
    const rows = selectedContinent
      ? maps.filter(
          (row) =>
            normalizeText(row.continent) === normalizeText(selectedContinent)
        )
      : [];

    return [...rows].sort((a, b) => sortJa(a.name, b.name));
  }, [maps, selectedContinent]);

  const selectedMap = useMemo(() => {
    return maps.find((row) => Number(row.id) === Number(selectedMapId)) ?? null;
  }, [maps, selectedMapId]);

  const mapLayers = useMemo(() => {
    return Array.isArray(selectedMap?.layers) ? selectedMap.layers : [];
  }, [selectedMap]);

  const spawnsForSelectedMap = useMemo(() => {
    if (!selectedMapId) return [];
    return allSpawns.filter((row) => Number(row.map_id) === Number(selectedMapId));
  }, [allSpawns, selectedMapId]);

  useEffect(() => {
    if (!selectedMapId) return;

    const ids = Array.from(
      new Set(spawnsForSelectedMap.map((row) => row.monster_id).filter(Boolean))
    );

    const missingIds = ids.filter((id) => !monsterMaster[id]);
    if (missingIds.length === 0) return;

    let ignore = false;

    async function fillMonsterDetails() {
      try {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            try {
              return await fetchMonsterDetail(id);
            } catch (error) {
              console.error(error);
              return null;
            }
          })
        );

        if (ignore) return;

        setMonsterMaster((prev) => {
          const next = { ...prev };
          for (const row of results) {
            if (row?.id) next[row.id] = row;
          }
          return next;
        });
      } catch (error) {
        console.error(error);
      }
    }

    fillMonsterDetails();
    return () => {
      ignore = true;
    };
  }, [selectedMapId, spawnsForSelectedMap, monsterMaster]);

  const candidateSpawns = useMemo(() => {
    if (!selectedMapId) return [];
    if (selectedLayerId === "all") return spawnsForSelectedMap;

    return spawnsForSelectedMap.filter(
      (spawn) => Number(spawn.map_layer_id) === Number(selectedLayerId)
    );
  }, [selectedMapId, spawnsForSelectedMap, selectedLayerId]);

  const monstersOnCurrentScope = useMemo(() => {
    const rows = candidateSpawns
      .map((spawn) => monsterMaster[spawn.monster_id])
      .filter(Boolean);

    return uniqBy(rows, (row) => row.id).sort((a, b) => {
      const aOrder = Number(a?.display_order ?? 999999);
      const bOrder = Number(b?.display_order ?? 999999);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return sortJa(a?.name, b?.name);
    });
  }, [candidateSpawns, monsterMaster]);

  const relatedSelectedMonsterIds = useMemo(() => {
    if (!selectedMonsterId) return new Set();
    return getRelatedMonsterIds(selectedMonsterId, monsterMaster);
  }, [selectedMonsterId, monsterMaster]);

  const systemTypesOnCurrentScope = useMemo(() => {
    return Array.from(
      new Set(
        monstersOnCurrentScope
          .map((row) => normalizeText(row.system_type))
          .filter(Boolean)
      )
    ).sort((a, b) => sortJa(a, b));
  }, [monstersOnCurrentScope]);

  const filteredSpawns = useMemo(() => {
    return candidateSpawns.filter((spawn) => {
      const monster = monsterMaster[spawn.monster_id];

      if (
        selectedMonsterId &&
        !relatedSelectedMonsterIds.has(Number(spawn.monster_id))
      ) {
        return false;
      }

      if (
        selectedSystemType &&
        normalizeText(monster?.system_type) !== normalizeText(selectedSystemType)
      ) {
        return false;
      }

      return true;
    });
  }, [
    candidateSpawns,
    monsterMaster,
    selectedMonsterId,
    selectedSystemType,
    relatedSelectedMonsterIds,
  ]);

  const layerSections = useMemo(() => {
    if (!selectedMap) return [];

    if (selectedLayerId !== "all") {
      const layer = mapLayers.find(
        (row) => Number(row.id) === Number(selectedLayerId)
      );
      if (!layer) return [];

      return filteredSpawns.length > 0 ? [{ layer, spawns: filteredSpawns }] : [];
    }

    if (mapLayers.length === 0) {
      return filteredSpawns.length > 0
        ? [
            {
              layer: {
                id: "no-layer",
                layer_name: "階層未設定",
                floor_no: "-",
                image_path: "",
                image_url: "",
              },
              spawns: filteredSpawns,
            },
          ]
        : [];
    }

    return mapLayers
      .map((layer) => {
        const layerSpawns = filteredSpawns.filter(
          (spawn) => Number(spawn.map_layer_id) === Number(layer.id)
        );

        return {
          layer,
          spawns: layerSpawns.map((spawn, index) => ({
            ...spawn,
            __key: `${layer.id}-${spawn.monster_id}-${index}`,
          })),
        };
      })
      .filter((section) => section.spawns.length > 0);
  }, [selectedMap, mapLayers, selectedLayerId, filteredSpawns]);

  const hasUnlayeredSpawns = useMemo(() => {
    if (selectedLayerId !== "all") return false;
    return filteredSpawns.some((spawn) => !spawn.map_layer_id);
  }, [filteredSpawns, selectedLayerId]);

  const unlayeredSpawns = useMemo(() => {
    return filteredSpawns
      .map((spawn, index) => ({
        ...spawn,
        __key: `unlayered-${spawn.monster_id}-${index}`,
      }))
      .filter((spawn) => !spawn.map_layer_id);
  }, [filteredSpawns]);

  useEffect(() => {
    if (!selectedMonsterId) return;

    const exists = candidateSpawns.some(
      (spawn) =>
        relatedSelectedMonsterIds.has(Number(spawn.monster_id)) ||
        Number(spawn.monster_id) === Number(selectedMonsterId)
    );

    if (!exists) setSelectedMonsterId("");
  }, [candidateSpawns, selectedMonsterId, relatedSelectedMonsterIds]);

  useEffect(() => {
    if (!selectedSystemType) return;

    const exists = systemTypesOnCurrentScope.some(
      (systemType) =>
        normalizeText(systemType) === normalizeText(selectedSystemType)
    );

    if (!exists) setSelectedSystemType("");
  }, [systemTypesOnCurrentScope, selectedSystemType]);

  function handleContinentChange(value) {
    setSelectedContinent(value);
    setSelectedMapId("");
    setSelectedLayerId("all");
    setSelectedMonsterId("");
    setSelectedSystemType("");
  }

  function handleMapChange(value) {
    setSelectedMapId(value);
    setSelectedLayerId("all");
    setSelectedMonsterId("");
    setSelectedSystemType("");
  }

  function handleMonsterToggle(monsterId) {
    if (Number(selectedMonsterId) === Number(monsterId)) {
      setSelectedMonsterId("");
      return;
    }

    setSelectedMonsterId(monsterId);
    setSelectedSystemType("");
  }

  function handleSystemTypeToggle(systemType) {
    if (normalizeText(selectedSystemType) === normalizeText(systemType)) {
      setSelectedSystemType("");
      return;
    }

    setSelectedSystemType(systemType);
    setSelectedMonsterId("");
  }

  const shouldUseCarousel =
    selectedLayerId === "all" && layerSections.length > 1;

  return (
    <main style={styles.page}>
      <PageHeroTitle
        kicker="DQX MAP DATABASE"
        title="マップ別モンスター検索"
      />

      <div
        className="grid gap-4 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-4"
        style={styles.filterPanel}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium" style={styles.labelText}>
            大陸
          </span>
          <select
            value={loading ? "" : selectedContinent}
            onChange={(e) => handleContinentChange(e.target.value)}
            className="rounded-xl px-3 py-2 text-base outline-none md:text-sm"
            style={{
              ...styles.selectInput,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            disabled={loading}
          >
            <option value="">
              {loading ? "大陸データを読み込んでいます..." : "大陸を選択"}
            </option>

            {!loading &&
              continents.map((continent) => (
                <option key={continent} value={continent}>
                  {continent}
                </option>
              ))}
          </select>
        </label>

        <div className="flex flex-col gap-2 xl:col-span-2">
          <span className="text-sm font-medium" style={styles.labelText}>
            地名検索
          </span>
          <SearchableMapSelect
            disabled={!selectedContinent}
            value={selectedMapId}
            onChange={handleMapChange}
            options={mapsInContinent}
            placeholder={selectedContinent ? "地名を入力" : "大陸を選択して下さい"}
            styles={styles}
          />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium" style={styles.labelText}>
            表示階層
          </span>
          <select
            value={selectedLayerId}
            onChange={(e) => {
              setSelectedLayerId(e.target.value);
              setSelectedMonsterId("");
              setSelectedSystemType("");
            }}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={styles.selectInput}
            disabled={!selectedMap}
          >
            <option value="all">すべて</option>
            {mapLayers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.layer_name || `階層 ${layer.floor_no}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <>
          <div className="mt-6 rounded-2xl p-4 text-sm" style={styles.loadingBox}>
            大陸データを読み込んでいます...
          </div>
          <MapMonsterBrowserSkeleton />
        </>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl p-4 text-sm" style={styles.errorBox}>
          {error}
        </div>
      ) : null}

      {!loading && !error && selectedMap ? (
        <div
          className="mt-6 grid gap-6 md:grid-cols-[350px_minmax(0,1fr)] lg:grid-cols-[370px_minmax(0,1fr)] xl:grid-cols-[370px_minmax(0,1fr)]"
          style={!isMobile ? styles.pageColumnsDesktop : undefined}
        >
          <aside className="md:sticky md:top-4 md:self-stretch">
            <div className="rounded-2xl p-4" style={styles.asideCard}>
              <div>
                <div className="text-sm" style={styles.continentText}>
                  {selectedMap.continent}
                </div>
                <h2 className="text-xl font-bold" style={styles.mapTitle}>
                  {selectedMap.name}
                </h2>
              </div>

              <div className="mt-3 text-sm" style={styles.countText}>
                モンスター数: {monstersOnCurrentScope.length} / 出現データ数:{" "}
                {candidateSpawns.length}
              </div>

              <div className="mt-5">
                <div className="mb-2 text-sm font-medium" style={styles.sectionTitle}>
                  モンスターで絞り込み
                </div>

                <div
                  className="grid max-h-[420px] gap-2 overflow-y-auto"
                  style={{
                    width: "100%",
                    gridTemplateColumns: "minmax(0, 1fr)",
                  }}
                >
                  <MonsterChip
                    active={!selectedMonsterId}
                    onClick={() => setSelectedMonsterId("")}
                    className="col-span-2 justify-self-start"
                    styles={styles}
                  >
                    すべて
                  </MonsterChip>

                  {monstersOnCurrentScope.map((monster) => {
                    const emphasized =
                      normalizeText(selectedSystemType) &&
                      normalizeText(monster?.system_type) ===
                        normalizeText(selectedSystemType);

                    return (
                      <MonsterChip
                        key={monster.id}
                        active={relatedSelectedMonsterIds.has(Number(monster.id))}
                        emphasized={Boolean(emphasized)}
                        onClick={() => handleMonsterToggle(monster.id)}
                        className="w-full text-left text-sm"
                        styles={styles}
                      >
                        <span className="flex min-w-0 items-start justify-start gap-1">
                          <span className="min-w-0 whitespace-normal break-words text-left leading-5">
                            {monster.name}
                          </span>

                          {monster?.is_reincarnated ? (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                              style={styles.reincarnationMiniBadge}
                            >
                              転
                            </span>
                          ) : null}
                        </span>
                      </MonsterChip>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-sm font-medium" style={styles.sectionTitle}>
                  系統で絞り込み
                </div>

                <div className="flex flex-wrap gap-2">
                  <MonsterChip
                    variant="subtle"
                    active={!selectedSystemType}
                    onClick={() => setSelectedSystemType("")}
                    styles={styles}
                  >
                    すべて
                  </MonsterChip>

                  {systemTypesOnCurrentScope.map((systemType) => (
                    <MonsterChip
                      key={systemType}
                      variant="subtle"
                      active={
                        normalizeText(selectedSystemType) ===
                        normalizeText(systemType)
                      }
                      onClick={() => handleSystemTypeToggle(systemType)}
                      styles={styles}
                    >
                      {systemType}
                    </MonsterChip>
                  ))}
                </div>

                {selectedSystemType ? (
                  <div className="mt-3 text-xs" style={styles.selectedSystemText}>
                    「{selectedSystemType}」に属するモンスターを強調表示中
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <div className="min-w-0" style={!isMobile ? styles.rightColumnDesktop : undefined}>
            <div className="grid gap-6 h-full">
              {layerSections.length === 0 ? (
                <div className="rounded-2xl p-6 text-sm" style={styles.emptyDashed}>
                  この条件に一致するモンスターはいない
                </div>
              ) : shouldUseCarousel ? (
                <LayerCarousel
                  sections={layerSections}
                  monstersById={monsterMaster}
                  selectedSystemType={selectedSystemType}
                  styles={styles}
                  isMobile={isMobile}
                />
              ) : (
                layerSections.map((section) => (
                  <LayerSection
                    key={section.layer.id}
                    layer={section.layer}
                    spawns={section.spawns}
                    monstersById={monsterMaster}
                    selectedMonsterId={selectedMonsterId}
                    selectedSystemType={selectedSystemType}
                    relatedSelectedMonsterIds={relatedSelectedMonsterIds}
                    styles={styles}
                    isMobile={isMobile}
                  />
                ))
              )}

              {hasUnlayeredSpawns ? (
                <section className="overflow-hidden rounded-2xl" style={styles.card}>
                  <div className="px-4 py-3" style={styles.cardHeader}>
                    <div className="text-sm font-semibold" style={styles.cardHeaderTitle}>
                      階層未設定
                    </div>
                  </div>

                  <div className="p-4">
                    <MonsterSpawnCarousel
                      spawns={unlayeredSpawns}
                      monstersById={monsterMaster}
                      selectedSystemType={selectedSystemType}
                      styles={styles}
                      mobile={isMobile}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && selectedContinent && !selectedMap ? (
        <div className="mt-6 rounded-2xl p-6 text-sm" style={styles.emptyDashed}>
          地名を入力すると候補が出ます
        </div>
      ) : null}

      {!loading && !error && !selectedContinent ? (
        <div className="mt-6 rounded-2xl p-6 text-sm" style={styles.emptyDashed}>
          大陸を選択して下さい
        </div>
      ) : null}
    </main>
  );
}