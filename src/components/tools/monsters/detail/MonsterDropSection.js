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

function usePrefersDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsDark(media.matches);

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }

    media.addListener(apply);
    return () => media.removeListener(apply);
  }, []);

  return isDark;
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

function getOrbColorStyles(color, isDark) {
  const key = String(color || "").trim();

  switch (key) {
    case "炎":
      return {
        background: isDark ? "rgba(190,24,93,0.18)" : "#fff1f2",
        color: isDark ? "#fda4af" : "#be123c",
      };
    case "水":
      return {
        background: isDark ? "rgba(29,78,216,0.18)" : "#eff6ff",
        color: isDark ? "#93c5fd" : "#1d4ed8",
      };
    case "風":
      return {
        background: isDark ? "rgba(4,120,87,0.18)" : "#ecfdf5",
        color: isDark ? "#86efac" : "#047857",
      };
    case "雷":
      return {
        background: isDark ? "rgba(180,83,9,0.2)" : "#fffbeb",
        color: isDark ? "#fdba74" : "#b45309",
      };
    case "土":
      return {
        background: isDark ? "rgba(146,64,14,0.2)" : "#fdf8f3",
        color: isDark ? "#fdba74" : "#92400e",
      };
    case "光":
      return {
        background: isDark ? "rgba(161,98,7,0.2)" : "#fffbea",
        color: isDark ? "#fde68a" : "#a16207",
      };
    case "闇":
      return {
        background: isDark ? "rgba(91,33,182,0.2)" : "#ede9fe",
        color: isDark ? "#c4b5fd" : "#5b21b6",
      };
    default:
      return {
        background: isDark ? "#1e293b" : "#f1f5f9",
        color: isDark ? "#cbd5e1" : "#334155",
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

function DropTagList({ items, styles }) {
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

function PlainTagList({ items, styles }) {
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

function OrbTagList({ items, styles, isDark }) {
  if (!items.length) return <div style={styles.emptyBox}>データなし</div>;

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => {
        const color = getOrbColor(item);
        const colorStyle = getOrbColorStyles(color, isDark);

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

function Panel({ title, children, styles, showTitle = true }) {
  return (
    <section style={styles.panel}>
      {showTitle ? <h3 style={styles.panelTitle}>{title}</h3> : null}
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
  const isDark = usePrefersDark();
  const styles = getStyles(isDark);

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
          <Panel title="ドロップ" styles={styles} showTitle={!isMobile}>
            <DropTagList items={mergedDrops} styles={styles} />
          </Panel>
        ),
      },
      {
        key: "equipment",
        label: "白宝箱",
        content: (
          <Panel title="白宝箱" styles={styles} showTitle={!isMobile}>
            <PlainTagList items={equipment} styles={styles} />
          </Panel>
        ),
      },
      {
        key: "orb",
        label: "宝珠",
        content: (
          <Panel title="宝珠" styles={styles} showTitle={!isMobile}>
            <OrbTagList items={orbs} styles={styles} isDark={isDark} />
          </Panel>
        ),
      },
    ];
  }, [normalDrops, rareDrops, equipmentDrops, orbDrops, styles, isDark, isMobile]);

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
            <div key={tab.key} style={styles.desktopItem}>
              {tab.content}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function getStyles(isDark) {
  return {
    section: {
      marginTop: "8px",
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },
    tabListMobile: {
      display: "flex",
      justifyContent:"center",
  
      overflowX: "auto",
      marginBottom: "12px",
      paddingBottom: "4px",
      scrollbarWidth: "thin",
      WebkitOverflowScrolling: "touch",
      width:"100%"
    },
    tabButton: {
      appearance: "none",
      border: isDark ? "1px solid #334155" : "1px solid #dbe3f0",
      background: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#cbd5e1" : "#475569",
     
      padding: "10px 14px",
      fontSize: "13px",
      fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
      width:"33%",
      flexShrink: 0,
    },
    tabButtonActive: {
      background: isDark ? "#4f46e5" : "#111827",
      color: "#ffffff",
      border: isDark ? "1px solid #6366f1" : "1px solid #111827",

    },
    mobileScroller: {
      display: "flex",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    },
    mobilePage: {
      minWidth: "100%",
      width: "100%",
      flex: "0 0 100%",
      scrollSnapAlign: "start",
      boxSizing: "border-box",
    },
    desktopGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
      gap: "14px",
    },
    desktopItem: {
      minWidth: 0,
    },
    panel: {
      borderRadius: "18px",
      background: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.9)",
      border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
      boxShadow: isDark
        ? "0 10px 28px rgba(2,6,23,0.24)"
        : "0 8px 24px rgba(15,23,42,0.05)",
      padding: "14px",
      minHeight: "100%",
      boxSizing: "border-box",
      display:"flex",
      alignItems:"center"
    },
    panelTitle: {
      margin: "0 0 12px",
      fontSize: "16px",
      fontWeight: 900,
      color: isDark ? "#f8fafc" : "#111827",
    },
    panelBody: {
      minWidth: 0,
    },
    tagList: {
      display: "flex",
      flexWrap: "wrap",
      alignItems:"center",
      gap: "10px",
      height:"100%"
    },
    itemTag: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "2px 12px",
      borderRadius: "999px",
      background: isDark ? "#1e293b" : "#f8fafc",
     
      maxWidth: "100%",
      boxSizing: "border-box",
    },
    itemTagNormal: {
      background: isDark ? "#1e293b" : "#f8fafc",
    },
    itemTagRare: {
      background: isDark ? "rgba(91,33,182,0.22)" : "#f5f3ff",
     
    },
    kindBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "999px",
      padding: "4px 8px",
      fontSize: "11px",
      fontWeight: 900,
      flexShrink: 0,
    },
    kindBadgeNormal: {

      color: isDark ? "#cbd5e1" : "#475569",
    },
    kindBadgeRare: {
     
      color: isDark ? "#c4b5fd" : "#6d28d9",
    },
    orbColorBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "999px",
      padding: "4px 8px",
      fontSize: "11px",
      fontWeight: 900,
      flexShrink: 0,
    },
    itemTagText: {
      fontSize: "14px",
      lineHeight: 1.5,
      fontWeight: 700,
      color: isDark ? "#f8fafc" : "#0f172a",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    },
    emptyBox: {
      borderRadius: "14px",
      padding: "14px",
      background: isDark ? "#0f172a" : "#f8fafc",
      border: isDark ? "1px dashed #334155" : "1px dashed #cbd5e1",
      color: isDark ? "#94a3b8" : "#64748b",
      fontSize: "14px",
      fontWeight: 700,
      textAlign: "center",
    },
  };
}