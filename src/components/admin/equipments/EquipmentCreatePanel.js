"use client";

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
    <section style={styles.card}>
      <div style={styles.sectionHead}>
        <div style={styles.sectionTitle}>新規追加</div>
      </div>

      <div style={styles.segment}>
        <button
          type="button"
          onClick={() => setNewMode("single")}
          style={segmentButtonStyle(newMode === "single")}
        >
          単体
        </button>
        <button
          type="button"
          onClick={() => setNewMode("group")}
          style={segmentButtonStyle(newMode === "group")}
        >
          セット
        </button>
      </div>

      {newMode === "single" ? (
        <div style={styles.grid2}>
          <LabeledField label="装備名">
            <input
              style={styles.input}
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
              style={styles.input}
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
              style={styles.select}
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
          <div style={styles.grid2}>
            <LabeledField label="セット名">
              <input
                style={styles.input}
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
                style={styles.select}
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
                    style={styles.input}
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
                    style={styles.select}
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

          <div style={styles.membersWrap}>
            {safeMembers.map((member, index) => (
              <div key={member.key ?? index} style={styles.memberCard}>
                <label style={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={!!member.enabled}
                    onChange={(e) =>
                      setNewGroup((prev) => {
                        const base = prev ?? FALLBACK_NEW_GROUP;
                        const members = Array.isArray(base.members)
                          ? [...base.members]
                          : [];
                        members[index] = {
                          ...members[index],
                          enabled: e.target.checked,
                        };
                        return { ...base, members };
                      })
                    }
                  />
                  <span>{member.slotLabel}</span>
                </label>

                <input
                  style={styles.input}
                  value={member.itemName ?? ""}
                  placeholder="名前を個別指定"
                  onChange={(e) =>
                    setNewGroup((prev) => {
                      const base = prev ?? FALLBACK_NEW_GROUP;
                      const members = Array.isArray(base.members)
                        ? [...base.members]
                        : [];
                      members[index] = {
                        ...members[index],
                        itemName: e.target.value,
                      };
                      return { ...base, members };
                    })
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const styles = {
  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text-title)",
  },

  segment: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "10px 12px",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-text)",
    borderRadius: 10,
    padding: "10px 12px",
  },

  membersWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  memberCard: {
    border: "1px solid var(--soft-border)",
    background: "var(--soft-bg)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--text-main)",
    fontWeight: 700,
  },
};

const segmentButtonStyle = (active) => ({
  border: `1px solid ${
    active ? "var(--selected-border)" : "var(--soft-border)"
  }`,
  background: active ? "var(--selected-bg)" : "var(--soft-bg)",
  color: "var(--text-main)",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700,
});