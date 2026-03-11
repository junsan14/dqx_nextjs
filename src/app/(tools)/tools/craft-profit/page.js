"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { TOOLS_BY_CRAFT, TOOL_USES } from "@/app/data/tools";
import { clamp0, yen } from "@/lib/money";
import { getCrystalByEquipLevel } from "@/app/data/crystals";

const DEFAULT_FEE_RATE = 5;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "";

const WEAPON_TYPES = [
  "片手剣", "両手剣", "短剣", "ヤリ", "オノ", "ハンマー", "ツメ", "ムチ",
  "ブーメラン", "スティック", "両手杖", "棍", "扇", "弓", "鎌",
];

const CATEGORY_ORDER = {
  裁縫: 1,
  武器鍛冶: 2,
  防具鍛冶: 3,
  木工: 4,
};

const collator = new Intl.Collator("ja");

function safeJsonParse(value, fallback) {
  if (value == null || value === "") return fallback;
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getDisplaySlot(itemType, itemKind = "") {
  const v = String(itemType || "").trim();
  if (!v) return "その他";
  if (["鎧頭", "裁縫頭"].includes(v)) return "頭";
  if (["鎧上", "裁縫上"].includes(v)) return "体上";
  if (["鎧下", "裁縫下"].includes(v)) return "体下";
  if (["鎧腕", "裁縫腕"].includes(v)) return "腕";
  if (["鎧足", "裁縫足"].includes(v)) return "足";
  if (["盾", "小盾", "大盾"].includes(v)) return "盾";
  if (itemKind === "武器" || WEAPON_TYPES.includes(v)) return "武器";
  return "その他";
}

function normalizeMaterial(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    return {
      item_id: null,
      name: raw,
      qty: 0,
      defaultUnitCost: 0,
    };
  }

  const itemId =
    raw.item_id ??
    raw.itemId ??
    raw.id ??
    null;

  const name =
    raw.name ??
    raw.material_name ??
    raw.item_name ??
    raw.label ??
    "";

  if (!name && itemId == null) return null;

  const qty =
    Number(
      raw.qty ??
      raw.quantity ??
      raw.count ??
      raw.num ??
      0
    ) || 0;

  const defaultUnitCost =
    Number(
      raw.defaultUnitCost ??
      raw.default_unit_cost ??
      raw.unitCost ??
      raw.unit_cost ??
      raw.price ??
      0
    ) || 0;

  return {
    item_id: itemId == null || itemId === "" ? null : Number(itemId),
    name: name || "不明な素材",
    qty,
    defaultUnitCost,
  };
}

function normalizeEquipmentRow(row) {
  const materials = safeJsonParse(row?.materials_json, []);
  const slotGrid = safeJsonParse(row?.slot_grid_json, null);
  const jobs = safeJsonParse(row?.jobs_json, []);
  const effects = safeJsonParse(row?.effects_json, []);

  return {
    id: row?.item_id || row?.group_id || row?.item_name || "",
    name: row?.item_name || "",
    slot: row?.slot || getDisplaySlot(row?.item_type, row?.item_kind),
    itemType: row?.item_type || "",
    itemTypeKey: row?.item_type_key || "",
    itemKind: row?.item_kind || "",
    craftType: row?.craft_type || "",
    craftLevel: Number(row?.craft_level || 0) || null,
    equipLevel: Number(row?.equip_level || 0) || null,
    recipeBook: row?.recipe_book || "",
    recipePlace: row?.recipe_place || "",
    description: row?.description || "",
    materials: Array.isArray(materials)
      ? materials.map(normalizeMaterial).filter(Boolean)
      : [],
    slotGrid,
    slotGridCols: Number(row?.slot_grid_cols || 0) || null,
    slotGridType: row?.slot_grid_type || row?.item_type || "",
    jobs: Array.isArray(jobs) ? jobs : [],
    groupId: row?.group_id || row?.item_id || row?.item_name || "",
    groupName: row?.group_name || row?.item_name || "",
    groupKind: row?.group_kind || "",
    itemsCount: Number(row?.items_count || 0) || 0,
    equipableType: row?.equipable_type || "",
    crystalByAlchemy: row?.crystal_by_alchemy || "",
    sourceUrl: row?.source_url || "",
    detailUrl: row?.detail_url || "",
    effects: Array.isArray(effects) ? effects : [],
  };
}

