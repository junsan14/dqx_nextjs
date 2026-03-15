import axios from "axios";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return apiUrl.replace(/\/$/, "");
}

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export function getMonsterAssetUrl(path = "") {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

export async function searchMonsters(keyword = "", searchType = "monster") {
  try {
    const res = await api.get("/api/monster-search", {
      params: {
        keyword,
        search_type: searchType,
      },
    });

    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data)) return res.data;

    return [];
  } catch (error) {
    console.error(error);

    if (error.response) {
      throw new Error(`モンスター取得失敗: ${error.response.status}`);
    }

    throw new Error("モンスター取得失敗");
  }
}

export async function fetchMonsterDetail(id) {
  try {
    const res = await api.get(`/api/monster-search/${id}`);

    return res.data?.data ?? res.data ?? null;
  } catch (error) {
    console.error(error);

    if (error.response) {
      throw new Error(`モンスター詳細取得失敗: ${error.response.status}`);
    }

    throw new Error("モンスター詳細取得失敗");
  }
}


export async function createMonster(payload) {
  try {
    const res = await api.post("/api/monster-search", payload);
    return res.data?.data ?? res.data ?? null;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response) {
      throw new Error(`モンスター作成失敗: ${error.response.status}`);
    }

    throw new Error("モンスター作成失敗");
  }
}

export async function updateMonster(id, payload) {
  try {
    const res = await api.put(`/api/monster-search/${id}`, payload);
    return res.data?.data ?? res.data ?? null;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response) {
      throw new Error(`モンスター更新失敗: ${error.response.status}`);
    }

    throw new Error("モンスター更新失敗");
  }
}

export async function deleteMonster(id) {
  try {
    const res = await api.delete(`/api/monster-search/${id}`);
    return res.data?.data ?? res.data ?? null;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response) {
      throw new Error(`モンスター削除失敗: ${error.response.status}`);
    }

    throw new Error("モンスター削除失敗");
  }
}
export async function fetchMonstersAroundDisplayOrder(
  displayOrder,
  { range = 5, excludeId = null } = {}
) {
  try {
    const res = await api.get(`${API_URL}/api/monsters/around-display-order`, {
      params: {
        display_order: displayOrder,
        range,
        ...(excludeId ? { exclude_id: excludeId } : {}),
      },
    });

    const rows = res.data?.data ?? [];

    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error(error);
    throw new Error("前後モンスター取得失敗");
  }
}