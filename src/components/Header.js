"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaXTwitter } from "react-icons/fa6";
import { useAuth } from "@/hooks/auth";
import { mochiy } from "@/app/fonts";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  const { user, logout } = useAuth();
  const term = "v7.6後期対応";
  const publicMenus = useMemo(
    () => [
      { href: "/tools/craft-profit", label: "職人あれこれ" },
      { href: "/tools/monster-search", label: "モンスター検索" },
      { href: "/tools/monster-zukan", label: "モンスター図鑑" },
      { href: "/tools/map-monster-browser", label: "MAP別モンスター検索" },
    ],
    []
  );

  const adminMenus = useMemo(
    () => [
      { href: "/tool-editor/monsters", label: "モンスター管理" },
      { href: "/tool-editor/maps", label: "マップ管理" },
      { href: "/tool-editor/items", label: "アイテム管理" },
      { href: "/tool-editor/accessories", label: "アクセ管理" },
      { href: "/tool-editor/equipments", label: "装備管理" },
      { href: "/tool-editor/orbs", label: "宝珠管理" },
      { href: "/tool-editor/clystals", label: "結晶管理" },
    ],
    []
  );

  const limitedAdminMenus = useMemo(
    () => [{ href: "/tool-editor/monsters", label: "モンスター管理" }],
    []
  );

  const isAdmin = Boolean(user?.is_admin);
  const canShowAdminMenu = Boolean(user);
  const visibleAdminMenus = isAdmin ? adminMenus : limitedAdminMenus;

  useEffect(() => {
    const updateHeaderHeight = () => {
      const nextHeight = headerRef.current?.offsetHeight ?? 0;
      setHeaderHeight(nextHeight);

      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--site-header-height",
          `${nextHeight}px`
        );
      }
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, [user, isAdmin]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function toggleMenu() {
    setOpen((prev) => !prev);
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 border-b border-slate-200 bg-white/90 text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white ${mochiy.className}`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="group inline-flex shrink-0 items-center gap-2 text-slate-900 dark:text-white"
              onClick={closeMenu}
            >
              <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-sm font-bold tracking-[0.2em] text-indigo-600 transition group-hover:border-indigo-300 group-hover:bg-indigo-100 dark:border-blue-500/20 dark:bg-blue-600/20 dark:text-blue-400 dark:group-hover:bg-blue-600/30">
                DQX
              </span>

              <span className="text-lg font-semibold tracking-wide text-slate-800 transition group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white">
                Tools
              </span>

              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-emerald-700 md:inline-flex dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
               {term}
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
              <nav className="min-w-0 overflow-x-auto">
                <div className="flex min-w-max items-center gap-2">
                  {publicMenus.map((menu) => (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      className="whitespace-nowrap rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      {menu.label}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href="https://x.com/miki0801388249"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="X"
                  title="X"
                >
                  <FaXTwitter className="h-4 w-4" />
                </a>

                {user && (
                  <>
                    <span className="max-w-[180px] truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      {user.name}
                    </span>

                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-red-500/10 dark:hover:text-white"
                    >
                      ログアウト
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 md:hidden"
              onClick={toggleMenu}
              aria-label={open ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={open}
            >
              {open ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>

          {canShowAdminMenu && (
            <div className="mt-3 hidden border-t border-slate-200 pt-3 md:block dark:border-white/10">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-500 dark:text-blue-400/80">
                  Admin
                </span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>

              <nav className="overflow-x-auto">
                <div className="flex min-w-max items-center gap-2">
                  {visibleAdminMenus.map((menu) => (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      className="whitespace-nowrap rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-100 hover:text-slate-950 dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-white"
                    >
                      {menu.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {open && (
        <div
          className={`fixed inset-x-0 z-40 md:hidden ${mochiy.className}`}
          style={{
            top: `${headerHeight}px`,
            height: `calc(100dvh - ${headerHeight}px)`,
          }}
        >
          <div className="absolute inset-0 bg-white/96 backdrop-blur-[30px] dark:bg-slate-950/92" />

          <div className="relative h-full overflow-y-auto px-6 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex min-h-full w-full max-w-sm flex-col gap-7 text-center">
              <section className="w-full">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-500">
                  Menu
                </div>

                <nav className="flex flex-col items-center gap-2">
                  {publicMenus.map((menu) => (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      onClick={closeMenu}
                      className="w-full rounded-2xl px-4 py-3 text-center text-lg font-medium text-slate-900 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      {menu.label}
                    </Link>
                  ))}

                  <a
                    href="https://x.com/miki0801388249"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-lg font-medium text-slate-900 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    aria-label="X"
                    title="X"
                  >
                    <FaXTwitter className="h-5 w-5" />
                    <span>X</span>
                  </a>
                </nav>
              </section>

              {canShowAdminMenu && (
                <section className="w-full">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-300">
                    Admin
                  </div>

                  <nav className="flex flex-col items-center gap-2">
                    {visibleAdminMenus.map((menu) => (
                      <Link
                        key={menu.href}
                        href={menu.href}
                        onClick={closeMenu}
                        className="w-full rounded-2xl px-4 py-3 text-center text-lg font-medium text-slate-900 transition hover:bg-indigo-50 dark:text-slate-100 dark:hover:bg-indigo-500/15"
                      >
                        {menu.label}
                      </Link>
                    ))}
                  </nav>
                </section>
              )}

              {user && (
                <section className="w-full pt-1">
                  <div className="mb-3 truncate text-center text-sm text-slate-500 dark:text-slate-400">
                    {user.name}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                    className="w-full rounded-2xl px-4 py-3 text-center text-lg font-medium text-slate-900 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-100 dark:hover:bg-red-500/12 dark:hover:text-white"
                  >
                    ログアウト
                  </button>
                </section>
              )}

              <div className="mt-auto flex justify-center pt-4">
                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                 {term}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}