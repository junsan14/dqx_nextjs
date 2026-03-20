"use client";

export default function EditorShell({
  isMobile = false,
  sidebar = null,
  children,
}) {
  const hasSidebar = Boolean(sidebar);

  return (
    <main
      style={{
        ...styles.root,
        ...(isMobile ? styles.rootMobile : null),
        ...(!hasSidebar ? styles.rootSingle : null),
      }}
    >
      {hasSidebar ? sidebar : null}

      <section
        style={{
          ...styles.content,
          ...(isMobile ? styles.contentMobile : null),
          ...(!hasSidebar ? styles.contentSingle : null),
        }}
      >
        {children}
      </section>
    </main>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    alignItems: "flex-start",
    background: "var(--page-bg)",
    color: "var(--page-text)",
    overflowX: "hidden",
  },

  rootMobile: {
    display: "block",
    minHeight: "auto",
  },

  rootSingle: {
    display: "block",
  },

  content: {
    flex: 1,
    minWidth: 0,
    padding: 24,
    overflowX: "hidden",
  },

  contentMobile: {
    width: "100%",
    padding: "16px 0 20px",
  },

  contentSingle: {
    width: "100%",
  },
};