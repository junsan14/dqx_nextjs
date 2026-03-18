"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-10">

        <div className="grid gap-8 md:grid-cols-3">

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Tools
            </h3>

            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/tools/craft-profit" className="hover:text-white">
                  Craft Profit
                </Link>
              </li>

              <li>
                <Link href="/tools/monster-search" className="hover:text-white">
                  モンスター検索
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Admin
            </h3>

            <ul className="mt-3 space-y-2 text-sm">

              {!user && (
                <li>
                  <Link
                    href="/login"
                    className="rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-800 hover:text-white"
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
        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-[11px] text-slate-500 space-y-1">
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