"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import styles from "./EquipmentForm.module.css";

const JOB_OVERRIDE_MODE_OPTIONS = ["inherit", "add", "replace"];

const GROUP_KIND_OPTIONS = [
  "armor_set",
  "tailoring_set",
  "shield_set",
  "weapon_set",
  "single",
];

const SLOT_OPTIONS = ["頭", "体上", "体下", "腕", "足", "盾", "武器", "その他"];

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

const GRID_TYPE_OPTIONS = Object.keys(GRID_TYPE_PRESETS);

const GROUP_MEMBER_PRESETS = {
  armor_set: [
    { key: "head", label: "頭", slot: "頭", slotGridType: "鎧頭" },
    { key: "bodyTop", label: "体上", slot: "体上", slotGridType: "鎧上" },
    { key: "bodyBottom", label: "体下", slot: "体下", slotGridType: "鎧下" },
    { key: "arm", label: "腕", slot: "腕", slotGridType: "鎧腕" },
    { key: "foot", label: "足", slot: "足", slotGridType: "鎧足" },
  ],
  tailoring_set: [
    { key: "head", label: "頭", slot: "頭", slotGridType: "裁縫頭" },
    { key: "bodyTop", label: "体上", slot: "体上", slotGridType: "裁縫上" },
    { key: "bodyBottom", label: "体下", slot: "体下", slotGridType: "裁縫下" },
    { key: "arm", label: "腕", slot: "腕", slotGridType: "裁縫腕" },
    { key: "foot", label: "足", slot: "足", slotGridType: "裁縫足" },
  ],
  shield_set: [{ key: "shield", label: "盾", slot: "盾", slotGridType: "盾" }],
  weapon_set: [{ key: "weapon", label: "武器", slot: "武器", slotGridType: "" }],
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function str(v) {
  return v == null ? "" : String(v);
}

function safeJsonParse(value, fallback) {
  if (value == null || value === "") return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJsonString(value, fallbackJson = "[]") {
  try {
    return JSON.stringify(value ?? JSON.parse(fallbackJson));
  } catch {
    return fallbackJson;
  }
}

function makeKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `k_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function slugify(text) {
  return str(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[　]+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
}

function makeItemId(row) {
  const explicit = str(row?.itemId).trim();
  if (explicit) return explicit;

  const name = str(row?.itemName).trim();
  const groupId = str(row?.groupId).trim();
  const slot = str(row?.slot).trim();

  const base = slugify(name);
  return [groupId, slot, base].filter(Boolean).join("_");
}

function createEmptyRow() {
  return {
    __key: makeKey(),
    id: null,
    itemId: "",
    itemName: "",
    equipmentTypeId: "",
    equipmentTypeName: "",
    jobOverrideMode: "inherit",
    craftLevel: "",
    equipLevel: "",
    recipeBook: "",
    recipePlace: "",
    description: "",
    slot: "",
    slotGridType: "",
    slotGridCols: "",
    groupKind: "",
    groupId: "",
    groupName: "",
    materialsJson: "[]",
    slotGridJson: "",
    sourceUrl: "",
    detailUrl: "",
    effectsJson: "[]",
    createdAt: null,
    updatedAt: null,
  };
}

function normalizeMaterial(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    return {
      item_id: null,
      name: raw,
      count: 1,
    };
  }

  const itemId = raw.item_id ?? raw.itemId ?? null;
  const name = raw.name ?? raw.item_name ?? raw.itemName ?? "";
  const count = Number(raw.count ?? raw.qty ?? raw.quantity ?? 1) || 1;

  return {
    item_id: itemId,
    name,
    count,
  };
}

function normalizeEffect(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") return raw;
  return raw;
}

function normalizeOneRowFromApi(row) {
  const rr = createEmptyRow();

  const materials = safeJsonParse(row?.materials_json, []);
  const slotGrid = safeJsonParse(row?.slot_grid_json, null);
  const effects = safeJsonParse(row?.effects_json, []);

  rr.id = row?.id ?? null;
  rr.itemId = str(row?.item_id);
  rr.itemName = str(row?.item_name);
  rr.equipmentTypeId =
    row?.equipment_type_id == null ? "" : String(row.equipment_type_id);
  rr.equipmentTypeName = str(
    row?.equipment_type?.name ?? row?.equipment_type_name ?? ""
  );
  rr.jobOverrideMode = str(row?.job_override_mode || "inherit");
  rr.craftLevel = row?.craft_level == null ? "" : String(row.craft_level);
  rr.equipLevel = row?.equip_level == null ? "" : String(row.equip_level);
  rr.recipeBook = str(row?.recipe_book);
  rr.recipePlace = str(row?.recipe_place);
  rr.description = str(row?.description);
  rr.slot = str(row?.slot);
  rr.slotGridType = str(row?.slot_grid_type);
  rr.slotGridCols =
    row?.slot_grid_cols == null ? "" : String(row.slot_grid_cols);
  rr.groupKind = str(row?.group_kind);
  rr.groupId = str(row?.group_id);
  rr.groupName = str(row?.group_name);
  rr.materialsJson = toJsonString(
    Array.isArray(materials) ? materials.map(normalizeMaterial).filter(Boolean) : [],
    "[]"
  );
  rr.slotGridJson = slotGrid == null ? "" : toJsonString(slotGrid, "[]");
  rr.sourceUrl = str(row?.source_url);
  rr.detailUrl = str(row?.detail_url);
  rr.effectsJson = toJsonString(
    Array.isArray(effects) ? effects.map(normalizeEffect).filter((x) => x != null) : [],
    "[]"
  );
  rr.createdAt = row?.created_at ?? null;
  rr.updatedAt = row?.updated_at ?? null;

  if (!rr.itemId) rr.itemId = makeItemId(rr);
  if (!rr.groupId && rr.groupKind) rr.groupId = rr.itemId || makeItemId(rr);
  rr.__key = makeKey();

  return rr;
}

function buildApiPayload(row) {
  return {
    item_id: str(row.itemId).trim() || null,
    item_name: str(row.itemName).trim(),
    equipment_type_id:
      str(row.equipmentTypeId).trim() === ""
        ? null
        : Number(row.equipmentTypeId),
    job_override_mode: str(row.jobOverrideMode).trim() || "inherit",
    craft_level:
      str(row.craftLevel).trim() === "" ? null : Number(row.craftLevel),
    equip_level:
      str(row.equipLevel).trim() === "" ? null : Number(row.equipLevel),
    recipe_book: str(row.recipeBook).trim() || null,
    recipe_place: str(row.recipePlace).trim() || null,
    description: str(row.description).trim() || null,
    slot: str(row.slot).trim() || null,
    slot_grid_type: str(row.slotGridType).trim() || null,
    slot_grid_cols:
      str(row.slotGridCols).trim() === "" ? null : Number(row.slotGridCols),
    group_kind: str(row.groupKind).trim() || null,
    group_id: str(row.groupId).trim() || null,
    group_name: str(row.groupName).trim() || null,
    materials_json: safeJsonParse(row.materialsJson, []),
    slot_grid_json:
      str(row.slotGridJson).trim() === ""
        ? null
        : safeJsonParse(row.slotGridJson, null),
    source_url: str(row.sourceUrl).trim() || null,
    detail_url: str(row.detailUrl).trim() || null,
    effects_json: safeJsonParse(row.effectsJson, []),
  };
}

function getGridPreset(gridType) {
  return GRID_TYPE_PRESETS[str(gridType).trim()] ?? null;
}

function isDisabledCell(gridType, r, c) {
  const preset = getGridPreset(gridType);
  if (!preset) return false;
  return preset.disabledCells.some(([rr, cc]) => rr === r && cc === c);
}

function normalizeGrid(gridLike, colsHint = 0) {
  if (!gridLike) return { grid: [], rows: 0, cols: colsHint };

  if (Array.isArray(gridLike) && gridLike.every((x) => Array.isArray(x))) {
    const rows = gridLike.length;
    const cols = Math.max(
      colsHint,
      ...gridLike.map((r) => (Array.isArray(r) ? r.length : 0)),
      0
    );

    return {
      grid: Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => gridLike?.[r]?.[c] ?? "")
      ),
      rows,
      cols,
    };
  }

  if (Array.isArray(gridLike)) {
    const cols = Math.max(colsHint, gridLike.length, 0);
    return {
      grid: [Array.from({ length: cols }, (_, c) => gridLike?.[c] ?? "")],
      rows: 1,
      cols,
    };
  }

  return { grid: [], rows: 0, cols: colsHint };
}

function ensureGridSize(curGrid, rowsCount, colsCount) {
  return Array.from({ length: rowsCount }, (_, r) =>
    Array.from({ length: colsCount }, (_, c) => curGrid?.[r]?.[c] ?? "")
  );
}

function denormalizeGrid(grid2d) {
  if (!Array.isArray(grid2d) || grid2d.length === 0) return null;
  const rows = grid2d.length;
  const cols = Math.max(...grid2d.map((r) => r.length), 0);
  const normalized = grid2d.map((r) =>
    Array.from({ length: cols }, (_, c) => r?.[c] ?? "")
  );
  return rows === 1 ? normalized[0] : normalized;
}

function getGroupDisplayName(row) {
  return str(row.groupName).trim() || str(row.itemName).trim();
}

function buildGroupedRows(rows) {
  const map = new Map();
  const counts = new Map();

  for (const row of rows) {
    const gid = str(row.groupId).trim();
    if (!gid) continue;
    counts.set(gid, (counts.get(gid) ?? 0) + 1);
  }

  for (const row of rows) {
    const gid = str(row.groupId).trim();
    const grouped = gid && (counts.get(gid) ?? 0) > 1;

    if (!grouped) {
      map.set(`single:${row.__key}`, {
        __kind: "single",
        __key: row.__key,
        label: row.itemName,
        searchText: [
          row.itemName,
          row.groupName,
          row.slot,
          row.recipeBook,
          row.recipePlace,
          row.equipmentTypeName,
        ]
          .filter(Boolean)
          .join(" "),
        row,
      });
      continue;
    }

    const groupKey = gid;
    const existing =
      map.get(`group:${groupKey}`) ??
      {
        __kind: "group",
        __key: `group:${groupKey}`,
        groupId: groupKey,
        label: getGroupDisplayName(row),
        groupKind: row.groupKind,
        rows: [],
        items: [],
        searchText: "",
      };

    existing.rows.push(row);
    existing.items.push({
      __key: row.__key,
      itemName: row.itemName,
      slot: row.slot,
    });

    existing.searchText = [
      existing.label,
      existing.groupKind,
      ...existing.items.map((x) => `${x.itemName} ${x.slot}`),
    ]
      .filter(Boolean)
      .join(" ");

    map.set(`group:${groupKey}`, existing);
  }

  return Array.from(map.values());
}

function buildEmptyGroupMembers(groupKind) {
  const preset = GROUP_MEMBER_PRESETS[groupKind] ?? [];
  return preset.map((x) => ({
    key: x.key,
    enabled: true,
    slotLabel: x.label,
    slot: x.slot,
    slotGridType: x.slotGridType,
    itemName: "",
  }));
}

function makeGroupId(groupName) {
  return slugify(groupName);
}

function getDefaultGroupItemName(groupName, slotLabel) {
  return `${str(groupName).trim()}${slotLabel}`.trim();
}

function Labeled({ label, children }) {
  return (
    <label className={styles.field}>
      <div className={styles.label}>{label}</div>
      {children}
    </label>
  );
}

export default function EquipmentForm() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [syncGroup, setSyncGroup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [gridRows, setGridRows] = useState(1);
  const [gridCols, setGridCols] = useState(1);
  const [grid2d, setGrid2d] = useState([[""]]);

  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [newMode, setNewMode] = useState("single");
  const [newItem, setNewItem] = useState({
    itemName: "",
    equipmentTypeId: "",
    jobOverrideMode: "inherit",
    slot: "",
    slotGridType: "",
    groupName: "",
  });

  const [newGroup, setNewGroup] = useState({
    groupName: "",
    groupKind: "armor_set",
    equipmentTypeId: "",
    jobOverrideMode: "inherit",
    members: buildEmptyGroupMembers("armor_set"),
  });

  const selectedRow = useMemo(() => {
    return rows.find((r) => r.__key === selectedKey) ?? null;
  }, [rows, selectedKey]);

  const displayEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const grouped = buildGroupedRows(rows);
    if (!q) return grouped;
    return grouped.filter((entry) =>
      str(entry.searchText).toLowerCase().includes(q)
    );
  }, [rows, query]);

  const materials = useMemo(() => {
    if (!selectedRow) return [];
    const arr = safeJsonParse(selectedRow.materialsJson, []);
    return Array.isArray(arr) ? arr : [];
  }, [selectedRow]);

  const effects = useMemo(() => {
    if (!selectedRow) return [];
    const arr = safeJsonParse(selectedRow.effectsJson, []);
    return Array.isArray(arr) ? arr : [];
  }, [selectedRow]);

  const isSelectedGrouped = useMemo(() => {
    if (!selectedRow) return false;
    const gid = str(selectedRow.groupId).trim();
    if (!gid) return false;
    return rows.filter((r) => str(r.groupId).trim() === gid).length > 1;
  }, [rows, selectedRow]);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!rows.length) {
      setSelectedKey("");
      return;
    }
    if (!rows.some((r) => r.__key === selectedKey)) {
      setSelectedKey(rows[0].__key);
    }
  }, [rows, selectedKey]);

  useEffect(() => {
    if (!selectedRow) {
      setGridRows(1);
      setGridCols(1);
      setGrid2d([[""]]);
      return;
    }

    const preset = getGridPreset(selectedRow.slotGridType);
    const colsHint = preset?.cols ?? Number(selectedRow.slotGridCols ?? 0) ?? 0;
    const gridLike = safeJsonParse(selectedRow.slotGridJson, null);
    const norm = normalizeGrid(gridLike, colsHint);

    const nextRows = preset?.rows ?? (norm.rows > 0 ? norm.rows : 1);
    const nextCols = preset?.cols ?? (norm.cols > 0 ? norm.cols : 1);
    const nextGrid = ensureGridSize(norm.grid, nextRows, nextCols);

    setGridRows(nextRows);
    setGridCols(nextCols);
    setGrid2d(nextGrid);
  }, [selectedRow?.__key, selectedRow?.slotGridType, selectedRow?.slotGridJson, selectedRow?.slotGridCols]);

  async function fetchInitial() {
    setLoading(true);
    try {
      const [equipmentRes, typeRes] = await Promise.allSettled([
        axios.get("/api/equipments"),
        axios.get("/api/equipment-types"),
      ]);

      if (equipmentRes.status === "fulfilled") {
        const list = Array.isArray(equipmentRes.value.data?.data)
          ? equipmentRes.value.data.data
          : Array.isArray(equipmentRes.value.data)
          ? equipmentRes.value.data
          : [];
        const normalized = list.map(normalizeOneRowFromApi);
        setRows(normalized);
        if (normalized[0]) setSelectedKey(normalized[0].__key);
      } else {
        alert("装備データの読み込みに失敗した");
      }

      if (typeRes.status === "fulfilled") {
        const list = Array.isArray(typeRes.value.data?.data)
          ? typeRes.value.data.data
          : Array.isArray(typeRes.value.data)
          ? typeRes.value.data
          : [];
        setEquipmentTypes(list);
      } else {
        setEquipmentTypes([]);
      }
    } catch (error) {
      console.error(error);
      alert("初期データ読み込みに失敗した");
    } finally {
      setLoading(false);
    }
  }

  function setSelectedRowPatch(patch) {
    if (!selectedKey) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.__key !== selectedKey) return r;
        const next = { ...r, ...patch };

        if (!str(next.itemId).trim()) next.itemId = makeItemId(next);
        return next;
      })
    );
  }

  function setGroupPatch(patch) {
    if (!selectedRow) return;
    const gid = str(selectedRow.groupId).trim();
    if (!gid) {
      setSelectedRowPatch(patch);
      return;
    }

    setRows((prev) =>
      prev.map((r) => {
        if (str(r.groupId).trim() !== gid) return r;
        const next = { ...r, ...patch };
        if (!str(next.itemId).trim()) next.itemId = makeItemId(next);
        return next;
      })
    );
  }

  async function handleCreateSingle() {
    const name = str(newItem.itemName).trim();
    if (!name) {
      alert("itemName は必須");
      return;
    }

    const row = {
      ...createEmptyRow(),
      itemName: name,
      itemId: makeItemId({ itemName: name, slot: newItem.slot }),
      equipmentTypeId: str(newItem.equipmentTypeId),
      jobOverrideMode: str(newItem.jobOverrideMode) || "inherit",
      slot: str(newItem.slot),
      slotGridType: str(newItem.slotGridType),
      slotGridCols: getGridPreset(newItem.slotGridType)?.cols
        ? String(getGridPreset(newItem.slotGridType).cols)
        : "",
      groupName: str(newItem.groupName),
      groupKind: "",
    };

    try {
      setSaving(true);
      const res = await axios.post("/api/equipments", buildApiPayload(row));
      const saved = normalizeOneRowFromApi(res.data?.data ?? res.data);
      setRows((prev) => [saved, ...prev]);
      setSelectedKey(saved.__key);
      setNewItem({
        itemName: "",
        equipmentTypeId: "",
        jobOverrideMode: "inherit",
        slot: "",
        slotGridType: "",
        groupName: "",
      });
    } catch (error) {
      console.error(error);
      alert("追加に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateGroup() {
    const groupName = str(newGroup.groupName).trim();
    if (!groupName) {
      alert("groupName は必須");
      return;
    }

    const enabledMembers = newGroup.members.filter((m) => m.enabled);
    if (!enabledMembers.length) {
      alert("少なくとも1つの部位をONにしてくれ");
      return;
    }

    const groupId = makeGroupId(groupName);

    try {
      setSaving(true);
      const created = [];

      for (const member of enabledMembers) {
        const name =
          str(member.itemName).trim() ||
          getDefaultGroupItemName(groupName, member.slotLabel);

        const preset = getGridPreset(member.slotGridType);

        const row = {
          ...createEmptyRow(),
          itemName: name,
          itemId: makeItemId({ itemName: name, groupId, slot: member.slot }),
          equipmentTypeId: str(newGroup.equipmentTypeId),
          jobOverrideMode: str(newGroup.jobOverrideMode) || "inherit",
          slot: member.slot,
          slotGridType: member.slotGridType,
          slotGridCols: preset?.cols ? String(preset.cols) : "",
          groupKind: str(newGroup.groupKind),
          groupId,
          groupName,
        };

        const res = await axios.post("/api/equipments", buildApiPayload(row));
        created.push(normalizeOneRowFromApi(res.data?.data ?? res.data));
      }

      setRows((prev) => [...created, ...prev]);
      if (created[0]) setSelectedKey(created[0].__key);

      setNewGroup({
        groupName: "",
        groupKind: "armor_set",
        equipmentTypeId: "",
        jobOverrideMode: "inherit",
        members: buildEmptyGroupMembers("armor_set"),
      });
    } catch (error) {
      console.error(error);
      alert("セット追加に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function saveSelected() {
    if (!selectedRow) return;

    try {
      setSaving(true);

      const gid = str(selectedRow.groupId).trim();
      const targetRows =
        syncGroup && gid
          ? rows.filter((r) => str(r.groupId).trim() === gid)
          : [selectedRow];

      for (const row of targetRows) {
        const payload = buildApiPayload(row);
        if (row.id) {
          await axios.put(`/api/equipments/${row.id}`, payload);
        } else {
          const res = await axios.post("/api/equipments", payload);
          const saved = normalizeOneRowFromApi(res.data?.data ?? res.data);
          setRows((prev) =>
            prev.map((r) => (r.__key === row.__key ? saved : r))
          );
        }
      }

      await fetchInitial();
      alert("保存した");
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

    const gid = str(selectedRow.groupId).trim();
    if (!gid) {
      await deleteCurrentItem();
      return;
    }

    if (!confirm(`セット「${selectedRow.groupName}」を全部削除しますか？`)) return;

    try {
      setSaving(true);
      const targets = rows.filter((r) => str(r.groupId).trim() === gid);
      for (const row of targets) {
        if (row.id) {
          await axios.delete(`/api/equipments/${row.id}`);
        }
      }
      setRows((prev) => prev.filter((r) => str(r.groupId).trim() !== gid));
      setSelectedKey("");
    } catch (error) {
      console.error(error);
      alert("セット削除に失敗した");
    } finally {
      setSaving(false);
    }
  }

  function addMaterial() {
    const next = [...materials, { item_id: null, name: "", count: 1 }];
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function updateMaterial(index, key, value) {
    const next = materials.map((m, i) =>
      i === index
        ? {
            ...m,
            [key]:
              key === "count"
                ? Number(value) || 0
                : value,
          }
        : m
    );
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function deleteMaterial(index) {
    const next = materials.filter((_, i) => i !== index);
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function addEffect() {
    const next = [...effects, ""];
    setSelectedRowPatch({ effectsJson: toJsonString(next, "[]") });
  }

  function updateEffect(index, value) {
    const next = effects.map((e, i) => (i === index ? value : e));
    setSelectedRowPatch({ effectsJson: toJsonString(next, "[]") });
  }

  function deleteEffect(index) {
    const next = effects.filter((_, i) => i !== index);
    setSelectedRowPatch({ effectsJson: toJsonString(next, "[]") });
  }

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
      slotGridJson: den == null ? "" : toJsonString(den, "[]"),
    });
  }

  function updateGridCell(r, c, value) {
    const next = ensureGridSize(grid2d, gridRows, gridCols);
    next[r][c] = value;
    setGrid2d(next);

    const den = denormalizeGrid(next);
    setSelectedRowPatch({
      slotGridJson: den == null ? "" : toJsonString(den, "[]"),
    });
  }

  function handleGridPaste(startR, startC, text) {
    const raw = str(text).replace(/\r\n?/g, "\n");
    if (!raw) return;

    const lines = raw.split("\n").filter((x) => x.length > 0);
    if (!lines.length) return;

    const pasted = lines.map((line) => line.split("\t"));
    const pasteRows = pasted.length;
    const pasteCols = Math.max(...pasted.map((r) => r.length), 0);

    const nextRows = Math.max(gridRows, startR + pasteRows);
    const nextCols = Math.max(gridCols, startC + pasteCols);
    const nextGrid = ensureGridSize(grid2d, nextRows, nextCols);

    for (let r = 0; r < pasteRows; r++) {
      for (let c = 0; c < pasted[r].length; c++) {
        nextGrid[startR + r][startC + c] = pasted[r][c];
      }
    }

    setGridRows(nextRows);
    setGridCols(nextCols);
    setGrid2d(nextGrid);

    const den = denormalizeGrid(nextGrid);
    setSelectedRowPatch({
      slotGridCols: nextCols ? String(nextCols) : "",
      slotGridJson: den == null ? "" : toJsonString(den, "[]"),
    });
  }

  function onChangeGridType(value) {
    const preset = getGridPreset(value);
    if (syncGroup) {
      setGroupPatch({
        slotGridType: value,
        slotGridCols: preset?.cols ? String(preset.cols) : "",
      });
    } else {
      setSelectedRowPatch({
        slotGridType: value,
        slotGridCols: preset?.cols ? String(preset.cols) : "",
      });
    }

    if (preset) {
      const nextGrid = ensureGridSize([], preset.rows, preset.cols);
      setGridRows(preset.rows);
      setGridCols(preset.cols);
      setGrid2d(nextGrid);

      const den = denormalizeGrid(nextGrid);
      if (syncGroup) {
        setGroupPatch({
          slotGridType: value,
          slotGridCols: String(preset.cols),
          slotGridJson: den == null ? "" : toJsonString(den, "[]"),
        });
      } else {
        setSelectedRowPatch({
          slotGridType: value,
          slotGridCols: String(preset.cols),
          slotGridJson: den == null ? "" : toJsonString(den, "[]"),
        });
      }
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>装備管理</h1>

      <div className={styles.toolbar}>
        <button
          onClick={fetchInitial}
          disabled={loading || saving}
          className={styles.button}
        >
          再読み込み
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
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, itemName: e.target.value }))
                  }
                  className={styles.input}
                />
              </Labeled>

              <Labeled label="equipmentType">
                <select
                  value={newItem.equipmentTypeId}
                  onChange={(e) =>
                    setNewItem((p) => ({
                      ...p,
                      equipmentTypeId: e.target.value,
                    }))
                  }
                  className={styles.input}
                >
                  <option value="">（選択）</option>
                  {equipmentTypes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="jobOverrideMode">
                <select
                  value={newItem.jobOverrideMode}
                  onChange={(e) =>
                    setNewItem((p) => ({
                      ...p,
                      jobOverrideMode: e.target.value,
                    }))
                  }
                  className={styles.input}
                >
                  {JOB_OVERRIDE_MODE_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="slot">
                <select
                  value={newItem.slot}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, slot: e.target.value }))
                  }
                  className={styles.input}
                >
                  <option value="">（選択）</option>
                  {SLOT_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="slotGridType">
                <select
                  value={newItem.slotGridType}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, slotGridType: e.target.value }))
                  }
                  className={styles.input}
                >
                  <option value="">（選択）</option>
                  {GRID_TYPE_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="groupName">
                <input
                  value={newItem.groupName}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, groupName: e.target.value }))
                  }
                  className={styles.input}
                />
              </Labeled>
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleCreateSingle}
                disabled={saving}
                className={styles.button}
              >
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
                  onChange={(e) =>
                    setNewGroup((p) => ({ ...p, groupName: e.target.value }))
                  }
                  className={styles.input}
                />
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
                  {GROUP_KIND_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="equipmentType">
                <select
                  value={newGroup.equipmentTypeId}
                  onChange={(e) =>
                    setNewGroup((p) => ({
                      ...p,
                      equipmentTypeId: e.target.value,
                    }))
                  }
                  className={styles.input}
                >
                  <option value="">（選択）</option>
                  {equipmentTypes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="jobOverrideMode">
                <select
                  value={newGroup.jobOverrideMode}
                  onChange={(e) =>
                    setNewGroup((p) => ({
                      ...p,
                      jobOverrideMode: e.target.value,
                    }))
                  }
                  className={styles.input}
                >
                  {JOB_OVERRIDE_MODE_OPTIONS.map((x) => (
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

                  <div className={styles.mutedText}>{m.slotGridType}</div>

                  <input
                    value={m.itemName}
                    placeholder={getDefaultGroupItemName(
                      newGroup.groupName,
                      m.slotLabel
                    )}
                    onChange={(e) =>
                      setNewGroup((p) => {
                        const next = [...p.members];
                        next[i] = { ...next[i], itemName: e.target.value };
                        return { ...p, members: next };
                      })
                    }
                    className={styles.input}
                  />

                  <div className={styles.metaText}>
                    {m.enabled ? "作成する" : "作成しない"}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleCreateGroup}
                disabled={saving}
                className={styles.button}
              >
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
              placeholder="検索（名前 / 部位 / グループ名）"
              className={styles.input}
            />

            <div className={styles.entryList}>
              {displayEntries.map((entry) => {
                if (entry.__kind === "group") {
                  const groupActive =
                    str(selectedRow?.groupId).trim() === str(entry.groupId).trim();

                  return (
                    <div key={entry.__key} className={styles.groupEntry}>
                      <button
                        onClick={() => setSelectedKey(entry.rows[0]?.__key ?? "")}
                        className={cx(
                          styles.entryButton,
                          groupActive && styles.entryButtonActive
                        )}
                      >
                        <div className={styles.entryTitle}>{entry.label}</div>
                        <div className={styles.entryMeta}>
                          {`${entry.groupKind || "group"} / ${entry.items.length}件`}
                        </div>
                      </button>

                      <div className={styles.groupChildren}>
                        {entry.items.map((item) => {
                          const childActive = selectedKey === item.__key;
                          return (
                            <button
                              key={item.__key}
                              onClick={() => setSelectedKey(item.__key)}
                              className={cx(
                                styles.entryChildButton,
                                childActive && styles.entryChildButtonActive
                              )}
                            >
                              <div className={styles.entryChildSlot}>
                                {item.slot || "部位なし"}
                              </div>
                              <div className={styles.entryChildName}>
                                {item.itemName}
                              </div>
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
                    className={cx(
                      styles.entryButton,
                      active && styles.entryButtonActive
                    )}
                  >
                    <div className={styles.entryTitle}>{entry.label}</div>
                    <div className={styles.entryMeta}>
                      {`${entry.row?.slot ?? ""} / Lv${entry.row?.equipLevel ?? "-"} / ${
                        entry.row?.equipmentTypeName ?? ""
                      }`}
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
                      <button
                        onClick={saveSelected}
                        disabled={saving}
                        className={styles.button}
                      >
                        保存
                      </button>
                      <label className={styles.inlineCheck}>
                        <input
                          type="checkbox"
                          checked={syncGroup}
                          onChange={(e) => setSyncGroup(e.target.checked)}
                        />
                        グループ同期
                      </label>
                    </div>

                    <div className={styles.sectionActionsRight}>
                      <button
                        onClick={deleteCurrentItem}
                        disabled={saving}
                        className={styles.buttonDanger}
                      >
                        単体削除
                      </button>
                      {isSelectedGrouped && (
                        <button
                          onClick={deleteCurrentGroup}
                          disabled={saving}
                          className={styles.buttonDanger}
                        >
                          セット削除
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGrid4}>
                    <Labeled label="itemId">
                      <input
                        value={selectedRow.itemId}
                        onChange={(e) =>
                          setSelectedRowPatch({ itemId: e.target.value })
                        }
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="itemName">
                      <input
                        value={selectedRow.itemName}
                        onChange={(e) =>
                          setSelectedRowPatch({ itemName: e.target.value })
                        }
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="equipmentType">
                      <select
                        value={selectedRow.equipmentTypeId}
                        onChange={(e) => {
                          const patch = { equipmentTypeId: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      >
                        <option value="">（選択）</option>
                        {equipmentTypes.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="jobOverrideMode">
                      <select
                        value={selectedRow.jobOverrideMode}
                        onChange={(e) => {
                          const patch = { jobOverrideMode: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      >
                        {JOB_OVERRIDE_MODE_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="craftLevel">
                      <input
                        type="number"
                        value={selectedRow.craftLevel}
                        onChange={(e) => {
                          const patch = { craftLevel: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="equipLevel">
                      <input
                        type="number"
                        value={selectedRow.equipLevel}
                        onChange={(e) => {
                          const patch = { equipLevel: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="recipeBook">
                      <input
                        value={selectedRow.recipeBook}
                        onChange={(e) => {
                          const patch = { recipeBook: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="recipePlace">
                      <input
                        value={selectedRow.recipePlace}
                        onChange={(e) => {
                          const patch = { recipePlace: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="slot">
                      <select
                        value={selectedRow.slot}
                        onChange={(e) => {
                          const patch = { slot: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      >
                        <option value="">（選択）</option>
                        {SLOT_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="slotGridType">
                      <select
                        value={selectedRow.slotGridType}
                        onChange={(e) => onChangeGridType(e.target.value)}
                        className={styles.input}
                      >
                        <option value="">（選択）</option>
                        {GRID_TYPE_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="slotGridCols">
                      <input
                        type="number"
                        value={selectedRow.slotGridCols}
                        onChange={(e) =>
                          setSelectedRowPatch({ slotGridCols: e.target.value })
                        }
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="groupKind">
                      <select
                        value={selectedRow.groupKind}
                        onChange={(e) =>
                          setSelectedRowPatch({ groupKind: e.target.value })
                        }
                        className={styles.input}
                      >
                        <option value="">（選択）</option>
                        {GROUP_KIND_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="groupId">
                      <input
                        value={selectedRow.groupId}
                        onChange={(e) =>
                          setSelectedRowPatch({ groupId: e.target.value })
                        }
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="groupName">
                      <input
                        value={selectedRow.groupName}
                        onChange={(e) => {
                          const patch = { groupName: e.target.value };
                          syncGroup ? setGroupPatch(patch) : setSelectedRowPatch(patch);
                        }}
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="sourceUrl">
                      <input
                        value={selectedRow.sourceUrl}
                        onChange={(e) =>
                          setSelectedRowPatch({ sourceUrl: e.target.value })
                        }
                        className={styles.input}
                      />
                    </Labeled>

                    <Labeled label="detailUrl">
                      <input
                        value={selectedRow.detailUrl}
                        onChange={(e) =>
                          setSelectedRowPatch({ detailUrl: e.target.value })
                        }
                        className={styles.input}
                      />
                    </Labeled>
                  </div>

                  <div className={styles.stack}>
                    <Labeled label="description">
                      <textarea
                        value={selectedRow.description}
                        onChange={(e) =>
                          setSelectedRowPatch({ description: e.target.value })
                        }
                        rows={5}
                        className={styles.textarea}
                      />
                    </Labeled>
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
                    {materials.map((m, i) => (
                      <div key={i} className={styles.materialRow}>
                        <div className={styles.materialNameWrap}>
                          <input
                            value={m.name ?? ""}
                            onChange={(e) =>
                              updateMaterial(i, "name", e.target.value)
                            }
                            placeholder="素材名"
                            className={styles.input}
                          />
                        </div>

                        <input
                          value={m.item_id ?? ""}
                          onChange={(e) =>
                            updateMaterial(i, "item_id", e.target.value)
                          }
                          placeholder="item_id"
                          className={styles.input}
                        />

                        <input
                          type="number"
                          value={m.count ?? 1}
                          onChange={(e) =>
                            updateMaterial(i, "count", e.target.value)
                          }
                          placeholder="数量"
                          className={styles.input}
                        />

                        <button
                          onClick={() => deleteMaterial(i)}
                          className={styles.buttonDanger}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionTitle}>効果</div>
                    <button onClick={addEffect} className={styles.button}>
                      効果追加
                    </button>
                  </div>

                  <div className={styles.stack}>
                    {effects.map((effect, i) => (
                      <div key={i} className={styles.materialRow}>
                        <div className={styles.materialNameWrap}>
                          <input
                            value={typeof effect === "string" ? effect : JSON.stringify(effect)}
                            onChange={(e) => updateEffect(i, e.target.value)}
                            placeholder="効果"
                            className={styles.input}
                          />
                        </div>
                        <div />
                        <div />
                        <button
                          onClick={() => deleteEffect(i)}
                          className={styles.buttonDanger}
                        >
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
                        onChange={(e) =>
                          applyGridResize(Number(e.target.value) || 0, gridCols)
                        }
                        className={cx(styles.input, styles.inputSmall)}
                      />
                    </label>

                    <label className={styles.inlineField}>
                      cols
                      <input
                        type="number"
                        value={gridCols}
                        onChange={(e) =>
                          applyGridResize(gridRows, Number(e.target.value) || 0)
                        }
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
                              const disabled = isDisabledCell(
                                selectedRow.slotGridType,
                                r,
                                c
                              );

                              return (
                                <td key={`${r}-${c}`} className={styles.gridCell}>
                                  <input
                                    value={grid2d?.[r]?.[c] ?? ""}
                                    disabled={disabled}
                                    onChange={(e) =>
                                      updateGridCell(r, c, e.target.value)
                                    }
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      handleGridPaste(
                                        r,
                                        c,
                                        e.clipboardData.getData("text")
                                      );
                                    }}
                                    className={cx(
                                      styles.gridInput,
                                      disabled && styles.gridInputDisabled
                                    )}
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
                  <div className={styles.sectionTitle}>JSON確認用</div>
                  <pre className={styles.pre}>
                    {JSON.stringify(buildApiPayload(selectedRow), null, 2)}
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