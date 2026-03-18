import axios from "axios";

let cache = null;

export async function fetchCrystalRules() {
  if (cache) return cache;

  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/crystal-rules`
  );

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