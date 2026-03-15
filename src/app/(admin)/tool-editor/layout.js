import AuthGuard from '@/components/AuthGuard'


export default function ToolsLayout({children}) {
    return (
    <AuthGuard>
        <div style={styles.wrapper}>
            <main style={styles.main}>
                <div style={styles.container}>{children}</div>
            </main>
        </div>
    </AuthGuard>
    )
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#0b1020",

  },
  main: {
    padding: "24px 16px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
};