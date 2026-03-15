"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function useIsMobile(breakpoint = 920) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

function normalizeList(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function getDropName(drop) {
  return (
    drop?.item_name ||
    drop?.equipment_name ||
    drop?.orb_name ||
    drop?.name ||
    "不明"
  );
}

function getOrbColor(orb) {
  return (
    orb?.orb_color ||
    orb?.matched_color ||
    orb?.color ||
    orb?.attribute ||
    ""
  );
}

function getOrbColorStyles(color) {
  const key = String(color || "").trim();

  switch (key) {
    case "炎":
      return {
        background: "#fff1f2",
        color: "#be123c",
      };
    case "水":
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
      };
    case "風":
      return {
        background: "#ecfdf5",
        color: "#047857",
      };
    case "雷":
      return {
        background: "#fffbeb",
        color: "#b45309",
      };
    case "土":
      return {
        background: "#fdf8f3",
        color: "#92400e",
      };
    case "光":
      return {
        background: "#fffbea",
        color: "#a16207",
      };
    case "闇":
      return {
        background: "#ede9fe",
        color: "#5b21b6",
      };
    default:
      return {
        background: "#f1f5f9",
        color: "#334155",
      };
  }
}

function uniqueByNameWithType(list) {
  const map = new Map();

  for (const item of list) {
    const name = getDropName(item).trim();
    if (!name) continue;

    const currentType = item?.__drop_kind || "normal";

    if (!map.has(name)) {
      map.set(name, {
        ...item,
        __display_name: name,
        __drop_kind: currentType,
      });
      continue;
    }

    const existing = map.get(name);
    if (existing.__drop_kind !== "rare" && currentType === "rare") {
      map.set(name, { ...existing, __drop_kind: "rare" });
    }
  }

  return Array.from(map.values());
}

function DropTagList({ items }) {
  if (!items.length) return <div style={styles.emptyBox}>データなし</div>;

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => {
        const isRare = item.__drop_kind === "rare";

        return (
          <span
            key={`${item?.id ?? item?.__display_name ?? "item"}-${index}`}
            style={{
              ...styles.itemTag,
              ...(isRare ? styles.itemTagRare : styles.itemTagNormal),
            }}
          >
            <span
              style={{
                ...styles.kindBadge,
                ...(isRare ? styles.kindBadgeRare : styles.kindBadgeNormal),
              }}
            >
              {isRare ? "レア" : "通常"}
            </span>
            <span style={styles.itemTagText}>{item.__display_name}</span>
          </span>
        );
      })}
    </div>
  );
}

function PlainTagList({ items }) {
  if (!items.length) return <div style={styles.emptyBox}>データなし</div>;

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => (
        <span
          key={`${item?.id ?? item?.__display_name ?? "item"}-${index}`}
          style={styles.itemTag}
        >
          <span style={styles.itemTagText}>
            {item.__display_name || getDropName(item)}
          </span>
        </span>
      ))}
    </div>
  );
}

function OrbTagList({ items }) {
  if (!items.length) return <div style={styles.emptyBox}>データなし</div>;

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => {
        const color = getOrbColor(item);
        const colorStyle = getOrbColorStyles(color);

        return (
          <span
            key={`${item?.id ?? item?.__display_name ?? "orb"}-${index}`}
            style={styles.itemTag}
          >
            {color ? (
              <span
                style={{
                  ...styles.orbColorBadge,
                  background: colorStyle.background,
                  color: colorStyle.color,
                }}
              >
                {color}
              </span>
            ) : null}
            <span style={styles.itemTagText}>
              {item.__display_name || getDropName(item)}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.panelTitle}>{title}</h3>
      <div style={styles.panelBody}>{children}</div>
    </section>
  );
}

