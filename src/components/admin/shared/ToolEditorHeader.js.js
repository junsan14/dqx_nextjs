"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/", label: "トップ" },
  { href: "/tool-editor/monsters", label: "モンスター" },
  { href: "/tool-editor/items", label: "アイテム" },
  { href: "/tool-editor/accessories", label: "アクセサリー" },
  { href: "/tool-editor/equipments", label: "装備" },
  { href: "/tool-editor/orbs", label: "宝珠" },
];

export default function ToolEditorHeader() {
  const pathname = usePathname();

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.logoArea}>
          <Link href="/tool-editor" style={styles.logo}>
            Tool Editor
          </Link>
        </div>

        <nav style={styles.nav}>
          {menus.map((menu) => {
            const isActive = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                style={{
                  ...styles.link,
                  ...(isActive ? styles.activeLink : {}),
                }}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#111827",
    borderBottom: "1px solid #1f2937",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "700",
    textDecoration: "none",
  },
  nav: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  link: {
    color: "#d1d5db",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    background: "transparent",
    transition: "0.2s",
  },
  activeLink: {
    color: "#fff",
    background: "#2563eb",
  },
};