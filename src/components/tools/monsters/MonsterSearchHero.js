export default function MonsterSearchHero() {
  return (
    <section style={styles.hero}>
      <div style={styles.heroGlow} />
      <p style={styles.kicker}>DQX MONSTER DATABASE</p>
      <h1 style={styles.title}>モンスター検索</h1>
    </section>
  );
}

const styles = {
  hero: {
    maxWidth: "1100px",
    margin: "0 auto 22px",
    position: "relative",
    padding: "24px 4px 8px",
  },
  heroGlow: {
    position: "absolute",
    top: "-40px",
    right: "10%",
    width: "220px",
    height: "220px",
    background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  kicker: {
    margin: "0 0 10px",
    fontSize: "12px",
    letterSpacing: "0.18em",
    color: "#6366f1",
    fontWeight: 800,
  },
  title: {
    margin: "0 0 10px",
    fontSize: "clamp(34px, 6vw, 58px)",
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  lead: {
    margin: 0,
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.7,
  },
};