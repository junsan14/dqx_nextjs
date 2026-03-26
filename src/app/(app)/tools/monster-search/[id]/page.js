import Link from "next/link";
import { fetchMonsterDetail } from "@/lib/monsters";
import MonsterDetailHero from "@/components/tools/monsters/detail/MonsterDetailHero";
import MonsterDropSection from "@/components/tools/monsters/detail/MonsterDropSection";
import MonsterMapSection from "@/components/tools/monsters/detail/MonsterMapSection";
import MonsterDetailPageClientShell from "@/components/tools/monsters/detail/MonsterDetailPageClientShell";

export default async function MonsterDetailPage({ params, searchParams }) {
  const monsterId = params?.id;
  const showName = searchParams?.from === "zukan";
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const rawBack = searchParams?.back;
  const safeBackHref =
    typeof rawBack === "string" && rawBack.startsWith("/tools/")
      ? rawBack
      : showName
      ? `/tools/monster-zukan?page=${page}`
      : "/tools/monster-search";

  let monster = null;
  let errorText = "";

  try {
    monster = await fetchMonsterDetail(monsterId);
  } catch (error) {
    console.error(error);
    errorText = "モンスター詳細を取得できなかった";
  }

  if (errorText || !monster) {
    return (
      <MonsterDetailPageClientShell>
        <div style={styles.centerBox}>
          <p style={styles.errorText}>{errorText || "データが見つからなかった"}</p>
          <Link href={safeBackHref} style={styles.backLink}>
            ← 検索へ戻る
          </Link>
        </div>
      </MonsterDetailPageClientShell>
    );
  }

  return (
    <MonsterDetailPageClientShell>
      <div style={styles.container}>
        <div style={styles.topNav}>
          <Link href={safeBackHref} style={styles.backLink}>
            ← 検索へ戻る
          </Link>
        </div>

        <MonsterDetailHero monster={monster} showName={showName} />

        <MonsterDropSection
          monster={monster}
          normalDrops={monster.normal_drops ?? []}
          rareDrops={monster.rare_drops ?? []}
          orbDrops={monster.orb_drops ?? []}
          equipmentDrops={monster.equipment_drops ?? []}
        />

        <MonsterMapSection maps={monster.maps ?? []} />
      </div>
    </MonsterDetailPageClientShell>
  );
}

const styles = {
  container: {
    maxWidth: "1120px",
    margin: "0 auto",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  topNav: {
    marginBottom: "14px",
  },
  backLink: {
    color: "inherit",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 700,
  },
  centerBox: {
    maxWidth: "720px",
    margin: "80px auto",
    borderRadius: "18px",
    padding: "32px 20px",
    textAlign: "center",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  errorText: {
    margin: "0 0 12px",
    fontSize: "14px",
  },
};