function buildSetsFromEquipments(rows) {
  const normalized = (rows || []).map(normalizeEquipmentRow);
  const groups = new Map();
  const singles = [];
  const slotOrder = {
    頭: 1,
    体上: 2,
    体下: 3,
    腕: 4,
    足: 5,
    顔: 6,
    盾: 7,
    武器: 8,
    その他: 99,
  };

  for (const item of normalized) {
    const isGroup =
      String(item.groupKind || "").endsWith("_set") ||
      (item.itemsCount || 0) > 1;

    if (!isGroup) {
      singles.push({ ...item });
      continue;
    }

    const key = item.groupId || item.id || item.name;
    const current = groups.get(key) || {
      id: key,
      name: item.groupName || item.name,
      craftType: item.craftType,
      craftLevel: item.craftLevel,
      equipLevel: item.equipLevel,
      recipeBook: item.recipeBook,
      recipePlace: item.recipePlace,
      groupKind: item.groupKind,
      itemsCount: item.itemsCount,
      items: [],
    };

    current.items.push({
      id: item.id,
      name: item.name,
      slot: item.slot,
      itemType: item.itemType,
      materials: item.materials,
      slotGrid: item.slotGrid,
      slotGridCols: item.slotGridCols,
      slotGridType: item.slotGridType,
      jobs: item.jobs,
      equipableType: item.equipableType,
      craftLevel: item.craftLevel,
      equipLevel: item.equipLevel,
      recipeBook: item.recipeBook,
      recipePlace: item.recipePlace,
      description: item.description,
      effects: item.effects,
    });

    if (!current.craftType && item.craftType) current.craftType = item.craftType;
    if (!current.craftLevel && item.craftLevel) current.craftLevel = item.craftLevel;
    if (!current.equipLevel && item.equipLevel) current.equipLevel = item.equipLevel;
    if (!current.recipeBook && item.recipeBook) current.recipeBook = item.recipeBook;
    if (!current.recipePlace && item.recipePlace) current.recipePlace = item.recipePlace;

    groups.set(key, current);
  }

  const grouped = Array.from(groups.values()).map((g) => {
    g.items.sort((a, b) => {
      const sa = slotOrder[a.slot] ?? 99;
      const sb = slotOrder[b.slot] ?? 99;
      if (sa !== sb) return sa - sb;
      return collator.compare(a.name, b.name);
    });
    return g;
  });

  return [...grouped, ...singles].sort((a, b) => {
    const ca = CATEGORY_ORDER[a.craftType] ?? 99;
    const cb = CATEGORY_ORDER[b.craftType] ?? 99;
    if (ca !== cb) return ca - cb;
    return collator.compare(a.name, b.name);
  });
}

const defaultStarPrices = (setObj) =>
  setObj?.starPrices ?? { star0: 0, star1: 20000, star2: 70000, star3: 150000 };

const DEFAULT_SLOT_GRIDS = {
  腕: {
    左上: 125,
    中上: 100,
    右上: 165,
    左下: 125,
    中下: 100,
    右下: 165,
  },
};

