import OrbManager from "@/components/admin/orbs/OrbManager";
import { fetchOrbs } from "@/lib/orbs";

export const dynamic = "force-dynamic";

export default async function OrbsPage() {
  let initialOrbs = [];

  try {
    initialOrbs = await fetchOrbs();
  } catch (error) {
    console.error("orbs fetch error:", error);
  }

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>オーブ管理</h1>
      <OrbManager initialOrbs={initialOrbs} />
    </main>
  );
}

const pageStyle = {
  padding: 24,
  display: "grid",
  gap: 20,
};

const titleStyle = {
  margin: 0,
  fontSize: 28,
};