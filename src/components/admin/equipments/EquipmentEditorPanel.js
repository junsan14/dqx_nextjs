"use client";

import { useMemo, useState } from "react";
import styles from "./EquipmentForm.module.css";
import LabeledField from "./LabeledField";
import { JOB_OVERRIDE_MODE_OPTIONS, str } from "./equipmentFormHelpers";

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
  const [jobSelectValue, setJobSelectValue] = useState("");

  if (!row) {
    return <section className={styles.card}>装備を選択してくれ</section>;
  }

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

  const inheritedJobs = useMemo(() => {
  const raw =
    selectedEquipmentType?.equipableTypes ??
    selectedEquipmentType?.equipable_types ??
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => item?.gameJob ?? item?.game_job)
    .filter(Boolean)
    .map((job) => ({
      id: job.id,
      key: String(job.key ?? job.id ?? job.name),
      name: job.name ?? String(job.key ?? job.id ?? ""),
    }));
}, [selectedEquipmentType]);

  const overrideJobs = useMemo(() => {
    return Array.isArray(row.overrideJobsJson) ? row.overrideJobsJson : [];
  }, [row.overrideJobsJson]);

  const selectableJobs = useMemo(() => {
    return (Array.isArray(allJobs) ? allJobs : []).map((job) => ({
      id: job.id,
      key: String(job.key ?? job.id ?? job.name),
      name: job.name ?? String(job.key ?? job.id ?? ""),
    }));
  }, [allJobs]);

  const displayJobs = useMemo(() => {
    if (row.jobOverrideMode === "replace") {
      return overrideJobs.map((job) =>
        typeof job === "string"
          ? { key: job, name: job, source: "override" }
          : {
              key: String(job.key ?? job.id ?? job.name),
              name: job.name ?? job.label ?? String(job.key ?? job.id ?? ""),
              source: "override",
            }
      );
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
        const key =
          typeof job === "string"
            ? String(job)
            : String(job.key ?? job.id ?? job.name);
        const name =
          typeof job === "string"
            ? String(job)
            : job.name ?? job.label ?? key;

        merged.set(String(key), {
          key: String(key),
          name,
          source: "override",
        });
      });

      return Array.from(merged.values());
    }

    return inheritedJobs.map((job) => ({
      key: String(job.key),
      name: job.name,
      source: "inherit",
    }));
  }, [row.jobOverrideMode, inheritedJobs, overrideJobs]);

  function addSelectedJob() {
    if (!jobSelectValue) return;

    const selected = selectableJobs.find(
      (job) => String(job.id) === String(jobSelectValue)
    );

    if (!selected) return;

    const key = String(selected.key);
    const name = selected.name;

    const exists = overrideJobs.some((j) => {
      const jKey =
        typeof j === "string" ? String(j) : String(j.key ?? j.id ?? j.name);
      return jKey === key;
    });

    if (exists) {
      setJobSelectValue("");
      return;
    }

    patchGroupAware("overrideJobsJson", [...overrideJobs, { key, name }]);
    setJobSelectValue("");
  }

  function removeOverrideJob(jobKey) {
    const next = overrideJobs.filter((j) => {
      const jKey =
        typeof j === "string" ? String(j) : String(j.key ?? j.id ?? j.name);
      return jKey !== jobKey;
    });

    patchGroupAware("overrideJobsJson", next);
  }

  return (
    <section className={styles.card}>
      <div className={styles.stickySaveBar}>
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

        <LabeledField label="装備タイプ">
          <select
            className={styles.selectCompact}
            value={row.equipmentTypeId}
            onChange={(e) => patchGroupAware("equipmentTypeId", e.target.value)}
          >
            <option value="">未選択</option>
            {equipmentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name ?? type.label ?? `#${type.id}`}
              </option>
            ))}
          </select>
        </LabeledField>

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
            onChange={(e) => patch("craftLevel", e.target.value)}
          />
        </LabeledField>

        <LabeledField label="装備レベル">
          <input
            type="number"
            className={styles.inputCompactXs}
            value={row.equipLevel}
            onChange={(e) => patch("equipLevel", e.target.value)}
          />
        </LabeledField>

        <LabeledField label="グリッドタイプ">
          <input
            className={styles.inputCompact}
            value={row.slotGridType ?? ""}
            onChange={(e) => patch("slotGridType", e.target.value)}
          />
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
        <div className={styles.label}>装備可能職業</div>
        <div className={styles.tagList}>
          {displayJobs.length ? (
            displayJobs.map((job) => (
              <span
                key={job.key}
                className={`${styles.jobTag} ${
                  job.source === "override" ? styles.jobTagOverride : ""
                }`}
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
          <div className={styles.label}>追加・置き換え職業</div>

          <div className={styles.customJobRow}>
            <select
              className={styles.selectCompact}
              value={jobSelectValue}
              onChange={(e) => setJobSelectValue(e.target.value)}
            >
              <option value="">職業を選択</option>
              {selectableJobs.map((job) => (
                <option key={job.id ?? job.key} value={job.id ?? job.key}>
                  {job.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={addSelectedJob}
            >
              追加
            </button>
          </div>

          {overrideJobs.length ? (
            <div className={styles.tagList}>
              {overrideJobs.map((job) => {
                const key =
                  typeof job === "string"
                    ? String(job)
                    : String(job.key ?? job.id ?? job.name);
                const name =
                  typeof job === "string"
                    ? String(job)
                    : job.name ?? job.label ?? key;

                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.jobTag} ${styles.jobTagOverride}`}
                    onClick={() => removeOverrideJob(key)}
                    title="クリックで削除"
                  >
                    {name} ×
                  </button>
                );
              })}
            </div>
          ) : null}
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