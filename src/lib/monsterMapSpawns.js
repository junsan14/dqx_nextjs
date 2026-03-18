import axios from "axios";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return apiUrl.replace(/\/$/, "");
}

const API_URL = getApiUrl();

const api = axios.create({
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export function resolveImageUrl(path = "") {
  const value = String(path ?? "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return `${API_URL}/${value}`;
}

function parseCoords(area) {
  if (Array.isArray(area)) return area;

  if (typeof area === "string") {
    try {
      const parsed = JSON.parse(area);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeLayerRow(row = {}) {
  const rawImagePath =
    row?.image_path ??
    row?.image_url ??
    row?.map_image_url ??
    row?.map_image_path ??
    "";

  return {
    id: row?.id ?? null,
    map_id: row?.map_id ?? null,
    layer_name: row?.layer_name ?? "",
    floor_no: row?.floor_no ?? 0,
    display_order: row?.display_order ?? 1,
    image_path: rawImagePath,
    image_url: resolveImageUrl(rawImagePath),
  };
}

export function normalizeMapRow(row = {}) {
  const layers = Array.isArray(row?.layers)
    ? row.layers
        .map(normalizeLayerRow)
        .sort((a, b) => {
          const aOrder = Number(a?.display_order ?? 1);
          const bOrder = Number(b?.display_order ?? 1);
          if (aOrder !== bOrder) return aOrder - bOrder;

          const aFloor = Number(a?.floor_no ?? 0);
          const bFloor = Number(b?.floor_no ?? 0);
          return aFloor - bFloor;
        })
    : [];

  return {
    id: row?.id ?? null,
    name: row?.name ?? row?.map_name ?? "",
    continent: row?.continent ?? "",
    map_type: row?.map_type ?? "",
    image_path:
      row?.image_path ??
      row?.image_url ??
      row?.map_image_url ??
      row?.map_image_path ??
      "",
    image_url: resolveImageUrl(
      row?.image_path ??
        row?.image_url ??
        row?.map_image_url ??
        row?.map_image_path ??
        ""
    ),
    layers,
  };
}

export function normalizeSpawn(row = {}) {
  const area = row?.area ?? "";
  const coords = Array.isArray(row?.coords) ? row.coords : parseCoords(area);

  const rawLayerImagePath =
    row?.map_layer_image_path ??
    row?.layer_image_path ??
    row?.map_layer?.image_path ??
    row?.map_layer?.image_url ??
    row?.map?.image_path ??
    row?.map?.image_url ??
    row?.map_image_url ??
    row?.image_url ??
    row?.image_path ??
    "";

  const mapLayerName =
    row?.map_layer_name ??
    row?.layer_name ??
    row?.map_layer?.layer_name ??
    "";

  return {
    id: row?.id ?? null,
    __key: row?.id
      ? `spawn-${row.id}`
      : `spawn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    monster_id: row?.monster_id ?? null,
    map_id: row?.map_id ?? row?.map?.id ?? null,
    map_layer_id: row?.map_layer_id ?? row?.map_layer?.id ?? null,
    area: typeof area === "string" ? area : JSON.stringify(area ?? []),
    coords,
    spawn_time: row?.spawn_time ?? "normal",
    spawn_count: row?.spawn_count ?? "",
    symbol_count: row?.symbol_count ?? "",
    note: row?.note ?? "",
    map_name: row?.map_name ?? row?.map?.name ?? "",
    map_layer_name: mapLayerName,
    map_layer_floor_no:
      row?.map_layer_floor_no ??
      row?.floor_no ??
      row?.map_layer?.floor_no ??
      null,
    map_image_url: resolveImageUrl(rawLayerImagePath),
    grid_mode: row?.grid_mode ?? "block",
  };
}

function extractList(json) {
  if (Array.isArray(json)) return json.map(normalizeSpawn);
  if (Array.isArray(json?.data)) return json.data.map(normalizeSpawn);
  if (Array.isArray(json?.data?.data)) return json.data.data.map(normalizeSpawn);
  return [];
}

function buildSpawnPayload(spawn = {}, monsterId = null) {
  const coords = Array.isArray(spawn?.coords)
    ? spawn.coords
    : parseCoords(spawn?.area);

  return {
    monster_id: spawn?.monster_id ?? monsterId ?? null,
    map_id: spawn?.map_id ? Number(spawn.map_id) : null,
    map_layer_id: spawn?.map_layer_id ? Number(spawn.map_layer_id) : null,
    area: JSON.stringify(coords),
    spawn_time: spawn?.spawn_time ?? "normal",
    spawn_count: String(spawn?.spawn_count ?? "").trim(),
    symbol_count: String(spawn?.symbol_count ?? "").trim(),
    note: spawn?.note ?? "",
  };
}

export async function fetchMonsterMapSpawns(monsterId) {
  try {
    const res = await api.get(`${API_URL}/api/monster-map-spawns`, {
      params: monsterId ? { monster_id: monsterId } : {},
    });

    return extractList(res.data);
  } catch (error) {
    console.error(error);
    throw new Error("生息地一覧取得失敗");
  }
}

export async function createMonsterMapSpawn(payload) {
  try {
    const res = await api.post(`${API_URL}/api/monster-map-spawns`, payload);
    return normalizeSpawn(res.data?.data ?? res.data);
  } catch (error) {
    console.error(error);
    throw new Error("生息地作成失敗");
  }
}

export async function updateMonsterMapSpawn(id, payload) {
  try {
    const res = await api.put(`${API_URL}/api/monster-map-spawns/${id}`, payload);
    return normalizeSpawn(res.data?.data ?? res.data);
  } catch (error) {
    console.error(error);
    throw new Error("生息地更新失敗");
  }
}

export async function deleteMonsterMapSpawn(id) {
  try {
    const res = await api.delete(`${API_URL}/api/monster-map-spawns/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw new Error("生息地削除失敗");
  }
}

export async function saveMonsterMapSpawns(
  monsterId,
  nextSpawns = [],
  prevSpawns = []
) {
  const nextIds = new Set(
    (nextSpawns ?? []).map((row) => row?.id).filter(Boolean)
  );

  const deleteTargets = (prevSpawns ?? []).filter(
    (row) => row?.id && !nextIds.has(row.id)
  );

  for (const row of deleteTargets) {
    await deleteMonsterMapSpawn(row.id);
  }

  const saved = [];

  for (const row of nextSpawns ?? []) {
    const payload = buildSpawnPayload(row, monsterId);

    if (row?.id) {
      const updated = await updateMonsterMapSpawn(row.id, payload);
      saved.push(updated);
    } else {
      const created = await createMonsterMapSpawn(payload);
      saved.push(created);
    }
  }

  return saved.map(normalizeSpawn);
}