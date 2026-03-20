"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMaps, fetchMapOptions } from "@/lib/maps";
import { fetchMonsterMapSpawns } from "@/lib/monsterMapSpawns";
import { fetchMonsterDetail } from "@/lib/monsters";
import MonsterMapOverlay from "./MonsterMapOverlay";
import PageHeroTitle from "@/components/PageHeroTitle";
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

function getStyles() {
  return {
    page: {
      background: "var(--page-bg)",
      color: "var(--page-text)",
    },
    pageTitle: {
      color: "var(--text-title)",
    },
    pageSubText: {
      color: "var(--text-muted)",
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
    cardFooter: {
      borderTop: "1px solid var(--card-border)",
    },

    infoRow: {
      border: "1px solid var(--card-border)",
      background: "var(--soft-bg)",
    },
    infoRowLabel: {
      color: "var(--text-muted)",
    },
    infoRowValue: {
      color: "var(--text-main)",
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

    spawnCard: {
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
    },
    monsterName: {
      color: "var(--text-title)",
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
  };
}

function getHoverBackground() {
  return "var(--hover-bg)";
}

function getInputFocusBorder() {
  return "var(--selected-border)";
}

function MonsterChip({
  active = false,
  onClick,
  children,
  variant = "default",
  emphasized = false,
  className = "",
  styles
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
        if (!active) {
          e.currentTarget.style.background = getHoverBackground();
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, variantStyle);
      }}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value, styles }) {
  if (!normalizeText(value)) return null;

  return (
    <div
      className="flex items-start justify-between gap-3 rounded-xl px-3 py-2"
      style={styles.infoRow}
    >
      <div className="text-xs font-semibold" style={styles.infoRowLabel}>
        {label}
      </div>
      <div className="text-right text-sm" style={styles.infoRowValue}>
        {value}
      </div>
    </div>
  );
}

function AreaBadgeList({ area, styles }) {
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

  return (
    <div className="rounded-2xl px-3 py-3" style={styles.areaWrap}>
      <div className="mb-2 text-xs font-semibold" style={styles.areaTitle}>
        生息エリア
      </div>
      <div className="flex flex-wrap gap-2">
        {cells.map((cell, index) => (
          <span
            key={`${cell}-${index}`}
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={styles.areaBadge}
          >
            {cell}
          </span>
        ))}
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
  styles
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
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const keyword = normalizeKana(inputValue);
    const base = [...options].sort((a, b) => sortJa(a.name, b.name));

    if (!keyword) {
      return base.slice(0, 30);
    }

    return base
      .filter((option) => {
        const normalizedName = normalizeKana(option.name);
        return normalizedName.includes(keyword);
      })
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

    if (!exact) {
      onChange?.("");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => handleInputChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-sm outline-none ring-0 transition"
        style={{
          ...styles.textInput,
          opacity: disabled ? 0.7 : 1,
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = getInputFocusBorder();
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--input-border)";
        }}
      />

      {open && !disabled ? (
        <div
          className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl p-2"
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
                  className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition"
                  style={active ? styles.dropdownItemActive : styles.dropdownItemIdle}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = getHoverBackground();
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {option.name}
                    </div>
                  </div>
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
  selectedSystemType,
  styles
}) {
  const systemTypeIsActive =
    normalizeText(selectedSystemType) &&
    normalizeText(monster?.system_type) === normalizeText(selectedSystemType);

  return (
    <article className="h-full min-w-0 rounded-2xl p-4" style={styles.spawnCard}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-semibold" style={styles.monsterName}>
          {monster?.name || `monster_id: ${spawn.monster_id}`}
        </div>

        {monster?.system_type ? (
          <span
            className="rounded-full px-2 py-1 text-xs"
            style={
              systemTypeIsActive
                ? styles.badgeSystemActive
                : styles.badgeSystemIdle
            }
          >
            {monster.system_type}
          </span>
        ) : null}

        {monster?.is_reincarnated ? (
          <span
            className="rounded-full px-2 py-1 text-xs"
            style={styles.badgeReincarnated}
          >
            転生
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <AreaBadgeList area={spawn.area} styles={styles} />
      </div>

      <div className="mt-3 grid gap-2">
        <InfoRow label="出現時間" value={spawn.spawn_time} styles={styles} />
        <InfoRow label="出現数" value={spawn.spawn_count} styles={styles} />
        <InfoRow label="シンボル数" value={spawn.symbol_count} styles={styles} />
      </div>

      <div className="mt-4">
        <Link
          href={`/tools/monster-search/${spawn.monster_id}?from=zukan`}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition"
          style={styles.detailLink}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = getHoverBackground();
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.detailLink);
          }}
        >
          モンスター詳細を見る
        </Link>
      </div>
    </article>
  );
}

function MonsterSpawnCarousel({
  spawns,
  monstersById,
  selectedSystemType,
  styles
}) {
  if (spawns.length === 0) {
    return (
      <div className="rounded-xl p-4 text-sm" style={styles.emptyDashed}>
        この階層に一致するモンスターはいない
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[4%] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {spawns.map((spawn) => {
            const monster = monstersById[spawn.monster_id];

            return (
              <div key={spawn.__key} className="w-[92%] shrink-0 snap-center">
                <MonsterSpawnCard
                  spawn={spawn}
                  monster={monster}
                  selectedSystemType={selectedSystemType}
                  styles={styles}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden md:block lg:hidden">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[4%] pb-2 [scrollbar-width:thin]">
          {spawns.map((spawn) => {
            const monster = monstersById[spawn.monster_id];

            return (
              <div key={spawn.__key} className="w-[92%] min-w-[92%] shrink-0 snap-center">
                <MonsterSpawnCard
                  spawn={spawn}
                  monster={monster}
                  selectedSystemType={selectedSystemType}
                  styles={styles}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[2%] pb-2 [scrollbar-width:thin]">
          {spawns.map((spawn) => {
            const monster = monstersById[spawn.monster_id];

            return (
              <div
                key={spawn.__key}
                className="w-[46%] min-w-[46%] shrink-0 snap-start"
              >
                <MonsterSpawnCard
                  spawn={spawn}
                  monster={monster}
                  selectedSystemType={selectedSystemType}
                  styles={styles}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function LayerSection({
  layer,
  spawns,
  monstersById,
  selectedMonsterId,
  selectedSystemType,
  relatedSelectedMonsterIds,
  styles
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

  return (
    <section className="overflow-hidden rounded-2xl" style={styles.card}>
      <div className="px-4 py-3" style={styles.cardHeader}>
        <div className="text-sm font-semibold" style={styles.cardHeaderTitle}>
          {layer?.layer_name || `階層 ${layer?.floor_no ?? ""}`}
        </div>
        <div className="mt-1 text-xs" style={styles.cardHeaderSub}>
          floor_no: {layer?.floor_no ?? "-"} / 出現データ数:{" "}
          {filteredLayerSpawns.length}
        </div>
      </div>

      <div className="px-4 py-4">
        <MonsterMapOverlay
          imagePath={layer?.image_path || layer?.image_url || ""}
          spawns={filteredLayerSpawns}
          size="sm"
          monstersById={monstersById}
        />
      </div>

      <div className="p-4" style={styles.cardFooter}>
        <MonsterSpawnCarousel
          spawns={filteredLayerSpawns}
          monstersById={monstersById}
          selectedSystemType={selectedSystemType}
          styles={styles}
        />
      </div>
    </section>
  );
}

function LayerCarousel({
  sections,
  monstersById,
  selectedSystemType,
  styles
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mobileScrollRef = useRef(null);
  const mobileSlideRefs = useRef([]);

  useEffect(() => {
    setActiveIndex(0);
  }, [sections]);

  useEffect(() => {
    mobileSlideRefs.current = mobileSlideRefs.current.slice(0, sections.length);
  }, [sections.length]);

  useEffect(() => {
    const container = mobileScrollRef.current;
    const target = mobileSlideRefs.current[activeIndex];

    if (!container || !target) return;

    target.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);

  function handleMobileScroll() {
    const container = mobileScrollRef.current;
    if (!container) return;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    mobileSlideRefs.current.forEach((node, index) => {
      if (!node) return;

      const slideCenter = node.offsetLeft + node.clientWidth / 2;
      const distance = Math.abs(slideCenter - containerCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
  }

  if (sections.length === 0) return null;

  const current = sections[activeIndex] ?? null;
  if (!current) return null;

  return (
    <>
      <section className="overflow-hidden rounded-2xl md:hidden" style={styles.card}>
        <div className="px-4 py-3" style={styles.cardHeader}>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={styles.cardHeaderSub}>
              {activeIndex + 1} / {sections.length}
            </div>
          </div>
        </div>

        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[7%] py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section, index) => (
            <div
              key={section.layer.id}
              ref={(node) => {
                mobileSlideRefs.current[index] = node;
              }}
              className="w-[86%] shrink-0 snap-center"
            >
              <div
                className="overflow-hidden rounded-2xl shadow-sm"
                style={styles.card}
              >
                <div className="px-4 py-3" style={styles.cardHeader}>
                  <div className="text-sm font-semibold" style={styles.cardHeaderTitle}>
                    {section.layer.layer_name || `階層 ${section.layer.floor_no}`}
                  </div>
                  <div className="mt-1 text-xs" style={styles.cardHeaderSub}>
                    floor_no: {section.layer.floor_no ?? "-"} / 出現データ数:{" "}
                    {section.spawns.length}
                  </div>
                </div>

                <div className="px-4 py-4">
                  <MonsterMapOverlay
                    imagePath={
                      section.layer?.image_path || section.layer?.image_url || ""
                    }
                    spawns={section.spawns}
                    size="sm"
                    monstersById={monstersById}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-2xl md:block" style={styles.card}>
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
                    if (!active) {
                      e.currentTarget.style.background = getHoverBackground();
                    }
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

        <div className="px-4 py-4">
          <MonsterMapOverlay
            imagePath={current.layer?.image_path || current.layer?.image_url || ""}
            spawns={current.spawns}
            size="sm"
            monstersById={monstersById}
          />
        </div>

        <div className="p-4" style={styles.cardFooter}>
          <MonsterSpawnCarousel
            spawns={current.spawns}
            monstersById={monstersById}
            selectedSystemType={selectedSystemType}
            styles={styles}
          />
        </div>
      </section>
    </>
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

  const styles = useMemo(() => getStyles(), []);

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
        if (!ignore) {
          setError(err?.message || "データ取得に失敗");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
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
            if (row?.id) {
              next[row.id] = row;
            }
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

    if (selectedLayerId === "all") {
      return spawnsForSelectedMap;
    }

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

      return filteredSpawns.length > 0
        ? [
            {
              layer,
              spawns: filteredSpawns,
            },
          ]
        : [];
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
    return filteredSpawns.map((spawn, index) => ({
      ...spawn,
      __key: `unlayered-${spawn.monster_id}-${index}`,
    })).filter((spawn) => !spawn.map_layer_id);
  }, [filteredSpawns]);

  useEffect(() => {
    if (!selectedMonsterId) return;

    const exists = candidateSpawns.some(
      (spawn) =>
        relatedSelectedMonsterIds.has(Number(spawn.monster_id)) ||
        Number(spawn.monster_id) === Number(selectedMonsterId)
    );

    if (!exists) {
      setSelectedMonsterId("");
    }
  }, [candidateSpawns, selectedMonsterId, relatedSelectedMonsterIds]);

  useEffect(() => {
    if (!selectedSystemType) return;

    const exists = systemTypesOnCurrentScope.some(
      (systemType) =>
        normalizeText(systemType) === normalizeText(selectedSystemType)
    );

    if (!exists) {
      setSelectedSystemType("");
    }
  }, [systemTypesOnCurrentScope, selectedSystemType]);

  const MONSTER_GRID_GAP_PX = 8;
  const MONSTER_GRID_SIDE_PADDING_PX = 16;
  const MONSTER_GRID_MAX_WIDTH_PX = 420;

  const monsterGridLayout = useMemo(() => {
    const names = monstersOnCurrentScope.map((monster) => String(monster?.name ?? ""));
    const longestNameLength = names.reduce(
      (max, name) => Math.max(max, name.length),
      0
    );

    const hasReincarnated = monstersOnCurrentScope.some(
      (monster) => monster?.is_reincarnated
    );

    const estimatedNaturalWidth =
      longestNameLength * 14 + (hasReincarnated ? 28 : 0) + 32;

    const containerMaxWidth = MONSTER_GRID_MAX_WIDTH_PX;
    const maxColumnWidth = Math.floor(
      (containerMaxWidth - MONSTER_GRID_GAP_PX - MONSTER_GRID_SIDE_PADDING_PX) / 2
    );

    const columnWidth = Math.min(
      Math.max(estimatedNaturalWidth, 120),
      maxColumnWidth
    );

    let fontClass = "text-sm";
    if (estimatedNaturalWidth > maxColumnWidth) {
      fontClass = "text-[13px]";
    }
    if (estimatedNaturalWidth > maxColumnWidth + 20) {
      fontClass = "text-xs";
    }

    return {
      columnWidth,
      gridWidth: columnWidth * 2 + MONSTER_GRID_GAP_PX,
      fontClass,
    };
  }, [monstersOnCurrentScope]);

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
    <main
     
      style={styles.page}
    >
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
            value={selectedContinent}
            onChange={(e) => handleContinentChange(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={styles.selectInput}
          >
            <option value="">大陸を選択</option>
            {continents.map((continent) => (
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
        <div className="mt-6 rounded-2xl p-6 text-sm" style={styles.loadingBox}>
          データ読み込み中...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl p-4 text-sm" style={styles.errorBox}>
          {error}
        </div>
      ) : null}

      {!loading && !error && selectedMap ? (
        <div className="mt-6 grid gap-6 md:grid-cols-[380px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="md:sticky md:top-4 md:self-start">
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
                    maxWidth: `${monsterGridLayout.gridWidth}px`,
                    margin: "0 auto",
                    gridTemplateColumns: `repeat(2, minmax(0, ${monsterGridLayout.columnWidth}px))`,
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
                        className={`w-full text-center ${monsterGridLayout.fontClass}`}
                        styles={styles}
                            >
                        <span className="flex min-w-0 items-center justify-center gap-1">
                          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
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

          <div className="min-w-0">
            <div className="grid gap-6">
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