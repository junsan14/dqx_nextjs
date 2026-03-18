"use client";

import { useMemo } from "react";
import styles from "./EquipmentForm.module.css";
import LabeledField from "./LabeledField";
import {
  JOB_OVERRIDE_MODE_OPTIONS,
  str,
  GRID_TYPE_OPTIONS,
} from "./equipmentFormHelpers";

const JOB_OVERRIDE_MODE_LABELS = {
  inherit: "継承",
  add: "追加",
  replace: "置き換え",
};

export default function EquipmentEditorPanel({
  row,
  equipmentTypes,
  allJobs = [],
  syncGroup,
  setSyncGroup,
  isSelectedGrouped,
  saving,
  onPatch,
  onGroupPatch,
  onSave,
  onDeleteItem,
  onDeleteGroup,
}) {
  if (!row) {
    return <section className={styles.card}>装備を選択してくれ</section>;
  }

  const isCraftToolSet = str(row.groupKind) === "craft_tool_set";

  const patch = (key, value) => onPatch({ [key]: value });

  const patchGroupAware = (key, value) => {
    if (syncGroup && isSelectedGrouped) {
      onGroupPatch({ [key]: value });
      return;
    }
    onPatch({ [key]: value });
  };

  const selectedEquipmentType = useMemo(() => {
    return (
      equipmentTypes.find(
        (type) => String(type.id) === String(row.equipmentTypeId)
      ) ||
      row.equipmentType ||
      null
    );
  }, [equipmentTypes, row.equipmentTypeId, row.equipmentType]);

  const selectableJobs = useMemo(() => {
    return (Array.isArray(allJobs) ? allJobs : []).map((job) => ({
      id: job.id,
      key: String(job.key ?? job.id ?? job.name),
      name: job.name ?? String(job.key ?? job.id ?? ""),
    }));
  }, [allJobs]);

  const inheritedJobs = useMemo(() => {
    const raw =
      selectedEquipmentType?.equipableTypes ??
      selectedEquipmentType?.equipable_types ??
      [];

    if (!Array.isArray(raw)) return [];

    const mapped = raw
      .map((item) => item?.gameJob ?? item?.game_job ?? item)
      .filter(Boolean)
      .map((job) => ({
        id: job.id ?? null,
        key: String(job.key ?? job.id ?? job.name),
        name: job.name ?? String(job.key ?? job.id ?? ""),
      }));

    const uniq = new Map();
    mapped.forEach((job) => {
      uniq.set(String(job.key), job);
    });

    return Array.from(uniq.values());
  }, [selectedEquipmentType]);

  const overrideJobs = useMemo(() => {
    if (!Array.isArray(row.overrideJobsJson)) return [];

    const mapped = row.overrideJobsJson
      .map((job) => {
        if (!job) return null;

        if (typeof job === "string") {
          const found = selectableJobs.find(
            (j) =>
              String(j.key) === String(job) || String(j.name) === String(job)
          );

          return found
            ? { key: String(found.key), name: found.name }
            : { key: String(job), name: String(job) };
        }

        return {
          key: String(job.key ?? job.id ?? job.name),
          name: job.name ?? job.label ?? String(job.key ?? job.id ?? ""),
        };
      })
      .filter(Boolean);

    const uniq = new Map();
    mapped.forEach((job) => {
      uniq.set(String(job.key), job);
    });

    return Array.from(uniq.values());
  }, [row.overrideJobsJson, selectableJobs]);

  const overrideJobKeySet = useMemo(() => {
    return new Set(overrideJobs.map((job) => String(job.key)));
  }, [overrideJobs]);

  const displayJobs = useMemo(() => {
    if (row.jobOverrideMode === "replace") {
      return overrideJobs.map((job) => ({
        ...job,
        source: "override",
      }));
    }

    if (row.jobOverrideMode === "add") {
      const merged = new Map();

      inheritedJobs.forEach((job) => {
        merged.set(String(job.key), {
          key: String(job.key),
          name: job.name,
          source: "inherit",
        });
      });

      overrideJobs.forEach((job) => {
        merged.set(String(job.key), {
          key: String(job.key),
          name: job.name,
          source: "override",
        });
      });

      return Array.from(merged.values());
    }

    return inheritedJobs.map((job) => ({
      ...job,
      source: "inherit",
    }));
  }, [row.jobOverrideMode, inheritedJobs, overrideJobs]);

  const handleEquipmentTypeChange = (value) => {
    const selectedType =
      equipmentTypes.find((type) => String(type.id) === String(value)) ?? null;

    const nextSlotGridType =
      selectedType?.slotGridType ??
      selectedType?.slot_grid_type ??
      selectedType?.gridType ??
      selectedType?.grid_type ??
      "";

    const payload = {
      equipmentTypeId: value,
      slotGridType: nextSlotGridType,
    };

    if (syncGroup && isSelectedGrouped) {
      onGroupPatch(payload);
      return;
    }

    onPatch(payload);
  };

  const setOverrideJobs = (jobs) => {
    patchGroupAware("overrideJobsJson", jobs);
  };

  const addOverrideJob = (job) => {
    const key = String(job.key ?? job.id ?? job.name);
    const name = job.name ?? String(job.key ?? job.id ?? "");

    if (overrideJobKeySet.has(key)) return;

    setOverrideJobs([...overrideJobs, { key, name }]);
  };

  const removeOverrideJob = (jobKey) => {
    const next = overrideJobs.filter(
      (job) => String(job.key) !== String(jobKey)
    );
    setOverrideJobs(next);
  };

  const toggleOverrideJob = (job) => {
    const key = String(job.key ?? job.id ?? job.name);

    if (overrideJobKeySet.has(key)) {
      removeOverrideJob(key);
      return;
    }

    addOverrideJob(job);
  };

  const clearOverrideJobs = () => {
    setOverrideJobs([]);
  };

  return (
    <section className={styles.card}>
      <div className={styles.stickySaveBar}>
        <div className={styles.saveLeft}>
          {isSelectedGrouped ? (
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={syncGroup}
                onChange={(e) => setSyncGroup(e.target.checked)}
              />
              <span>グループ同期</span>
            </label>
          ) : null}

          <button
            type="button"
            className={styles.buttonPrimary}
            disabled={saving}
            onClick={onSave}
          >
            保存
          </button>
        </div>

        <div className={styles.saveRight}>
          <button
            type="button"
            className={styles.buttonDanger}
            disabled={saving}
            onClick={onDeleteItem}
          >
            単体削除
          </button>

          {isSelectedGrouped ? (
            <button
              type="button"
              className={styles.buttonDanger}
              disabled={saving}
              onClick={onDeleteGroup}
            >
              セット削除
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>基本情報</div>
      </div>

      <div className={styles.compactFieldGrid}>
        <LabeledField label="ID">
          <input className={styles.inputCompact} value={row.id ?? ""} disabled />
        </LabeledField>

        <LabeledField label="アイテムID">
          <input
            className={styles.inputCompact}
            value={row.itemId}
            onChange={(e) => patch("itemId", e.target.value)}
          />
        </LabeledField>

        <LabeledField label="装備名">
          <input
            className={styles.inputCompactWide}
            value={row.itemName}
            onChange={(e) => patch("itemName", e.target.value)}
          />
        </LabeledField>

        {!isCraftToolSet ? (
          <LabeledField label="装備タイプ">
            <select
              className={styles.selectCompact}
              value={row.equipmentTypeId}
              onChange={(e) => handleEquipmentTypeChange(e.target.value)}
            >
              <option value="">未選択</option>
              {equipmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name ?? type.label ?? `#${type.id}`}
                </option>
              ))}
            </select>
          </LabeledField>
        ) : null}

        <LabeledField label="職業設定">
          <select
            className={styles.selectCompact}
            value={row.jobOverrideMode}
            onChange={(e) => patchGroupAware("jobOverrideMode", e.target.value)}
          >
            {JOB_OVERRIDE_MODE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {JOB_OVERRIDE_MODE_LABELS[mode] ?? mode}
              </option>
            ))}
          </select>
        </LabeledField>

        <LabeledField label="作成レベル">
          <input
            type="number"
            className={styles.inputCompactXs}
            value={row.craftLevel}
            onChange={(e) => patchGroupAware("craftLevel", e.target.value)}
          />
        </LabeledField>

        {!isCraftToolSet ? (
          <LabeledField label="装備レベル">
            <input
              type="number"
              className={styles.inputCompactXs}
              value={row.equipLevel}
              onChange={(e) => patchGroupAware("equipLevel", e.target.value)}
            />
          </LabeledField>
        ) : null}

        <LabeledField label="職人作成コマタイプ">
          <select
            className={styles.select}
            value={row.slotGridType || ""}
            onChange={(e) => patch("slotGridType", e.target.value)}
          >
            <option value="">未選択</option>
            {GRID_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </LabeledField>

        {isSelectedGrouped ? (
          <>
            <LabeledField label="セット種類">
              <input
                className={styles.inputCompact}
                value={row.groupKind}
                onChange={(e) => patchGroupAware("groupKind", e.target.value)}
              />
            </LabeledField>

            <LabeledField label="セットID">
              <input
                className={styles.inputCompact}
                value={row.groupId}
                onChange={(e) => patchGroupAware("groupId", e.target.value)}
              />
            </LabeledField>

            <LabeledField label="セット名">
              <input
                className={styles.inputCompact}
                value={row.groupName}
                onChange={(e) => patchGroupAware("groupName", e.target.value)}
              />
            </LabeledField>
          </>
        ) : null}

        <LabeledField label="レシピ本">
          <input
            className={styles.inputCompact}
            value={row.recipeBook}
            onChange={(e) => patch("recipeBook", e.target.value)}
          />
        </LabeledField>

        <LabeledField label="レシピ入手場所">
          <input
            className={styles.inputCompact}
            value={row.recipePlace}
            onChange={(e) => patch("recipePlace", e.target.value)}
          />
        </LabeledField>

        <LabeledField label="一覧URL">
          <input
            className={styles.inputCompactWide}
            value={row.sourceUrl}
            onChange={(e) => patch("sourceUrl", e.target.value)}
          />
        </LabeledField>

        <LabeledField label="詳細URL">
          <input
            className={styles.inputCompactWide}
            value={row.detailUrl}
            onChange={(e) => patch("detailUrl", e.target.value)}
          />
        </LabeledField>
      </div>

      <div className={styles.jobSection}>
        <div className={styles.label}>現在の装備可能職業</div>

        <div className={styles.tagList}>
          {displayJobs.length ? (
            displayJobs.map((job) => (
              <span
                key={job.key}
                className={`${styles.jobTag} ${
                  job.source === "override" ? styles.jobTagOverride : ""
                }`}
                title={
                  job.source === "override" ? "追加・置き換え職業" : "装備タイプ由来"
                }
              >
                {job.name}
              </span>
            ))
          ) : (
            <span className={styles.mutedText}>職業データなし</span>
          )}
        </div>
      </div>

      {row.jobOverrideMode !== "inherit" ? (
        <div className={styles.jobSection}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div className={styles.label}>
              {row.jobOverrideMode === "add"
                ? "追加する職業"
                : "置き換え後の職業"}
            </div>

            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={clearOverrideJobs}
            >
              クリア
            </button>
          </div>

          <div className={styles.tagList} style={{ marginTop: 10 }}>
            {selectableJobs.map((job) => {
              const selected = overrideJobKeySet.has(String(job.key));

              return (
                <button
                  key={job.id ?? job.key}
                  type="button"
                  className={`${styles.jobTag} ${
                    selected ? styles.jobTagOverride : ""
                  }`}
                  onClick={() => toggleOverrideJob(job)}
                  title={selected ? "クリックで削除" : "クリックで追加"}
                >
                  {job.name}
                  {selected ? " ×" : ""}
                </button>
              );
            })}
          </div>

          {overrideJobs.length ? (
            <>
              <div className={styles.label} style={{ marginTop: 12 }}>
                選択中
              </div>

              <div className={styles.tagList}>
                {overrideJobs.map((job) => (
                  <button
                    key={job.key}
                    type="button"
                    className={`${styles.jobTag} ${styles.jobTagOverride}`}
                    onClick={() => removeOverrideJob(job.key)}
                    title="クリックで削除"
                  >
                    {job.name} ×
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.mutedText} style={{ marginTop: 10 }}>
              まだ選択されていない
            </div>
          )}
        </div>
      ) : null}

      <LabeledField label="説明">
        <textarea
          className={styles.textarea}
          value={row.description}
          onChange={(e) => patch("description", e.target.value)}
          rows={5}
        />
      </LabeledField>

      <div className={styles.metaText}>
        <span>作成日時: {str(row.createdAt)}</span>
        <span>更新日時: {str(row.updatedAt)}</span>
      </div>
    </section>
  );
}