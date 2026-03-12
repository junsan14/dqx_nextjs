"use client";

import React, { useMemo, useState, useEffect } from "react";
import styles from "./EquipmentForm.module.css";

import EquipmentSidebar from "./EquipmentSidebar";
import EquipmentCreatePanel from "./EquipmentCreatePanel";
import EquipmentEditor from "./EquipmentEditor";

import {
  getEquipments,
  createEquipment,
  updateEquipment,
  removeEquipment,
  createMaterialItem,
} from "@/lib/equipments";
import {
  safeJsonParse,
  toJsonString,
  makeKey,
  makeItemId,
  buildGroupedRows,
  buildEmptyGroupMembers,
  ensureGridSize,
  normalizeGrid,
  denormalizeGrid
} from "./equipmentHelpers";
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
/**
 * ここに元の EquipmentForm.js にある
 * - DEFAULT_HEADERS
 * - ITEM_KIND_OPTIONS
 * - CRAFT_TYPE_OPTIONS
 * - WEAPON_ITEM_TYPES
 * - ARMOR_ITEM_TYPES
 * - DEFAULT_GRID_TYPES
 * - DEFAULT_JOBS
 * - WEAPON_DEFAULT_JOBS
 * - ARMOR_GROUP_DEFAULT_JOBS
 * - WEAPON_EQUIPABLE_TYPES
 * - ARMOR_EQUIPABLE_TYPES
 * - GROUP_MEMBER_PRESETS
 * - GRID_TYPE_PRESETS
 * - WEAPON_GRID_TYPES
 * - ARMOR_GRID_TYPES
 * - SEWING_GRID_TYPES
 * - WEAPON_ITEM_TYPE_KEYS
 * - ARMOR_ITEM_TYPE_KEYS
 *
 * と、下記 helper 関数をそのままコピペ
 * - getItemTypeKey
 * - buildRowDerivedFields
 * - cx
 * - safeJsonParse
 * - toJsonString
 * - str
 * - makeKey
 * - makeItemId
 * - getGroupKindPreset
 * - getGroupMemberPreset
 * - buildEmptyGroupMembers
 * - makeGroupId
 * - getDefaultGroupItemName
 * - normalizeMaterial
 * - normalizeGrid
 * - denormalizeGrid
 * - ensureGridSize
 * - parseGridTypeToSize
 * - getGridPreset
 * - isDisabledCell
 * - getDefaultJobsForEquipableType
 * - getItemTypeOptions
 * - getGridTypeFromItemType
 * - getDisplaySlotFromItemType
 * - getGroupDisplayName
 * - isGroupedRow
 * - buildGroupedRows
 * - normalizeOneRowFromApi
 * - buildApiPayload
 */

function Labeled({ label, children }) {
  return (
    <label className={styles.field}>
      <div className={styles.label}>{label}</div>
      {children}
    </label>
  );
}

