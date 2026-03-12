import Link from "next/link";
import { fetchMonsterDetail } from "@/lib/monsters";
import MonsterDetailHero from "@/components/tools/monsters/detail/MonsterDetailHero";
import MonsterDropSection from "@/components/tools/monsters/detail/MonsterDropSection";
import MonsterMapSection from "@/components/tools/monsters/detail/MonsterMapSection";

export default async function MonsterDetailPage({ params }) {
  const monsterId = params?.id;

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
      <main style={styles.page}>
        <div style={styles.centerBox}>
          <p style={styles.errorText}>{errorText || "データが見つからなかった"}</p>
          <Link href="/tools/monsters" style={styles.backLink}>
            ← 検索へ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topNav}>
          <Link href="/tools/monsters" style={styles.backLink}>
            ← 検索へ戻る
          </Link>
        </div>

        <MonsterDetailHero monster={monster} />

        <MonsterDropSection
          normalDrops={monster.normal_drops ?? []}
          rareDrops={monster.rare_drops ?? []}
          orbDrops={monster.orb_drops ?? []}
          equipmentDrops={monster.equipment_drops ?? []}
        />

        <MonsterMapSection maps={monster.maps ?? []} />
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    color: "#111827",
    padding: "24px 16px 56px",
  },
  container: {
    maxWidth: "1120px",
    margin: "0 auto",
  },
  topNav: {
    marginBottom: "14px",
  },
  backLink: {
    color: "#475569",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 700,
  },
  centerBox: {
    maxWidth: "720px",
    margin: "80px auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "32px 20px",
    textAlign: "center",
  },
  errorText: {
    margin: "0 0 12px",
    fontSize: "14px",
    color: "#b91c1c",
  },
};