"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonsterImageCard from "@/components/tools/monsters/detail/MonsterImageCard";

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
            style={styles.itemTag}
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

function Panel({ title, children, styles }) {
  return (
    <section style={styles.panel}>
      <div style={styles.panelHeader}>
        <h3 style={styles.panelTitle}>{title}</h3>
      </div>
      <div style={styles.panelBody}>{children}</div>
    </section>
  );
}

function getStyles(isMobile) {
  return {
    section: {
      marginTop: "14px",
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    outerGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: isMobile ? "8px" : "14px",
      width: "100%",
      minWidth: 0,
    },

    tabsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "6px",
      width: "100%",
      marginBottom: 0,
    },

    contentRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0, 1fr) 84px" : "minmax(0, 1fr) 165px",
      gap: isMobile ? "10px" : "14px",
      alignItems: "stretch",
      width: "100%",
      minWidth: 0,
    },

    rightWrap: {
      width: isMobile ? "84px" : "165px",
      minWidth: isMobile ? "84px" : "165px",
      display: "flex",
      justifyContent: "center",
      alignItems: "stretch",
      height: "100%",
      position: isMobile ? "sticky" : "relative",
      top: isMobile ? "12px" : "auto",
    },

    leftWrap: {
      minWidth: 0,
      width: "100%",
    },

    tabButton: {
      appearance: "none",
      border: "1px solid var(--panel-border)",
      background: "var(--panel-bg)",
      color: "var(--text-sub)",
      padding: isMobile ? "9px 6px" : "10px 10px",
      fontSize: isMobile ? "11px" : "13px",
      fontWeight: 900,
      lineHeight: 1.2,
      cursor: "pointer",
      borderRadius: "5px",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    tabButtonActive: {
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
      border: "1px solid var(--primary-border)",
    },

    mobileContentViewport: {
      overflow: "hidden",
      width: "100%",
      minWidth: 0,
    },

    mobileScroller: {
      display: "flex",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      width: "100%",
      minWidth: 0,
    },

    mobilePage: {
      minWidth: "100%",
      width: "100%",
      flex: "0 0 100%",
      scrollSnapAlign: "start",
      boxSizing: "border-box",
    },

    desktopPanels: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "12px",
      width: "100%",
      minWidth: 0,
    },

    panel: {
      height: "100%",
      borderRadius: "5px",
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
    },

    panelHeader: {
      padding: isMobile ? "10px 10px 8px" : "12px 12px 10px",
      borderBottom: "1px solid var(--soft-border)",
      background: "var(--soft-bg)",
      textAlign: "center",
    },

    panelTitle: {
      margin: 0,
      fontSize: isMobile ? "13px" : "15px",
      lineHeight: 1.2,
      fontWeight: 900,
      color: "var(--text-title)",
    },

    panelBody: {
      padding: isMobile ? "10px 8px" : "12px 10px",
      flex: 1,
      minHeight: 0,
    },

    tagList: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? "4px" : "5px",
      width: "100%",
      minWidth: 0,
    },

    emptyBox: {
      borderRadius: "10px",
      padding: isMobile ? "10px" : "14px",
      background: "var(--soft-bg)",
      border: "1px dashed var(--soft-border)",
      color: "var(--text-muted)",
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: 700,
      width: "100%",
      textAlign: "center",
      boxSizing: "border-box",
    },

    itemTag: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "5px" : "8px",
      minWidth: 0,
      width: "100%",
      borderRadius: "999px",
      padding: isMobile ? "3px 8px" : "4px 10px",
      color: "var(--tag-text)",
      boxSizing: "border-box",
      maxWidth: "100%",
      overflow: "hidden",
    },

    kindBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: isMobile ? "32px" : "38px",
      height: isMobile ? "18px" : "22px",
      padding: isMobile ? "0 6px" : "0 8px",
      borderRadius: "999px",
      fontSize: isMobile ? "9px" : "11px",
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: "nowrap",
      flexShrink: 0,
    },

    kindBadgeNormal: {
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
    },

    kindBadgeRare: {
      background: "var(--warning-bg)",
      color: "var(--warning-text)",
      border: "1px solid var(--warning-border)",
    },

    kindBadgeEquipment: {
      background: "var(--badge-bg)",
      color: "var(--badge-text)",
      border: "1px solid var(--tag-border)",
    },

    itemTagText: {
      fontSize: isMobile ? "12px" : "13px",
      lineHeight: isMobile ? 1.35 : 1.45,
      fontWeight: 700,
      color: "var(--text-main)",
      wordBreak: "break-word",
      overflowWrap: "anywhere",
      minWidth: 0,
      flex: 1,
    },

    orbColorBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: isMobile ? "24px" : "28px",
      height: isMobile ? "18px" : "22px",
      padding: isMobile ? "0 6px" : "0 8px",
      borderRadius: "999px",
      fontSize: isMobile ? "9px" : "11px",
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
  };
}