export default function EquipmentForm() {
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
      const list = await getEquipments();
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
      Array.from(
        new Set(rows.map((r) => str(r[key]).trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "ja"));

    const craftTypes = Array.from(
      new Set([...CRAFT_TYPE_OPTIONS, ...uniq("craftType")])
    );

    const itemTypes = Array.from(
      new Set([...WEAPON_ITEM_TYPES, ...ARMOR_ITEM_TYPES, ...uniq("itemType")])
    ).sort((a, b) => a.localeCompare(b, "ja"));

    const itemKinds = Array.from(
      new Set([...ITEM_KIND_OPTIONS, ...uniq("itemKind")])
    ).sort((a, b) => a.localeCompare(b, "ja"));

    const slots = uniq("slot");

    const gridTypes = Array.from(
      new Set([...DEFAULT_GRID_TYPES, ...uniq("slotGridType")])
    ).sort((a, b) => a.localeCompare(b, "ja"));

    const materialSet = new Set();
    for (const r of rows) {
      const arr = safeJsonParse(r.materialsJson, []);
      if (!Array.isArray(arr)) continue;
      for (const m of arr) {
        const name = (m?.name ?? "").toString().trim();
        if (name) materialSet.add(name);
      }
    }
    const materialNames = Array.from(materialSet).sort((a, b) =>
      a.localeCompare(b, "ja")
    );

    const jobSet = new Set(DEFAULT_JOBS);
    for (const r of rows) {
      const arr = safeJsonParse(r.jobsJson, []);
      if (!Array.isArray(arr)) continue;
      for (const j of arr) {
        const name = (j ?? "").toString().trim();
        if (name) jobSet.add(name);
      }
    }
    const jobNames = Array.from(jobSet).sort((a, b) =>
      a.localeCompare(b, "ja")
    );

    const equipableFromCsv = uniq("equipableType");
    const equipableTypeOptions = Array.from(
      new Set([
        ...equipableFromCsv,
        ...WEAPON_EQUIPABLE_TYPES,
        ...ARMOR_EQUIPABLE_TYPES,
        "大盾",
        "小盾",
      ])
    ).sort((a, b) => a.localeCompare(b, "ja"));

    return {
      craftTypes,
      itemTypes,
      itemKinds,
      slots,
      gridTypes,
      materialNames,
      jobNames,
      equipableTypeOptions,
    };
  }, [rows]);

  const displayEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const grouped = buildGroupedRows(rows);
    if (!q) return grouped;

    return grouped.filter((entry) => {
      const baseText = (entry.searchText || "").toLowerCase();

      if (entry.__kind === "group") {
        const equipLevels = Array.isArray(entry.items)
          ? entry.items.map((it) => String(it.equipLevel ?? "")).join(" ")
          : "";
        const craftLevels = Array.isArray(entry.items)
          ? entry.items.map((it) => String(it.craftLevel ?? "")).join(" ")
          : "";
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

      return (
        baseText.includes(q) ||
        rowEquipLevel.includes(q) ||
        rowCraftLevel.includes(q)
      );
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
    return getItemTypeOptions(
      selectedRow?.itemKind ?? "",
      selectedRow?.craftType ?? ""
    );
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

        if (!next.itemId || next.itemId.trim() === "") {
          next.itemId = makeItemId(next);
        }
        if ((next.groupId ?? "").trim() === "" && next.itemId) {
          next.groupId = next.itemId;
        }

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
        if (!next.itemId || next.itemId.trim() === "") {
          next.itemId = makeItemId(next);
        }
        if ((next.groupId ?? "").trim() === "" && next.itemId) {
          next.groupId = next.itemId;
        }

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
      const savedRow = await createEquipment(buildApiPayload(row));
      const saved = normalizeOneRowFromApi(savedRow, headers);
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
        const itemName =
          (m.itemName || "").trim() ||
          getDefaultGroupItemName(groupName, m.slotLabel, m.itemType);

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

        const savedRow = await createEquipment(buildApiPayload(row));
        createdRows.push(normalizeOneRowFromApi(savedRow, headers));
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
      idx === i
        ? {
            ...m,
            [key]:
              key === "qty" || key === "defaultUnitCost"
                ? Number(value)
                : value,
          }
        : m
    );
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function setMaterialName(i, name) {
    const next = materials.map((m, idx) =>
      idx === i ? { ...m, name } : m
    );
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
    setSelectedRowPatch({
      slotGridJson: den == null ? "" : toJsonString(den, ""),
    });
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

    setSelectedRowPatch({
      itemKind: v,
      itemType: nextItemType,
    });
  }

  function handleSelectedItemTypeChange(v) {
    setSelectedRowPatch({ itemType: v });

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
        setGroupPatch({
          equipableType: value,
          jobsJson: toJsonString(defaults, "[]"),
        });
      } else {
        setSelectedRowPatch({
          equipableType: value,
          jobsJson: toJsonString(defaults, "[]"),
        });
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
        await createMaterialItem(name);
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
          await updateEquipment(row.id, payload);
        } else {
          const savedRow = await createEquipment(payload);
          const saved = normalizeOneRowFromApi(savedRow, headers);
          setRows((prev) =>
            prev.map((r) => (r.__key === row.__key ? saved : r))
          );
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
        await removeEquipment(selectedRow.id);
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
          await removeEquipment(row.id);
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

      <EquipmentCreatePanel
        newMode={newMode}
        setNewMode={setNewMode}
        newItem={newItem}
        setNewItem={setNewItem}
        newGroup={newGroup}
        setNewGroup={setNewGroup}
        saving={saving}
        CRAFT_TYPE_OPTIONS={CRAFT_TYPE_OPTIONS}
        ITEM_KIND_OPTIONS={ITEM_KIND_OPTIONS}
        itemTypeOptionsForNewItem={itemTypeOptionsForNewItem}
        groupKindOptions={groupKindOptions}
        buildEmptyGroupMembers={buildEmptyGroupMembers}
        getGroupKindPreset={getGroupKindPreset}
        getDefaultGroupItemName={getDefaultGroupItemName}
        handleNewItemCraftTypeChange={handleNewItemCraftTypeChange}
        handleNewItemKindChange={handleNewItemKindChange}
        handleNewItemTypeChange={handleNewItemTypeChange}
        handleNewGroupCraftTypeChange={handleNewGroupCraftTypeChange}
        addNewItem={addNewItem}
        addNewGroup={addNewGroup}
      />

      {loading ? (
        <div className={styles.card}>読み込み中...</div>
      ) : (
        <div className={styles.layout}>
          <EquipmentSidebar
            query={query}
            setQuery={setQuery}
            displayEntries={displayEntries}
            selectedKey={selectedKey}
            selectedRow={selectedRow}
            setSelectedKey={setSelectedKey}
          />

          <main className={styles.main}>
            <EquipmentEditor
              selectedRow={selectedRow}
              saving={saving}
              syncGroup={syncGroup}
              setSyncGroup={setSyncGroup}
              saveSelected={saveSelected}
              deleteCurrentItem={deleteCurrentItem}
              deleteCurrentGroup={deleteCurrentGroup}
              isSelectedGrouped={isSelectedGrouped}
              CRAFT_TYPE_OPTIONS={CRAFT_TYPE_OPTIONS}
              ITEM_KIND_OPTIONS={ITEM_KIND_OPTIONS}
              itemTypeOptionsForSelectedRow={itemTypeOptionsForSelectedRow}
              enums={enums}
              handleSelectedCraftTypeChange={handleSelectedCraftTypeChange}
              handleSelectedItemKindChange={handleSelectedItemKindChange}
              handleSelectedItemTypeChange={handleSelectedItemTypeChange}
              onChangeEquipableType={onChangeEquipableType}
              setSelectedRowPatch={setSelectedRowPatch}
              setGroupPatch={setGroupPatch}
              jobs={jobs}
              deleteJob={deleteJob}
              addJob={addJob}
              jobQuery={jobQuery}
              setJobQuery={setJobQuery}
              jobCandidates={jobCandidates}
              materials={materials}
              addMaterial={addMaterial}
              materialQuery={materialQuery}
              setMaterialQuery={setMaterialQuery}
              materialCandidates={materialCandidates}
              setMaterialName={setMaterialName}
              updateMaterial={updateMaterial}
              deleteMaterial={deleteMaterial}
              gridRows={gridRows}
              gridCols={gridCols}
              applyGridResize={applyGridResize}
              grid2d={grid2d}
              isDisabledCell={isDisabledCell}
              updateGridCell={updateGridCell}
              handleGridPaste={handleGridPaste}
            />
          </main>
        </div>
      )}
    </div>
  );
}