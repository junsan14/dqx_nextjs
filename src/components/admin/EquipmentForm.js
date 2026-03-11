"use client";

import React, { useMemo, useState, useEffect } from "react";
import axios from "@/lib/axios";
import styles from "./EquipmentForm.module.css";

const DEFAULT_HEADERS = [
  "itemId",
  "itemName",
  "itemKind",
  "itemTypeKey",
  "itemType",
  "craftType",
  "craftLevel",
  "equipLevel",
  "recipeBook",
  "recipePlace",
  "slot",
  "slotGridType",
  "slotGridCols",
  "groupKind",
  "groupId",
  "groupName",
  "itemsCount",
  "materialsJson",
  "slotGridJson",
  "jobsJson",
  "equipableType",
];

const ITEM_KIND_OPTIONS = ["武器", "防具"];

const CRAFT_TYPE_OPTIONS = ["武器鍛冶", "防具鍛冶", "裁縫", "ランプ", "つぼ", "木工"];

const WEAPON_ITEM_TYPES = [
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

const ARMOR_ITEM_TYPES = [
  "鎧頭",
  "鎧上",
  "鎧下",
  "鎧腕",
  "鎧足",
  "裁縫頭",
  "裁縫上",
  "裁縫下",
  "裁縫腕",
  "裁縫足",
  "盾",
];

const DEFAULT_GRID_TYPES = [...WEAPON_ITEM_TYPES, ...ARMOR_ITEM_TYPES];

const DEFAULT_JOBS = [
  "戦士",
  "僧侶",
  "魔法使い",
  "武闘家",
  "盗賊",
  "旅芸人",
  "バトルマスター",
  "パラディン",
  "魔法戦士",
  "レンジャー",
  "賢者",
  "スーパースター",
  "まもの使い",
  "どうぐ使い",
  "踊り子",
  "占い師",
  "天地雷鳴士",
  "遊び人",
  "デスマスター",
  "魔剣士",
  "海賊",
  "ガーディアン",
  "竜術士",
  "隠者",
];

const WEAPON_DEFAULT_JOBS = {
  片手剣: ["戦士", "バトルマスター", "魔法戦士", "占い師", "遊び人", "パラディン", "魔剣士", "ガーディアン"],
  両手剣: ["戦士", "バトルマスター", "まもの使い", "魔剣士", "ガーディアン"],
  短剣: ["魔法使い", "盗賊", "旅芸人", "踊り子", "遊び人", "魔剣士", "海賊"],
  ヤリ: ["僧侶", "パラディン", "どうぐ使い", "武闘家", "ガーディアン"],
  オノ: ["戦士", "レンジャー", "まもの使い", "デスマスター", "海賊"],
  ハンマー: ["バトルマスター", "パラディン", "どうぐ使い", "遊び人"],
  ツメ: ["武闘家", "盗賊", "まもの使い", "レンジャー"],
  ムチ: ["魔法使い", "盗賊", "スーパースター", "まもの使い", "占い師"],
  ブーメラン: ["レンジャー", "賢者", "どうぐ使い", "遊び人", "旅芸人", "海賊", "隠者"],
  スティック: ["僧侶", "パラディン", "スーパースター", "踊り子", "天地雷鳴士", "竜術士", "隠者"],
  両手杖: ["魔法使い", "魔法戦士", "賢者", "天地雷鳴士", "竜術士"],
  棍: ["僧侶", "武闘家", "旅芸人", "占い師", "デスマスター"],
  扇: ["武闘家", "旅芸人", "スーパースター", "踊り子", "天地雷鳴士", "賢者", "隠者"],
  弓: ["魔法戦士", "レンジャー", "賢者", "どうぐ使い", "占い師", "デスマスター", "海賊", "竜術士", "隠者"],
  鎌: ["デスマスター", "スーパースター", "魔剣士", "竜術士"],
  大盾: ["戦士", "パラディン", "魔法戦士", "魔剣士", "ガーディアン"],
  小盾: ["戦士", "僧侶", "魔法", "盗賊", "旅芸人", "パラディン", "魔法戦士", "レンジャー", "賢者", "スーパースター", "どうぐ使い", "占い師", "天地雷鳴士", "遊び人", "魔剣士", "海賊", "ガーディアン", "竜術士", "隠者"],
};

const ARMOR_GROUP_DEFAULT_JOBS = {
  戦士系: ["戦士", "パラディン", "魔法戦士(スキル)", "魔剣士", "ガーディアン"],
  "僧侶・魔法使い系": ["僧侶", "魔法使い", "賢者", "占い師", "天地雷鳴士", "デスマスター", "竜術士", "隠者"],
  武闘家系: ["武闘家", "バトルマスター", "まもの使い", "踊り子"],
  盗賊系: ["盗賊", "魔法戦士", "どうぐ使い", "海賊"],
  旅芸人系: ["旅芸人", "レンジャー", "スーパースター", "踊り子", "遊び人"],
};

const WEAPON_EQUIPABLE_TYPES = [
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

const ARMOR_EQUIPABLE_TYPES = ["戦士系", "僧侶・魔法使い系", "武闘家系", "盗賊系", "旅芸人系"];

const GROUP_MEMBER_PRESETS = {
  armor_set: [
    { key: "head", label: "頭", itemType: "鎧頭" },
    { key: "bodyTop", label: "体上", itemType: "鎧上" },
    { key: "bodyBottom", label: "体下", itemType: "鎧下" },
    { key: "arm", label: "腕", itemType: "鎧腕" },
    { key: "foot", label: "足", itemType: "鎧足" },
  ],
  tailoring_set: [
    { key: "head", label: "頭", itemType: "裁縫頭" },
    { key: "bodyTop", label: "体上", itemType: "裁縫上" },
    { key: "bodyBottom", label: "体下", itemType: "裁縫下" },
    { key: "arm", label: "腕", itemType: "裁縫腕" },
    { key: "foot", label: "足", itemType: "裁縫足" },
  ],
};

const GRID_TYPE_PRESETS = {
  鎧頭: { rows: 2, cols: 2, disabledCells: [] },
  鎧上: { rows: 3, cols: 2, disabledCells: [] },
  鎧下: { rows: 4, cols: 2, disabledCells: [] },
  鎧腕: { rows: 3, cols: 1, disabledCells: [] },
  鎧足: { rows: 3, cols: 2, disabledCells: [[0, 0], [1, 0]] },

  裁縫頭: { rows: 2, cols: 3, disabledCells: [[0, 0], [0, 2]] },
  裁縫上: { rows: 3, cols: 3, disabledCells: [] },
  裁縫下: { rows: 3, cols: 2, disabledCells: [] },
  裁縫腕: { rows: 2, cols: 3, disabledCells: [] },
  裁縫足: { rows: 2, cols: 2, disabledCells: [] },

  盾: { rows: 2, cols: 2, disabledCells: [] },

  片手剣: { rows: 3, cols: 1, disabledCells: [] },
  両手剣: { rows: 4, cols: 2, disabledCells: [] },
  短剣: { rows: 2, cols: 1, disabledCells: [] },
  ヤリ: { rows: 4, cols: 1, disabledCells: [] },
  オノ: { rows: 4, cols: 2, disabledCells: [[2, 1], [3, 1]] },
  ハンマー: { rows: 3, cols: 2, disabledCells: [] },
  ツメ: { rows: 2, cols: 2, disabledCells: [] },
  ムチ: { rows: 4, cols: 2, disabledCells: [[3, 1]] },
  ブーメラン: { rows: 3, cols: 2, disabledCells: [[1, 0]] },
  スティック: { rows: 2, cols: 1, disabledCells: [] },
  両手杖: { rows: 3, cols: 1, disabledCells: [] },
  棍: { rows: 3, cols: 2, disabledCells: [] },
  扇: { rows: 2, cols: 2, disabledCells: [] },
  弓: { rows: 3, cols: 2, disabledCells: [[1, 1]] },
  鎌: { rows: 4, cols: 2, disabledCells: [[1, 1], [2, 1], [3, 1]] },
};

const WEAPON_GRID_TYPES = [...WEAPON_ITEM_TYPES];
const ARMOR_GRID_TYPES = ["鎧頭", "鎧上", "鎧下", "鎧腕", "鎧足", "盾"];
const SEWING_GRID_TYPES = ["裁縫頭", "裁縫上", "裁縫下", "裁縫腕", "裁縫足"];

const WEAPON_ITEM_TYPE_KEYS = {
  片手剣: "katateken",
  両手剣: "ryouteken",
  短剣: "tanken",
  ヤリ: "yari",
  オノ: "ono",
  ハンマー: "hammer",
  ツメ: "tsume",
  ムチ: "muchi",
  ブーメラン: "boomerang",
  スティック: "stick",
  両手杖: "tsue",
  棍: "kon",
  扇: "ougi",
  弓: "yumi",
  鎌: "kama",
  盾: "shield",
};

const ARMOR_ITEM_TYPE_KEYS = {
  防具鍛冶: {
    鎧頭: "armor_head",
    鎧上: "armor_body_up",
    鎧下: "armor_body_down",
    鎧腕: "armor_arm",
    鎧足: "armor_foot",
    盾: "shield",
  },
  裁縫: {
    裁縫頭: "tailor_head",
    裁縫上: "tailor_body_up",
    裁縫下: "tailor_body_down",
    裁縫腕: "tailor_arm",
    裁縫足: "tailor_foot",
    盾: "shield",
  },
};

function getItemTypeKey(itemType, itemKind = "", craftType = "") {
  const type = (itemType || "").trim();
  const kind = (itemKind || "").trim();
  const craft = (craftType || "").trim();

  if (!type) return "";

  if (kind === "武器" || WEAPON_ITEM_TYPES.includes(type)) {
    return WEAPON_ITEM_TYPE_KEYS[type] ?? "";
  }

  if (kind === "防具" || ARMOR_ITEM_TYPES.includes(type) || type === "盾") {
    const craftMap = ARMOR_ITEM_TYPE_KEYS[craft] ?? {};
    return craftMap[type] ?? (type === "盾" ? "shield" : "");
  }

  return "";
}

function buildRowDerivedFields(baseRow) {
  const itemType = (baseRow?.itemType ?? "").trim();
  const itemKind = (baseRow?.itemKind ?? "").trim();
  const craftType = (baseRow?.craftType ?? "").trim();
  const slotGridType = getGridTypeFromItemType(itemType);
  const size = parseGridTypeToSize(slotGridType);
  const currentGrid = safeJsonParse(baseRow?.slotGridJson ?? "", null);

  let slotGridJson = baseRow?.slotGridJson ?? "";
  if (slotGridType && size.rows != null && size.cols != null && currentGrid == null) {
    slotGridJson = toJsonString(denormalizeGrid(ensureGridSize([], size.rows, size.cols)), "");
  }

  return {
    itemTypeKey: getItemTypeKey(itemType, itemKind, craftType),
    slot: getDisplaySlotFromItemType(itemType, itemKind),
    slotGridType,
    slotGridCols: size.cols != null ? String(size.cols) : "",
    slotGridJson,
  };
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeJsonParse(s, fallback) {
  if (s == null || s === "") return fallback;
  if (Array.isArray(s) || (typeof s === "object" && s !== null)) return s;
  if (typeof s !== "string") return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function toJsonString(v, fallbackJson = "[]") {
  try {
    return JSON.stringify(v ?? safeJsonParse(fallbackJson, []));
  } catch {
    return fallbackJson;
  }
}

function str(v) {
  return v == null ? "" : String(v);
}

function makeKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `k_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function makeItemId(row) {
  const craft = (row.craftType || "").trim();
  const name = (row.itemName || "").trim();
  if (!name) return "";
  return craft ? `${craft}_${name}` : name;
}

function getGroupKindPreset(craftType, itemKind) {
  const craft = (craftType || "").trim();
  const kind = (itemKind || "").trim();
  if (kind === "防具" && craft === "防具鍛冶") return "armor_set";
  if (kind === "防具" && craft === "裁縫") return "tailoring_set";
  return "armor_set";
}

function getGroupMemberPreset(groupKind) {
  return GROUP_MEMBER_PRESETS[groupKind] ?? [];
}

function buildEmptyGroupMembers(groupKind) {
  return getGroupMemberPreset(groupKind).map((x) => ({
    key: x.key,
    enabled: true,
    slotLabel: x.label,
    itemType: x.itemType,
    itemName: "",
  }));
}

function makeGroupId(groupName, craftType) {
  const base = (groupName || "").trim();
  if (!base) return "";
  return makeItemId({ itemName: `${base}_group`, craftType });
}

function getDefaultGroupItemName(groupName, slotLabel, itemType) {
  const base = (groupName || "").trim();
  if (!base) return "";
  const suffixMap = {
    鎧頭: "ヘルム",
    鎧上: "メイル上",
    鎧下: "メイル下",
    鎧腕: "グローブ",
    鎧足: "グリーブ",
    裁縫頭: "ハット",
    裁縫上: "ウェア上",
    裁縫下: "ウェア下",
    裁縫腕: "グローブ",
    裁縫足: "ブーツ",
  };
  const suffix = suffixMap[itemType] || slotLabel || "";
  return suffix ? `${base}${suffix}` : base;
}

function normalizeMaterial(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    return {
      name: raw,
      qty: 0,
      defaultUnitCost: 0,
    };
  }

  const name = raw.name ?? raw.material_name ?? raw.item_name ?? raw.label ?? "";
  if (!name) return null;

  const qty = Number(raw.qty ?? raw.quantity ?? raw.count ?? raw.num ?? 0) || 0;
  const defaultUnitCost =
    Number(raw.defaultUnitCost ?? raw.default_unit_cost ?? raw.unitCost ?? raw.unit_cost ?? raw.price ?? 0) || 0;

  return {
    name,
    qty,
    defaultUnitCost,
  };
}

function normalizeGrid(gridLike, colsHint) {
  if (!gridLike) return { grid: [], rows: 0, cols: colsHint || 0 };

  if (Array.isArray(gridLike) && gridLike.every((x) => Array.isArray(x))) {
    const rows = gridLike.length;
    const cols = Math.max(colsHint || 0, ...gridLike.map((r) => (Array.isArray(r) ? r.length : 0)), 0);
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => gridLike?.[r]?.[c] ?? "")
    );
    return { grid, rows, cols };
  }

  if (Array.isArray(gridLike)) {
    const cols = Math.max(colsHint || 0, gridLike.length, 0);
    const grid = [Array.from({ length: cols }, (_, c) => gridLike?.[c] ?? "")];
    return { grid, rows: 1, cols };
  }

  return { grid: [], rows: 0, cols: colsHint || 0 };
}

function denormalizeGrid(grid2d) {
  if (!Array.isArray(grid2d) || grid2d.length === 0) return null;
  const rows = grid2d.length;
  const cols = Math.max(...grid2d.map((r) => r.length), 0);
  const trimmed = grid2d.map((r) => Array.from({ length: cols }, (_, c) => r?.[c] ?? ""));
  if (rows === 1) return trimmed[0];
  return trimmed;
}

function ensureGridSize(curGrid, rowsCount, colsCount) {
  return Array.from({ length: rowsCount }, (_, r) =>
    Array.from({ length: colsCount }, (_, c) => curGrid?.[r]?.[c] ?? "")
  );
}

function parseGridTypeToSize(gridType) {
  const gt = (gridType || "").trim();
  if (GRID_TYPE_PRESETS[gt]) {
    return {
      rows: GRID_TYPE_PRESETS[gt].rows,
      cols: GRID_TYPE_PRESETS[gt].cols,
    };
  }
  return { rows: null, cols: null };
}

function getGridPreset(gridType) {
  const gt = (gridType || "").trim();
  return GRID_TYPE_PRESETS[gt] ?? null;
}

function isDisabledCell(gridType, r, c) {
  const preset = getGridPreset(gridType);
  if (!preset || !Array.isArray(preset.disabledCells)) return false;
  return preset.disabledCells.some(([rr, cc]) => rr === r && cc === c);
}

function getDefaultJobsForEquipableType(equipableType, allJobs) {
  const key = (equipableType || "").trim();
  if (!key) return null;

  const a = ARMOR_GROUP_DEFAULT_JOBS[key];
  if (a) return a.slice();

  const w = WEAPON_DEFAULT_JOBS[key];
  if (!w) return null;
  if (w === "__ALL__") return allJobs.slice();
  return w.slice();
}

function getItemTypeOptions(itemKind, craftType = "") {
  const kind = (itemKind || "").trim();
  const craft = (craftType || "").trim();

  if (kind === "武器") return WEAPON_ITEM_TYPES;
  if (kind === "防具") {
    if (craft === "防具鍛冶") return ARMOR_GRID_TYPES;
    if (craft === "裁縫") return SEWING_GRID_TYPES;
    return ARMOR_ITEM_TYPES;
  }
  return [...WEAPON_ITEM_TYPES, ...ARMOR_ITEM_TYPES];
}

function getGridTypeFromItemType(itemType) {
  const v = (itemType || "").trim();
  return GRID_TYPE_PRESETS[v] ? v : "";
}

function getDisplaySlotFromItemType(itemType, itemKind = "") {
  const v = (itemType || "").trim();
  if (!v) return "";
  if (["鎧頭", "裁縫頭"].includes(v)) return "頭";
  if (["鎧上", "裁縫上"].includes(v)) return "体上";
  if (["鎧下", "裁縫下"].includes(v)) return "体下";
  if (["鎧腕", "裁縫腕"].includes(v)) return "腕";
  if (["鎧足", "裁縫足"].includes(v)) return "足";
  if (v === "盾" || v === "小盾" || v === "大盾") return "盾";
  if (itemKind === "武器" || WEAPON_ITEM_TYPES.includes(v)) return "武器";
  return v;
}

function getGroupDisplayName(row) {
  return (row?.groupName ?? "").toString().trim() || (row?.itemName ?? "").toString().trim();
}

function isGroupedRow(row, groupCountMap = new Map()) {
  const kind = (row?.groupKind ?? "").toString().trim();
  const count = Number(row?.itemsCount ?? 0) || 0;
  const gid = (row?.groupId ?? "").toString().trim();

  if (kind.endsWith("_set")) return true;
  if (count > 1) return true;
  if (gid && (groupCountMap.get(gid) ?? 0) > 1) return true;

  return false;
}

function buildGroupedRows(rows) {
  const map = new Map();

  const groupCountMap = new Map();
  for (const row of rows) {
    const gid = (row?.groupId ?? "").toString().trim();
    if (!gid) continue;
    groupCountMap.set(gid, (groupCountMap.get(gid) ?? 0) + 1);
  }

  for (const row of rows) {
    const groupId = (row?.groupId ?? "").toString().trim();
    const grouped = isGroupedRow(row, groupCountMap);

    if (!grouped) {
      map.set(`single:${row.__key}`, {
        __kind: "single",
        __key: row.__key,
        label: (row?.itemName ?? "").toString(),
        searchText: [row?.itemName, row?.groupName, row?.itemType, row?.craftType].filter(Boolean).join(" "),
        row,
      });
      continue;
    }

    const groupKey = groupId || `nogid:${row.__key}`;

    const existing = map.get(`group:${groupKey}`) ?? {
      __kind: "group",
      __key: `group:${groupKey}`,
      groupId: groupKey,
      label: getGroupDisplayName(row),
      searchText: "",
      craftType: row?.craftType ?? "",
      equipLevel: row?.equipLevel ?? "",
      craftLevel: row?.craftLevel ?? "",
      recipeBook: row?.recipeBook ?? "",
      recipePlace: row?.recipePlace ?? "",
      itemKind: row?.itemKind ?? "",
      groupKind: row?.groupKind ?? "",
      items: [],
      rows: [],
    };

    existing.rows.push(row);
    existing.items.push({
      __key: row.__key,
      itemName: row?.itemName ?? "",
      itemType: row?.itemType ?? "",
      slotLabel: getDisplaySlotFromItemType(row?.itemType ?? "", row?.itemKind ?? ""),
      craftType: row?.craftType ?? "",
      equipLevel: row?.equipLevel ?? "",
      craftLevel: row?.craftLevel ?? "",
      recipeBook: row?.recipeBook ?? "",
      recipePlace: row?.recipePlace ?? "",
      materialsJson: row?.materialsJson ?? "[]",
      slotGridJson: row?.slotGridJson ?? "",
      slotGridType: row?.slotGridType ?? "",
      slotGridCols: row?.slotGridCols ?? "",
      jobsJson: row?.jobsJson ?? "[]",
      equipableType: row?.equipableType ?? "",
      row,
    });

    existing.searchText = [
      existing.label,
      ...existing.items.map((x) => `${x.itemName} ${x.slotLabel} ${x.itemType}`),
      existing.craftType,
    ]
      .filter(Boolean)
      .join(" ");

    map.set(`group:${groupKey}`, existing);
  }

  const slotOrder = { 頭: 1, 体上: 2, 体下: 3, 腕: 4, 足: 5, 盾: 6, 武器: 7 };

  const result = Array.from(map.values()).map((entry) => {
    if (entry.__kind === "group") {
      entry.items.sort((a, b) => {
        const sa = slotOrder[a.slotLabel] ?? 99;
        const sb = slotOrder[b.slotLabel] ?? 99;
        if (sa !== sb) return sa - sb;
        return String(a.itemName).localeCompare(String(b.itemName), "ja");
      });
    }
    return entry;
  });

  return result.sort((a, b) => String(a.label).localeCompare(String(b.label), "ja"));
}

function normalizeOneRowFromApi(row, headers) {
  const rr = {};
  headers.forEach((h) => (rr[h] = ""));

  const materials = safeJsonParse(row?.materials_json, Array.isArray(row?.materials_json) ? row.materials_json : []);
  const slotGrid = safeJsonParse(row?.slot_grid_json, row?.slot_grid_json ?? null);
  const jobs = safeJsonParse(row?.jobs_json, Array.isArray(row?.jobs_json) ? row.jobs_json : []);
  const effects = safeJsonParse(row?.effects_json, Array.isArray(row?.effects_json) ? row.effects_json : []);
  rr.id = row?.id ?? null;
  rr.itemId = str(row?.item_id ?? row?.id ?? "");
  rr.itemName = str(row?.item_name ?? "");
  rr.itemKind = str(row?.item_kind ?? "");
  rr.itemTypeKey = str(row?.item_type_key ?? "");
  rr.itemType = str(row?.item_type ?? "");
  rr.craftType = str(row?.craft_type ?? "");
  rr.craftLevel = str(row?.craft_level ?? "");
  rr.equipLevel = str(row?.equip_level ?? "");
  rr.recipeBook = str(row?.recipe_book ?? "");
  rr.recipePlace = str(row?.recipe_place ?? "");
  rr.slot = str(row?.slot ?? getDisplaySlotFromItemType(row?.item_type ?? "", row?.item_kind ?? ""));
  rr.slotGridType = str(row?.slot_grid_type ?? row?.item_type ?? "");
  rr.slotGridCols = str(row?.slot_grid_cols ?? "");
  rr.groupKind = str(row?.group_kind ?? "");
  rr.groupId = str(row?.group_id ?? row?.item_id ?? row?.id ?? "");
  rr.groupName = str(row?.group_name ?? row?.item_name ?? "");
  rr.itemsCount = str(row?.items_count ?? "1");
  rr.materialsJson = toJsonString(
    Array.isArray(materials) ? materials.map(normalizeMaterial).filter(Boolean) : [],
    "[]"
  );
  rr.slotGridJson = slotGrid == null ? "" : toJsonString(slotGrid, "");
  rr.jobsJson = toJsonString(Array.isArray(jobs) ? jobs : [], "[]");
  rr.equipableType = str(row?.equipable_type ?? "");
  rr.effectsJson = toJsonString(Array.isArray(effects) ? effects : [], "[]");

  const derived = buildRowDerivedFields(rr);
  Object.assign(rr, derived);

  if (!rr.itemId || rr.itemId.trim() === "") rr.itemId = makeItemId(rr);
  if (!rr.groupId || rr.groupId.trim() === "") rr.groupId = rr.itemId;

  rr.__key = makeKey();
  return rr;
}

function buildApiPayload(row) {
  const derived = buildRowDerivedFields(row);

  return {
    item_id: (row.itemId ?? "").trim() || null,
    item_name: row.itemName,
    item_kind: row.itemKind,
    item_type_key: derived.itemTypeKey,
    item_type: row.itemType,
    craft_type: row.craftType,
    craft_level: row.craftLevel === "" ? null : Number(row.craftLevel),
    equip_level: row.equipLevel === "" ? null : Number(row.equipLevel),
    recipe_book: row.recipeBook,
    recipe_place: row.recipePlace,
    slot: derived.slot,
    slot_grid_type: derived.slotGridType,
    slot_grid_cols: derived.slotGridCols === "" ? null : Number(derived.slotGridCols),
    group_kind: row.groupKind,
    group_id: row.groupId,
    group_name: row.groupName,
    items_count: row.itemsCount === "" ? 1 : Number(row.itemsCount),
    materials_json: safeJsonParse(row.materialsJson, []),
    slot_grid_json: derived.slotGridJson === "" ? null : safeJsonParse(derived.slotGridJson, null),
    jobs_json: safeJsonParse(row.jobsJson, []),
    equipable_type: row.equipableType,
  };
}

export default function EquipmentAdmin() {
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [syncGroup, setSyncGroup] = useState(true);
  const [selectedKey, setSelectedKey] = useState("");

  const [gridRows, setGridRows] = useState(0);
  const [gridCols, setGridCols] = useState(0);
  const [grid2d, setGrid2d] = useState([]);

  const [newMode, setNewMode] = useState("single");
  const [newItem, setNewItem] = useState({
    itemName: "",
    craftType: "",
    itemType: "",
    itemKind: "",
  });

  const [newGroup, setNewGroup] = useState({
    groupName: "",
    craftType: "",
    itemKind: "防具",
    groupKind: "armor_set",
    members: buildEmptyGroupMembers("armor_set"),
  });

  const [jobQuery, setJobQuery] = useState("");
  const [materialQuery, setMaterialQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRow = useMemo(() => {
    if (!selectedKey) return null;
    return rows.find((r) => r.__key === selectedKey) ?? null;
  }, [rows, selectedKey]);

  useEffect(() => {
    if (rows.length === 0) {
      if (selectedKey) setSelectedKey("");
      return;
    }
    const exists = rows.some((r) => r.__key === selectedKey);
    if (!exists) setSelectedKey(rows[0].__key);
  }, [rows, selectedKey]);

  useEffect(() => {
    fetchEquipments();
  }, []);

  async function fetchEquipments() {
    setLoading(true);
    try {
      const res = await axios.get("/api/equipments");
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const normalized = list.map((row) => normalizeOneRowFromApi(row, headers));
      setRows(normalized);
      if (normalized[0]) setSelectedKey(normalized[0].__key);
    } catch (error) {
      console.error(error);
      alert("装備データの読み込みに失敗した");
    } finally {
      setLoading(false);
    }
  }

  const enums = useMemo(() => {
    const uniq = (key) =>
      Array.from(new Set(rows.map((r) => str(r[key]).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ja"));

    const craftTypes = Array.from(new Set([...CRAFT_TYPE_OPTIONS, ...uniq("craftType")]));
    const itemTypes = Array.from(new Set([...WEAPON_ITEM_TYPES, ...ARMOR_ITEM_TYPES, ...uniq("itemType")])).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
    const itemKinds = Array.from(new Set([...ITEM_KIND_OPTIONS, ...uniq("itemKind")])).sort((a, b) => a.localeCompare(b, "ja"));
    const slots = uniq("slot");

    const gridTypes = Array.from(new Set([...DEFAULT_GRID_TYPES, ...uniq("slotGridType")])).sort((a, b) =>
      a.localeCompare(b, "ja")
    );

    const materialSet = new Set();
    for (const r of rows) {
      const arr = safeJsonParse(r.materialsJson, []);
      if (!Array.isArray(arr)) continue;
      for (const m of arr) {
        const name = (m?.name ?? "").toString().trim();
        if (name) materialSet.add(name);
      }
    }
    const materialNames = Array.from(materialSet).sort((a, b) => a.localeCompare(b, "ja"));

    const jobSet = new Set(DEFAULT_JOBS);
    for (const r of rows) {
      const arr = safeJsonParse(r.jobsJson, []);
      if (!Array.isArray(arr)) continue;
      for (const j of arr) {
        const name = (j ?? "").toString().trim();
        if (name) jobSet.add(name);
      }
    }
    const jobNames = Array.from(jobSet).sort((a, b) => a.localeCompare(b, "ja"));

    const equipableFromCsv = uniq("equipableType");
    const equipableTypeOptions = Array.from(
      new Set([...equipableFromCsv, ...WEAPON_EQUIPABLE_TYPES, ...ARMOR_EQUIPABLE_TYPES, "大盾", "小盾"])
    ).sort((a, b) => a.localeCompare(b, "ja"));

    return { craftTypes, itemTypes, itemKinds, slots, gridTypes, materialNames, jobNames, equipableTypeOptions };
  }, [rows]);

  const displayEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const grouped = buildGroupedRows(rows);
    if (!q) return grouped;

    return grouped.filter((entry) => {
      const baseText = (entry.searchText || "").toLowerCase();

      if (entry.__kind === "group") {
        const equipLevels = Array.isArray(entry.items) ? entry.items.map((it) => String(it.equipLevel ?? "")).join(" ") : "";
        const craftLevels = Array.isArray(entry.items) ? entry.items.map((it) => String(it.craftLevel ?? "")).join(" ") : "";
        const groupEquipLevel = String(entry.equipLevel ?? "");
        const groupCraftLevel = String(entry.craftLevel ?? "");

        return (
          baseText.includes(q) ||
          groupEquipLevel.includes(q) ||
          groupCraftLevel.includes(q) ||
          equipLevels.includes(q) ||
          craftLevels.includes(q)
        );
      }

      const rowEquipLevel = String(entry.row?.equipLevel ?? "");
      const rowCraftLevel = String(entry.row?.craftLevel ?? "");

      return baseText.includes(q) || rowEquipLevel.includes(q) || rowCraftLevel.includes(q);
    });
  }, [rows, query]);

  const gridTypeOptionsForSelectedRow = useMemo(() => {
    const itemKind = (selectedRow?.itemKind ?? "").trim();
    const craftType = (selectedRow?.craftType ?? "").trim();

    if (itemKind === "武器") return WEAPON_GRID_TYPES;
    if (itemKind === "防具") {
      if (craftType === "防具鍛冶") return ARMOR_GRID_TYPES;
      if (craftType === "裁縫") return SEWING_GRID_TYPES;
      return ARMOR_ITEM_TYPES;
    }

    if (craftType === "武器鍛冶") return WEAPON_GRID_TYPES;
    if (craftType === "防具鍛冶") return ARMOR_GRID_TYPES;
    if (craftType === "裁縫") return SEWING_GRID_TYPES;

    return enums.gridTypes;
  }, [selectedRow?.itemKind, selectedRow?.craftType, enums.gridTypes]);

  const itemTypeOptionsForSelectedRow = useMemo(() => {
    return getItemTypeOptions(selectedRow?.itemKind ?? "", selectedRow?.craftType ?? "");
  }, [selectedRow?.itemKind, selectedRow?.craftType]);

  const itemTypeOptionsForNewItem = useMemo(() => {
    return getItemTypeOptions(newItem.itemKind, newItem.craftType);
  }, [newItem.itemKind, newItem.craftType]);

  const groupKindOptions = useMemo(() => ["armor_set", "tailoring_set"], []);

  const materials = useMemo(() => {
    if (!selectedRow) return [];
    const arr = safeJsonParse(selectedRow.materialsJson, []);
    if (!Array.isArray(arr)) return [];
    return arr.map((m) => ({
      name: m?.name ?? "",
      qty: Number(m?.qty ?? 0),
      defaultUnitCost: Number(m?.defaultUnitCost ?? 0),
    }));
  }, [selectedRow]);

  const jobs = useMemo(() => {
    if (!selectedRow) return [];
    const arr = safeJsonParse(selectedRow.jobsJson, []);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => (x ?? "").toString()).filter(Boolean);
  }, [selectedRow]);

  const materialCandidates = useMemo(() => {
    const q = materialQuery.trim();
    if (!q) return enums.materialNames;
    return enums.materialNames.filter((x) => x.includes(q));
  }, [enums.materialNames, materialQuery]);

  const isSelectedGrouped = useMemo(() => {
    if (!selectedRow) return false;
    const gid = (selectedRow.groupId ?? "").trim();
    if (!gid) return false;
    return rows.filter((r) => (r.groupId ?? "").trim() === gid).length > 1;
  }, [rows, selectedRow]);

  useEffect(() => {
    if (!selectedRow) {
      setGridRows(1);
      setGridCols(1);
      setGrid2d([[""]]);
      return;
    }

    const gridType = (selectedRow.slotGridType ?? "").trim();
    const preset = GRID_TYPE_PRESETS[gridType] ?? null;

    const colsHintFromRow = Number(selectedRow.slotGridCols ?? 0) || 0;
    const colsHint = preset?.cols ?? colsHintFromRow;

    const gridLike = safeJsonParse(selectedRow.slotGridJson, null);
    const norm = normalizeGrid(gridLike, colsHint);

    const rowsCount = preset?.rows ?? (norm.rows > 0 ? norm.rows : 1);
    const colsCount = preset?.cols ?? (norm.cols > 0 ? norm.cols : 1);
    const baseGrid = norm.rows > 0 && norm.cols > 0 ? norm.grid : [];

    const resized = ensureGridSize(baseGrid, rowsCount, colsCount);

    setGridRows(rowsCount);
    setGridCols(colsCount);
    setGrid2d(resized);
  }, [selectedRow?.__key]);

  function applyDerivedFields(rowLike) {
    return {
      ...rowLike,
      ...buildRowDerivedFields(rowLike),
    };
  }

  function setSelectedRowPatch(patch) {
    if (!selectedKey) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.__key !== selectedKey) return r;
        const next = applyDerivedFields({ ...r, ...patch });

        if (!next.itemId || next.itemId.trim() === "") next.itemId = makeItemId(next);
        if ((next.groupId ?? "").trim() === "" && next.itemId) next.groupId = next.itemId;

        return next;
      })
    );
  }

  function setGroupPatch(patch) {
    if (!selectedRow) return;

    const gid = (selectedRow.groupId ?? "").trim();
    if (!gid) {
      setSelectedRowPatch(patch);
      return;
    }

    setRows((prev) =>
      prev.map((r) => {
        if ((r.groupId ?? "").trim() !== gid) return r;

        const next = applyDerivedFields({ ...r, ...patch });
        if (!next.itemId || next.itemId.trim() === "") next.itemId = makeItemId(next);
        if ((next.groupId ?? "").trim() === "" && next.itemId) next.groupId = next.itemId;

        return next;
      })
    );
  }

  function newEmpty() {
    setHeaders(DEFAULT_HEADERS);
    setRows([]);
    setSelectedKey("");
    setQuery("");
    setJobQuery("");
    setMaterialQuery("");
    setNewMode("single");
    setNewItem({ itemName: "", craftType: "", itemType: "", itemKind: "" });
    setNewGroup({
      groupName: "",
      craftType: "",
      itemKind: "防具",
      groupKind: "armor_set",
      members: buildEmptyGroupMembers("armor_set"),
    });
  }

  function handleNewItemCraftTypeChange(v) {
    setNewItem((p) => {
      const allowedTypes = getItemTypeOptions(p.itemKind, v);
      const keepType = allowedTypes.includes(p.itemType);
      return {
        ...p,
        craftType: v,
        itemType: keepType ? p.itemType : "",
      };
    });
  }

  function handleNewGroupCraftTypeChange(v) {
    setNewGroup((p) => {
      const groupKind = getGroupKindPreset(v, p.itemKind);
      return {
        ...p,
        craftType: v,
        groupKind,
        members: buildEmptyGroupMembers(groupKind),
      };
    });
  }

  async function addNewItem() {
    const name = newItem.itemName.trim();
    if (!name) {
      alert("itemName は必須");
      return;
    }

    const row = applyDerivedFields({
      __key: makeKey(),
      itemId: makeItemId(newItem),
      itemName: newItem.itemName,
      itemKind: newItem.itemKind,
      itemTypeKey: "",
      itemType: newItem.itemType,
      craftType: newItem.craftType,
      craftLevel: "",
      equipLevel: "",
      recipeBook: "",
      recipePlace: "",
      slot: "",
      slotGridType: "",
      slotGridCols: "",
      groupKind: newItem.itemKind === "防具" ? "armor_single" : "weapon_single",
      groupId: "",
      groupName: newItem.itemName,
      itemsCount: "1",
      materialsJson: "[]",
      slotGridJson: "",
      jobsJson: "[]",
      equipableType: "",
    });

    try {
      setSaving(true);
      const res = await axios.post(`/api/equipments`, buildApiPayload(row));
      const saved = normalizeOneRowFromApi(res.data?.data ?? res.data, headers);
      setRows((prev) => [saved, ...prev]);
      setSelectedKey(saved.__key);
      setNewItem({ itemName: "", craftType: "", itemType: "", itemKind: "" });
    } catch (error) {
      console.error(error);
      alert("追加に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function addNewGroup() {
    const groupName = newGroup.groupName.trim();
    if (!groupName) {
      alert("groupName は必須");
      return;
    }

    const groupId = makeGroupId(groupName, newGroup.craftType);
    const enabledMembers = newGroup.members.filter((m) => m.enabled);

    if (enabledMembers.length === 0) {
      alert("少なくとも1つの部位をONにしてくれ");
      return;
    }

    try {
      setSaving(true);

      const createdRows = [];
      for (const m of enabledMembers) {
        const itemName = (m.itemName || "").trim() || getDefaultGroupItemName(groupName, m.slotLabel, m.itemType);

        const row = applyDerivedFields({
          __key: makeKey(),
          itemId: makeItemId({ itemName, craftType: newGroup.craftType }),
          itemName,
          itemKind: newGroup.itemKind,
          itemTypeKey: "",
          itemType: m.itemType,
          craftType: newGroup.craftType,
          craftLevel: "",
          equipLevel: "",
          recipeBook: "",
          recipePlace: "",
          slot: "",
          slotGridType: "",
          slotGridCols: "",
          groupKind: newGroup.groupKind,
          groupId,
          groupName,
          itemsCount: String(enabledMembers.length),
          materialsJson: "[]",
          slotGridJson: "",
          jobsJson: "[]",
          equipableType: "",
        });

        const res = await axios.post("/api/equipments", buildApiPayload(row));
        createdRows.push(normalizeOneRowFromApi(res.data?.data ?? res.data, headers));
      }

      setRows((prev) => [...createdRows, ...prev]);
      if (createdRows[0]) setSelectedKey(createdRows[0].__key);
      setNewGroup({
        groupName: "",
        craftType: "",
        itemKind: "防具",
        groupKind: "armor_set",
        members: buildEmptyGroupMembers("armor_set"),
      });
    } catch (error) {
      console.error(error);
      alert("セット追加に失敗した");
    } finally {
      setSaving(false);
    }
  }

  function addMaterial() {
    const next = [...materials, { name: "", qty: 1, defaultUnitCost: 0 }];
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function updateMaterial(i, key, value) {
    const next = materials.map((m, idx) =>
      idx === i ? { ...m, [key]: key === "qty" || key === "defaultUnitCost" ? Number(value) : value } : m
    );
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function setMaterialName(i, name) {
    const next = materials.map((m, idx) => (idx === i ? { ...m, name } : m));
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function deleteMaterial(i) {
    const next = materials.filter((_, idx) => idx !== i);
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function addJob(name) {
    const v = (name ?? "").toString().trim();
    if (!v) return;
    if (jobs.includes(v)) return;
    const next = [...jobs, v];
    setSelectedRowPatch({ jobsJson: toJsonString(next, "[]") });
  }

  function deleteJob(name) {
    const next = jobs.filter((x) => x !== name);
    setSelectedRowPatch({ jobsJson: toJsonString(next, "[]") });
  }

  const jobCandidates = useMemo(() => {
    const q = jobQuery.trim();
    if (!q) return enums.jobNames;
    return enums.jobNames.filter((x) => x.includes(q));
  }, [enums.jobNames, jobQuery]);

  function applyGridResize(nextRows, nextCols) {
    const r = Math.max(0, Number(nextRows) || 0);
    const c = Math.max(0, Number(nextCols) || 0);
    const resized = ensureGridSize(grid2d, r, c);

    setGridRows(r);
    setGridCols(c);
    setGrid2d(resized);

    const den = denormalizeGrid(resized);
    setSelectedRowPatch({
      slotGridCols: c ? String(c) : "",
      slotGridJson: den == null ? "" : toJsonString(den, ""),
    });
  }

  function updateGridCell(r, c, value) {
    const next = ensureGridSize(grid2d, gridRows, gridCols);
    next[r][c] = value;
    setGrid2d(next);

    const den = denormalizeGrid(next);
    setSelectedRowPatch({ slotGridJson: den == null ? "" : toJsonString(den, "") });
  }

  function applyGridAll(nextGrid, r, c) {
    const resized = ensureGridSize(nextGrid, r, c);
    setGridRows(r);
    setGridCols(c);
    setGrid2d(resized);

    const den = denormalizeGrid(resized);
    setSelectedRowPatch({
      slotGridCols: c ? String(c) : "",
      slotGridJson: den == null ? "" : toJsonString(den, ""),
    });
  }

  function handleGridPaste(startR, startC, text) {
    const raw = (text ?? "").toString().replace(/\r\n?/g, "\n");
    if (!raw) return;

    const lines = raw.split("\n").filter((x) => x.length > 0);
    if (lines.length === 0) return;

    const rowsData = lines.map((line) => line.split("\t"));
    const pasteRows = rowsData.length;
    const pasteCols = Math.max(0, ...rowsData.map((r) => r.length));

    const needRows = Math.max(gridRows, startR + pasteRows);
    const needCols = Math.max(gridCols, startC + pasteCols);

    const next = ensureGridSize(grid2d, needRows, needCols);

    for (let rr = 0; rr < pasteRows; rr++) {
      for (let cc = 0; cc < rowsData[rr].length; cc++) {
        next[startR + rr][startC + cc] = rowsData[rr][cc];
      }
    }

    applyGridAll(next, needRows, needCols);
  }

  function handleSelectedCraftTypeChange(v) {
    const allowedTypes = getItemTypeOptions(selectedRow?.itemKind ?? "", v);
    const currentType = (selectedRow?.itemType ?? "").trim();
    const keepType = allowedTypes.includes(currentType);
    const nextItemType = keepType ? currentType : "";

    const basePatch = {
      craftType: v,
      itemType: nextItemType,
    };

    if (syncGroup) {
      setGroupPatch(basePatch);
    } else {
      setSelectedRowPatch(basePatch);
    }
  }

  function handleSelectedItemKindChange(v) {
    const allowedTypes = getItemTypeOptions(v, selectedRow?.craftType ?? "");
    const currentType = (selectedRow?.itemType ?? "").trim();
    const keepType = allowedTypes.includes(currentType);
    const nextItemType = keepType ? currentType : "";

    const patch = {
      itemKind: v,
      itemType: nextItemType,
    };

    setSelectedRowPatch(patch);
  }

  function handleSelectedItemTypeChange(v) {
    const patch = {
      itemType: v,
    };

    setSelectedRowPatch(patch);

    const nextGridType = getGridTypeFromItemType(v);
    if (nextGridType) {
      const size = parseGridTypeToSize(nextGridType);
      if (size.rows != null && size.cols != null) {
        applyGridResize(size.rows, size.cols);
      }
    }
  }

  function handleNewItemKindChange(v) {
    setNewItem((p) => {
      const allowedTypes = getItemTypeOptions(v, p.craftType);
      const keepType = allowedTypes.includes(p.itemType);
      return {
        ...p,
        itemKind: v,
        itemType: keepType ? p.itemType : "",
      };
    });
  }

  function handleNewItemTypeChange(v) {
    setNewItem((p) => ({ ...p, itemType: v }));
  }

  function onChangeEquipableType(value) {
    if (syncGroup) {
      setGroupPatch({ equipableType: value });
    } else {
      setSelectedRowPatch({ equipableType: value });
    }

    const currentJobs = safeJsonParse(selectedRow?.jobsJson, []);
    if (Array.isArray(currentJobs) && currentJobs.length > 0) return;

    const defaults = getDefaultJobsForEquipableType(value, enums.jobNames);
    if (defaults && defaults.length > 0) {
      if (syncGroup) {
        setGroupPatch({ equipableType: value, jobsJson: toJsonString(defaults, "[]") });
      } else {
        setSelectedRowPatch({ equipableType: value, jobsJson: toJsonString(defaults, "[]") });
      }
    }
  }

  async function ensureMissingMaterialsExist(targetRows) {
    const known = new Set(enums.materialNames.map((x) => x.trim()).filter(Boolean));
    const missing = new Set();

    for (const row of targetRows) {
      const arr = safeJsonParse(row.materialsJson, []);
      if (!Array.isArray(arr)) continue;
      for (const m of arr) {
        const name = (m?.name ?? "").toString().trim();
        if (name && !known.has(name)) {
          missing.add(name);
        }
      }
    }

    for (const name of missing) {
      try {
        await axios.post("/api/items", {
          name,
          category: "素材",
        });
      } catch (error) {
        console.error("material create failed", name, error);
      }
    }
  }

  async function saveSelected() {
    if (!selectedRow) return;
    try {
      setSaving(true);

      const gid = (selectedRow.groupId ?? "").trim();
      const targetRows =
        syncGroup && gid
          ? rows.filter((r) => (r.groupId ?? "").trim() === gid)
          : [selectedRow];

      await ensureMissingMaterialsExist(targetRows);

      for (const row of targetRows) {
        const payload = buildApiPayload(row);
        if (row.id) {
          await axios.put(`/api/equipments/${row.id}`, payload);
        } else {
          const res = await axios.post("/api/equipments", payload);
          const saved = normalizeOneRowFromApi(res.data?.data ?? res.data, headers);
          setRows((prev) => prev.map((r) => (r.__key === row.__key ? saved : r)));
        }
      }

      alert("保存した");
      await fetchEquipments();
    } catch (error) {
      console.error(error);
      alert("保存に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentItem() {
    if (!selectedRow) return;
    if (!confirm(`「${selectedRow.itemName}」を削除しますか？`)) return;

    try {
      setSaving(true);
      if (selectedRow.id) {
        await axios.delete(`/api/equipments/${selectedRow.id}`);
      }
      setRows((prev) => prev.filter((r) => r.__key !== selectedRow.__key));
      setSelectedKey("");
    } catch (error) {
      console.error(error);
      alert("削除に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentGroup() {
    if (!selectedRow) return;
    const gid = (selectedRow.groupId ?? "").trim();
    if (!gid) return deleteCurrentItem();

    if (!confirm(`セット「${selectedRow.groupName}」を全部削除しますか？`)) return;

    try {
      setSaving(true);
      const targets = rows.filter((r) => (r.groupId ?? "").trim() === gid);
      for (const row of targets) {
        if (row.id) {
          await axios.delete(`/api/equipments/${row.id}`);
        }
      }
      setRows((prev) => prev.filter((r) => (r.groupId ?? "").trim() !== gid));
      setSelectedKey("");
    } catch (error) {
      console.error(error);
      alert("セット削除に失敗した");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>装備管理</h1>

      <div className={styles.toolbar}>
        <button onClick={fetchEquipments} disabled={loading || saving} className={styles.button}>
          再読み込み
        </button>
        <button onClick={newEmpty} disabled={saving} className={styles.button}>
          クリア
        </button>
        <span className={styles.toolbarMeta}>rows: {rows.length}</span>
      </div>

      <section className={styles.card}>
        <div className={styles.segment}>
          <button
            onClick={() => setNewMode("single")}
            className={cx(styles.button, newMode === "single" && styles.buttonActive)}
          >
            単体追加
          </button>
          <button
            onClick={() => setNewMode("group")}
            className={cx(styles.button, newMode === "group" && styles.buttonActive)}
          >
            セット追加
          </button>
        </div>

        {newMode === "single" ? (
          <>
            <div className={styles.formGrid4}>
              <Labeled label="itemName">
                <input
                  value={newItem.itemName}
                  onChange={(e) => setNewItem((p) => ({ ...p, itemName: e.target.value }))}
                  className={styles.input}
                />
              </Labeled>

              <Labeled label="craftType">
                <select value={newItem.craftType} onChange={(e) => handleNewItemCraftTypeChange(e.target.value)} className={styles.input}>
                  <option value="">（選択）</option>
                  {CRAFT_TYPE_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="itemKind">
                <select value={newItem.itemKind} onChange={(e) => handleNewItemKindChange(e.target.value)} className={styles.input}>
                  <option value="">（選択）</option>
                  {ITEM_KIND_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="itemType">
                <select value={newItem.itemType} onChange={(e) => handleNewItemTypeChange(e.target.value)} className={styles.input}>
                  <option value="">（選択）</option>
                  {itemTypeOptionsForNewItem.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>
            </div>

            <div className={styles.actions}>
              <button onClick={addNewItem} disabled={saving} className={styles.button}>
                追加
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.formGrid4}>
              <Labeled label="groupName">
                <input
                  value={newGroup.groupName}
                  onChange={(e) => setNewGroup((p) => ({ ...p, groupName: e.target.value }))}
                  className={styles.input}
                />
              </Labeled>

              <Labeled label="craftType">
                <select value={newGroup.craftType} onChange={(e) => handleNewGroupCraftTypeChange(e.target.value)} className={styles.input}>
                  <option value="">（選択）</option>
                  {CRAFT_TYPE_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="itemKind">
                <select
                  value={newGroup.itemKind}
                  onChange={(e) =>
                    setNewGroup((p) => {
                      const itemKind = e.target.value;
                      const groupKind = getGroupKindPreset(p.craftType, itemKind);
                      return {
                        ...p,
                        itemKind,
                        groupKind,
                        members: buildEmptyGroupMembers(groupKind),
                      };
                    })
                  }
                  className={styles.input}
                >
                  <option value="">（選択）</option>
                  {ITEM_KIND_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="groupKind">
                <select
                  value={newGroup.groupKind}
                  onChange={(e) =>
                    setNewGroup((p) => ({
                      ...p,
                      groupKind: e.target.value,
                      members: buildEmptyGroupMembers(e.target.value),
                    }))
                  }
                  className={styles.input}
                >
                  {groupKindOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>
            </div>

            <div className={styles.stack}>
              {newGroup.members.map((m, i) => (
                <div key={m.key} className={styles.groupMemberRow}>
                  <label className={styles.inlineCheck}>
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) =>
                        setNewGroup((p) => {
                          const next = [...p.members];
                          next[i] = { ...next[i], enabled: e.target.checked };
                          return { ...p, members: next };
                        })
                      }
                    />
                    {m.slotLabel}
                  </label>

                  <div className={styles.mutedText}>{m.itemType}</div>

                  <input
                    value={m.itemName}
                    placeholder={getDefaultGroupItemName(newGroup.groupName, m.slotLabel, m.itemType)}
                    onChange={(e) =>
                      setNewGroup((p) => {
                        const next = [...p.members];
                        next[i] = { ...next[i], itemName: e.target.value };
                        return { ...p, members: next };
                      })
                    }
                    className={styles.input}
                  />

                  <div className={styles.metaText}>{m.enabled ? "作成する" : "作成しない"}</div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button onClick={addNewGroup} disabled={saving} className={styles.button}>
                セット追加
              </button>
            </div>
          </>
        )}
      </section>

      {loading ? (
        <div className={styles.card}>読み込み中...</div>
      ) : (
        <div className={styles.layout}>
          <aside className={cx(styles.card, styles.sidebarCard)}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索（名前 / 装備Lv / 職人Lv）"
              className={styles.input}
            />

            <div className={styles.entryList}>
              {displayEntries.map((entry) => {
                if (entry.__kind === "group") {
                  const groupActive = (selectedRow?.groupId ?? "").trim() === (entry.groupId ?? "").trim();

                  return (
                    <div key={entry.__key} className={styles.groupEntry}>
                      <button
                        onClick={() => setSelectedKey(entry.rows[0]?.__key ?? "")}
                        className={cx(styles.entryButton, groupActive && styles.entryButtonActive)}
                      >
                        <div className={styles.entryTitle}>{entry.label}</div>
                        <div className={styles.entryMeta}>
                          {`${entry.groupKind || "group"} / ${entry.craftType} / ${entry.items.length}件`}
                        </div>
                      </button>

                      <div className={styles.groupChildren}>
                        {entry.items.map((item) => {
                          const childActive = selectedKey === item.__key;
                          return (
                            <button
                              key={item.__key}
                              onClick={() => setSelectedKey(item.__key)}
                              className={cx(styles.entryChildButton, childActive && styles.entryChildButtonActive)}
                            >
                              <div className={styles.entryChildSlot}>{item.slotLabel}</div>
                              <div className={styles.entryChildName}>{item.itemName}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const active = selectedKey === entry.__key;

                return (
                  <button
                    key={entry.__key}
                    onClick={() => setSelectedKey(entry.__key)}
                    className={cx(styles.entryButton, active && styles.entryButtonActive)}
                  >
                    <div className={styles.entryTitle}>{entry.label}</div>
                    <div className={styles.entryMeta}>
                      {`${entry.row?.itemType ?? ""} / ${entry.row?.craftType ?? ""} / ${entry.row?.equipableType ?? ""}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className={styles.main}>
            {!selectedRow ? (
              <section className={styles.card}>左から装備を選んでくれ</section>
            ) : (
              <>
                <section className={styles.card}>
                  <div className={styles.sectionActions}>
                    <div className={styles.sectionActionsLeft}>
                      <button onClick={saveSelected} disabled={saving} className={styles.button}>
                        保存
                      </button>
                      <label className={styles.inlineCheck}>
                        <input type="checkbox" checked={syncGroup} onChange={(e) => setSyncGroup(e.target.checked)} />
                        グループ同期
                      </label>
                    </div>

                    <div className={styles.sectionActionsRight}>
                      <button onClick={deleteCurrentItem} disabled={saving} className={styles.buttonDanger}>
                        単体削除
                      </button>
                      {isSelectedGrouped && (
                        <button onClick={deleteCurrentGroup} disabled={saving} className={styles.buttonDanger}>
                          セット削除
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGrid4}>
                    <Labeled label="itemName">
                      <input value={selectedRow.itemName} onChange={(e) => setSelectedRowPatch({ itemName: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="craftType">
                      <select value={selectedRow.craftType} onChange={(e) => handleSelectedCraftTypeChange(e.target.value)} className={styles.input}>
                        <option value="">（選択）</option>
                        {CRAFT_TYPE_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="itemKind">
                      <select value={selectedRow.itemKind} onChange={(e) => handleSelectedItemKindChange(e.target.value)} className={styles.input}>
                        <option value="">（選択）</option>
                        {ITEM_KIND_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="itemType">
                      <select value={selectedRow.itemType} onChange={(e) => handleSelectedItemTypeChange(e.target.value)} className={styles.input}>
                        <option value="">（選択）</option>
                        {itemTypeOptionsForSelectedRow.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="itemTypeKey">
                      <input value={selectedRow.itemTypeKey} readOnly className={styles.input} />
                    </Labeled>

                    <Labeled label="equipableType">
                      <select value={selectedRow.equipableType} onChange={(e) => onChangeEquipableType(e.target.value)} className={styles.input}>
                        <option value="">（選択）</option>
                        {enums.equipableTypeOptions.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="craftLevel">
                      <input value={selectedRow.craftLevel} onChange={(e) => setGroupPatch({ craftLevel: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="equipLevel">
                      <input value={selectedRow.equipLevel} onChange={(e) => setGroupPatch({ equipLevel: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="recipeBook">
                      <input value={selectedRow.recipeBook} onChange={(e) => setGroupPatch({ recipeBook: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="recipePlace">
                      <input value={selectedRow.recipePlace} onChange={(e) => setGroupPatch({ recipePlace: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="slotGridCols">
                      <input value={selectedRow.slotGridCols} onChange={(e) => setSelectedRowPatch({ slotGridCols: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="groupKind">
                      <input value={selectedRow.groupKind} onChange={(e) => setSelectedRowPatch({ groupKind: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="groupId">
                      <input value={selectedRow.groupId} onChange={(e) => setSelectedRowPatch({ groupId: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="groupName">
                      <input value={selectedRow.groupName} onChange={(e) => setGroupPatch({ groupName: e.target.value })} className={styles.input} />
                    </Labeled>

                    <Labeled label="itemsCount">
                      <input value={selectedRow.itemsCount} onChange={(e) => setGroupPatch({ itemsCount: e.target.value })} className={styles.input} />
                    </Labeled>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.sectionTitle}>装備可能職業</div>

                  <div className={styles.chips}>
                    {jobs.map((j) => (
                      <span key={j} className={styles.chip}>
                        {j}
                        <button onClick={() => deleteJob(j)} className={styles.chipX}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className={styles.stack}>
                    <input value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} placeholder="職業検索" className={styles.input} />
                    <div className={styles.jobCandidates}>
                      {jobCandidates.map((j) => (
                        <button key={j} onClick={() => addJob(j)} className={styles.button}>
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionTitle}>素材</div>
                    <button onClick={addMaterial} className={styles.button}>
                      素材追加
                    </button>
                  </div>

                  <div className={styles.stack}>
                    <input
                      value={materialQuery}
                      onChange={(e) => setMaterialQuery(e.target.value)}
                      placeholder="素材候補検索"
                      className={styles.input}
                    />

                    {materials.map((m, i) => (
                      <div key={i} className={styles.materialRow}>
                        <div className={styles.materialNameWrap}>
                          <input
                            value={m.name}
                            onChange={(e) => setMaterialName(i, e.target.value)}
                            placeholder="素材名"
                            className={styles.input}
                            list={`material-candidates-${i}`}
                          />
                          <datalist id={`material-candidates-${i}`}>
                            {materialCandidates.map((name) => (
                              <option key={name} value={name} />
                            ))}
                          </datalist>
                        </div>

                        <input
                          type="number"
                          value={m.qty}
                          onChange={(e) => updateMaterial(i, "qty", e.target.value)}
                          placeholder="数量"
                          className={styles.input}
                        />
                        <input
                          type="number"
                          value={m.defaultUnitCost ?? 0}
                          onChange={(e) => updateMaterial(i, "defaultUnitCost", e.target.value)}
                          placeholder="単価"
                          className={styles.input}
                        />
                        <button onClick={() => deleteMaterial(i)} className={styles.buttonDanger}>
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.gridResizeRow}>
                    <div className={styles.sectionTitle}>slotGrid</div>
                    <label className={styles.inlineField}>
                      rows
                      <input
                        type="number"
                        value={gridRows}
                        onChange={(e) => applyGridResize(Number(e.target.value) || 0, gridCols)}
                        className={cx(styles.input, styles.inputSmall)}
                      />
                    </label>
                    <label className={styles.inlineField}>
                      cols
                      <input
                        type="number"
                        value={gridCols}
                        onChange={(e) => applyGridResize(gridRows, Number(e.target.value) || 0)}
                        className={cx(styles.input, styles.inputSmall)}
                      />
                    </label>
                  </div>

                  <div className={styles.gridTableWrap}>
                    <table className={styles.gridTable}>
                      <tbody>
                        {Array.from({ length: gridRows }).map((_, r) => (
                          <tr key={r}>
                            {Array.from({ length: gridCols }).map((__, c) => {
                              const disabled = isDisabledCell(selectedRow.slotGridType, r, c);
                              return (
                                <td key={`${r}-${c}`} className={styles.gridCell}>
                                  <input
                                    value={grid2d?.[r]?.[c] ?? ""}
                                    disabled={disabled}
                                    onChange={(e) => updateGridCell(r, c, e.target.value)}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      handleGridPaste(r, c, e.clipboardData.getData("text"));
                                    }}
                                    className={cx(styles.gridInput, disabled && styles.gridInputDisabled)}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.sectionTitle}>JSON確認</div>
                  <pre className={styles.pre}>
{JSON.stringify(
  {
    materials: safeJsonParse(selectedRow.materialsJson, []),
    slotGrid: safeJsonParse(selectedRow.slotGridJson, null),
    jobs: safeJsonParse(selectedRow.jobsJson, []),
  },
  null,
  2
)}
                  </pre>
                </section>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}