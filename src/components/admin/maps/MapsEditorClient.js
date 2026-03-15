"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createMap,
  deleteMap,
  fetchMap,
  fetchMaps,
  fetchMapOptions,
  updateMap,
} from "@/lib/maps";
import MapListPane from "./MapListPane";
import MapEditorForm from "./MapEditorForm";
import {
  getMonsterEditorTheme,
  usePrefersDarkMode,
} from "../theme";

function createEmptyLayer(order = 1) {
  return {
    id: null,
    map_id: null,
    layer_name: "",
    layer_file_name: "",
    floor_no: 0,
    image_path: "",
    image_url: "",
    image_file: null,
    source_url: "",
    display_order: order,
  };
}

function createEmptyMap() {
  return {
    id: null,
    continent: "",
    continent_folder: "",
    name: "",
    map_type: "",
    source_url: "",
    layers: [createEmptyLayer(1)],
  };
}

function getIsSp() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

export default function MapsEditorClient() {
  const isDark = usePrefersDarkMode();
  const theme = useMemo(() => getMonsterEditorTheme(isDark), [isDark]);

  const [keyword, setKeyword] = useState("");
  const [maps, setMaps] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [currentMap, setCurrentMap] = useState(createEmptyMap());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [continentOptions, setContinentOptions] = useState([]);
  const [mapTypeOptions, setMapTypeOptions] = useState([]);
  const [isSp, setIsSp] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  async function loadMaps(q = "") {
    setLoadingList(true);
    setMessage("");
    try {
      const rows = await fetchMaps(q);
      setMaps(rows);
      return rows;
    } catch (error) {
      console.error(error);
      setMessage(error.message || "マップ一覧取得失敗");
      return [];
    } finally {
      setLoadingList(false);
    }
  }

  async function loadOptions() {
    try {
      const data = await fetchMapOptions();
      setContinentOptions(data?.continents ?? []);
      setMapTypeOptions(data?.map_types ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMapDetail(id) {
    if (!id) return;
    setLoadingDetail(true);
    setMessage("");
    try {
      const row = await fetchMap(id);
      setCurrentMap({
        ...createEmptyMap(),
        ...row,
        continent_folder: row?.continent_folder ?? "",
        layers:
          Array.isArray(row?.layers) && row.layers.length > 0
            ? row.layers.map((layer, index) => ({
                ...createEmptyLayer(index + 1),
                ...layer,
                image_file: null,
              }))
            : [createEmptyLayer(1)],
      });
      setSelectedId(row.id);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "マップ詳細取得失敗");
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    const syncViewport = () => {
      const nextIsSp = getIsSp();
      setIsSp(nextIsSp);
      if (!nextIsSp) {
        setIsMobileListOpen(true);
      } else {
        setIsMobileListOpen(false);
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    (async () => {
      await loadOptions();
      const rows = await loadMaps("");

      if (rows.length > 0) {
        await loadMapDetail(rows[0].id);
      } else {
        setCurrentMap(createEmptyMap());
      }
    })();
  }, []);

  const selectedMapSummary = useMemo(() => {
    return maps.find((row) => Number(row.id) === Number(selectedId)) ?? null;
  }, [maps, selectedId]);

  function handleCreateNew() {
    setSelectedId(null);
    setCurrentMap(createEmptyMap());
    setMessage("新規作成モード");
    if (isSp) {
      setIsMobileListOpen(false);
    }
  }

  async function handleSelect(id) {
    if (!id) return;
    await loadMapDetail(id);

    if (getIsSp()) {
      setIsMobileListOpen(false);
    }
  }

  function handleChangeField(key, value) {
    setCurrentMap((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleAddLayer() {
    setCurrentMap((prev) => {
      const nextOrder = (prev.layers?.length ?? 0) + 1;

      return {
        ...prev,
        layers: [...(prev.layers ?? []), createEmptyLayer(nextOrder)],
      };
    });
  }

  function handleChangeLayer(index, key, value) {
    setCurrentMap((prev) => {
      const nextLayers = [...(prev.layers ?? [])];
      const target = nextLayers[index] ?? createEmptyLayer(index + 1);

      nextLayers[index] = {
        ...target,
        [key]:
          key === "floor_no" || key === "display_order"
            ? Number(value || 0)
            : value,
      };

      return {
        ...prev,
        layers: nextLayers,
      };
    });
  }

  function handleRemoveLayer(index) {
    setCurrentMap((prev) => {
      const nextLayers = [...(prev.layers ?? [])].filter((_, i) => i !== index);

      return {
        ...prev,
        layers:
          nextLayers.length > 0
            ? nextLayers.map((layer, i) => ({
                ...layer,
                display_order: i + 1,
              }))
            : [createEmptyLayer(1)],
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        continent: currentMap.continent?.trim() ?? "",
        continent_folder: currentMap.continent_folder?.trim() ?? "",
        name: currentMap.name?.trim() ?? "",
        map_type: currentMap.map_type?.trim() ?? "",
        source_url: currentMap.source_url?.trim() ?? "",
        layers: (currentMap.layers ?? []).map((layer, index) => ({
          id: layer.id ?? null,
          layer_name: layer.layer_name?.trim() ?? "",
          floor_no: Number(layer.floor_no ?? 0),
          image_file: layer.image_file ?? null,
          source_url: layer.source_url?.trim() ?? "",
          display_order: Number(layer.display_order ?? index + 1),
        })),
      };

      if (!payload.name) {
        throw new Error("マップ名は必須");
      }

      if (!payload.continent) {
        throw new Error("continent は必須");
      }

      if (!payload.map_type) {
        throw new Error("map_type は必須");
      }

      let saved;
      if (currentMap.id) {
        saved = await updateMap(currentMap.id, payload);
        setMessage("更新した");
      } else {
        saved = await createMap(payload);
        setMessage("作成した");
      }

      await loadOptions();
      const rows = await loadMaps(keyword);
      const nextId = saved?.id ?? currentMap.id ?? rows?.[0]?.id ?? null;

      if (nextId) {
        await loadMapDetail(nextId);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "保存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!currentMap?.id) {
      setCurrentMap(createEmptyMap());
      setSelectedId(null);
      setMessage("未保存データを破棄した");
      return;
    }

    const ok = window.confirm(`「${currentMap.name || "このマップ"}」を削除する?`);
    if (!ok) return;

    setSaving(true);
    setMessage("");

    try {
      await deleteMap(currentMap.id);
      setMessage("削除した");
      await loadOptions();

      const rows = await loadMaps(keyword);
      if (rows.length > 0) {
        await loadMapDetail(rows[0].id);
      } else {
        setSelectedId(null);
        setCurrentMap(createEmptyMap());
      }

      if (getIsSp()) {
        setIsMobileListOpen(false);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "削除失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    const rows = await loadMaps(keyword);

    if (rows.length === 0) {
      setSelectedId(null);
      setCurrentMap(createEmptyMap());
      return;
    }

    if (isSp) {
      setIsMobileListOpen(true);
    }

    const stillExists = rows.some((row) => Number(row.id) === Number(selectedId));
    if (stillExists && selectedId) {
      await loadMapDetail(selectedId);
    } else {
      await loadMapDetail(rows[0].id);
    }
  }

  return (
    <div style={pageStyle(theme)}>
      <div style={layoutStyle(isSp)}>
        <aside style={sidebarStyle(isSp)}>
          <div style={sidebarCardStyle(theme)}>
            <div style={sidebarHeaderStyle}>
              <h1 style={pageTitleStyle(theme)}>Maps Editor</h1>
              <button
                type="button"
                onClick={handleCreateNew}
                style={primaryButtonStyle(theme)}
              >
                新規追加
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} style={searchRowStyle(isSp)}>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="マップ名で検索"
                style={searchInputStyle(theme)}
              />
              <button type="submit" style={secondaryButtonStyle(theme)}>
                検索
              </button>
            </form>

            {isSp ? (
              <button
                type="button"
                onClick={() => setIsMobileListOpen((prev) => !prev)}
                style={mobileToggleButtonStyle(theme)}
              >
                {isMobileListOpen ? "候補を閉じる" : "候補を開く"}
              </button>
            ) : null}

            {(!isSp || isMobileListOpen) ? (
              <div style={mobileListWrapStyle(isSp, theme)}>
                <MapListPane
                  maps={maps}
                  loading={loadingList}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  theme={theme}
                />
              </div>
            ) : null}
          </div>
        </aside>

        <main style={mainStyle}>
          <div style={mainCardStyle(theme)}>
            <div style={statusRowStyle}>
              <div style={statusLeftStyle}>
                <div style={sectionTitleStyle(theme)}>
                  {currentMap?.id
                    ? `編集: ${selectedMapSummary?.name || currentMap.name}`
                    : "新規マップ作成"}
                </div>
                {message ? <div style={messageStyle(theme)}>{message}</div> : null}
              </div>

              <div style={actionRowStyle}>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={dangerButtonStyle(theme)}
                  disabled={saving}
                >
                  {currentMap?.id ? "削除" : "破棄"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={primaryButtonStyle(theme)}
                  disabled={saving || loadingDetail}
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>

            <MapEditorForm
              value={currentMap}
              loading={loadingDetail}
              continentOptions={continentOptions}
              mapTypeOptions={mapTypeOptions}
              onChangeField={handleChangeField}
              onAddLayer={handleAddLayer}
              onChangeLayer={handleChangeLayer}
              onRemoveLayer={handleRemoveLayer}
              isMobile={isSp}
              theme={theme}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

const pageStyle = (theme) => ({
  minHeight: "100vh",
  background: theme.pageBg,
  color: theme.pageText,
});

const layoutStyle = (isSp) => ({
  display: "grid",
  gridTemplateColumns: isSp ? "1fr" : "320px minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start",
});

const sidebarStyle = (isSp) => ({
  position: isSp ? "static" : "sticky",
  top: isSp ? "auto" : "20px",
  alignSelf: "start",
  minWidth: 0,
});

const sidebarCardStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: "18px",
  padding: "16px",
  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
});

const sidebarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const pageTitleStyle = (theme) => ({
  fontSize: "20px",
  fontWeight: 700,
  margin: 0,
  color: theme.title,
});

const searchRowStyle = (isSp) => ({
  display: "grid",
  gridTemplateColumns: isSp ? "1fr" : "1fr auto",
  gap: "10px",
  marginBottom: "14px",
});

const searchInputStyle = (theme) => ({
  minWidth: 0,
  border: `1px solid ${theme.inputBorder}`,
  borderRadius: "12px",
  padding: "10px 12px",
  fontSize: "14px",
  outline: "none",
  background: theme.inputBg,
  color: theme.inputText,
  width: "100%",
  boxSizing: "border-box",
});

const mobileToggleButtonStyle = (theme) => ({
  width: "100%",
  border: `1px solid ${theme.inputBorder}`,
  background: theme.inputBg,
  color: theme.text,
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: "14px",
});

const mobileListWrapStyle = (isSp, theme) => ({
  borderTop: isSp ? `1px solid ${theme.cardBorder}` : "none",
  paddingTop: isSp ? "14px" : 0,
});

const mainStyle = {
  minWidth: 0,
};

const mainCardStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
  minWidth: 0,
});

const statusRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const statusLeftStyle = {
  minWidth: 0,
  flex: "1 1 320px",
};

const sectionTitleStyle = (theme) => ({
  fontSize: "20px",
  fontWeight: 700,
  color: theme.title,
  marginBottom: "6px",
  wordBreak: "break-word",
});

const messageStyle = (theme) => ({
  fontSize: "13px",
  color: theme.subText,
});

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle = (theme) => ({
  border: `1px solid ${theme.primaryBorder}`,
  background: theme.primaryBg,
  color: theme.primaryText,
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
});

const secondaryButtonStyle = (theme) => ({
  border: `1px solid ${theme.secondaryBorder}`,
  background: theme.secondaryBg,
  color: theme.secondaryText,
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
});

const dangerButtonStyle = (theme) => ({
  border: `1px solid ${theme.dangerBorder}`,
  background: theme.dangerBg,
  color: theme.dangerText,
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
});
