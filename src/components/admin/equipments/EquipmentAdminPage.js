"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";

import styles from "./EquipmentForm.module.css";
import EquipmentToolbar from "./EquipmentToolbar";
import EquipmentListPanel from "./EquipmentListPanel";
import EquipmentCreatePanel from "./EquipmentCreatePanel";
import EquipmentEditorPanel from "./EquipmentEditorPanel";
import EquipmentGridPanel from "./EquipmentGridPanel";
import EquipmentMaterialsPanel from "./EquipmentMaterialsPanel";
import EquipmentEffectsPanel from "./EquipmentEffectsPanel";
import EquipmentJsonPreview from "./EquipmentJsonPreview";
import { fetchItemsByIds } from "@/lib/items";
import { fetchEquipments } from "@/lib/equipments";
import { fetchGameJobs } from "@/lib/gameJobs";
import { fetchEquipmentTypes } from "@/lib/equipmentTypes";
import {
  safeJsonParse,
  toJsonString,
  createEmptyRow,
  normalizeOneRowFromApi,
  hydrateRowMaterialsWithItems,
  buildApiPayload,
  buildGroupedRows,
  str,
  buildEmptyGroupMembers,
  makeGroupId,
  getDefaultGroupItemName,
  getGridPreset,
  makeItemId,
  getAutoSlotGridType,
  findEquipmentTypeById,
} from "./equipmentFormHelpers";

const DEFAULT_GROUP_KIND = "armor_set";

function createInitialNewItem() {
  return {
    itemName: "",
    equipmentTypeId: "",
    jobOverrideMode: "inherit",
    slot: "",
    slotGridType: "",
    groupName: "",
    equipLevel: "",
  };
}

function createInitialNewGroup(groupKind = DEFAULT_GROUP_KIND) {
  const safeGroupKind = groupKind || DEFAULT_GROUP_KIND;

  return {
    groupName: "",
    groupKind: safeGroupKind,
    equipmentTypeId: "",
    jobOverrideMode: "inherit",
    members: buildEmptyGroupMembers(safeGroupKind),
    equipLevel: "",
  };
}

