import OrbForm from "@/admin/components/orbs/OrbForm";



export default async function NewOrbPage() {
  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>オーブ新規追加</h1>
      <OrbForm mode="create" />
    </main>
  );
}

const pageStyle = {
  padding: 24,
  display: "grid",
  gap: 20,
};

const titleStyle = {
  fontSize: 28,
  margin: 0,
};