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

function normalizeAccessory(row = {}) {
  return {
    id: row?.id ?? null,
    item_id: row?.item_id ?? "",
    name: row?.name ?? "",
    item_kind: row?.item_kind ?? "accessory",
    slot: row?.slot ?? "",
    accessory_type: row?.accessory_type ?? "",
    equip_level: row?.equip_level ?? null,
    description: row?.description ?? "",
    effects_json: Array.isArray(row?.effects_json) ? row.effects_json : [],
    synthesis_effects_json: Array.isArray(row?.synthesis_effects_json)
      ? row.synthesis_effects_json
      : [],
    obtain_methods_json: Array.isArray(row?.obtain_methods_json)
      ? row.obtain_methods_json
      : [],
    image_url: row?.image_url ?? "",
    source_url: row?.source_url ?? "",
    detail_url: row?.detail_url ?? "",
    drop_monsters: Array.isArray(row?.drop_monsters) ? row.drop_monsters : [],
  };
}

export async function fetchAccessories(q = "") {
  try {
    const res = await api.get(`${API_URL}/api/accessories`, {
      params: q ? { q } : {},
    });

    const json = res.data;

    if (Array.isArray(json?.data)) return json.data.map(normalizeAccessory);
    if (Array.isArray(json?.data?.data)) return json.data.data.map(normalizeAccessory);

    return [];
  } catch (error) {
    console.error(error);
    throw new Error("アクセサリ一覧取得失敗");
  }
}

export async function fetchAccessory(id) {
  try {
    const res = await api.get(`${API_URL}/api/accessories/${id}`);
    return normalizeAccessory(res.data.data);
  } catch (error) {
    console.error(error);
    throw new Error("アクセサリ取得失敗");
  }
}

export async function createAccessory(data) {
  try {
    const res = await api.post(`${API_URL}/api/accessories`, data);
    return normalizeAccessory(res.data.data);
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アクセサリ作成失敗");
  }
}

export async function updateAccessory(id, data) {
  try {
    const res = await api.put(`${API_URL}/api/accessories/${id}`, data);
    return normalizeAccessory(res.data.data);
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アクセサリ更新失敗");
  }
}

export async function deleteAccessory(id) {
  try {
    const res = await api.delete(`${API_URL}/api/accessories/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アクセサリ削除失敗");
  }
}