export default function MonsterDropSection({
  normalDrops = [],
  rareDrops = [],
  equipmentDrops = [],
  orbDrops = [],
}) {
  const isMobile = useIsMobile();
  const scrollerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const isProgrammaticScrollRef = useRef(false);

  const data = useMemo(() => {
    const mergedDrops = uniqueByNameWithType([
      ...normalizeList(normalDrops).map((item) => ({ ...item, __drop_kind: "normal" })),
      ...normalizeList(rareDrops).map((item) => ({ ...item, __drop_kind: "rare" })),
    ]);

    const equipment = normalizeList(equipmentDrops).map((item) => ({
      ...item,
      __display_name: getDropName(item),
    }));

    const orbs = normalizeList(orbDrops).map((item) => ({
      ...item,
      __display_name: getDropName(item),
    }));

    return [
      {
        key: "drops",
        label: "ドロップ",
        content: (
          <Panel title="ドロップ">
            <DropTagList items={mergedDrops} />
          </Panel>
        ),
      },
      {
        key: "equipment",
        label: "白宝箱",
        content: (
          <Panel title="白宝箱">
            <PlainTagList items={equipment} />
          </Panel>
        ),
      },
      {
        key: "orb",
        label: "宝珠",
        content: (
          <Panel title="宝珠">
            <OrbTagList items={orbs} />
          </Panel>
        ),
      },
    ];
  }, [normalDrops, rareDrops, equipmentDrops, orbDrops]);

  useEffect(() => {
    if (!isMobile) return;
    const el = scrollerRef.current;
    if (!el) return;

    const pageWidth = el.clientWidth || 1;
    isProgrammaticScrollRef.current = true;

    el.scrollTo({
      left: pageWidth * activeTab,
      behavior: "smooth",
    });

    const timer = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 350);

    return () => clearTimeout(timer);
  }, [activeTab, isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const el = scrollerRef.current;
    if (!el) return;

    function handleScroll() {
      if (isProgrammaticScrollRef.current) return;

      const pageWidth = el.clientWidth || 1;
      const nextTab = Math.round(el.scrollLeft / pageWidth);

      if (nextTab !== activeTab && nextTab >= 0 && nextTab < data.length) {
        setActiveTab(nextTab);
      }
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeTab, data.length, isMobile]);

  return (
    <section style={styles.section}>
      {isMobile ? (
        <>
          <div style={styles.tabListMobile}>
            {data.map((tab, index) => {
              const isActive = index === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  style={{
                    ...styles.tabButton,
                    ...(isActive ? styles.tabButtonActive : {}),
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div ref={scrollerRef} style={styles.mobileScroller}>
            {data.map((tab) => (
              <div key={tab.key} style={styles.mobilePage}>
                {tab.content}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={styles.desktopGrid}>
          {data.map((tab) => (
            <div key={tab.key} style={styles.desktopCol}>
              {tab.content}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const styles = {
  section: {
    marginTop: "18px",
    display: "grid",
    gap: "12px",
  },

  tabListMobile: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
  },
  tabButton: {
    appearance: "none",
    border: "none",
    background: "#eef2ff",
    color: "#475569",
    padding: "14px 10px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    transition: "all .18s ease",
  },
  tabButtonActive: {
    background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(37,99,235,0.20)",
  },

  desktopGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    alignItems: "stretch",
  },
  desktopCol: {
    display: "flex",
  },

  panel: {
    background: "#fff",
    borderRadius: "20px",
    padding: "16px",
    minWidth: 0,
    width: "100%",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  panelTitle: {
    margin: "0 0 14px",
    fontSize: "16px",
    fontWeight: 900,
    color: "#111827",
  },
  panelBody: {
    flex: 1,
    alignContent: "flex-start",
  },

  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignContent: "flex-start",
  },
  itemTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f8fbff",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.3,
    boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
    minHeight: "38px",
  },
  itemTagNormal: {
    background: "#f8fafc",
  },
  itemTagRare: {
    background: "#fff7ed",
  },
  kindBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 7px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0,
  },
  kindBadgeNormal: {
    background: "#e2e8f0",
    color: "#475569",
  },
  kindBadgeRare: {
    background: "#fb923c",
    color: "#fff",
  },
  orbColorBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0,
  },
  itemTagText: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0f172a",
  },
  emptyBox: {
    background: "#f8fafc",
    color: "#94a3b8",
    borderRadius: "14px",
    minHeight: "92px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
  },

  mobileScroller: {
    display: "flex",
    overflowX: "auto",
    overflowY: "hidden",
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
    gap: 0,
    overscrollBehaviorX: "contain",

  },
  mobilePage: {
    flex: "0 0 100%",
    width: "100%",
    minWidth: "100%",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    boxSizing: "border-box",
  },
};