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

export function resolveMapImageUrl(path = "") {
  const value = String(path ?? "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return `${API_URL}/${value}`;
}

function normalizeLayer(row = {}) {
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
    floor_no: Number(row?.floor_no ?? 0),
    image_path: rawImagePath,
    image_url: resolveMapImageUrl(rawImagePath),
    source_url: row?.source_url ?? "",
    display_order: Number(row?.display_order ?? 1),
    image_file: null,
  };
}

function normalizeMap(row = {}) {
  const layers = Array.isArray(row?.layers)
    ? row.layers
        .map(normalizeLayer)
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
    continent: row?.continent ?? "",
    continent_folder: row?.continent_folder ?? "",
    name: row?.name ?? "",
    map_type: row?.map_type ?? "",
    source_url: row?.source_url ?? "",
    layers,
  };
}

function extractRows(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

function extractOne(json) {
  if (json?.data?.data) return json.data.data;
  if (json?.data) return json.data;
  return json;
}

function buildMapFormData(payload = {}) {
  const formData = new FormData();

  formData.append("continent", String(payload?.continent ?? ""));
  formData.append("continent_folder", String(payload?.continent_folder ?? ""));
  formData.append("name", String(payload?.name ?? ""));
  formData.append("map_type", String(payload?.map_type ?? ""));
  formData.append("source_url", String(payload?.source_url ?? ""));

  const layers = Array.isArray(payload?.layers) ? payload.layers : [];

  layers.forEach((layer, index) => {
    if (layer?.id != null && layer?.id !== "") {
      formData.append(`layers[${index}][id]`, String(layer.id));
    }

    formData.append(`layers[${index}][layer_name]`, String(layer?.layer_name ?? ""));
    formData.append(`layers[${index}][floor_no]`, String(layer?.floor_no ?? 0));
    formData.append(`layers[${index}][source_url]`, String(layer?.source_url ?? ""));
    formData.append(
      `layers[${index}][display_order]`,
      String(layer?.display_order ?? index + 1)
    );

    if (layer?.image_file instanceof File) {
      formData.append(`layers[${index}][image]`, layer.image_file);
    }
  });

  return formData;
}

export async function fetchMaps(q = "") {
  try {
    const res = await api.get(`${API_URL}/api/maps`, {
      params: q ? { q } : {},
    });

    return extractRows(res.data).map(normalizeMap);
  } catch (error) {
    console.error(error);
    throw new Error("マップ一覧取得失敗");
  }
}

export async function fetchMap(id) {
  try {
    const res = await api.get(`${API_URL}/api/maps/${id}`);
    return normalizeMap(extractOne(res.data));
  } catch (error) {
    console.error(error);
    throw new Error("マップ詳細取得失敗");
  }
}

export async function createMap(payload) {
  try {
    const formData = buildMapFormData(payload);

    const res = await api.post(`${API_URL}/api/maps`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return normalizeMap(extractOne(res.data));
  } catch (error) {
    console.error(error?.response?.data || error);
    throw new Error("マップ作成失敗");
  }
}

export async function updateMap(id, payload) {
  try {
    const formData = buildMapFormData(payload);
    formData.append("_method", "PUT");

    const res = await api.post(`${API_URL}/api/maps/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return normalizeMap(extractOne(res.data));
  } catch (error) {
    console.error(error?.response?.data || error);
    throw new Error("マップ更新失敗");
  }
}

export async function deleteMap(id) {
  try {
    await api.delete(`${API_URL}/api/maps/${id}`);
    return true;
  } catch (error) {
    console.error(error);
    throw new Error("マップ削除失敗");
  }
}

export async function fetchMapOptions() {
  try {
    const res = await api.get(`${API_URL}/api/maps/options`);
    const data = extractOne(res.data) ?? {};

    return {
      continents: Array.isArray(data?.continents) ? data.continents : [],
      map_types: Array.isArray(data?.map_types) ? data.map_types : [],
    };
  } catch (error) {
    console.error(error);
    return {
      continents: [],
      map_types: [],
    };
  }
}