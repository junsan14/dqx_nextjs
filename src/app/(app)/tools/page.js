import Link from "next/link";

export const metadata = {
  title: "DQX Tools",
  description: "ドラクエ10向け便利ツール集",
};

const tools = [
  {
    title: "Craft Profit",
    description:
      "装備の素材費、原価、売値を見ながら利益を確認できる職人向けツール。",
    href: "/tools/craft-profit",
    badge: "職人向け",
    accent: "from-emerald-400/20 to-cyan-400/10",
  },
  {
    title: "モンスター検索",
    description:
      "出現場所、ドロップ、マップ確認をまとめて見られる検索ツール。",
    href: "/tools/monster-search",
    badge: "検索ツール",
    accent: "from-violet-400/20 to-indigo-400/10",
  },
];



export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_28%),linear-gradient(to_bottom,rgba(15,23,42,1),rgba(2,6,23,1))]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-200">
              DQX TOOL SITE
            </p>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              ドラクエ10を
              <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                {" "}
                もっと快適にする{" "}
              </span>
              ツール集
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              職人の利益計算やモンスター検索など、
              ふだんのプレイで「ちょっと助かる」をまとめたツールサイトだ。
              見やすさ重視で、必要な機能をすぐ使える形にしている。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tools/craft-profit"
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-400"
              >
                まずは Craft Profit を使う
              </Link>

              <Link
                href="/tools/monster-search"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                モンスター検索を見る
              </Link>
            </div>

          </div>

          <div className="flex items-center">
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Available Tools
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      現在すぐ使える機能
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    2 Tools
                  </div>
                </div>

                <div className="space-y-3">
                  {tools.map((tool, index) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 transition hover:border-slate-600 hover:bg-slate-800"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-sm font-bold text-white ring-1 ring-white/10`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {tool.title}
                          </div>
                          <div className="mt-1 text-xs leading-6 text-slate-400">
                            {tool.badge}
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              使えるツール
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              現在公開しているツール一覧
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition duration-200 hover:-translate-y-1 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${tool.accent} opacity-80`}
              />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-300">
                    {tool.badge}
                  </span>
                  <span className="text-sm text-slate-500 transition group-hover:text-slate-300">
                    OPEN →
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white">{tool.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">
                  {tool.description}
                </p>

                <div className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-300">
                  ツールを開く
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <p className="text-sm font-semibold tracking-wide text-indigo-300">
              ABOUT
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              このサイトについて
            </h2>
            <p className="mt-4 leading-8 text-slate-300">
              ドラクエ10向けの便利機能を少しずつ追加していくサイトだ。
              職人系、検索系、確認系を中心に、
              プレイ中に開きやすい実用ツールを増やしていく予定。
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7">
            <p className="text-sm font-semibold tracking-wide text-cyan-300">
              ROADMAP
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              これから増やしたいもの
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                相場確認まわりの補助
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                装備・素材の確認系
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                モンスター情報の拡張
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}