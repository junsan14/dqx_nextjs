import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-10">

        <div className="grid gap-8 md:grid-cols-3">

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              DQX Tools
            </h3>
            <p className="mt-3 text-sm leading-6">
              ドラクエ10のプレイを便利にするツールサイト。
              職人・モンスター検索などを提供。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Tools
            </h3>

            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/tools/craft-profit"
                  className="hover:text-white"
                >
                  Craft Profit
                </Link>
              </li>

              <li>
                <Link
                  href="/tools/monster-search"
                  className="hover:text-white"
                >
                  モンスター検索
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Site
            </h3>

            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  トップページ
                </Link>
              </li>

              <li>
                <Link href="/tools" className="hover:text-white">
                  ツール一覧
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs">
          © {new Date().getFullYear()} DQX Tools
        </div>

      </div>
    </footer>
  );
}