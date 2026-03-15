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
    };
  }

  return {
    label: option?.label ?? option?.value ?? "",
    value: option?.value ?? option?.label ?? "",
    folder: option?.folder ?? "",
  };
}

function mergeUniqueOptions(options = []) {
  const map = new Map();

  for (const raw of options) {
    const item = normalizeOption(raw);
    const key = String(item?.value ?? "");

    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
      continue;
    }

    const prev = map.get(key);

    map.set(key, {
      ...prev,
      label: prev?.label || item?.label || key,
      value: key,
      folder: prev?.folder || item?.folder || "",
    });
  }

  return Array.from(map.values());
}

export default function MapEditorForm({
  value,
  loading = false,
  continentOptions = [],
  mapTypeOptions = [],
  onChangeField,
  onAddLayer,
  onChangeLayer,
  onRemoveLayer,
  isMobile = false,
  theme,
}) {
  const styles = useMemo(() => getComponentStyles(theme), [theme]);

  const mergedContinentOptions = useMemo(() => {
    const apiOptions = Array.isArray(continentOptions) ? continentOptions : [];
    const defaultOptions = Array.isArray(DEFAULT_CONTINENT_OPTIONS)
      ? DEFAULT_CONTINENT_OPTIONS
      : [];

    return mergeUniqueOptions([...apiOptions, ...defaultOptions]);
  }, [continentOptions]);

  const mergedMapTypeOptions = useMemo(() => {
    const apiOptions = Array.isArray(mapTypeOptions) ? mapTypeOptions : [];
    const defaultOptions = Array.isArray(DEFAULT_MAP_TYPE_OPTIONS)
      ? DEFAULT_MAP_TYPE_OPTIONS
      : [];

    return mergeUniqueOptions([...apiOptions, ...defaultOptions]);
  }, [mapTypeOptions]);

  const mergedLayerNameOptions = useMemo(() => {
    return Array.isArray(DEFAULT_LAYER_NAME_OPTIONS)
      ? DEFAULT_LAYER_NAME_OPTIONS.map(normalizeOption)
      : [];
  }, []);

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
        <div style={styles.layerHeader}>
          <h2 style={styles.heading}>レイヤー</h2>
          <button type="button" onClick={onAddLayer} style={styles.addButton}>
            レイヤー追加
          </button>
        </div>

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
                    <select
                      value={layer?.layer_name ?? ""}
                      onChange={(e) =>
                        onChangeLayer?.(index, "layer_name", e.target.value)
                      }
                      style={styles.input}
                    >
                      <option value="">選択</option>
                      {mergedLayerNameOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                      /storage/images/maps/大陸/map_id_xxx/floor_no.拡張子
                      で保存される
                    </div>
                  </label>
                </div>

                {previewUrl ? (
                  <Image src={previewUrl} alt="" style={styles.previewImage} fill />
                ) : null}
              </div>
            );
          })}
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
    justifyContent: "space-between",
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
  previewImage: {
    width: "100%",
    marginTop: "10px",
    borderRadius: "8px",
    display: "block",
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
