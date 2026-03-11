import AuthGuard from '@/components/AuthGuard'

export default function ToolsLayout({children}) {
    return <AuthGuard>{children}</AuthGuard>
}