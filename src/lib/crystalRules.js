import axios from "axios";

let cache = null;

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return apiUrl.replace(/\/$/, "");
}

const API_URL = getApiUrl();

export async function fetchCrystalRules() {
  if (cache) return cache;

  const res = await axios.get(`${API_URL}/api/crystal-rules`);

  cache = res.data?.data ?? [];
  return cache;
}

export async function getCrystalByEquipLevel(level) {
  const rules = await fetchCrystalRules();

  const rule = rules.find(
    (r) => level >= r.min_level && level <= r.max_level
  );

  if (!rule) return null;

  return {
    plus0: rule.plus0,
    plus1: rule.plus1,
    plus2: rule.plus2,
    plus3: rule.plus3,
  };
}