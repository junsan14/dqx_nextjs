"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMaps, fetchMapOptions } from "@/lib/maps";
import { fetchMonsterMapSpawns } from "@/lib/monsterMapSpawns";
import { fetchMonsterDetail } from "@/lib/monsters";
import MonsterMapOverlay from "./MonsterMapOverlay";

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

function MonsterChip({
  active = false,
  onClick,
  children,
  variant = "default",
  emphasized = false,
}) {
  const base =
    "rounded-full border px-3 py-1.5 text-sm transition whitespace-nowrap";

  const variants = {
    default: active
      ? "border-emerald-600 bg-emerald-600 text-white"
      : emphasized
      ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/70"
      : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
    subtle: active
      ? "border-sky-600 bg-sky-600 text-white"
      : emphasized
      ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/70"
      : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }) {
  if (!normalizeText(value)) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="text-right text-sm text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function AreaBadgeList({ area }) {
  const cells = parseAreaList(area)
    .map((cell) => String(cell ?? "").trim().toUpperCase())
    .filter(Boolean);

  if (cells.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-slate-50 px-3 py-3 dark:border-zinc-800 dark:bg-slate-950">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">エリア情報なし</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-slate-50 px-3 py-3 dark:border-zinc-800 dark:bg-slate-950">
      <div className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
        生息エリア
      </div>
      <div className="flex flex-wrap gap-2">
        {cells.map((cell, index) => (
          <span
            key={`${cell}-${index}`}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
    const keyword = inputValue.trim().toLowerCase();
    const base = [...options].sort((a, b) => sortJa(a.name, b.name));

    if (!keyword) {
      return base.slice(0, 30);
    }

    return base
      .filter((option) => {
        const name = String(option.name ?? "").toLowerCase();
        const mapType = String(option.map_type ?? "").toLowerCase();
        return name.includes(keyword) || mapType.includes(keyword);
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
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {open && !disabled ? (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
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
                  className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                    active
                      ? "bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {option.name}
                    </div>
                    <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {option.map_type || "map_typeなし"}
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

function LayerSection({
  layer,
  spawns,
  monstersById,
  selectedMonsterId,
  selectedSystemType,
}) {
  const filteredLayerSpawns = useMemo(() => {
    return spawns.filter((spawn) => {
      const monster = monstersById[spawn.monster_id];

      if (selectedMonsterId && Number(spawn.monster_id) !== Number(selectedMonsterId)) {
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
  }, [spawns, monstersById, selectedMonsterId, selectedSystemType]);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {layer?.layer_name || `階層 ${layer?.floor_no ?? ""}`}
        </div>
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          floor_no: {layer?.floor_no ?? "-"} / 出現データ数: {filteredLayerSpawns.length}
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

      <div className="grid gap-4 border-t border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-2">
        {filteredLayerSpawns.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            この階層に一致するモンスターはいない
          </div>
        ) : (
          filteredLayerSpawns.map((spawn) => {
            const monster = monstersById[spawn.monster_id];

            return (
              <article
                key={spawn.__key}
                className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {monster?.name || `monster_id: ${spawn.monster_id}`}
                  </div>

                  {monster?.system_type ? (
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        normalizeText(selectedSystemType) &&
                        normalizeText(monster?.system_type) === normalizeText(selectedSystemType)
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {monster.system_type}
                    </span>
                  ) : null}

                  {monster?.is_reincarnated ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      転生
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <AreaBadgeList area={spawn.area} />
                </div>

                <div className="mt-3 grid gap-2">
                  <InfoRow label="出現時間" value={spawn.spawn_time} />
                  <InfoRow label="出現数" value={spawn.spawn_count} />
                  <InfoRow label="シンボル数" value={spawn.symbol_count} />
                  <InfoRow label="メモ" value={spawn.note} />
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function LayerCarousel({ sections, monstersById }) {
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
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
           

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
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
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {section.layer.layer_name || `階層 ${section.layer.floor_no}`}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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

      <section className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">


          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map((section, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={section.layer.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  }`}
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
      ? maps.filter((row) => normalizeText(row.continent) === normalizeText(selectedContinent))
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

      if (selectedMonsterId && Number(spawn.monster_id) !== Number(selectedMonsterId)) {
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
  }, [candidateSpawns, monsterMaster, selectedMonsterId, selectedSystemType]);

  const layerSections = useMemo(() => {
    if (!selectedMap) return [];

    if (selectedLayerId !== "all") {
      const layer = mapLayers.find((row) => Number(row.id) === Number(selectedLayerId));
      if (!layer) return [];

      return [
        {
          layer,
          spawns: filteredSpawns,
        },
      ];
    }

    if (mapLayers.length === 0) {
      return [
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
      ];
    }

    return mapLayers.map((layer) => ({
      layer,
      spawns: filteredSpawns.filter(
        (spawn) => Number(spawn.map_layer_id) === Number(layer.id)
      ),
    }));
  }, [selectedMap, mapLayers, selectedLayerId, filteredSpawns]);

  const hasUnlayeredSpawns = useMemo(() => {
    if (selectedLayerId !== "all") return false;
    return filteredSpawns.some((spawn) => !spawn.map_layer_id);
  }, [filteredSpawns, selectedLayerId]);

  const unlayeredSpawns = useMemo(() => {
    return filteredSpawns.filter((spawn) => !spawn.map_layer_id);
  }, [filteredSpawns]);

  useEffect(() => {
    if (!selectedMonsterId) return;

    const exists = candidateSpawns.some(
      (spawn) => Number(spawn.monster_id) === Number(selectedMonsterId)
    );

    if (!exists) {
      setSelectedMonsterId("");
    }
  }, [candidateSpawns, selectedMonsterId]);

  useEffect(() => {
    if (!selectedSystemType) return;

    const exists = systemTypesOnCurrentScope.some(
      (systemType) => normalizeText(systemType) === normalizeText(selectedSystemType)
    );

    if (!exists) {
      setSelectedSystemType("");
    }
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          マップ別モンスター検索
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          大陸 → 地名検索 → モンスター名 or 系統 で絞り込みできる
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            大陸
          </span>
          <select
            value={selectedContinent}
            onChange={(e) => handleContinentChange(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            地名検索
          </span>
          <SearchableMapSelect
            disabled={!selectedContinent}
            value={selectedMapId}
            onChange={handleMapChange}
            options={mapsInContinent}
            placeholder={
              selectedContinent
                ? "フィールド / ダンジョン名を入力"
                : "先に大陸を選択"
            }
          />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            表示階層
          </span>
          <select
            value={selectedLayerId}
            onChange={(e) => {
              setSelectedLayerId(e.target.value);
              setSelectedMonsterId("");
              setSelectedSystemType("");
            }}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
        <div className="mt-6 rounded-2xl border border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          データ読み込み中...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error && selectedMap ? (
        <>
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedMap.continent}
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedMap.name}
                </h2>
             
              </div>

              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                モンスター数: {monstersOnCurrentScope.length} / 出現データ数:{" "}
                {candidateSpawns.length}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                モンスターで絞り込み
              </div>
              <div className="flex flex-wrap gap-2">
                <MonsterChip
                  active={!selectedMonsterId}
                  onClick={() => setSelectedMonsterId("")}
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
                      active={Number(selectedMonsterId) === Number(monster.id)}
                      emphasized={Boolean(emphasized)}
                      onClick={() => handleMonsterToggle(monster.id)}
                    >
                      {monster.name}
                    </MonsterChip>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                系統で絞り込み
              </div>
              <div className="flex flex-wrap gap-2">
                <MonsterChip
                  variant="subtle"
                  active={!selectedSystemType}
                  onClick={() => setSelectedSystemType("")}
                >
                  すべて
                </MonsterChip>

                {systemTypesOnCurrentScope.map((systemType) => (
                  <MonsterChip
                    key={systemType}
                    variant="subtle"
                    active={normalizeText(selectedSystemType) === normalizeText(systemType)}
                    onClick={() => handleSystemTypeToggle(systemType)}
                  >
                    {systemType}
                  </MonsterChip>
                ))}
              </div>

              {selectedSystemType ? (
                <div className="mt-3 text-xs text-sky-700 dark:text-sky-300">
                  「{selectedSystemType}」に属するモンスターを強調表示中
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6">
            {shouldUseCarousel ? (
              <LayerCarousel sections={layerSections} monstersById={monsterMaster} />
            ) : (
              layerSections.map((section) => (
                <LayerSection
                  key={section.layer.id}
                  layer={section.layer}
                  spawns={section.spawns}
                  monstersById={monsterMaster}
                  selectedMonsterId={selectedMonsterId}
                  selectedSystemType={selectedSystemType}
                />
              ))
            )}

            {hasUnlayeredSpawns ? (
              <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    階層未設定
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-2">
                  {unlayeredSpawns.map((spawn) => {
                    const monster = monsterMaster[spawn.monster_id];

                    return (
                      <article
                        key={spawn.__key}
                        className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {monster?.name || `monster_id: ${spawn.monster_id}`}
                          </div>

                          {monster?.system_type ? (
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                normalizeText(selectedSystemType) &&
                                normalizeText(monster?.system_type) ===
                                  normalizeText(selectedSystemType)
                                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              {monster.system_type}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3">
                          <AreaBadgeList area={spawn.area} />
                        </div>

                        <div className="mt-3 grid gap-2">
                          <InfoRow label="出現時間" value={spawn.spawn_time} />
                          <InfoRow label="出現数" value={spawn.spawn_count} />
                          <InfoRow label="シンボル数" value={spawn.symbol_count} />
                          <InfoRow label="メモ" value={spawn.note} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </>
      ) : null}

      {!loading && !error && selectedContinent && !selectedMap ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          フィールドかダンジョンの地名を入力すると候補が出る
        </div>
      ) : null}

      {!loading && !error && !selectedContinent ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          まず大陸を選択してくれ
        </div>
      ) : null}
    </div>
  );
}