"use client";

import { clamp0 } from "@/lib/money";

export const SLOT_ORDER_MAP = {
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

const collator = new Intl.Collator("ja");

export const DEFAULT_FEE_RATE = 5;

export function normalizeSlotName(slot) {
  const text = String(slot ?? "").trim();

  if (!text) return "その他";

  if (
    text === "頭" ||
    text.includes("頭") ||
    text.includes("アタマ")
  ) {
    return "頭";
  }

  if (
    text === "体上" ||
    text === "上" ||
    text.includes("体上")
  ) {
    return "体上";
  }

  if (
    text === "体下" ||
    text === "下" ||
    text.includes("体下")
  ) {
    return "体下";
  }

  if (
    text === "腕" ||
    text.includes("腕") ||
    text.includes("ウデ")
  ) {
    return "腕";
  }

  if (
    text === "足" ||
    text.includes("足")
  ) {
    return "足";
  }

  if (text === "顔" || text.includes("顔")) return "顔";
  if (text === "盾" || text.includes("盾")) return "盾";
  if (text === "武器" || text.includes("武器")) return "武器";

  return text;
}

export function getSlotOrder(slot) {
  return SLOT_ORDER_MAP[normalizeSlotName(slot)] ?? 999;
}

export function sortSlots(slots = []) {
  return [...slots].sort((a, b) => {
    const ia = getSlotOrder(a);
    const ib = getSlotOrder(b);

    if (ia !== ib) return ia - ib;

    return collator.compare(String(a), String(b));
  });
}

export function sortItemsBySlot(items = []) {
  return [...items].sort((a, b) => {
    const ia = getSlotOrder(a?.slot);
    const ib = getSlotOrder(b?.slot);

    if (ia !== ib) return ia - ib;

    return collator.compare(String(a?.name ?? ""), String(b?.name ?? ""));
  });
}

export function formatSlotLabel(slot) {
  const normalized = normalizeSlotName(slot);

  if (normalized === "体上") return "上";
  if (normalized === "体下") return "下";

  return normalized;
}

export function safeJsonParse(value, fallback) {
  if (value == null || value === "") return fallback;

  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeMaterial(raw) {
  if (!raw) return null;

  const itemId =
    raw.item_id ??
    raw.itemId ??
    raw.material_id ??
    raw.id ??
    null;

  const name =
    raw.name ??
    raw.material_name ??
    raw.item_name ??
    raw.label ??
    "";

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
        raw.buy_price ??
        raw.buyPrice ??
        0
    ) || 0;

  if (itemId == null && !name) return null;

  return {
    item_id: itemId == null || itemId === "" ? null : Number(itemId),
    name,
    qty,
    defaultUnitCost,
  };
}

function normalizeJobs(row) {
  const names = new Set();

  const equipableTypes =
    row?.equipmentType?.equipableTypes ??
    row?.equipmentType?.equipable_types ??
    row?.equipment_type?.equipable_types ??
    [];

  if (Array.isArray(equipableTypes)) {
    for (const item of equipableTypes) {
      const name =
        item?.gameJob?.name ??
        item?.game_job?.name ??
        item?.name ??
        "";

      if (name) {
        names.add(String(name).trim());
      }
    }
  }

  const overrideJobs = safeJsonParse(
    row?.overrideJobsJson ??
      row?.override_jobs_json ??
      row?.jobsJson ??
      row?.jobs_json ??
      [],
    []
  );

  if (Array.isArray(overrideJobs)) {
    for (const job of overrideJobs) {
      if (typeof job === "string" && job.trim()) {
        names.add(job.trim());
      } else if (job?.name) {
        names.add(String(job.name).trim());
      }
    }
  }

  return Array.from(names);
}

function toItemSummary(item) {
  return {
    id: item.id,
    name: item.name,
    slot: item.slot,
    materials: item.materials,
    slotGrid: item.slotGrid,
    jobs: item.jobs,
    craftLevel: item.craftLevel,
    equipLevel: item.equipLevel,
    recipeBook: item.recipeBook,
    recipePlace: item.recipePlace,
    description: item.description,
    effects: item.effects,
  };
}

export function normalizeEquipmentRow(row, itemMap = new Map()) {
  const materials = safeJsonParse(
    row?.materialsJson ?? row?.materials_json ?? row?.materials,
    []
  );

  const slotGrid = safeJsonParse(
    row?.slotGridJson ?? row?.slot_grid_json,
    null
  );

  const effects = safeJsonParse(
    row?.effectsJson ?? row?.effects_json,
    []
  );

  const normalizedMaterials = Array.isArray(materials)
    ? materials
        .map(normalizeMaterial)
        .filter(Boolean)
        .map((material) => {
          const master = material.item_id
            ? itemMap.get(Number(material.item_id))
            : null;

          return {
            ...material,
            name: material.name || master?.name || "不明な素材",
            defaultUnitCost:
              material.defaultUnitCost ||
              Number(master?.buy_price ?? master?.buyPrice ?? 0) ||
              0,
          };
        })
    : [];

  return {
    id:
      row?.itemId ??
      row?.item_id ??
      row?.groupId ??
      row?.group_id ??
      row?.itemName ??
      row?.item_name ??
      row?.id ??
      "",

    name: row?.itemName ?? row?.item_name ?? row?.name ?? "",
    slot: normalizeSlotName(row?.slot ?? "その他"),

    craftType:
      row?.equipmentType?.craftType?.name ??
      row?.equipmentType?.craft_type?.name ??
      row?.equipment_type?.craft_type?.name ??
      row?.craftType ??
      row?.craft_type ??
      "",

    craftLevel: Number(row?.craftLevel ?? row?.craft_level ?? 0) || null,
    equipLevel: Number(row?.equipLevel ?? row?.equip_level ?? 0) || null,

    recipeBook: row?.recipeBook ?? row?.recipe_book ?? "",
    recipePlace: row?.recipePlace ?? row?.recipe_place ?? "",
    description: row?.description ?? "",

    materials: normalizedMaterials,
    slotGrid,
    jobs: normalizeJobs(row),

    groupId:
      row?.groupId ??
      row?.group_id ??
      row?.itemId ??
      row?.item_id ??
      row?.itemName ??
      row?.item_name ??
      row?.id ??
      "",

    groupName:
      row?.groupName ??
      row?.group_name ??
      row?.itemName ??
      row?.item_name ??
      row?.name ??
      "",

    groupKind: row?.groupKind ?? row?.group_kind ?? "",
    itemsCount: Number(row?.itemsCount ?? row?.items_count ?? 0) || 0,

    sourceUrl: row?.sourceUrl ?? row?.source_url ?? "",
    detailUrl: row?.detailUrl ?? row?.detail_url ?? "",
    effects: Array.isArray(effects) ? effects : [],
  };
}

export function buildSetsFromEquipments(rows, itemMap = new Map()) {
  const normalized = (rows || [])
    .map((row) => normalizeEquipmentRow(row, itemMap));

  const groups = new Map();
  const singles = [];

  for (const item of normalized) {
    const isGroup =
      String(item.groupKind || "").endsWith("_set") ||
      (item.itemsCount || 0) > 1;

    if (!isGroup) {
      singles.push({
        ...item,
        items: [toItemSummary(item)],
      });
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
      jobs: [],
      items: [],
    };

    current.items.push(toItemSummary(item));
    current.jobs = Array.from(new Set([...current.jobs, ...(item.jobs || [])]));

    if (!current.craftType && item.craftType) current.craftType = item.craftType;
    if (!current.craftLevel && item.craftLevel) current.craftLevel = item.craftLevel;
    if (!current.equipLevel && item.equipLevel) current.equipLevel = item.equipLevel;
    if (!current.recipeBook && item.recipeBook) current.recipeBook = item.recipeBook;
    if (!current.recipePlace && item.recipePlace) current.recipePlace = item.recipePlace;

    groups.set(key, current);
  }

  const grouped = Array.from(groups.values()).map((group) => {
    group.items = sortItemsBySlot(group.items);
    return group;
  });

  return [...grouped, ...singles].sort((a, b) =>
    collator.compare(a.name, b.name)
  );
}

export function defaultStarPrices(setObj) {
  return (
    setObj?.starPrices ?? {
      star0: 0,
      star1: 20000,
      star2: 70000,
      star3: 150000,
    }
  );
}

export function normalizeSlots(items) {
  const slots = Array.from(
    new Set((items || []).map((item) => normalizeSlotName(item.slot || "その他")))
  );

  return sortSlots(slots);
}

function isCraftToolSet(selectedSet) {
  return String(selectedSet?.groupKind || "") === "craft_tool_set";
}

function getAxisMeta(selectedSet, normalizedItems) {
  if (isCraftToolSet(selectedSet)) {
    const axisKeys = normalizedItems.map((item, index) =>
      String(item.id || item.name || `tool_${index}`)
    );

    const axisMeta = {};
    normalizedItems.forEach((item, index) => {
      const key = axisKeys[index];
      axisMeta[key] = {
        key,
        shortLabel: item.name || `道具${index + 1}`,
        label: item.name || `道具${index + 1}`,
        itemName: item.name || `道具${index + 1}`,
        slot: normalizeSlotName(item.slot || "その他"),
      };
    });

    return { axisKeys, axisMeta, mode: "item" };
  }

  const axisKeys = normalizeSlots(normalizedItems);
  const axisMeta = {};

  axisKeys.forEach((slot) => {
    const item = normalizedItems.find(
      (x) => normalizeSlotName(x.slot || "その他") === slot
    );

    axisMeta[slot] = {
      key: slot,
      shortLabel: formatSlotLabel(slot),
      label: formatSlotLabel(slot),
      itemName: item?.name ?? null,
      slot,
    };
  });

  return { axisKeys, axisMeta, mode: "slot" };
}

export function buildMatrix(selectedSet) {
  if (!selectedSet) {
    return {
      slots: [],
      rows: [],
      slotGrids: {},
      slotGridMeta: {},
    };
  }

  const normalizedItems =
    Array.isArray(selectedSet.items) && selectedSet.items.length
      ? selectedSet.items.map((item) => ({
          ...item,
          slot: normalizeSlotName(item.slot || "その他"),
        }))
      : Array.isArray(selectedSet.materials) || selectedSet.slotGrid
      ? [
          {
            id: selectedSet.id,
            name: selectedSet.name,
            slot: normalizeSlotName(selectedSet.slot || "その他"),
            materials: Array.isArray(selectedSet.materials)
              ? selectedSet.materials
              : [],
            slotGrid: selectedSet.slotGrid,
          },
        ]
      : [];

  const { axisKeys, axisMeta } = getAxisMeta(selectedSet, normalizedItems);
  const materialMap = new Map();
  const slotGrids = {};
  const slotGridMeta = {};

  normalizedItems.forEach((item, index) => {
    const axisKey = isCraftToolSet(selectedSet)
      ? String(item.id || item.name || `tool_${index}`)
      : normalizeSlotName(item.slot || "その他");

    for (const material of item.materials || []) {
      const key = `${material.item_id ?? "noid"}::${material.name}`;
      const current = materialMap.get(key) || {
        materialKey: key,
        itemId: material.item_id ?? null,
        materialName: material.name,
        perSlotQty: {},
        totalQty: 0,
        defaultUnitCost: 0,
      };

      const qty = Number(material.qty || 0);
      current.perSlotQty[axisKey] = (current.perSlotQty[axisKey] || 0) + qty;
      current.totalQty += qty;

      if (!current.defaultUnitCost && material.defaultUnitCost != null) {
        current.defaultUnitCost = Number(material.defaultUnitCost);
      }

      materialMap.set(key, current);
    }

    if (item.slotGrid) {
      slotGrids[axisKey] = item.slotGrid;
      slotGridMeta[axisKey] = axisMeta[axisKey];
    }
  });

  const rows = Array.from(materialMap.values()).sort((a, b) =>
    collator.compare(a.materialName, b.materialName)
  );

  return {
    slots: axisKeys,
    rows,
    slotGrids,
    slotGridMeta,
  };
}

export function getSlotItemName(selectedSet, slot) {
  if (!selectedSet) return null;

  if (Array.isArray(selectedSet.items)) {
    if (isCraftToolSet(selectedSet)) {
      const item = selectedSet.items.find(
        (it) => String(it.id || it.name) === String(slot)
      );
      return item?.name ?? null;
    }

    const normalizedSlot = normalizeSlotName(slot);
    const item = selectedSet.items.find(
      (it) => normalizeSlotName(it.slot) === normalizedSlot
    );
    return item?.name ?? null;
  }

  if (normalizeSlotName(selectedSet.slot) === normalizeSlotName(slot)) {
    return selectedSet.name;
  }

  return null;
}

export function recommendFromP3(p3) {
  if (p3 == null) {
    return {
      label: "—",
      tone: "text-slate-700 dark:text-slate-200",
      sub: "",
    };
  }

  if (p3 <= 10) {
    return {
      label: "超おすすめ",
      tone: "text-emerald-700 dark:text-emerald-300",
      sub: "★★★なしでも黒字",
    };
  }

  if (p3 <= 25) {
    return {
      label: "おすすめ",
      tone: "text-emerald-700 dark:text-emerald-300",
      sub: "★★★が少し出れば黒字",
    };
  }

  if (p3 <= 40) {
    return {
      label: "普通",
      tone: "text-amber-700 dark:text-amber-300",
      sub: "★★★がそこそこ必要",
    };
  }

  if (p3 <= 60) {
    return {
      label: "厳しめ",
      tone: "text-rose-700 dark:text-rose-300",
      sub: "★★★運にかなり依存",
    };
  }

  return {
    label: "非推奨",
    tone: "text-rose-700 dark:text-rose-300",
    sub: "★3が多すぎないと黒字にならない",
  };
}

export function calcMinRatesToBreakEven({
  feeRate,
  costPerItem,
  starPrice,
  stepPercent = 1,
}) {
  const rate = Math.max(0, Number(feeRate) || 0);
  const net = (price) => Math.max(0, Number(price) || 0) * (1 - rate);

  const net0 = net(starPrice.star0);
  const net1 = net(starPrice.star1);
  const net2 = net(starPrice.star2);
  const net3 = net(starPrice.star3);

  const cost = Math.max(0, Number(costPerItem) || 0);

  if (cost === 0) return { ok: true, p3: 0, p2: 0, p1: 100, p0: 0 };
  if (net1 >= cost) return { ok: true, p3: 0, p2: 0, p1: 100, p0: 0 };

  if (net3 < cost) {
    return {
      ok: true,
      impossible: true,
      p3: 100,
      p2: 0,
      p1: 0,
      p0: 0,
      note: "100%★3でも黒字にならない",
    };
  }

  const p0 = 0;

  for (let p3 = 0; p3 <= 100 - p0; p3 += stepPercent) {
    for (let p2 = 0; p2 <= 100 - p0 - p3; p2 += stepPercent) {
      const p1 = 100 - p0 - p3 - p2;
      const expectedNet =
        (p0 / 100) * net0 +
        (p1 / 100) * net1 +
        (p2 / 100) * net2 +
        (p3 / 100) * net3;

      if (expectedNet >= cost) {
        return { ok: true, p3, p2, p1, p0 };
      }
    }
  }

  return { ok: false, reason: "探索で見つからなかった" };
}

export function buildInitialUnitCostMap(setObj) {
  const initialMap = {};
  const { rows } = buildMatrix(setObj);

  for (const row of rows) {
    initialMap[row.materialKey] = row.defaultUnitCost || 0;
  }

  return initialMap;
}

export function resolveCrystalByEquipLevel(level, crystalRules = []) {
  const numericLevel = Number(level || 0);
  if (!numericLevel) return null;

  const rules = Array.isArray(crystalRules) ? crystalRules : [];

  const rule = rules.find((row) => {
    const min =
      Number(row?.min_level ?? row?.minLevel ?? row?.min ?? 0) || 0;
    const max =
      Number(row?.max_level ?? row?.maxLevel ?? row?.max ?? 0) || 0;

    return numericLevel >= min && numericLevel <= max;
  });

  if (!rule) return null;

  return {
    plus0: Number(rule?.plus0 ?? rule?.values?.plus0 ?? 0) || 0,
    plus1: Number(rule?.plus1 ?? rule?.values?.plus1 ?? 0) || 0,
    plus2: Number(rule?.plus2 ?? rule?.values?.plus2 ?? 0) || 0,
    plus3: Number(rule?.plus3 ?? rule?.values?.plus3 ?? 0) || 0,
  };
}

export function getCrystalInfo(selectedSet, crystalRules = []) {
  const level =
    Number(selectedSet?.equipLevel ?? 0) ||
    Number(selectedSet?.items?.[0]?.equipLevel ?? 0);

  if (!level) return null;

  return resolveCrystalByEquipLevel(level, crystalRules);
}

export function getDisplayJobs(selectedSet) {
  const topJobs = selectedSet?.jobs;

  if (Array.isArray(topJobs) && topJobs.length > 0) {
    return topJobs;
  }

  const names = new Set();
  const items = selectedSet?.items ?? [];

  for (const item of items) {
    const jobs = item?.jobs;
    if (!Array.isArray(jobs)) continue;

    for (const job of jobs) {
      if (job) names.add(String(job));
    }
  }

  return Array.from(names);
}

export function calcMaterialCost(rows, unitCostMap) {
  return rows.reduce((sum, row) => {
    const unit = clamp0(unitCostMap[row.materialKey] ?? 0);
    return sum + clamp0(row.totalQty) * unit;
  }, 0);
}

export function calcSlotTotals(rows, slots, unitCostMap) {
  const amount = {};

  for (const slot of slots) {
    amount[slot] = 0;
  }

  for (const row of rows) {
    const unit = clamp0(unitCostMap[row.materialKey] ?? 0);

    for (const slot of slots) {
      const qty = Number(row.perSlotQty[slot] || 0);
      amount[slot] += qty * unit;
    }
  }

  return { amount };
}