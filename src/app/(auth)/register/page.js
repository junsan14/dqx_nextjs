'use client'

import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useState } from 'react'

const Page = () => {
    const { register, authLoading } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    })

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [errors, setErrors] = useState([])

    const submitForm = async event => {
        event.preventDefault()

        await register({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            setErrors,
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
                            登録中...
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

            <form onSubmit={submitForm}>
                <div>
                    <Label htmlFor="name">Name</Label>

                    <Input
                        id="name"
                        type="text"
                        value={name}
                        className="block mt-1 w-full"
                        onChange={event => setName(event.target.value)}
                        required
                        autoFocus
                        disabled={authLoading}
                    />

                    <InputError messages={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="email">Email</Label>

                    <Input
                        id="email"
                        type="email"
                        value={email}
                        className="block mt-1 w-full"
                        onChange={event => setEmail(event.target.value)}
                        required
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
                        autoComplete="new-password"
                        disabled={authLoading}
                    />

                    <InputError messages={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Label htmlFor="passwordConfirmation">
                        Confirm Password
                    </Label>

                    <Input
                        id="passwordConfirmation"
                        type="password"
                        value={passwordConfirmation}
                        className="block mt-1 w-full"
                        onChange={event =>
                            setPasswordConfirmation(event.target.value)
                        }
                        required
                        disabled={authLoading}
                    />

                    <InputError
                        messages={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center justify-end mt-4">
                    <Link
                        href="/login"
                        className="underline text-sm text-gray-600 hover:text-gray-900">
                        Already registered?
                    </Link>

                    <Button className="ml-4" disabled={authLoading}>
                        {authLoading ? 'Loading...' : 'Register'}
                    </Button>
                </div>
            </form>
        </>
    )
}

export default Page