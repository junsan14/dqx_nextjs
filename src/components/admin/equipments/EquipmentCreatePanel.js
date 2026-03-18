"use client";

import styles from "./EquipmentForm.module.css";
import LabeledField from "./LabeledField";
import {
  buildEmptyGroupMembers,
  findEquipmentTypeById,
  getAutoSlotGridType,
  inferSingleSlotFromEquipmentType,
} from "./equipmentFormHelpers";

const GROUP_KIND_OPTIONS_FOR_CREATE = [
  { value: "tailoring_set", label: "ローブ(裁縫系)" },
  { value: "armor_set", label: "鎧(防具鍛冶系)" },
  { value: "craft_tool_set", label: "職人道具" },
];

const FALLBACK_NEW_ITEM = {
  itemName: "",
  equipmentTypeId: "",
  jobOverrideMode: "inherit",
  slot: "",
  slotGridType: "",
  groupName: "",
  equipLevel: "",
};

const FALLBACK_NEW_GROUP = {
  groupName: "",
  groupKind: "armor_set",
  equipmentTypeId: "",
  jobOverrideMode: "inherit",
  members: buildEmptyGroupMembers("armor_set"),
  equipLevel: "",
};

export default function EquipmentCreatePanel({
  newMode,
  setNewMode,
  newItem,
  setNewItem,
  newGroup,
  setNewGroup,
  equipmentTypes = [],
  saving,
  onCreateItem,
  onCreateGroup,
}) {
  const safeNewItem = newItem ?? FALLBACK_NEW_ITEM;
  const safeNewGroup = newGroup ?? FALLBACK_NEW_GROUP;
  const safeMembers = Array.isArray(safeNewGroup.members)
    ? safeNewGroup.members
    : [];

  const isCraftToolSet = safeNewGroup.groupKind === "craft_tool_set";

  function updateSingleEquipmentType(nextEquipmentTypeId) {
    const nextType = findEquipmentTypeById(equipmentTypes, nextEquipmentTypeId);
    const inferred = inferSingleSlotFromEquipmentType(nextType);

    setNewItem((prev) => ({
      ...(prev ?? FALLBACK_NEW_ITEM),
      equipmentTypeId: nextEquipmentTypeId,
      slot: inferred.slot || "",
      slotGridType: inferred.slotGridType || "",
    }));
  }

  function updateGroupEquipmentType(nextEquipmentTypeId) {
    const nextType = findEquipmentTypeById(equipmentTypes, nextEquipmentTypeId);

    setNewGroup((prev) => {
      const base = prev ?? FALLBACK_NEW_GROUP;
      const members = Array.isArray(base.members) ? base.members : [];

      return {
        ...base,
        equipmentTypeId: nextEquipmentTypeId,
        members: members.map((member) => ({
          ...member,
          slotGridType: getAutoSlotGridType(
            member.slot,
            nextType,
            base.groupKind,
            member
          ),
        })),
      };
    });
  }

  function updateGroupKind(nextKind) {
    const selectedType = findEquipmentTypeById(
      equipmentTypes,
      safeNewGroup.equipmentTypeId
    );

    setNewGroup((prev) => ({
      ...(prev ?? FALLBACK_NEW_GROUP),
      groupKind: nextKind,
      equipmentTypeId:
        nextKind === "craft_tool_set" ? "" : prev?.equipmentTypeId ?? "",
      equipLevel: nextKind === "craft_tool_set" ? "" : prev?.equipLevel ?? "",
      members: buildEmptyGroupMembers(nextKind).map((member) => ({
        ...member,
        slotGridType: getAutoSlotGridType(
          member.slot,
          selectedType,
          nextKind,
          member
        ),
      })),
    }));
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>新規追加</div>

        <div className={styles.actionsInline}>
          {newMode === "single" ? (
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={saving}
              onClick={onCreateItem}
            >
              保存
            </button>
          ) : (
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={saving}
              onClick={onCreateGroup}
            >
              保存
            </button>
          )}
        </div>
      </div>

      <div className={styles.segment}>
        <button
          type="button"
          onClick={() => setNewMode("single")}
          className={`${styles.segmentButton} ${
            newMode === "single" ? styles.segmentButtonActive : ""
          }`}
        >
          単体追加
        </button>
        <button
          type="button"
          onClick={() => setNewMode("group")}
          className={`${styles.segmentButton} ${
            newMode === "group" ? styles.segmentButtonActive : ""
          }`}
        >
          セット追加
        </button>
      </div>

      {newMode === "single" ? (
        <div className={styles.grid2}>
          <LabeledField label="装備名">
            <input
              className={styles.input}
              value={safeNewItem.itemName}
              onChange={(e) =>
                setNewItem((prev) => ({
                  ...(prev ?? FALLBACK_NEW_ITEM),
                  itemName: e.target.value,
                }))
              }
              placeholder="例: 皮のぼうし"
            />
          </LabeledField>

          <LabeledField label="装備レベル">
            <input
              type="number"
              className={styles.input}
              value={safeNewItem.equipLevel ?? ""}
              onChange={(e) =>
                setNewItem((prev) => ({
                  ...(prev ?? FALLBACK_NEW_ITEM),
                  equipLevel: e.target.value,
                }))
              }
              placeholder="例: 130"
              min="1"
            />
          </LabeledField>

          <LabeledField label="装備タイプ">
            <select
              className={styles.select}
              value={safeNewItem.equipmentTypeId}
              onChange={(e) => updateSingleEquipmentType(e.target.value)}
            >
              <option value="">未選択</option>
              {equipmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name ?? type.label ?? `#${type.id}`}
                </option>
              ))}
            </select>
          </LabeledField>
        </div>
      ) : (
        <>
          <div className={styles.grid2}>
            <LabeledField label="セット名">
              <input
                className={styles.input}
                value={safeNewGroup.groupName}
                onChange={(e) =>
                  setNewGroup((prev) => ({
                    ...(prev ?? FALLBACK_NEW_GROUP),
                    groupName: e.target.value,
                  }))
                }
                placeholder={
                  isCraftToolSet ? "例: 職人道具セット" : "例: 皮セット"
                }
              />
            </LabeledField>

            <LabeledField label="セット種類">
              <select
                className={styles.select}
                value={safeNewGroup.groupKind}
                onChange={(e) => updateGroupKind(e.target.value)}
              >
                {GROUP_KIND_OPTIONS_FOR_CREATE.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </LabeledField>

            {!isCraftToolSet ? (
              <>
                <LabeledField label="装備レベル">
                  <input
                    type="number"
                    className={styles.input}
                    value={safeNewGroup.equipLevel ?? ""}
                    onChange={(e) =>
                      setNewGroup((prev) => ({
                        ...(prev ?? FALLBACK_NEW_GROUP),
                        equipLevel: e.target.value,
                      }))
                    }
                    placeholder="例: 130"
                    min="1"
                  />
                </LabeledField>

                <LabeledField label="装備タイプ">
                  <select
                    className={styles.select}
                    value={safeNewGroup.equipmentTypeId}
                    onChange={(e) => updateGroupEquipmentType(e.target.value)}
                  >
                    <option value="">未選択</option>
                    {equipmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name ?? type.label ?? `#${type.id}`}
                      </option>
                    ))}
                  </select>
                </LabeledField>
              </>
            ) : null}
          </div>

          <div className={styles.stack}>
            {safeMembers.map((member, index) => (
              <div key={member.key} className={styles.memberCard}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={!!member.enabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewGroup((prev) => {
                        const base = prev ?? FALLBACK_NEW_GROUP;
                        const members = Array.isArray(base.members)
                          ? base.members
                          : [];

                        return {
                          ...base,
                          members: members.map((m, i) =>
                            i === index ? { ...m, enabled: checked } : m
                          ),
                        };
                      });
                    }}
                  />
                  <span>{member.slotLabel}</span>
                </label>

                <div className={styles.grid2}>
                  <LabeledField label="装備名">
                    <input
                      className={styles.input}
                      value={member.itemName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewGroup((prev) => {
                          const base = prev ?? FALLBACK_NEW_GROUP;
                          const members = Array.isArray(base.members)
                            ? base.members
                            : [];

                          return {
                            ...base,
                            members: members.map((m, i) =>
                              i === index ? { ...m, itemName: value } : m
                            ),
                          };
                        });
                      }}
                      placeholder={member.slotLabel}
                    />
                  </LabeledField>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}