export default function EquipmentAdminPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [syncGroup, setSyncGroup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [activeTab, setActiveTab] = useState("edit");

  const [newMode, setNewMode] = useState("single");
  const [newItem, setNewItem] = useState(createInitialNewItem());
  const [newGroup, setNewGroup] = useState(() => createInitialNewGroup());

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

  async function fetchInitial() {
    try {
      setLoading(true);

      const equipments = await fetchEquipments();
      const fetchedEquipmentTypes = await fetchEquipmentTypes();
      const jobs = await fetchGameJobs();

      const materialItemIds = Array.from(
        new Set(
          equipments.flatMap((row) => {
            const mats = Array.isArray(row.materialsJson)
              ? row.materialsJson
              : [];
            return mats
              .map((mat) => Number(mat?.item_id ?? mat?.itemId))
              .filter((id) => Number.isInteger(id) && id > 0);
          })
        )
      );

      let materialItems = [];

      if (materialItemIds.length > 0) {
        try {
          materialItems = await fetchItemsByIds(materialItemIds);
        } catch (error) {
          console.error("fetchItemsByIds failed", error);
          materialItems = [];
        }
      }

      const hydratedEquipments = equipments.map((row) =>
        hydrateRowMaterialsWithItems(row, materialItems)
      );

      setRows(hydratedEquipments);
      setEquipmentTypes(fetchedEquipmentTypes);
      setAllJobs(jobs);
      setAllItems(materialItems);

      if (hydratedEquipments[0]?.__key) {
        setSelectedKey(hydratedEquipments[0].__key);
      } else {
        setSelectedKey("");
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
        next.itemId = makeItemId(next, equipmentTypes);

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
        next.itemId = makeItemId(next, equipmentTypes);

        return next;
      })
    );
  }

  async function handleCreateItem() {
    const safeNewItem = newItem ?? createInitialNewItem();
    const name = str(safeNewItem.itemName).trim();

    if (!name) {
      alert("itemName は必須");
      return;
    }

    const selectedType = findEquipmentTypeById(
      equipmentTypes,
      safeNewItem.equipmentTypeId
    );

    const autoSlotGridType = getAutoSlotGridType(
      safeNewItem.slot,
      selectedType
    );
    const preset = getGridPreset(autoSlotGridType);

    const row = {
      ...createEmptyRow(),
      itemName: name,
      equipmentTypeId: str(safeNewItem.equipmentTypeId),
      equipmentType: selectedType,
      jobOverrideMode: "inherit",
      slot: str(safeNewItem.slot),
      slotGridType: autoSlotGridType,
      slotGridCols: preset?.cols ? String(preset.cols) : "",
      groupName: str(safeNewItem.groupName),
      groupKind: "",
      equipLevel: str(safeNewItem.equipLevel),
    };

    row.itemId = makeItemId(row, equipmentTypes);

    try {
      setSaving(true);

      const res = await axios.post("/api/equipments", buildApiPayload(row));
      const saved = hydrateRowMaterialsWithItems(
        normalizeOneRowFromApi(res.data?.data ?? res.data),
        allItems
      );

      setRows((prev) => [saved, ...prev]);
      setSelectedKey(saved.__key);
      setActiveTab("edit");
      setNewItem(createInitialNewItem());
    } catch (error) {
      console.error(error);
      alert("追加に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateGroup() {
    const safeNewGroup = newGroup ?? createInitialNewGroup();
    const groupName = str(safeNewGroup.groupName).trim();

    if (!groupName) {
      alert("groupName は必須");
      return;
    }

    const enabledMembers = Array.isArray(safeNewGroup.members)
      ? safeNewGroup.members.filter((m) => m.enabled)
      : [];

    if (!enabledMembers.length) {
      alert("少なくとも1つの部位をONにしてくれ");
      return;
    }

    const groupId = makeGroupId(groupName);
    const selectedType = findEquipmentTypeById(
      equipmentTypes,
      safeNewGroup.equipmentTypeId
    );
    const isCraftToolSet = str(safeNewGroup.groupKind) === "craft_tool_set";

    try {
      setSaving(true);

      const created = [];

      for (const member of enabledMembers) {
        const name =
          str(member.itemName).trim() ||
          (isCraftToolSet
            ? str(member.slotLabel).trim()
            : getDefaultGroupItemName(groupName, member.slotLabel));

        const autoSlotGridType = getAutoSlotGridType(
          member.slot,
          selectedType,
          safeNewGroup.groupKind,
          member
        );

        const preset = getGridPreset(autoSlotGridType);

        const row = {
          ...createEmptyRow(),
          itemName: name,
          equipmentTypeId: isCraftToolSet
            ? ""
            : str(safeNewGroup.equipmentTypeId),
          equipmentType: isCraftToolSet ? null : selectedType,
          jobOverrideMode: "inherit",
          slot: member.slot,
          slotGridType: autoSlotGridType,
          slotGridCols: preset?.cols ? String(preset.cols) : "",
          groupKind: str(safeNewGroup.groupKind),
          groupId,
          groupName,
          equipLevel: isCraftToolSet ? "" : str(safeNewGroup.equipLevel),
        };

        row.itemId = makeItemId(row, equipmentTypes);

        const res = await axios.post("/api/equipments", buildApiPayload(row));
        created.push(
          hydrateRowMaterialsWithItems(
            normalizeOneRowFromApi(res.data?.data ?? res.data),
            allItems
          )
        );
      }

      setRows((prev) => [...created, ...prev]);

      if (created[0]) {
        setSelectedKey(created[0].__key);
      }

      setActiveTab("edit");
      setNewGroup(createInitialNewGroup());
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
      const saveSingleOnly = !!selectedRow.__saveSingleOnly;

      const targetRows =
        !saveSingleOnly && syncGroup && gid
          ? rows.filter((r) => str(r.groupId).trim() === gid)
          : [selectedRow];

      for (const row of targetRows) {
        const payload = buildApiPayload({
          ...row,
          __saveSingleOnly: undefined,
        });

        if (row.id) {
          await axios.put(`/api/equipments/${row.id}`, payload);
        } else {
          const res = await axios.post("/api/equipments", payload);
          const saved = hydrateRowMaterialsWithItems(
            normalizeOneRowFromApi(res.data?.data ?? res.data),
            allItems
          );

          setRows((prev) =>
            prev.map((r) => (r.__key === row.__key ? saved : r))
          );
        }
      }

      setRows((prev) =>
        prev.map((r) =>
          r.__key === selectedRow.__key
            ? { ...r, __saveSingleOnly: undefined }
            : r
        )
      );

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

    if (!confirm(`セット「${selectedRow.groupName}」を全部削除しますか？`)) {
      return;
    }

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

  function addMaterial(newMaterial = null) {
    const material = newMaterial ?? { item_id: null, count: 1 };
    const next = [...materials, material];
    setSelectedRowPatch({ materialsJson: toJsonString(next, "[]") });
  }

  function updateMaterial(index, key, value) {
    const next = materials.map((m, i) =>
      i === index
        ? {
            ...m,
            [key]: key === "count" ? Number(value) || 0 : value,
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>装備管理</h1>

      <EquipmentToolbar
        loading={loading}
        saving={saving}
        rowsCount={rows.length}
        onReload={fetchInitial}
      />

      <div className={styles.layout}>
        <EquipmentListPanel
          query={query}
          setQuery={setQuery}
          displayEntries={displayEntries}
          selectedKey={selectedKey}
          selectedRow={selectedRow}
          setSelectedKey={(key) => {
            setSelectedKey(key);
            setActiveTab("edit");
          }}
        />

        <main className={styles.main}>
          <div className={styles.topTabs}>
            <button
              type="button"
              className={`${styles.topTabButton} ${
                activeTab === "edit" ? styles.topTabButtonActive : ""
              }`}
              onClick={() => setActiveTab("edit")}
            >
              編集
            </button>

            <button
              type="button"
              className={`${styles.topTabButton} ${
                activeTab === "create" ? styles.topTabButtonActive : ""
              }`}
              onClick={() => setActiveTab("create")}
            >
              新規追加
            </button>
          </div>

          {activeTab === "create" ? (
            <EquipmentCreatePanel
              newMode={newMode}
              setNewMode={setNewMode}
              newItem={newItem}
              setNewItem={setNewItem}
              newGroup={newGroup}
              setNewGroup={setNewGroup}
              equipmentTypes={equipmentTypes}
              saving={saving}
              onCreateItem={handleCreateItem}
              onCreateGroup={handleCreateGroup}
            />
          ) : !selectedRow ? (
            <section className={styles.card}>左から装備を選択してくれ</section>
          ) : (
            <>
              <EquipmentEditorPanel
                row={selectedRow}
                equipmentTypes={equipmentTypes}
                allJobs={allJobs}
                syncGroup={syncGroup}
                setSyncGroup={setSyncGroup}
                isSelectedGrouped={isSelectedGrouped}
                saving={saving}
                onPatch={setSelectedRowPatch}
                onGroupPatch={setGroupPatch}
                onSave={saveSelected}
                onDeleteItem={deleteCurrentItem}
                onDeleteGroup={deleteCurrentGroup}
              />

              <EquipmentGridPanel
                row={selectedRow}
                syncGroup={syncGroup}
                onPatch={setSelectedRowPatch}
                onGroupPatch={setGroupPatch}
              />

              <EquipmentMaterialsPanel
                materials={materials}
                allItems={allItems}
                onAdd={addMaterial}
                onUpdate={updateMaterial}
                onDelete={deleteMaterial}
              />

              <EquipmentEffectsPanel
                effects={effects}
                onAdd={addEffect}
                onUpdate={updateEffect}
                onDelete={deleteEffect}
              />

              <EquipmentJsonPreview payload={buildApiPayload(selectedRow)} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}