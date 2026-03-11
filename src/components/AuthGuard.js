'use client'

import { useAuth } from '@/hooks/auth'

export default function AuthGuard({ children }) {
    const { user } = useAuth({ middleware: 'auth' })

    if (!user) {
        return <div>Loading...</div>
    }

    return <>{children}</>
}