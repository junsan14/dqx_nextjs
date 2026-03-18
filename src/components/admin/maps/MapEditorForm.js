"use client";

import { useEffect, useMemo } from "react";
import { resolveMapImageUrl } from "@/lib/maps";
import Image from "next/image";
import {
  DEFAULT_CONTINENT_OPTIONS,
  DEFAULT_MAP_TYPE_OPTIONS,
  DEFAULT_LAYER_NAME_OPTIONS,
} from "./mapOptions";
import { applyMonsterThemeToStyleTree } from "../theme";

function normalizeOption(option) {
  if (typeof option === "string") {
    return {
      label: option,
      value: option,
      folder: "",
      fileName: "",
    };
  }

  return {
    label: option?.label ?? option?.value ?? "",
    value: option?.value ?? option?.label ?? "",
    folder: option?.folder ?? "",
    fileName: option?.fileName ?? "",
  };
}

/**
 * default の順番を維持しつつ、
 * 同じ value のものは default の label を優先して補完する
 */
function mergeOptionsByDefaultOrder(defaultOptions = [], apiOptions = []) {
  const defaultItems = Array.isArray(defaultOptions)
    ? defaultOptions.map(normalizeOption)
    : [];

  const apiItems = Array.isArray(apiOptions)
    ? apiOptions.map(normalizeOption)
    : [];

  const apiMap = new Map();
  for (const item of apiItems) {
    const key = String(item?.value ?? "");
    if (!key) continue;
    if (!apiMap.has(key)) {
      apiMap.set(key, item);
    }
  }

  const used = new Set();
  const merged = [];

  for (const def of defaultItems) {
    const key = String(def?.value ?? "");
    if (!key) continue;

    const api = apiMap.get(key);

    merged.push({
      value: key,
      label: def?.label || api?.label || key,
      folder: def?.folder || api?.folder || "",
      fileName: def?.fileName || api?.fileName || "",
    });

    used.add(key);
  }

  for (const api of apiItems) {
    const key = String(api?.value ?? "");
    if (!key || used.has(key)) continue;

    merged.push({
      value: key,
      label: api?.label || key,
      folder: api?.folder || "",
      fileName: api?.fileName || "",
    });
  }

  return merged;
}