export default function MonsterDropSection({
  monster,
  normalDrops = [],
  rareDrops = [],
  equipmentDrops = [],
  orbDrops = [],
}) {
  const isMobile = useIsMobile();
  const styles = useMemo(() => getStyles(isMobile), [isMobile]);

  const scrollerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const isProgrammaticScrollRef = useRef(false);
  const hasMonsterImage = Boolean(monster?.image_path);
  const mergedDrops = useMemo(() => {
    return uniqueByNameWithType([
      ...normalizeList(normalDrops).map((item) => ({
        ...item,
        __drop_kind: "normal",
      })),
      ...normalizeList(rareDrops).map((item) => ({
        ...item,
        __drop_kind: "rare",
      })),
    ]);
  }, [normalDrops, rareDrops]);

  const equipment = useMemo(() => {
    return normalizeList(equipmentDrops).map((item) => ({
      ...item,
      __display_name: getDropName(item),
    }));
  }, [equipmentDrops]);

  const orbs = useMemo(() => {
    return normalizeList(orbDrops).map((item) => ({
      ...item,
      __display_name: getDropName(item),
    }));
  }, [orbDrops]);

  const tabs = useMemo(
    () => [
      {
        key: "drops",
        label: "ドロップ",
        title: "ドロップ",
        content: <DropTagList items={mergedDrops} styles={styles} />,
      },
      {
        key: "equipment",
        label: "白宝箱",
        title: "白宝箱",
        content: <EquipmentTagList items={equipment} styles={styles} />,
      },
      {
        key: "orb",
        label: "宝珠",
        title: "宝珠",
        content: <OrbTagList items={orbs} styles={styles} />,
      },
    ],
    [mergedDrops, equipment, orbs, styles]
  );

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

      if (nextTab !== activeTab && nextTab >= 0 && nextTab < tabs.length) {
        setActiveTab(nextTab);
      }
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeTab, isMobile, tabs.length]);

  return (
    <section style={styles.section}>
      <div style={styles.outerGrid}>
        {isMobile ? (
          <div style={styles.tabsRow}>
            {tabs.map((tab, index) => {
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
        ) : null}

  
         <div
          style={{
            ...styles.contentRow,
            gridTemplateColumns: isMobile
              ? hasMonsterImage
                ? "minmax(0, 1fr) 84px"
                : "minmax(0, 1fr)"
              : hasMonsterImage
              ? "minmax(0, 1fr) 165px"
              : "minmax(0, 1fr)",
          }}
        >
  <div style={styles.leftWrap}>
    {isMobile ? (
      <div style={styles.mobileContentViewport}>
        <div ref={scrollerRef} style={styles.mobileScroller}>
          {tabs.map((tab) => (
            <div key={tab.key} style={styles.mobilePage}>
              <Panel title={tab.title} styles={styles}>
                {tab.content}
              </Panel>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div style={styles.desktopPanels}>
        {tabs.map((tab) => (
          <Panel key={tab.key} title={tab.title} styles={styles}>
            {tab.content}
          </Panel>
        ))}
      </div>
    )}
  </div>

  {hasMonsterImage ? (
    <div style={styles.rightWrap}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-center",
          justifyContent: "center",
        }}
      >
        <MonsterImageCard monster={monster} size="sm" rounded={5} />
      </div>
    </div>
  ) : null}
         </div>

      </div>
    </section>
  );
}