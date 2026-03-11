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

export async function lookupMonsters(keyword = "") {
  try {
    const res = await api.get("/api/monster-lookup", {
      params: { keyword },
    });

    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error(error);

    if (error.response) {
      throw new Error(`モンスター検索失敗: ${error.response.status}`);
    }

    throw new Error("モンスター検索失敗");
  }
}