"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-wide text-white">
          DQX Tools
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <Link
            href="/tools/craft-profit"
            className="hover:text-white transition"
          >
            Craft Profit
          </Link>

          <Link
            href="/tools/monster-search"
            className="hover:text-white transition"
          >
            モンスター検索
          </Link>

          <Link
            href="/tools"
            className="hover:text-white transition"
          >
            ツール一覧
          </Link>
        </nav>

        {/* Mobile Button */}
        <button
          className="md:hidden text-slate-300"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-slate-800 bg-slate-950 md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4 text-sm text-slate-300">

            <Link
              href="/tools/craft-profit"
              onClick={() => setOpen(false)}
              className="hover:text-white"
            >
              Craft Profit
            </Link>

            <Link
              href="/tools/monster-search"
              onClick={() => setOpen(false)}
              className="hover:text-white"
            >
              モンスター検索
            </Link>

            <Link
              href="/tools"
              onClick={() => setOpen(false)}
              className="hover:text-white"
            >
              ツール一覧
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}