
import PageHeroTitle from "@/components/PageHeroTitle";
export const metadata = {
  title: "このサイトについて",
  description:
    "DQX Tools の利用上の注意、著作権表記、掲載情報の取り扱いについてまとめたページ。",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "このサイトについて | DQX Tools",
    description:
      "DQX Tools の利用上の注意、著作権表記、掲載情報の取り扱いについてまとめたページ。",
    url: "https://www.junsan.info/about",
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--page-bg)",
    color: "var(--page-text)",
    padding: "32px 16px 72px",
  },
  container: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
  },
  hero: {
    border: "1px solid var(--panel-border)",
    background: "linear-gradient(180deg, var(--card-bg) 0%, var(--soft-bg) 100%)",
    borderRadius: "24px",
    padding: "28px 20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  kicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
  },
  title: {
    margin: "12px 0 0",
    fontSize: "clamp(30px, 5vw, 44px)",
    lineHeight: 1.15,
    color: "var(--text-title)",
    fontWeight: 800,
  },
  lead: {
    margin: "14px 0 0",
    fontSize: "15px",
    lineHeight: 1.8,
    color: "var(--text-sub)",
    maxWidth: "760px",
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "22px",
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "999px",
    background: "var(--primary-bg)",
    color: "var(--primary-text)",
    border: "1px solid var(--primary-border)",
    textDecoration: "none",
    fontWeight: 700,
  },
  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "999px",
    background: "var(--secondary-bg)",
    color: "var(--secondary-text)",
    border: "1px solid var(--secondary-border)",
    textDecoration: "none",
    fontWeight: 700,
  },
  section: {
    marginTop: "24px",
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    borderRadius: "24px",
    padding: "24px 20px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.3,
    color: "var(--text-title)",
    fontWeight: 800,
  },
  sectionText: {
    margin: "14px 0 0",
    fontSize: "15px",
    lineHeight: 1.9,
    color: "var(--text-sub)",
  },
  list: {
    margin: "14px 0 0",
    paddingLeft: "1.2em",
    color: "var(--text-sub)",
    lineHeight: 1.9,
    fontSize: "15px",
  },
  noteBox: {
    marginTop: "16px",
    border: "1px solid var(--soft-border)",
    background: "var(--soft-bg)",
    borderRadius: "18px",
    padding: "16px",
    fontSize: "14px",
    lineHeight: 1.8,
    color: "var(--text-sub)",
  },
  warningBox: {
    marginTop: "16px",
    border: "1px solid var(--soft-danger-border)",
    background: "var(--soft-danger-bg)",
    borderRadius: "18px",
    padding: "16px",
    fontSize: "14px",
    lineHeight: 1.8,
    color: "var(--danger-text)",
  },
  footerBox: {
    marginTop: "24px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "13px",
  },
};

export default function AboutPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <PageHeroTitle
            kicker="DQX MAP DATABASE"
            title="ご利用にあたって"
        />
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>ご利用上の注意</h2>
          <p style={styles.sectionText}>
            このサイトに掲載している情報は、できるだけ見やすく整理した上で提供しています。
            ただし、ゲーム内アップデート、仕様変更、個別条件、記載ミスなどにより、
            実際の内容と差が出る場合があります。
          </p>
          <ul style={styles.list}>
            <li>掲載内容の正確性や完全性を常に保証するものではありません。</li>
            <li>閲覧や利用は利用者自身の判断と責任で行って頂きたいです。</li>
            <li>掲載情報は予告なく修正、追加、削除する場合があります。</li>
          </ul>

          <div style={styles.noteBox}>
            このサイトの情報を参考にしたことによって生じた不利益、損害、
            トラブルなどについて、管理者は責任を負わないものと致します。
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>画像・文章の無断転載について</h2>
          <p style={styles.sectionText}>
            このサイトに掲載している画像、文章、レイアウト、独自に整理したデータ表現などのうち、
            当サイト管理者が作成したものについては、無断での転載、再配布、複製、
            スクリーンショットの大量転載、まとめサイト等への流用はお控え下さい。
            引用を行う場合は、管理者へお知らせ下さい。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>著作権について</h2>
          <p style={styles.sectionText}>
            ドラゴンクエストX、およびその関連名称、ゲーム内名称、画像、設定、
            世界観その他の権利は、各権利者に帰属しております。。
            このサイトはファンによる非公式の情報整理サイトであり、
            権利を主張するものでありません。
          </p>
        </section>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>非公式サイトであることについて</h2>
          <p style={styles.sectionText}>
            このサイトは、ドラゴンクエストX に関する情報を見やすくまとめることを目的とした
            非公式サイトです。公式運営とは関係はございません。
          </p>
        </section>

        <div style={styles.footerBox}>
          DQX Tools / About & Notice
        </div>
      </div>
    </main>
  );
}