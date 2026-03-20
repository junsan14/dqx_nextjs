import MonsterZukanServer from "@/components/tools/monster-zukan/MonsterZukanServer";

export default function Page({ searchParams }) {
  const page = Number(searchParams?.page ?? 1) || 1;
  const sort = searchParams?.sort === "kana" ? "kana" : "no";

  return <MonsterZukanServer page={page} sort={sort} />;
}