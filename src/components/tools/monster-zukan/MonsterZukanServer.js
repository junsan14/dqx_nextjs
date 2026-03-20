import MonsterZukanClient from "@/components/tools/monster-zukan/MonsterZukanClient";
import { fetchMonsterZukanPage } from "@/lib/monsters";

export default async function MonsterZukanServer({ page, sort = "no" }) {
  const safeSort = sort === "kana" ? "kana" : "no";
  const monsterPage = await fetchMonsterZukanPage(page, 16, safeSort);

  return (
    <MonsterZukanClient
      monsters={monsterPage.data}
      currentPage={monsterPage.current_page}
      lastPage={monsterPage.last_page}
      total={monsterPage.total}
      perPage={monsterPage.per_page}
      sort={safeSort}
    />
  );
}