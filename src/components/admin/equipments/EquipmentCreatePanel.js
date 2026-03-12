"use client";

import styles from "./EquipmentForm.module.css";
import LabeledField from "./LabeledField";
import {
  GROUP_KIND_OPTIONS,
  buildEmptyGroupMembers,
  str,
  findEquipmentTypeById,
  getAutoSlotGridType,
} from "./equipmentFormHelpers";

const SLOT_OPTIONS = [
  { value: "頭", label: "頭" },
  { value: "からだ上", label: "からだ上" },
  { value: "からだ下", label: "からだ下" },
  { value: "腕", label: "腕" },
  { value: "足", label: "足" },
  { value: "盾", label: "盾" },
  { value: "武器", label: "武器" },
];

export default function EquipmentCreatePanel({
  newMode,
  setNewMode,
  newItem,
  setNewItem,
  newGroup,
  setNewGroup,
  equipmentTypes,
  saving,
  onCreateItem,
  onCreateGroup,
}) {
  function updateSingleEquipmentType(nextEquipmentTypeId) {
    const nextType = findEquipmentTypeById(equipmentTypes, nextEquipmentTypeId);

    setNewItem((prev) => ({
      ...prev,
      equipmentTypeId: nextEquipmentTypeId,
      slotGridType: getAutoSlotGridType(prev.slot, nextType),
    }));
  }

  function updateSingleSlot(nextSlot) {
    const currentType = findEquipmentTypeById(
      equipmentTypes,
      newItem.equipmentTypeId
    );

    setNewItem((prev) => ({
      ...prev,
      slot: nextSlot,
      slotGridType: getAutoSlotGridType(nextSlot, currentType),
    }));
  }

  function updateGroupEquipmentType(nextEquipmentTypeId) {
    const nextType = findEquipmentTypeById(equipmentTypes, nextEquipmentTypeId);

    setNewGroup((prev) => ({
      ...prev,
      equipmentTypeId: nextEquipmentTypeId,
      members: prev.members.map((member) => ({
        ...member,
        slotGridType: getAutoSlotGridType(member.slot, nextType),
      })),
    }));
  }

  function updateGroupKind(nextKind) {
    const selectedType = findEquipmentTypeById(
      equipmentTypes,
      newGroup.equipmentTypeId
    );

    setNewGroup((prev) => ({
      ...prev,
      groupKind: nextKind,
      members: buildEmptyGroupMembers(nextKind).map((member) => ({
        ...member,
        slotGridType: getAutoSlotGridType(member.slot, selectedType),
      })),
    }));
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>新規追加</div>
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
              value={newItem.itemName}
              onChange={(e) =>
                setNewItem((prev) => ({ ...prev, itemName: e.target.value }))
              }
              placeholder="例: 皮のぼうし"
            />
          </LabeledField>

          <LabeledField label="装備レベル">
            <input
              type="number"
              className={styles.input}
              value={newItem.equipLevel ?? ""}
              onChange={(e) =>
                setNewItem((prev) => ({
                  ...prev,
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
              value={newItem.equipmentTypeId}
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

          <LabeledField label="部位">
            <select
              className={styles.select}
              value={newItem.slot}
              onChange={(e) => updateSingleSlot(e.target.value)}
            >
              <option value="">未選択</option>
              {SLOT_OPTIONS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </LabeledField>

          <LabeledField label="グリッドタイプ">
            <input
              className={styles.input}
              value={newItem.slotGridType ?? ""}
              readOnly
              placeholder="装備タイプと部位から自動設定"
            />
          </LabeledField>

          <LabeledField label="セット名">
            <input
              className={styles.input}
              value={newItem.groupName}
              onChange={(e) =>
                setNewItem((prev) => ({ ...prev, groupName: e.target.value }))
              }
              placeholder="単体なら空でもOK"
            />
          </LabeledField>
        </div>
      ) : (
        <>
          <div className={styles.grid2}>
            <LabeledField label="セット名">
              <input
                className={styles.input}
                value={newGroup.groupName}
                onChange={(e) =>
                  setNewGroup((prev) => ({ ...prev, groupName: e.target.value }))
                }
                placeholder="例: 皮セット"
              />
            </LabeledField>

            <LabeledField label="セット種類">
              <select
                className={styles.select}
                value={newGroup.groupKind}
                onChange={(e) => updateGroupKind(e.target.value)}
              >
                {GROUP_KIND_OPTIONS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </LabeledField>

            <LabeledField label="装備レベル">
              <input
                type="number"
                className={styles.input}
                value={newGroup.equipLevel ?? ""}
                onChange={(e) =>
                  setNewGroup((prev) => ({
                    ...prev,
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
                value={newGroup.equipmentTypeId}
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
          </div>

          <div className={styles.stack}>
            {newGroup.members.map((member, index) => (
              <div key={member.key} className={styles.memberCard}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={!!member.enabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewGroup((prev) => ({
                        ...prev,
                        members: prev.members.map((m, i) =>
                          i === index ? { ...m, enabled: checked } : m
                        ),
                      }));
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
                        setNewGroup((prev) => ({
                          ...prev,
                          members: prev.members.map((m, i) =>
                            i === index ? { ...m, itemName: value } : m
                          ),
                        }));
                      }}
                      placeholder={`${
                        str(newGroup.groupName).trim() || "セット名"
                      }${member.slotLabel}`}
                    />
                  </LabeledField>

                  <LabeledField label="グリッドタイプ">
                    <input
                      className={styles.input}
                      value={member.slotGridType ?? ""}
                      readOnly
                    />
                  </LabeledField>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.actions}>
        {newMode === "single" ? (
          <button
            type="button"
            className={styles.buttonPrimaryLarge}
            disabled={saving}
            onClick={onCreateItem}
          >
            ＋ 単体装備を追加
          </button>
        ) : (
          <button
            type="button"
            className={styles.buttonPrimaryLarge}
            disabled={saving}
            onClick={onCreateGroup}
          >
            ＋ セット装備を作成
          </button>
        )}
      </div>
    </section>
  );
}