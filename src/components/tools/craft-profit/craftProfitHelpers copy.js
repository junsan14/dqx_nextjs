"use client";

import { clamp0 } from "@/lib/money";
import { getCrystalByEquipLevel } from "@/app/data/crystals";

const WEAPON_TYPES = [
  "片手剣",
  "両手剣",
  "短剣",
  "ヤリ",
  "オノ",
  "ハンマー",
  "ツメ",
  "ムチ",
  "ブーメラン",
  "スティック",
  "両手杖",
  "棍",
  "扇",
  "弓",
  "鎌",
];

const CATEGORY_ORDER = {
  裁縫: 1,
  武器鍛冶: 2,
  防具鍛冶: 3,
  木工: 4,
};

const SLOT_ORDER_MAP = {
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

export const DEFAULT_SLOT_GRIDS = {
  腕: {
    左上: 125,
    中上: 100,
    右上: 165,
    左下: 125,
    中下: 100,
    右下: 165,
  },
};

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

export function getDisplaySlot(itemType, itemKind = "") {
  const value = String(itemType || "").trim();

  if (!value) return "その他";
  if (["鎧頭", "裁縫頭"].includes(value)) return "頭";
  if (["鎧上", "裁縫上"].includes(value)) return "体上";
  if (["鎧下", "裁縫下"].includes(value)) return "体下";
  if (["鎧腕", "裁縫腕"].includes(value)) return "腕";
  if (["鎧足", "裁縫足"].includes(value)) return "足";
  if (["盾", "小盾", "大盾"].includes(value)) return "盾";
  if (itemKind === "武器" || WEAPON_TYPES.includes(value)) return "武器";

  return "その他";
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
    slotGridCols: item.slotGridCols,
    slotGridType: item.slotGridType,
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
    row?.materialsJson ?? row?.materials_json,
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
    slot:
      row?.slot ||
      getDisplaySlot(row?.itemType ?? row?.item_type, row?.itemKind ?? row?.item_kind),
    itemType: row?.itemType ?? row?.item_type ?? "",
    craftType:
      row?.equipmentType?.craftType?.name ??
      row?.equipmentType?.craft_type?.name ??
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
    slotGridCols: Number(row?.slotGridCols ?? row?.slot_grid_cols ?? 0) || null,
    slotGridType:
      row?.slotGridType ??
      row?.slot_grid_type ??
      row?.itemType ??
      row?.item_type ??
      "",
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
  const normalized = (rows || []).map((row) =>
    normalizeEquipmentRow(row, itemMap)
  );

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
    group.items.sort((a, b) => {
      const sa = SLOT_ORDER_MAP[a.slot] ?? 99;
      const sb = SLOT_ORDER_MAP[b.slot] ?? 99;
      if (sa !== sb) return sa - sb;
      return collator.compare(a.name, b.name);
    });

    return group;
  });

  return [...grouped, ...singles].sort((a, b) => {
    const ca = CATEGORY_ORDER[a.craftType] ?? 99;
    const cb = CATEGORY_ORDER[b.craftType] ?? 99;
    if (ca !== cb) return ca - cb;
    return collator.compare(a.name, b.name);
  });
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
    new Set((items || []).map((item) => item.slot || "その他"))
  );

  slots.sort((a, b) => {
    const ia = SLOT_ORDER_MAP[a] ?? 99;
    const ib = SLOT_ORDER_MAP[b] ?? 99;
    if (ia !== ib) return ia - ib;
    return collator.compare(a, b);
  });

  return slots;
}

export function buildMatrix(selectedSet) {
  if (!selectedSet) {
    return { slots: [], rows: [], slotGrids: {}, slotGridMeta: {} };
  }

  const normalizedItems =
    Array.isArray(selectedSet.items) && selectedSet.items.length
      ? selectedSet.items
      : Array.isArray(selectedSet.materials) || selectedSet.slotGrid
      ? [
          {
            id: selectedSet.id,
            name: selectedSet.name,
            slot: selectedSet.slot || "その他",
            materials: Array.isArray(selectedSet.materials)
              ? selectedSet.materials
              : [],
            slotGrid: selectedSet.slotGrid,
            slotGridCols: selectedSet.slotGridCols,
            slotGridType: selectedSet.slotGridType,
          },
        ]
      : [];

  const slots = normalizeSlots(normalizedItems);
  const materialMap = new Map();

  for (const item of normalizedItems) {
    const slot = item.slot || "その他";

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
      current.perSlotQty[slot] = (current.perSlotQty[slot] || 0) + qty;
      current.totalQty += qty;

      if (!current.defaultUnitCost && material.defaultUnitCost != null) {
        current.defaultUnitCost = Number(material.defaultUnitCost);
      }

      materialMap.set(key, current);
    }
  }

  const rows = Array.from(materialMap.values()).sort((a, b) =>
    collator.compare(a.materialName, b.materialName)
  );

  const slotGrids = {};
  const slotGridMeta = {};

  for (const item of normalizedItems) {
    const slot = item.slot || "その他";

    if (item.slotGrid) {
      slotGrids[slot] = item.slotGrid;
    }

    if (item.slotGridCols != null || item.slotGridType != null) {
      slotGridMeta[slot] = {
        cols: item.slotGridCols != null ? Number(item.slotGridCols) : null,
        type: item.slotGridType ?? null,
      };
    }
  }

  return { slots, rows, slotGrids, slotGridMeta };
}

export function getSlotItemName(selectedSet, slot) {
  if (!selectedSet) return null;

  if (Array.isArray(selectedSet.items)) {
    const item = selectedSet.items.find((it) => it.slot === slot);
    return item?.name ?? null;
  }

  if (selectedSet.slot === slot) return selectedSet.name;
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

export function getSlotGridInfo(slot, slotGrids) {
  return {
    grid: slotGrids?.[slot] ?? DEFAULT_SLOT_GRIDS?.[slot] ?? null,
  };
}

export function buildInitialUnitCostMap(setObj) {
  const initialMap = {};
  const { rows } = buildMatrix(setObj);

  for (const row of rows) {
    initialMap[row.materialKey] = row.defaultUnitCost || 0;
  }

  return initialMap;
}

export function getCrystalInfo(selectedSet) {
  const level =
    Number(selectedSet?.equipLevel ?? 0) ||
    Number(selectedSet?.items?.[0]?.equipLevel ?? 0);

  if (!level) return null;

  return getCrystalByEquipLevel(level);
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