import './auth.css'

export const metadata = {
  title: 'Auth',
}

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__inner">
          {children}
        </div>
      </div>
    </div>
  )
}