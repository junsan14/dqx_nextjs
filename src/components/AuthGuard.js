'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/auth'

export default function AuthGuard({ children }) {
  const pathname = usePathname()
  const { user } = useAuth({ middleware: 'auth' })

  if (!user) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingCard}>
          <div style={styles.spinnerWrap}>
            <span style={{ ...styles.dot, animationDelay: '0s' }} />
            <span style={{ ...styles.dot, animationDelay: '0.15s' }} />
            <span style={{ ...styles.dot, animationDelay: '0.3s' }} />
          </div>

          <h1 style={styles.loadingTitle}>Loading...</h1>
          <p style={styles.loadingText}>
            ユーザー情報を確認しています
          </p>
        </div>

        <style>{`
          @keyframes guardBounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 0.45;
            }
            40% {
              transform: translateY(-8px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    )
  }

  const isAdmin = Boolean(user?.is_admin)

  const canAccessMonsters =
    pathname === '/tool-editor/monsters' ||
    pathname.startsWith('/tool-editor/monsters/')

  const canAccess = isAdmin || canAccessMonsters

  if (!canAccess) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h1 style={styles.title}>お持ちの権限ではアクセスできません</h1>
          <p style={styles.text}>
            このページは管理者のみ編集可能です。
          </p>

          <div style={styles.actions}>
            <Link href="/tool-editor/monsters" style={styles.link}>
              モンスター管理へ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

const styles = {
  loadingWrapper: {
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    background:
      'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
  },
  loadingCard: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: '20px',
    padding: '40px 28px',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid #e2e8f0',
    boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
    textAlign: 'center',
  },
  spinnerWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '9999px',
    background: '#2563eb',
    display: 'inline-block',
    animation: 'guardBounce 1.2s infinite ease-in-out',
  },
  loadingTitle: {
    margin: '0 0 10px',
    fontSize: '24px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '0.02em',
  },
  loadingText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.7,
    color: '#475569',
  },
  wrapper: {
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: '12px',
    padding: '24px',
    color: '#fff',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '24px',
    fontWeight: 700,
  },
  text: {
    margin: 0,
    color: '#d1d5db',
    lineHeight: 1.7,
  },
  actions: {
    marginTop: '20px',
  },
  link: {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
  },
}