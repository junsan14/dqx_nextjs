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

function normalizeMap(row = {}) {
  return {
    id: row?.id ?? null,
    name: row?.name ?? row?.map_name ?? "",
    image_url:
      row?.image_url ??
      row?.image_path ??
      row?.map_image_url ??
      row?.map_image_path ??
      "",
    area: row?.area ?? "",
    continent: row?.continent ?? "",
  };
}

export async function fetchMaps(q = "") {
  try {
    const res = await api.get(`${API_URL}/api/maps`, {
      params: q ? { q } : {},
    });

    const json = res.data;

    if (Array.isArray(json)) return json.map(normalizeMap);
    if (Array.isArray(json?.data)) return json.data.map(normalizeMap);
    if (Array.isArray(json?.data?.data)) return json.data.data.map(normalizeMap);

    return [];
  } catch (error) {
    console.error(error);
    throw new Error("マップ一覧取得失敗");
  }
}