'use client'

import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthSessionStatus from '@/app/(auth)/AuthSessionStatus'

const Login = () => {
    const searchParams = useSearchParams()

    const { login, authLoading } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/tool-editor',
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [shouldRemember, setShouldRemember] = useState(false)
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)

    useEffect(() => {
        const reset = searchParams.get('reset')

        if (reset && errors.length === 0) {
            setStatus(atob(reset))
        } else {
            setStatus(null)
        }
    }, [searchParams, errors])

    const submitForm = async event => {
        event.preventDefault()

        await login({
            email,
            password,
            remember: shouldRemember,
            setErrors,
            setStatus,
        })
    }

    return (
        <>
            {authLoading && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(4px)',
                    }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '24px 32px',
                            background: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #e2e8f0',
                                borderTop: '4px solid #2563eb',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }}
                        />
                        <p
                            style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#334155',
                            }}>
                            ログイン中...
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>

            <div style={{ marginBottom: '20px' }}>
                <h2
                    style={{
                        margin: 0,
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        color: '#0f172a',
                    }}>
                    Login
                </h2>
                <p
                    style={{
                        marginTop: '8px',
                        color: '#475569',
                        lineHeight: 1.7,
                    }}>
                    メールアドレスとパスワードを入力してログイン
                </p>
            </div>

            <AuthSessionStatus className="mb-4" status={status} />

            <form onSubmit={submitForm}>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        className="block mt-1 w-full"
                        onChange={event => setEmail(event.target.value)}
                        required
                        autoFocus
                        disabled={authLoading}
                    />
                    <InputError messages={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        className="block mt-1 w-full"
                        onChange={event => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={authLoading}
                    />
                    <InputError
                        messages={errors.password}
                        className="mt-2"
                    />
                </div>

                <div className="block mt-4">
                    <label
                        htmlFor="remember_me"
                        className="inline-flex items-center">
                        <input
                            id="remember_me"
                            type="checkbox"
                            name="remember"
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            onChange={event =>
                                setShouldRemember(event.target.checked)
                            }
                            disabled={authLoading}
                        />
                        <span className="ml-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Link
                        href="/forgot-password"
                        className="underline text-sm text-gray-600 hover:text-gray-900">
                        Forgot your password?
                    </Link>

                    <Button className="ml-3" disabled={authLoading}>
                        {authLoading ? 'Loading...' : 'Login'}
                    </Button>
                </div>
            </form>
        </>
    )
}

export default Login