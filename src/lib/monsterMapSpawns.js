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

function normalizeSpawn(row = {}) {
  return {
    id: row?.id ?? null,
    monster_id: row?.monster_id ?? null,
    map_id: row?.map_id ?? null,
    area: row?.area ?? "",
    spawn_time: row?.spawn_time ?? "normal",
    note: row?.note ?? "",
    map_name: row?.map_name ?? "",
    map_image_url:
      row?.map_image_url ??
      row?.image_url ??
      row?.image_path ??
      "",
  };
}

function extractList(json) {
  if (Array.isArray(json)) return json.map(normalizeSpawn);
  if (Array.isArray(json?.data)) return json.data.map(normalizeSpawn);
  if (Array.isArray(json?.data?.data)) return json.data.data.map(normalizeSpawn);
  return [];
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