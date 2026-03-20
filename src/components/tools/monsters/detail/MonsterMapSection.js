"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonsterMapCard from "./MonsterMapCard";

function useIsMobile(breakpoint = 920) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

function chunkArray(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function buildTabLabel(group, index, isMobile) {
  if (!group?.length) return `タブ${index + 1}`;

  if (isMobile) {
    return group[0]?.name || `タブ${index + 1}`;
  }

  if (group.length === 1) {
    return group[0]?.name || `タブ${index + 1}`;
  }

  const first = group[0]?.name || "";
  const second = group[1]?.name || "";
  return `${first} / ${second}`;
}

function getStyles() {
  return {
    section: {
      marginTop: "8px",
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      overflowX: "clip",
      boxSizing: "border-box",
    },
    header: {
      marginBottom: "12px",
      minWidth: 0,
    },
    title: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 800,
      color: "var(--text-title)",
    },
    tabScroller: {
      display: "flex",
      gap: "8px",
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      overscrollBehaviorX: "contain",
      marginBottom: "14px",
      paddingBottom: "4px",
      boxSizing: "border-box",
      scrollbarWidth: "thin",
    },
    tabButton: {
      appearance: "none",
      border: `1px solid var(--panel-border)`,
      background: "var(--panel-bg)",
      color: "var(--text-sub)",
      padding: "8px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      lineHeight: 1.2,
      cursor: "pointer",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
      flex: "0 0 auto",
      flexShrink: 0,
      boxSizing: "border-box",
      maxWidth: "100%",
    },
    tabButtonActive: {
      background: "var(--primary-bg)",
      color: "var(--primary-text)",
      border: `1px solid var(--primary-border)`,
      boxShadow:
        "0 10px 24px color-mix(in srgb, var(--primary-border) 16%, transparent)",
    },
    emptyCard: {
      borderRadius: "18px",
      padding: "18px",
      background: "var(--soft-bg)",
      border: `1px dashed var(--soft-border)`,
      color: "var(--text-muted)",
      fontWeight: 700,
    },
    mobileContentScroller: {
      display: "flex",
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      width: "100%",
    },
    mobilePage: {
      minWidth: "100%",
      width: "100%",
      flex: "0 0 100%",
      scrollSnapAlign: "start",
      boxSizing: "border-box",
    },
    mobilePageInner: {
      width: "100%",
      boxSizing: "border-box",
    },
    mobileCardWrap: {
      width: "100%",
      boxSizing: "border-box",
    },
    desktopGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0,1fr))",
      gap: "14px",
      width: "100%",
      minWidth: 0,
    },
    desktopCardWrap: {
      minWidth: 0,
    },
  };
}

export default function MonsterMapSection({ maps = [] }) {
  const isMobile = useIsMobile();
  const styles = useMemo(() => getStyles(), []);

  const contentScrollerRef = useRef(null);
  const tabScrollerRef = useRef(null);
  const tabRefs = useRef({});
  const isProgrammaticScrollRef = useRef(false);

  const normalizedMaps = useMemo(() => {
    return Array.isArray(maps)
      ? maps.filter((item) => item && (item.name || item.id))
      : [];
  }, [maps]);

  const pageSize = isMobile ? 1 : 2;

  const pagedMaps = useMemo(() => {
    return chunkArray(normalizedMaps, pageSize);
  }, [normalizedMaps, pageSize]);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (activeTab > pagedMaps.length - 1) {
      setActiveTab(0);
    }
  }, [pagedMaps, activeTab]);

  useEffect(() => {
    const scroller = tabScrollerRef.current;
    const target = tabRefs.current[activeTab];
    if (!scroller || !target) return;

    const nextLeft =
      target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;

    scroller.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: "smooth",
    });
  }, [activeTab]);

  useEffect(() => {
    if (!isMobile) return;

    const el = contentScrollerRef.current;
    if (!el) return;

    const pageWidth = el.clientWidth;
    isProgrammaticScrollRef.current = true;

    el.scrollTo({
      left: pageWidth * activeTab,
      behavior: "auto",
    });

    const timer = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, isMobile]);

  useEffect(() => {
    if (!isMobile) return;

    const el = contentScrollerRef.current;
    if (!el) return;

    function handleScroll() {
      if (isProgrammaticScrollRef.current) return;

      const pageWidth = el.clientWidth || 1;
      const nextTab = Math.round(el.scrollLeft / pageWidth);

      if (nextTab !== activeTab && nextTab >= 0 && nextTab < pagedMaps.length) {
        setActiveTab(nextTab);
      }
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeTab, isMobile, pagedMaps.length]);

  if (normalizedMaps.length === 0) {
    return (
      <section style={styles.section}>
        <div style={styles.header}>
          <h2 style={styles.title}>出現場所</h2>
        </div>
        <div style={styles.emptyCard}>出現場所データなし</div>
      </section>
    );
  }

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.title}>出現場所</h2>
      </div>

      <div ref={tabScrollerRef} style={styles.tabScroller}>
        {pagedMaps.map((group, index) => {
          const isActive = index === activeTab;

          return (
            <button
              key={`tab-${index}`}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              onClick={() => setActiveTab(index)}
              style={{
                ...styles.tabButton,
                ...(isActive ? styles.tabButtonActive : {}),
              }}
            >
              {buildTabLabel(group, index, isMobile)}
            </button>
          );
        })}
      </div>

      {isMobile ? (
        <div ref={contentScrollerRef} style={styles.mobileContentScroller}>
          {pagedMaps.map((group, index) => (
            <div key={`page-${index}`} style={styles.mobilePage}>
              <div style={styles.mobilePageInner}>
                {group.map((mapItem) => (
                  <div key={mapItem.id ?? mapItem.name} style={styles.mobileCardWrap}>
                    <MonsterMapCard mapItem={mapItem} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.desktopGrid}>
          {(pagedMaps[activeTab] ?? []).map((mapItem) => (
            <div key={mapItem.id ?? mapItem.name} style={styles.desktopCardWrap}>
              <MonsterMapCard mapItem={mapItem} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}