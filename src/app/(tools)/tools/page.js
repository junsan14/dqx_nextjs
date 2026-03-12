import Link from "next/link";

export const metadata = {
  title: "DQX Tools",
  description: "ドラクエ10向け便利ツール集",
};

const tools = [
  {
    title: "Craft Profit",
    description:
      "装備の素材費や売値をもとに、利益を確認できるツール。",
    href: "/tools/craft-profit",
    badge: "職人向け",
  },
  {
    title: "モンスター検索",
    description:
      "モンスターの出現場所やドロップ情報を検索できるツール。",
    href: "/tools/monster-search",
    badge: "検索ツール",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-3 inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-300">
            DQX TOOL SITE
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            ドラクエ10の便利ツールを
            <br />
            まとめたサイト
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            職人の利益確認や、モンスターの検索など、
            プレイを少し便利にするツールをまとめて使えるサイトだ。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tools/craft-profit"
              className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Craft Profit を使う
            </Link>
            <Link
              href="/tools/monster-search"
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
            >
              モンスター検索へ
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">使えるツール</h2>
          <p className="mt-2 text-sm text-slate-400">
            現在公開しているツール一覧
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {tool.badge}
                </span>
                <span className="text-sm text-slate-500 transition group-hover:text-slate-300">
                  →
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{tool.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{tool.description}</p>

              <div className="mt-6 text-sm font-semibold text-indigo-300">
                ツールを開く
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">このサイトについて</h2>
          <p className="mt-3 leading-7 text-slate-300">
            ドラクエ10向けの便利機能を少しずつ追加していくサイトだ。
            今後は職人系だけでなく、検索や確認系のツールも増やしていく想定だ。
          </p>
        </div>
      </section>
    </main>
  );
}