export default function MapEditorForm({
  value,
  loading = false,
  continentOptions = [],
  mapTypeOptions = [],
  layerNameOptions = [],
  onChangeField,
  onAddLayer,
  onChangeLayer,
  onRemoveLayer,
  isMobile = false,
  theme,
}) {
  const styles = useMemo(() => getComponentStyles(theme), [theme]);

  const mergedContinentOptions = useMemo(() => {
    return mergeOptionsByDefaultOrder(
      DEFAULT_CONTINENT_OPTIONS,
      Array.isArray(continentOptions) ? continentOptions : []
    );
  }, [continentOptions]);

  const mergedMapTypeOptions = useMemo(() => {
    return mergeOptionsByDefaultOrder(
      DEFAULT_MAP_TYPE_OPTIONS,
      Array.isArray(mapTypeOptions) ? mapTypeOptions : []
    );
  }, [mapTypeOptions]);

  const mergedLayerNameOptions = useMemo(() => {
    const options =
      Array.isArray(layerNameOptions) && layerNameOptions.length > 0
        ? layerNameOptions
        : DEFAULT_LAYER_NAME_OPTIONS;

    return Array.isArray(options) ? options.map(normalizeOption) : [];
  }, [layerNameOptions]);

  useEffect(() => {
    if (!value?.continent || value?.continent_folder) return;

    const matched = mergedContinentOptions.find(
      (item) => item.value === value.continent
    );

    if (matched?.folder) {
      onChangeField?.("continent_folder", matched.folder);
    }
  }, [
    value?.continent,
    value?.continent_folder,
    mergedContinentOptions,
    onChangeField,
  ]);

  if (loading) {
    return <div style={styles.loading}>読み込み中...</div>;
  }

  const layers = Array.isArray(value?.layers) ? value.layers : [];

  function handleSelectImage(index, file) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    onChangeLayer?.(index, "image_file", file);
    onChangeLayer?.(index, "image_url", previewUrl);
  }

  return (
    <div style={styles.wrap}>
      <section style={styles.section}>
        <h2 style={styles.heading}>基本情報</h2>

        <div style={styles.grid(isMobile)}>
          <label style={styles.field}>
            <div style={styles.label}>大陸</div>
            <select
              value={value?.continent ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                const opt = mergedContinentOptions.find((o) => o.value === val);

                onChangeField?.("continent", val);
                onChangeField?.("continent_folder", opt?.folder ?? "");
              }}
              style={styles.input}
            >
              <option value="">選択</option>
              {mergedContinentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <div style={styles.label}>マップ名</div>
            <input
              value={value?.name ?? ""}
              onChange={(e) => onChangeField?.("name", e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <div style={styles.label}>マップ種別</div>
            <select
              value={value?.map_type ?? ""}
              onChange={(e) => onChangeField?.("map_type", e.target.value)}
              style={styles.input}
            >
              <option value="">選択</option>
              {mergedMapTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <div style={styles.label}>元URL</div>
            <input
              value={value?.source_url ?? ""}
              onChange={(e) => onChangeField?.("source_url", e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.layerList}>
          {layers.map((layer, index) => {
            const previewUrl =
              layer?.image_url || resolveMapImageUrl(layer?.image_path || "");

            return (
              <div key={layer?.id ?? `layer_${index}`} style={styles.layerCard}>
                <div style={styles.layerCardHeader}>
                  <div style={styles.layerCardIndex}>{index + 1}</div>
                  <button
                    type="button"
                    onClick={() => onRemoveLayer?.(index)}
                    style={styles.removeButton}
                  >
                    削除
                  </button>
                </div>

                <div style={styles.grid(isMobile)}>
                  <label style={styles.field}>
                    <div style={styles.label}>レイヤー名</div>
                   <input
                    list={`layer-name-options-${index}`}
                    value={layer?.layer_name ?? ""}
                    onChange={(e) =>
                      onChangeLayer?.(index, "layer_name", e.target.value)
                    }
                    style={styles.input}
                  />

                  <datalist id={`layer-name-options-${index}`}>
                    {mergedLayerNameOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </datalist>
                  </label>

                  <label style={styles.field}>
                    <div style={styles.label}>保存ファイル名</div>
                    <input
                      value={layer?.layer_file_name ?? ""}
                      onChange={(e) =>
                        onChangeLayer?.(index, "layer_file_name", e.target.value)
                      }
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <div style={styles.label}>floor_no</div>
                    <input
                      type="number"
                      value={layer?.floor_no ?? 0}
                      onChange={(e) =>
                        onChangeLayer?.(index, "floor_no", Number(e.target.value))
                      }
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <div style={styles.label}>表示順</div>
                    <input
                      type="number"
                      value={layer?.display_order ?? index + 1}
                      onChange={(e) =>
                        onChangeLayer?.(
                          index,
                          "display_order",
                          Number(e.target.value || index + 1)
                        )
                      }
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.field}>
                    <div style={styles.label}>元URL</div>
                    <input
                      value={layer?.source_url ?? ""}
                      onChange={(e) =>
                        onChangeLayer?.(index, "source_url", e.target.value)
                      }
                      style={styles.input}
                    />
                  </label>

                  <label style={{ ...styles.field, ...styles.fieldFull }}>
                    <div style={styles.label}>画像</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleSelectImage(index, e.target.files?.[0])
                      }
                      style={styles.input}
                    />
                    <div style={styles.helpText}>
                      保存時に自動で
                      /storage/images/maps/大陸/map_id_xxx/layer_file_name.webp
                      で保存される
                    </div>
                  </label>
                </div>

                {previewUrl ? (
                  <div style={styles.previewWrap}>
                    <Image
                      src={previewUrl}
                      alt={`map-layer-${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 900px"
                      style={styles.previewImage}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div style={styles.layerHeader}>
          <button type="button" onClick={onAddLayer} style={styles.addButton}>
            レイヤー追加
          </button>
        </div>
      </section>
    </div>
  );
}

const baseStyles = {
  wrap: {
    display: "grid",
    gap: "20px",
    minWidth: 0,
  },
  section: {
    border: "1px solid #e2e8f0",
    padding: "16px",
    borderRadius: "16px",
    minWidth: 0,
    background: "#ffffff",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    color: "#111827",
  },
  grid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "10px",
  }),
  field: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },
  fieldFull: {
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    border: "1px solid #cbd5e1",
    padding: "10px 12px",
    borderRadius: "8px",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  layerHeader: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "20px",
    marginBottom: "10px",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  addButton: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  layerList: {
    display: "grid",
    gap: "14px",
  },
  layerCard: {
    border: "1px solid #cbd5e1",
    padding: "14px",
    borderRadius: "12px",
    minWidth: 0,
    background: "#ffffff",
  },
  layerCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  layerCardIndex: {
    fontWeight: 700,
    color: "#0f172a",
  },
  removeButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
  },
  previewWrap: {
    position: "relative",
    width: "100%",
    marginTop: "10px",
    aspectRatio: "16 / 9",
    maxHeight: "480px",
    overflow: "hidden",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  previewImage: {
    objectFit: "contain",
  },
  helpText: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  loading: {
    padding: "20px",
    color: "#64748b",
  },
};

function getComponentStyles(theme) {
  return applyMonsterThemeToStyleTree(baseStyles, theme);
}