function normalizeSlots(items) {
  const slotOrder = ["頭", "体上", "体下", "腕", "足", "顔", "盾", "武器", "その他"];
  const slots = Array.from(new Set((items || []).map((it) => it.slot || "その他")));
  slots.sort((a, b) => {
    const ia = slotOrder.indexOf(a);
    const ib = slotOrder.indexOf(b);
    if (ia === -1 && ib === -1) return collator.compare(a, b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return slots;
}

function buildMatrix(selectedSet) {
  if (!selectedSet) return { slots: [], rows: [], slotGrids: {}, slotGridMeta: {} };

  const normalizedItems =
    Array.isArray(selectedSet.items) && selectedSet.items.length
      ? selectedSet.items
      : (Array.isArray(selectedSet.materials) || selectedSet.slotGrid)
        ? [
            {
              id: selectedSet.id,
              name: selectedSet.name,
              slot: selectedSet.slot || "その他",
              materials: Array.isArray(selectedSet.materials) ? selectedSet.materials : [],
              slotGrid: selectedSet.slotGrid,
              slotGridCols: selectedSet.slotGridCols,
              slotGridType: selectedSet.slotGridType,
            },
          ]
        : [];

  const slots = normalizeSlots(normalizedItems);

  const map = new Map();
  for (const it of normalizedItems) {
    const slot = it.slot || "その他";
    for (const m of it.materials || []) {
      const key = `${m.item_id ?? "noid"}::${m.name}`;
      const cur = map.get(key) || {
        materialKey: key,
        itemId: m.item_id ?? null,
        materialName: m.name,
        perSlotQty: {},
        totalQty: 0,
        defaultUnitCost: 0,
      };
      const q = Number(m.qty || 0);
      cur.perSlotQty[slot] = (cur.perSlotQty[slot] || 0) + q;
      cur.totalQty += q;
      if (!cur.defaultUnitCost && m.defaultUnitCost != null) {
        cur.defaultUnitCost = Number(m.defaultUnitCost);
      }
      map.set(key, cur);
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => collator.compare(a.materialName, b.materialName));

  const slotGrids = {};
  const slotGridMeta = {};
  for (const it of normalizedItems) {
    const slot = it.slot || "その他";
    if (it.slotGrid) slotGrids[slot] = it.slotGrid;
    if (it.slotGridCols != null || it.slotGridType != null) {
      slotGridMeta[slot] = {
        cols: it.slotGridCols != null ? Number(it.slotGridCols) : null,
        type: it.slotGridType ?? null,
      };
    }
  }

  return { slots, rows, slotGrids, slotGridMeta };
}

function getSlotItemName(selectedSet, slot) {
  if (!selectedSet) return null;

  if (Array.isArray(selectedSet.items)) {
    const item = selectedSet.items.find((it) => it.slot === slot);
    return item?.name ?? null;
  }

  if (selectedSet.slot === slot) {
    return selectedSet.name;
  }

  return null;
}

function recommendFromP3(p3) {
  if (p3 == null) return { label: "—", tone: "text-slate-700 dark:text-slate-200", sub: "" };
  if (p3 <= 10) return { label: "超おすすめ", tone: "text-emerald-700 dark:text-emerald-300", sub: "★★★なしでも黒字" };
  if (p3 <= 25) return { label: "おすすめ", tone: "text-emerald-700 dark:text-emerald-300", sub: "★★★が少し出れば黒字" };
  if (p3 <= 40) return { label: "普通", tone: "text-amber-700 dark:text-amber-300", sub: "★★★がそこそこ必要" };
  if (p3 <= 60) return { label: "厳しめ", tone: "text-rose-700 dark:text-rose-300", sub: "★★★運にかなり依存" };
  return { label: "非推奨", tone: "text-rose-700 dark:text-rose-300", sub: "⭐3が多すぎないと黒字にならない" };
}

function calcMinRatesToBreakEven({ feeRate, costPerItem, starPrice, stepPercent = 1 }) {
  const r = Math.max(0, Number(feeRate) || 0);
  const net = (p) => Math.max(0, Number(p) || 0) * (1 - r);

  const net0 = net(starPrice.star0);
  const net1 = net(starPrice.star1);
  const net2 = net(starPrice.star2);
  const net3 = net(starPrice.star3);

  const C = Math.max(0, Number(costPerItem) || 0);
  if (C === 0) return { ok: true, p3: 0, p2: 0, p1: 100, p0: 0 };
  if (net1 >= C) return { ok: true, p3: 0, p2: 0, p1: 100, p0: 0 };
  if (net3 < C) return { ok: true, impossible: true, p3: 100, p2: 0, p1: 0, p0: 0, note: "100%⭐3でも黒字にならない" };

  const p0 = 0;

  for (let p3 = 0; p3 <= 100 - p0; p3 += stepPercent) {
    for (let p2 = 0; p2 <= 100 - p0 - p3; p2 += stepPercent) {
      const p1 = 100 - p0 - p3 - p2;
      const expectedNet =
        (p0 / 100) * net0 +
        (p1 / 100) * net1 +
        (p2 / 100) * net2 +
        (p3 / 100) * net3;

      if (expectedNet >= C) return { ok: true, p3, p2, p1, p0 };
    }
  }

  return { ok: false, reason: "探索で見つからなかった（想定外）" };
}

function SlotGridView({ grid }) {
  if (!grid) return null;

  const is2DArray =
    Array.isArray(grid) && grid.every((row) => Array.isArray(row));

  if (!is2DArray) return null;

  const rows = grid.length;
  const cols = Math.max(...grid.map((row) => row.length), 0);

  const normalized = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => grid?.[r]?.[c] ?? null)
  );

  const cell = (value, key) => {
    const disabled = value == null || value === "";

    return (
      <div
        key={key}
        className={`min-h-[48px] rounded-xl border px-2 py-2 flex items-center justify-center text-center ${
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
            : "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        }`}
      >
        <div className="text-sm font-semibold leading-tight tabular-nums break-words">
          {disabled ? "" : value}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <div
        className="grid gap-2 w-full min-w-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {normalized.flat().map((value, i) => cell(value, i))}
      </div>
    </div>
  );
}

function getSlotGridInfo(slot, slotGrids, slotGridMeta) {
  const grid = slotGrids?.[slot] ?? DEFAULT_SLOT_GRIDS?.[slot] ?? null;
  const cols = slotGridMeta?.[slot]?.cols ?? null;
  return { grid, cols };
}

function buildInitialUnitCostMap(setObj) {
  const init = {};
  const { rows } = buildMatrix(setObj);

  for (const row of rows) {
    init[row.materialKey] = row.defaultUnitCost || 0;
  }

  return init;
}

export default function CraftProfitPage() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [setId, setSetId] = useState("");
  const [setQuery, setSetQuery] = useState("");
  const [openSetList, setOpenSetList] = useState(false);

  const [feeRatePct, setFeeRatePct] = useState(DEFAULT_FEE_RATE);
  const [starPrice, setStarPrice] = useState(defaultStarPrices(null));

  const [toolId, setToolId] = useState("none");
  const [toolPriceOverride, setToolPriceOverride] = useState(null);
  const [unitCostMap, setUnitCostMap] = useState({});
  const [activeSlot, setActiveSlot] = useState("その他");

  useEffect(() => {
    let cancelled = false;

    async function fetchEquipments() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(`${API_BASE}/api/equipments`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const json = await res.json();
        const nextSets = buildSetsFromEquipments(json?.data || []);

        if (cancelled) return;

        setSets(nextSets);

        const first = nextSets[0] || null;
        if (first) {
          setSetId(first.id);
          setSetQuery(first.name);
          setUnitCostMap(buildInitialUnitCostMap(first));
          setStarPrice(defaultStarPrices(first));
        }
      } catch (error) {
        if (cancelled) return;
        setLoadError("装備データの取得に失敗した");
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEquipments();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(
    () => sets.find((s) => s.id === setId) || null,
    [sets, setId]
  );

  const slotItemMap = useMemo(() => {
    const map = {};
    for (const it of selectedSet?.items || []) {
      map[it.slot] = it.name;
    }
    return map;
  }, [selectedSet]);

  const crystalByEquipLevel = useMemo(() => {
    const lv =
      Number(selectedSet?.equipLevel ?? 0) ||
      Number(selectedSet?.items?.[0]?.equipLevel ?? 0);

    if (!lv) return null;
    return getCrystalByEquipLevel(lv);
  }, [selectedSet]);

  const displayJobs = useMemo(() => {
    const top = selectedSet?.jobs;
    if (Array.isArray(top) && top.length > 0) return top;

    const set = new Set();
    const items = selectedSet?.items ?? [];
    for (const it of items) {
      const arr = it?.jobs;
      if (!Array.isArray(arr)) continue;
      for (const j of arr) {
        if (j) set.add(String(j));
      }
    }
    return Array.from(set);
  }, [selectedSet]);

  useEffect(() => {
    if (selectedSet?.name) setSetQuery(selectedSet.name);
  }, [selectedSet?.id]);

  const filteredSets = useMemo(() => {
    const q = setQuery.toLowerCase().trim();
    if (!q) return sets;

    const groupedMatches = [];
    const singleMatches = [];

    for (const s of sets) {
      const top = String(s.name || "").toLowerCase();
      const itemNames = Array.isArray(s.items)
        ? s.items.map((it) => String(it.name || "").toLowerCase()).join(" ")
        : "";
      const equipLevelText = String(s.equipLevel ?? "");
      const itemEquipLevels = Array.isArray(s.items)
        ? s.items.map((it) => String(it.equipLevel ?? "")).join(" ")
        : "";

      if (!(top.includes(q) || itemNames.includes(q) || equipLevelText.includes(q) || itemEquipLevels.includes(q))) {
        continue;
      }

      if (Array.isArray(s.items) && s.items.length > 1) groupedMatches.push(s);
      else singleMatches.push(s);
    }

    return [...groupedMatches, ...singleMatches];
  }, [setQuery, sets]);

  const craftType = selectedSet?.craftType;
  const feeRate = useMemo(() => clamp0(feeRatePct) / 100, [feeRatePct]);

  const toolOptions = useMemo(
    () => TOOLS_BY_CRAFT[craftType] ?? [{ id: "none", name: "選択なし", defaultPrice: 0 }],
    [craftType]
  );

  useEffect(() => {
    setToolId("none");
    setToolPriceOverride(null);
  }, [craftType]);

  const selectedTool = useMemo(
    () => toolOptions.find((t) => t.id === toolId) ?? toolOptions[0],
    [toolOptions, toolId]
  );

  const toolPrice = useMemo(
    () => (toolPriceOverride == null ? selectedTool?.defaultPrice ?? 0 : Number(toolPriceOverride)),
    [selectedTool, toolPriceOverride]
  );

  const toolCostPerCraft = useMemo(() => clamp0(toolPrice) / TOOL_USES, [toolPrice]);

  const toolEnabled = useMemo(
    () => !!TOOLS_BY_CRAFT[craftType] && selectedTool?.id !== "none",
    [craftType, selectedTool]
  );

  const mobileToolRow = useMemo(() => {
    if (!TOOLS_BY_CRAFT[craftType]) return null;
    if (!selectedTool || selectedTool.id === "none") return null;
    return {
      name: `【道具】${selectedTool.name}`,
      toolPrice,
      toolCostPerCraft,
      onChangeToolPrice: (v) => setToolPriceOverride(v),
    };
  }, [craftType, selectedTool, toolPrice, toolCostPerCraft]);

  const { slots, rows, slotGrids, slotGridMeta } = useMemo(
    () => buildMatrix(selectedSet),
    [selectedSet]
  );

  useEffect(() => {
    if (slots?.length && !slots.includes(activeSlot)) {
      setActiveSlot(slots[0]);
    }
  }, [slots, activeSlot]);

  const onChangeSet = (nextId) => {
    setSetId(nextId);
    const nextSet = sets.find((s) => s.id === nextId) || sets[0] || null;
    if (!nextSet) return;

    setSetQuery(nextSet.name);
    setUnitCostMap(buildInitialUnitCostMap(nextSet));
    setStarPrice(defaultStarPrices(nextSet));
  };

  const updateUnitCost = (materialKey, value) => {
    setUnitCostMap((prev) => ({
      ...prev,
      [materialKey]: Number(value),
    }));
  };

  const materialCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      const unit = clamp0(unitCostMap[r.materialKey] ?? 0);
      return sum + clamp0(r.totalQty) * unit;
    }, 0);
  }, [rows, unitCostMap]);

  const slotTotals = useMemo(() => {
    const qty = {};
    const amount = {};
    for (const slot of slots) {
      qty[slot] = 0;
      amount[slot] = 0;
    }
    for (const r of rows) {
      const unit = clamp0(unitCostMap[r.materialKey] ?? 0);
      for (const slot of slots) {
        const q = Number(r.perSlotQty[slot] || 0);
        qty[slot] += q;
        amount[slot] += q * unit;
      }
    }
    return { qty, amount };
  }, [rows, slots, unitCostMap]);

  const slotTotalsWithTool = useMemo(() => {
    const amount = { ...slotTotals.amount };
    if (toolEnabled) {
      for (const slot of slots) {
        amount[slot] = (amount[slot] || 0) + toolCostPerCraft;
      }
    }
    const total = slots.reduce((sum, slot) => sum + (amount[slot] || 0), 0);
    return { amount, total };
  }, [slotTotals.amount, toolEnabled, toolCostPerCraft, slots]);

  const partCount = useMemo(() => Math.max(1, slots?.length || 0), [slots]);
  const avgMaterialCostPerPart = useMemo(() => materialCost / partCount, [materialCost, partCount]);
  const costPerItem = useMemo(
    () => avgMaterialCostPerPart + (toolEnabled ? toolCostPerCraft : 0),
    [avgMaterialCostPerPart, toolEnabled, toolCostPerCraft]
  );

  const minRates = useMemo(() => {
    return calcMinRatesToBreakEven({
      feeRate,
      costPerItem,
      starPrice,
      stepPercent: 1,
    });
  }, [feeRate, costPerItem, starPrice]);

  const recommend = useMemo(() => {
    if (minRates?.impossible) {
      return {
        label: "★☆☆☆☆（非推奨）",
        tone: "text-rose-700 dark:text-rose-300",
        sub: "100%⭐3でも黒字にならない",
      };
    }
    return minRates?.ok ? recommendFromP3(minRates.p3) : recommendFromP3(null);
  }, [minRates]);

  const recommendRate = useMemo(() => {
    if (!minRates?.ok) return 0;
    return Math.max(0, 100 - (Number(minRates.p3) || 0));
  }, [minRates]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        読み込み中...
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {loadError}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 space-y-5 sm:space-y-6 min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">職人利益計算</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-5 items-stretch">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 h-full">
          <div className="space-y-3">
            <div className="min-w-0 relative">
              <label className="text-xs text-slate-500 dark:text-slate-400">装備セット</label>
              <input
                type="text"
                value={setQuery}
                placeholder="装備名 or レベルで検索"
                onFocus={() => setOpenSetList(true)}
                onChange={(e) => {
                  setSetQuery(e.target.value);
                  setOpenSetList(true);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
              />

              {openSetList && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow max-h-60 overflow-auto">
                  {filteredSets.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onChangeSet(s.id);
                        setOpenSetList(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">職種</div>
              <div className="mt-1 inline-flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                <span className="text-sm font-semibold">{craftType || "—"}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  必要Lv {selectedSet?.craftLevel ?? "—"}
                </span>
              </div>
            </div>

            {TOOLS_BY_CRAFT[craftType] && (
              <div className="min-w-0">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  使用する道具（{TOOL_USES}回）
                </label>
                <div className="mt-1 grid grid-cols-1 gap-2">
                  <select
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                    value={toolId}
                    onChange={(e) => {
                      setToolId(e.target.value);
                      setToolPriceOverride(null);
                    }}
                  >
                    {toolOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                    value={toolPrice}
                    min={0}
                    onChange={(e) => setToolPriceOverride(Number(e.target.value))}
                    title="道具価格（変更可能）"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">装備情報</h2>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              装備Lv：
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedSet?.equipLevel ?? "—"}
              </span>
            </div>
          </div>

          {Array.isArray(selectedSet?.items) && selectedSet.items.length > 1 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold">
                セット内容
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSet.items.map((it) => (
                  <span
                    key={it.id}
                    className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[13px] font-extrabold"
                  >
                    {it.slot}：{it.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold">
                装備可能職業
              </div>
              {displayJobs.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {displayJobs.map((j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 text-[13px] font-extrabold"
                    >
                      {j}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400 dark:text-slate-500">（jobs 未設定）</div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">結晶</div>
              {crystalByEquipLevel ? (
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-7">
                  なし: {crystalByEquipLevel.plus0}個 ★: {crystalByEquipLevel.plus1}個 ★★: {crystalByEquipLevel.plus2}個 ★★★: {crystalByEquipLevel.plus3}個
                </div>
              ) : (
                <div className="text-sm text-slate-400 dark:text-slate-400">
                  equipLevel が無いので表示できない
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <div className="text-sm font-semibold">売値</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">手数料</span>
            <div className="relative w-20">
              <input
                type="number"
                value={feeRatePct}
                onChange={(e) => setFeeRatePct(Number(e.target.value))}
                className="w-full text-base origin-right scale-90 rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-2 py-1 pr-5 text-right"
              />
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["star0", "星なし"],
            ["star1", "★"],
            ["star2", "★★"],
            ["star3", "★★★"],
          ].map(([k, label]) => (
            <div key={k} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
              <input
                type="number"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-right"
                value={starPrice[k]}
                min={0}
                onChange={(e) => setStarPrice((p) => ({ ...p, [k]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">結晶装備おすすめ率</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">おすすめ率が高いほど黒字にしやすい</div>
            </div>
            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
              minRates?.impossible
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                : "border-slate-200 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            }`}>
              {recommend.label}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-5 text-center shadow-sm">
            <div className={`text-5xl font-black leading-none tabular-nums ${recommend.tone}`}>{recommendRate}%</div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: "p3", star: "★★★", value: minRates.p3, note: "必要率" },
              { key: "p2", star: "★★", value: minRates.p2, note: "必要率" },
              { key: "p1", star: "★", value: minRates.p1, note: "残り" },
            ].map((item) => (
              <div key={item.key} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-3 text-center shadow-sm">
                <div className="text-sm font-black tracking-wider text-slate-900 dark:text-slate-100">{item.star}</div>
                <div className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">{item.value}%</div>
                <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.note}</div>
              </div>
            ))}
          </div>

          {recommend.sub || minRates?.note ? (
            <div className={`rounded-xl border px-3 py-2 text-xs ${
              minRates?.impossible
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
                : "border-slate-200 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
            }`}>
              {minRates?.note || recommend.sub}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">職人情報</h2>
        </div>

        <div className="sm:hidden space-y-3">
          <MobileSlotTabs slots={slots} activeSlot={activeSlot} onChange={setActiveSlot} />

          <MobileSlotCarousel
            slots={slots}
            activeSlot={activeSlot}
            onChange={setActiveSlot}
            slotGrids={slotGrids}
            slotGridMeta={slotGridMeta}
            slotItemMap={slotItemMap}
          >
            {(slot) => (
              <MobileMaterialsList
                slot={slot}
                rows={rows}
                unitCostMap={unitCostMap}
                onChangeUnitCost={(key, v) => updateUnitCost(key, v)}
                toolRow={mobileToolRow}
              />
            )}
          </MobileSlotCarousel>
        </div>

        <div className="hidden sm:block space-y-3">
          <div className="hidden sm:block space-y-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">基準値</div>

            <div className="overflow-x-auto">
              <div className="flex gap-3 min-w-max pb-2">
                {slots.map((slot) => {
                  const { grid } = getSlotGridInfo(slot, slotGrids, slotGridMeta);
                  const itemName = getSlotItemName(selectedSet, slot);

                  if (!grid) return null;

                  return (
                    <div
                      key={slot}
                      className="w-[220px] shrink-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {slot} <br />
                        {itemName ? `${itemName}` : ""}
                      </div>

                      <SlotGridView grid={grid} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">素材</th>
                    {slots.map((slot) => (
                      <th key={slot} className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                        {slot}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">合計</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">単価</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">金額</th>
                  </tr>
                </thead>

                <tbody>
                  {toolEnabled && selectedTool?.id !== "none" && (
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">【道具】{selectedTool.name}</td>
                      {slots.map((slot) => (
                        <td key={slot} className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">—</td>
                      ))}
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">—</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                          value={toolPrice}
                          min={0}
                          onChange={(e) => setToolPriceOverride(Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{yen(toolCostPerCraft)}</td>
                    </tr>
                  )}

                  {rows.map((r) => {
                    const unit = clamp0(unitCostMap[r.materialKey] ?? 0);
                    const amount = clamp0(r.totalQty) * unit;

                    return (
                      <tr key={r.materialKey} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{r.materialName}</span>
                        </td>
                        {slots.map((slot) => (
                          <td key={slot} className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {r.perSlotQty[slot] ? r.perSlotQty[slot] : ""}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{r.totalQty}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                            value={unitCostMap[r.materialKey] ?? 0}
                            min={0}
                            onChange={(e) => updateUnitCost(r.materialKey, e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">{yen(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-slate-50 dark:bg-slate-800/40">
                  <tr>
                    <td className="px-3 py-2 font-semibold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">合計（道具込）</td>
                    {slots.map((slot) => (
                      <td key={slot} className="px-3 py-2 text-right font-semibold tabular-nums border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                        {slotTotalsWithTool.amount[slot] ? yen(slotTotalsWithTool.amount[slot]) : ""}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      {yen(slotTotalsWithTool.total)}
                    </td>
                    <td className="px-3 py-2 text-right border-t border-slate-200 dark:border-slate-700">—</td>
                    <td className="px-3 py-2 text-right font-semibold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      {yen(slotTotalsWithTool.total)}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-3 py-2 font-semibold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">参考（1部位あたり）</td>
                    <td
                      className="px-3 py-2 text-right font-semibold tabular-nums border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      colSpan={slots.length + 2}
                    >
                      平均材料 {yen(avgMaterialCostPerPart)} + 道具 {yen(toolEnabled ? toolCostPerCraft : 0)} = 原価 {yen(costPerItem)}
                    </td>
                    <td className="px-3 py-2 text-right border-t border-slate-200 dark:border-slate-700">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MobileSlotTabs({ slots, activeSlot, onChange }) {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
      <div className="flex gap-2 py-1">
        {slots.map((s) => {
          const isActive = s === activeSlot;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={
                "shrink-0 rounded-full border px-3 py-1 text-sm font-semibold " +
                (isActive
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200")
              }
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileMaterialsList({ slot, rows, unitCostMap, onChangeUnitCost, toolRow }) {
  const items = useMemo(() => {
    const out = [];

    if (toolRow) {
      out.push({
        key: "__tool__",
        name: toolRow.name,
        qty: null,
        unit: toolRow.toolPrice,
        amount: toolRow.toolCostPerCraft,
        isTool: true,
        onChangeToolPrice: toolRow.onChangeToolPrice,
      });
    }

    for (const r of rows) {
      const qty = Number(r.perSlotQty?.[slot] || 0);
      if (!qty) continue;

      const unit = clamp0(unitCostMap[r.materialKey] ?? 0);

      out.push({
        key: r.materialKey,
        name: r.materialName,
        qty,
        unit,
        amount: qty * unit,
        isTool: false,
      });
    }

    return out;
  }, [slot, rows, unitCostMap, toolRow]);

  const totalAmount = useMemo(
    () => items.reduce((sum, x) => sum + clamp0(x.amount), 0),
    [items]
  );

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-[11px] bg-white dark:bg-slate-900">
      <div
        className="
          grid grid-cols-[minmax(120px,1fr)_32px_56px_56px]
          items-center
          gap-1
          py-2
          text-[11px] font-semibold
          text-center
          bg-slate-100 dark:bg-slate-800
          border-b border-slate-200 dark:border-slate-700
        "
      >
        <div className="text-left px-2 text-slate-900 dark:text-slate-100">素材名</div>
        <div className="text-slate-900 dark:text-slate-100">必要</div>
        <div className="text-slate-900 dark:text-slate-100">金額</div>
        <div className="text-slate-900 dark:text-slate-100">単価</div>
      </div>

      {items.length ? (
        items.map((x) => (
          <div
            key={x.key}
            className="grid grid-cols-[minmax(120px,1fr)_32px_56px_56px] items-center gap-1 py-1 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="truncate font-medium px-2 text-slate-900 dark:text-slate-100">{x.name}</div>

            <div className="text-center text-slate-500 dark:text-slate-400">
              {x.isTool ? "-" : x.qty}
            </div>

            <div className="text-center tabular-nums text-slate-900 dark:text-slate-100">
              {yen(x.amount)}
            </div>

            <div className="pr-2">
              <input
                type="number"
                inputMode="numeric"
                className="h-7 w-full text-right border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded px-1 text-[16px] scale-[0.8] origin-right"
                value={x.unit}
                min={0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (x.isTool) x.onChangeToolPrice(v);
                  else onChangeUnitCost(x.key, v);
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400">この部位で使う素材はない。</div>
      )}

      <div className="flex justify-end items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100">
        <span>合計: {yen(totalAmount)}G</span>
      </div>
    </div>
  );
}

function MobileSlotCarousel({ slots, activeSlot, onChange, slotGrids, slotGridMeta, slotItemMap, children }) {
  const scrollerRef = useRef(null);
  const lastActiveRef = useRef(activeSlot);
  const setByScrollRef = useRef(false);
  const scrollEndTimerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    if (setByScrollRef.current) {
      setByScrollRef.current = false;
      lastActiveRef.current = activeSlot;
      return;
    }

    if (lastActiveRef.current === activeSlot) return;
    lastActiveRef.current = activeSlot;

    const escapedSlot =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(activeSlot)
        : String(activeSlot).replace(/"/g, '\\"');

    const card = el.querySelector(`[data-slot="${escapedSlot}"]`);
    if (!card) return;

    const targetLeft = card.offsetLeft - (el.clientWidth / 2 - card.offsetWidth / 2);

    el.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [activeSlot]);

  const syncActiveFromCenter = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll("[data-slot]"));
    if (!cards.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let bestSlot = activeSlot;
    let bestDist = Infinity;

    for (const c of cards) {
      const cCenter = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(cCenter - center);
      if (d < bestDist) {
        bestDist = d;
        bestSlot = c.getAttribute("data-slot");
      }
    }

    if (bestSlot && bestSlot !== activeSlot) {
      setByScrollRef.current = true;
      onChange(bestSlot);
    }
  };

  const onScroll = () => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      syncActiveFromCenter();
    }, 140);
  };

  return (
    <div className="-mx-4 px-4">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="
          flex gap-3 overflow-x-auto pb-2
          scroll-smooth
          snap-x snap-mandatory
          [-webkit-overflow-scrolling:touch]
        "
      >
        <div className="shrink-0 w-4" />

        {slots.map((slot) => {
          const { grid } = getSlotGridInfo(slot, slotGrids, slotGridMeta);

          return (
            <div
              key={slot}
              data-slot={slot}
              className="shrink-0 w-[92%] snap-center"
            >
              <div className="space-y-3">
                {grid ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
                    <div className="text-xs font-semibold text-center text-slate-700 dark:text-slate-200 truncate px-2">
                      {slotItemMap?.[slot] || slot}
                    </div>

                    <div className="min-h-[184px] flex items-center">
                      <div className="w-full">
                        <SlotGridView grid={grid} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {children(slot)}
              </div>
            </div>
          );
        })}

        <div className="shrink-0 w-4" />
      </div>

      <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
        ← 横スワイプで部位切替 →
      </div>
    </div>
  );
}