"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import { fetchItemsByIds } from "@/lib/items";
import { fetchEquipments } from "@/lib/equipments";
import { fetchGameJobs } from "@/lib/gameJobs";
import { fetchEquipmentTypes } from "@/lib/equipmentTypes";

import EditorSidebar from "@/components/admin/shared/editor/EditorSidebar";
import EditorShell from "@/components/admin/shared/editor/EditorShell";
import EditorHeader from "@/components/admin/shared/editor/EditorHeader";
import useEditorLayout from "@/components/admin/shared/editor/useEditorLayout";
import FloatingToast from "@/components/admin/shared/editor/FloatingToast";
import useFloatingToast from "@/components/admin/shared/editor/useFloatingToast";

import EquipmentCreatePanel from "./EquipmentCreatePanel";
import EquipmentEditorPanel from "./EquipmentEditorPanel";
import EquipmentDetailsPanel from "./EquipmentDetailsPanel";

import {
  GROUP_MEMBER_PRESETS,
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
  getGroupDisplayName,
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

function getPresetMemberLabel(row) {
  const groupKind = str(row?.groupKind).trim();
  const presets = GROUP_MEMBER_PRESETS[groupKind] ?? [];

  const slot = str(row?.slot).trim();
  const slotGridType = str(row?.slotGridType).trim();

  const matched =
    presets.find((preset) => str(preset.slot).trim() === slot) ??
    presets.find((preset) => str(preset.slotGridType).trim() === slotGridType) ??
    null;

  return str(matched?.label).trim();
}

function getDeleteTargetText(row) {
  const groupName = getGroupDisplayName(row);
  const memberLabel = getPresetMemberLabel(row);
  const itemName = str(row?.itemName).trim();

  if (!str(row?.groupId).trim()) {
    return itemName || "装備";
  }

  if (memberLabel) {
    return `「${groupName}」の「${memberLabel}」`;
  }

  return `「${groupName}」の「${itemName || "部位"}」`;
}

export default function EquipmentsClient() {
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

  const [deleteChoiceOpen, setDeleteChoiceOpen] = useState(false);

  const { toast, showToast } = useFloatingToast();

  const { isMobile, sidebarOpen, closeSidebar, openSidebar, toggleSidebar } =
    useEditorLayout(900);

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

  const selectedGroupName = useMemo(() => {
    return selectedRow ? getGroupDisplayName(selectedRow) : "";
  }, [selectedRow]);

  const selectedMemberLabel = useMemo(() => {
    return selectedRow ? getPresetMemberLabel(selectedRow) : "";
  }, [selectedRow]);

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
      showToast("初期データ読み込みに失敗した", "error");
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
      showToast("itemName は必須", "error");
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
      showToast(`「${saved.itemName || name}」を作成した`);

      if (isMobile) closeSidebar();
    } catch (error) {
      console.error(error);
      showToast("追加に失敗した", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateGroup() {
    const safeNewGroup = newGroup ?? createInitialNewGroup();
    const groupName = str(safeNewGroup.groupName).trim();

    if (!groupName) {
      showToast("groupName は必須", "error");
      return;
    }

    const enabledMembers = Array.isArray(safeNewGroup.members)
      ? safeNewGroup.members.filter((m) => m.enabled)
      : [];

    if (!enabledMembers.length) {
      showToast("少なくとも1つの部位をONにしてくれ", "error");
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
      showToast(`「${groupName}」を作成した`);

      if (isMobile) closeSidebar();
    } catch (error) {
      console.error(error);
      showToast("セット追加に失敗した", "error");
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

      const targetName =
        getGroupDisplayName(selectedRow) || selectedRow.itemName || "装備";
      showToast(`「${targetName}」を保存した`);
    } catch (error) {
      console.error(error);
      showToast("保存に失敗した", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentItem() {
    if (!selectedRow) return;

    const targetText = getDeleteTargetText(selectedRow);

    if (!window.confirm(`${targetText}を削除しますか？`)) return;

    try {
      setSaving(true);

      if (selectedRow.id) {
        await axios.delete(`/api/equipments/${selectedRow.id}`);
      }

      setRows((prev) => prev.filter((r) => r.__key !== selectedRow.__key));
      setSelectedKey("");
      setDeleteChoiceOpen(false);
      showToast(`${targetText}を削除した`);

      if (isMobile) openSidebar();
    } catch (error) {
      console.error(error);
      showToast("削除に失敗した", "error");
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

    const targetName = getGroupDisplayName(selectedRow) || "装備セット";

    if (!window.confirm(`「${targetName}」を削除しますか？`)) {
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
      setDeleteChoiceOpen(false);
      showToast(`「${targetName}」を削除した`);

      if (isMobile) openSidebar();
    } catch (error) {
      console.error(error);
      showToast("セット削除に失敗した", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleHeaderDelete() {
    if (!selectedRow) return;

    const gid = str(selectedRow.groupId).trim();

    if (!gid) {
      await deleteCurrentItem();
      return;
    }

    setDeleteChoiceOpen(true);
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

  const isCreateTab = activeTab === "create";
  const createAction =
    newMode === "single" ? handleCreateItem : handleCreateGroup;

  const headerNotice = isCreateTab
    ? newMode === "single"
      ? "新規追加: 単体装備を作成中"
      : "新規追加: セット装備を作成中"
    : selectedRow
    ? `${selectedRow.itemName || getGroupDisplayName(selectedRow) || "名称なし"}を編集中`
    : loading
    ? "読み込み中..."
    : "";

  return (
    <>
      <EditorShell
        isMobile={isMobile}
        sidebar={
          <EditorSidebar
            isMobile={isMobile}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            keyword={query}
            onKeywordChange={setQuery}
            onCreateNew={() => {
              setActiveTab("create");
              if (isMobile) closeSidebar();
            }}
            createLabel="新規追加"
            loading={loading}
            title="装備一覧"
            searchPlaceholder="検索（名前 / 部位 / レシピ本 / グループ名）"
          >
            {displayEntries.map((entry) => {
              if (entry.__kind === "group") {
                const groupActive =
                  str(selectedRow?.groupId).trim() === str(entry.groupId).trim();

                return (
                  <div key={entry.__key} style={sidebarStyles.groupEntry}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(entry.rows[0]?.__key ?? "");
                        setActiveTab("edit");
                        if (isMobile) closeSidebar();
                      }}
                      style={entryButtonStyle(groupActive)}
                    >
                      <div style={sidebarStyles.entryTitle}>{entry.label}</div>
                      <div style={sidebarStyles.entryMeta}>
                        {`${entry.groupKind || "group"} / ${entry.items.length}件`}
                      </div>
                    </button>

                    <div style={sidebarStyles.groupChildren}>
                      {entry.items.map((item) => {
                        const childActive = selectedKey === item.__key;

                        return (
                          <button
                            key={item.__key}
                            type="button"
                            onClick={() => {
                              setSelectedKey(item.__key);
                              setActiveTab("edit");
                              if (isMobile) closeSidebar();
                            }}
                            style={childButtonStyle(childActive)}
                          >
                            <div style={sidebarStyles.entryChildSlot}>
                              {item.slot || "部位なし"}
                            </div>
                            <div style={sidebarStyles.entryChildName}>
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
                  type="button"
                  onClick={() => {
                    setSelectedKey(entry.__key);
                    setActiveTab("edit");
                    if (isMobile) closeSidebar();
                  }}
                  style={entryButtonStyle(active)}
                >
                  <div style={sidebarStyles.entryTitle}>{entry.label}</div>
                  <div style={sidebarStyles.entryMeta}>
                    {`${entry.row?.slot ?? ""} / Lv${entry.row?.equipLevel ?? "-"} / ${
                      entry.row?.groupName ?? ""
                    }`}
                  </div>
                </button>
              );
            })}
          </EditorSidebar>
        }
      >
        <EditorHeader
          isMobile={isMobile}
          title={headerNotice}
          onSave={isCreateTab ? createAction : saveSelected}
          onDelete={isCreateTab ? undefined : handleHeaderDelete}
          saving={saving}
          saveDisabled={saving || loading || (isCreateTab ? false : !selectedRow)}
          deleteDisabled={saving || loading || isCreateTab || !selectedRow}
        />

        {activeTab === "create" ? (
          <EquipmentCreatePanel
            newMode={newMode}
            setNewMode={setNewMode}
            newItem={newItem}
            setNewItem={setNewItem}
            newGroup={newGroup}
            setNewGroup={setNewGroup}
            equipmentTypes={equipmentTypes}
          />
        ) : (
          <div style={styles.stack}>
            <EquipmentEditorPanel
              row={selectedRow}
              equipmentTypes={equipmentTypes}
              allJobs={allJobs}
              syncGroup={syncGroup}
              setSyncGroup={setSyncGroup}
              isSelectedGrouped={isSelectedGrouped}
              onPatch={setSelectedRowPatch}
              onGroupPatch={setGroupPatch}
            />

            <EquipmentDetailsPanel
              row={selectedRow}
              allItems={allItems}
              materials={materials}
              effects={effects}
              onPatch={setSelectedRowPatch}
              onAddMaterial={addMaterial}
              onUpdateMaterial={updateMaterial}
              onDeleteMaterial={deleteMaterial}
              onAddEffect={addEffect}
              onUpdateEffect={updateEffect}
              onDeleteEffect={deleteEffect}
            />
          </div>
        )}
      </EditorShell>

      {deleteChoiceOpen && selectedRow ? (
        <div style={styles.modalOverlay} onClick={() => setDeleteChoiceOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>削除方法を選択</div>

            <div style={styles.modalText}>
              {selectedMemberLabel
                ? `「${selectedGroupName}」の「${selectedMemberLabel}」を選択中`
                : `「${selectedGroupName}」の部位を選択中`}
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={deleteCurrentItem}
                disabled={saving}
                style={dangerSoftButtonStyle(saving)}
              >
                この部位だけ削除
              </button>

              <button
                type="button"
                onClick={deleteCurrentGroup}
                disabled={saving}
                style={dangerSoftButtonStyle(saving)}
              >
                セット全体を削除
              </button>

              <button
                type="button"
                onClick={() => setDeleteChoiceOpen(false)}
                disabled={saving}
                style={minorButtonStyle(saving)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FloatingToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        isMobile={isMobile}
      />
    </>
  );
}

const styles = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 2000,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text-title)",
  },

  modalText: {
    fontSize: 14,
    color: "var(--text-main)",
    lineHeight: 1.6,
  },

  modalActions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
};

const sidebarStyles = {
  groupEntry: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  groupChildren: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    paddingLeft: 10,
  },

  entryTitle: {
    fontWeight: 700,
    color: "var(--text-main)",
    textAlign: "left",
    wordBreak: "break-word",
  },

  entryMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "var(--text-muted)",
    textAlign: "left",
    wordBreak: "break-word",
  },

  entryChildSlot: {
    fontSize: 12,
    color: "var(--text-muted)",
    textAlign: "left",
  },

  entryChildName: {
    marginTop: 2,
    color: "var(--text-main)",
    fontWeight: 700,
    textAlign: "left",
    wordBreak: "break-word",
  },
};

const entryButtonStyle = (active) => ({
  width: "100%",
  border: `1px solid ${
    active ? "var(--selected-border)" : "var(--card-border)"
  }`,
  background: active ? "var(--selected-bg)" : "var(--card-bg)",
  borderRadius: 10,
  padding: "12px 14px",
  cursor: "pointer",
  minWidth: 0,
});

const childButtonStyle = (active) => ({
  width: "100%",
  border: `1px solid ${
    active ? "var(--selected-border)" : "var(--soft-border)"
  }`,
  background: active ? "var(--selected-bg)" : "var(--soft-bg)",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
  minWidth: 0,
});

const minorButtonStyle = (disabled) => ({
  border: "1px solid var(--soft-border)",
  background: disabled ? "var(--input-disabled-bg)" : "var(--soft-bg)",
  color: "var(--text-main)",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.7 : 1,
});

const dangerSoftButtonStyle = (disabled) => ({
  border: "1px solid var(--danger-border, #fca5a5)",
  background: disabled ? "var(--input-disabled-bg)" : "var(--soft-bg)",
  color: "var(--danger-text, #b91c1c)",
  borderRadius: 10,
  padding: "12px 14px",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 700,
  opacity: disabled ? 0.7 : 1,
});