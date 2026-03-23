"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* top grid */}
        <div className="grid gap-10 md:grid-cols-3">

          {/* tools */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Tools
            </h3>

            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/tools/craft-profit" className="hover:text-white transition">
                  Craft Profit
                </Link>
              </li>
              <li>
                <Link href="/tools/monster-search" className="hover:text-white transition">
                  モンスター検索
                </Link>
              </li>
              <li>
                <Link href="/tools/monster-zukan" className="hover:text-white transition">
                  モンスター図鑑
                </Link>
              </li>
              <li>
                <Link href="/tools/map-monster-browser" className="hover:text-white transition">
                  MAP別モンスター検索
                </Link>
              </li>
            </ul>
          </div>

          {/* about / info */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Info
            </h3>

            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  このサイトについて / ご利用にあたって
                </Link>
              </li>

              <li>
                <span className="text-slate-500">
                  非公式ファンサイト
                </span>
              </li>
            </ul>
          </div>

          {/* admin */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              Admin
            </h3>

            <ul className="mt-4 space-y-2 text-sm">
              {!user && (
                <li>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1.5 text-xs hover:bg-slate-800 hover:text-white transition"
                  >
                    管理者ログイン
                  </Link>
                </li>
              )}

              {user && (
                <li className="text-slate-500">
                  Logged in
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* copyright */}
        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-[11px] text-slate-500 space-y-1 leading-relaxed">
          <div>
            © {new Date().getFullYear()} DQX Tools
          </div>

          <div>
            本サイトはドラゴンクエストXの非公式ファンサイトです。株式会社スクウェア・エニックスとは関係ありません。
          </div>

          <div>
            © ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}