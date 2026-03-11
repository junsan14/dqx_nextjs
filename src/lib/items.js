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

export async function fetchItems(q = "") {
  try {
    const res = await api.get(`${API_URL}/api/items`, {
      params: q ? { q } : {},
    });

    const json = res.data;

    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.data?.data)) return json.data.data;

    return [];
  } catch (error) {
    console.error(error);
    throw new Error("アイテム一覧取得失敗");
  }
}

export async function fetchItem(id) {
  try {
    const res = await api.get(`${API_URL}/api/items/${id}`);
    return res.data.data;
  } catch (error) {
    console.error(error);
    throw new Error("アイテム取得失敗");
  }
}

export async function createItem(data) {
  try {
    const res = await api.post(`${API_URL}/api/items`, data);
    return res.data.data;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アイテム作成失敗");
  }
}

export async function updateItem(id, data) {
  try {
    const res = await api.put(`${API_URL}/api/items/${id}`, data);
    return res.data.data;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アイテム更新失敗");
  }
}

export async function deleteItem(id) {
  try {
    const res = await api.delete(`${API_URL}/api/items/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アイテム削除失敗");
  }
}