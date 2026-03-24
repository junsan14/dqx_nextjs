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
        background: "color-mix(in srgb, #be123c 14%, var(--panel-bg))",
        color: "#be123c",
      };
    case "水":
      return {
        background: "color-mix(in srgb, #1d4ed8 14%, var(--panel-bg))",
        color: "#1d4ed8",
      };
    case "風":
      return {
        background: "color-mix(in srgb, #047857 14%, var(--panel-bg))",
        color: "#047857",
      };
    case "雷":
      return {
        background: "color-mix(in srgb, #b45309 14%, var(--panel-bg))",
        color: "#b45309",
      };
    case "土":
      return {
        background: "color-mix(in srgb, #92400e 14%, var(--panel-bg))",
        color: "#92400e",
      };
    case "光":
      return {
        background: "color-mix(in srgb, #a16207 14%, var(--panel-bg))",
        color: "#a16207",
      };
    case "闇":
      return {
        background: "color-mix(in srgb, #5b21b6 14%, var(--panel-bg))",
        color: "#5b21b6",
      };
    default:
      return {
        background: "var(--badge-bg)",
        color: "var(--badge-text)",
      };
  }
}

function getEquipmentBadgeLabel(item) {
  const slot = String(item?.slot || "").trim();
  const typeName = String(item?.slot || "").trim();

  const slotMap = {
    head: "頭",
    body_upper: "体上",
    body_lower: "体下",
    arm: "腕",
    arms: "腕",
    hand: "腕",
    hands: "腕",
    foot: "足",
    feet: "足",
    shield: "盾",
  };

  if (slot && slotMap[slot]) {
    return slotMap[slot];
  }

  return typeName;
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

function EquipmentTagList({ items, styles }) {
  if (!items.length) return <div style={styles.emptyBox}>データなし</div>;

  return (
    <div style={styles.tagList}>
      {items.map((item, index) => {
        const badgeLabel = getEquipmentBadgeLabel(item);

        return (
          <span
            key={`${item?.id ?? item?.__display_name ?? "equipment"}-${index}`}
            style={styles.itemTag}
          >
            {badgeLabel ? (
              <span
                style={{
                  ...styles.kindBadge,
                  ...styles.kindBadgeEquipment,
                }}
              >
                {badgeLabel}
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

function OrbTagList({ items, styles }) {
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

function Panel({ title, eyebrow, children, styles, showTitle = true }) {
  return (
    <section style={styles.panel}>
      {showTitle ? (
        <div style={styles.panelHeader}>
          {eyebrow ? <div style={styles.panelEyebrow}>{eyebrow}</div> : null}
          <h3 style={styles.panelTitle}>{title}</h3>
        </div>
      ) : null}
      <div style={styles.panelBody}>{children}</div>
    </section>
  );
}

function getStyles() {
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
      justifyContent: "center",
      overflowX: "auto",
      marginBottom: "12px",
      paddingBottom: "4px",
      scrollbarWidth: "thin",
      WebkitOverflowScrolling: "touch",
      width: "100%",
    },
    tabButton: {
      appearance: "none",
      border: `1px solid var(--panel-border)`,
      background: "var(--panel-bg)",
      color: "var(--text-sub)",
      padding: "10px 14px",
      fontSize: "13px",
      fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
      width: "33%",
      flexShrink: 0,
    },
    tabButtonActive: {
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
      border: `1px solid var(--primary-border)`,
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
      width: "100%",
      minWidth: 0,
    },
    desktopItem: {
      minWidth: 0,
    },
    panel: {
      height: "100%",
      borderRadius: "5px",
      border: `1px solid var(--card-border)`,
      background: "var(--card-bg)",

      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    panelHeader: {
      padding: "16px 16px 10px",
      borderBottom: `1px solid var(--soft-border)`,
      background: "var(--soft-bg)",
      textAlign:"center"
    },
    panelEyebrow: {
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: "0.08em",
      color: "var(--text-muted)",
      marginBottom: "4px",
    },
    panelTitle: {
      margin: 0,
      fontSize: "18px",
      lineHeight: 1.3,
      fontWeight: 900,
      color: "var(--text-title)",
    },
   panelBody: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 0,
  },
    tagList: {
      display: "flex",
      flexDirection: "column",
      gap: "5px",
      width: "100%",
      maxWidth: "420px",
      justifyContent:"center"
    },
    emptyBox: {
      borderRadius: "14px",
      padding: "14px",
      background: "var(--soft-bg)",
      border: `1px dashed var(--soft-border)`,
      color: "var(--text-muted)",
      fontSize: "14px",
      fontWeight: 700,
    },
    itemTag: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      minWidth: "200px",
      borderRadius: "999px",
      padding: "2px 12px",
      color: "var(--tag-text)",
      boxSizing: "border-box",
      maxWidth: "100%",
    },
    itemTagNormal: {},
    itemTagRare: {

    },
    kindBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "38px",
      height: "22px",
      padding: "0 8px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: "nowrap",
    },
    kindBadgeNormal: {
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
    },
    kindBadgeRare: {
      background: "var(--warning-bg)",
      color: "var(--warning-text)",
      border: `1px solid var(--warning-border)`,
    },
    kindBadgeEquipment: {
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
      border: `1px solid var(--tag-border)`,
    },
    itemTagText: {
      fontSize: "14px",
      lineHeight: 1.5,
      fontWeight: 700,
      color: "var(--text-main)",
      wordBreak: "break-word",
    },
    orbColorBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "28px",
      height: "22px",
      padding: "0 8px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: "nowrap",
    },
  };
}

export default function MonsterDropSection({
  normalDrops = [],
  rareDrops = [],
  equipmentDrops = [],
  orbDrops = [],
}) {
  const isMobile = useIsMobile();
  const styles = useMemo(() => getStyles(), []);

  const scrollerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const isProgrammaticScrollRef = useRef(false);

  const data = useMemo(() => {
    const mergedDrops = uniqueByNameWithType([
      ...normalizeList(normalDrops).map((item) => ({
        ...item,
        __drop_kind: "normal",
      })),
      ...normalizeList(rareDrops).map((item) => ({
        ...item,
        __drop_kind: "rare",
      })),
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
          <Panel
            title="ドロップ"
            styles={styles}
            showTitle={!isMobile}
          >
            <DropTagList items={mergedDrops} styles={styles} />
          </Panel>
        ),
      },
      {
        key: "equipment",
        label: "白宝箱",
        content: (
          <Panel
            title="白宝箱"
            styles={styles}
            showTitle={!isMobile}
          >
            <EquipmentTagList items={equipment} styles={styles} />
          </Panel>
        ),
      },
      {
        key: "orb",
        label: "宝珠",
        content: (
          <Panel
            title="宝珠"
            styles={styles}
            showTitle={!isMobile}
          >
            <OrbTagList items={orbs} styles={styles} />
          </Panel>
        ),
      },
    ];
  }, [normalDrops, rareDrops, equipmentDrops, orbDrops, styles, isMobile]);

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