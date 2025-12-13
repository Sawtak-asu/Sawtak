"use client";

import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleSignInButton } from './google-sign-in-button'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user && !isLoading) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                </div>
            </div>
        );
    }

    return (
        <section className="min-h-screen flex bg-background">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-muted/30 items-center justify-center p-12">
                <div className="max-w-md">
                    <Link href="/" className="inline-block mb-8">
                        <LogoIcon className="w-12 h-12" />
                    </Link>
                    <h2 className="text-3xl font-semibold text-foreground mb-4">
                        Report with confidence.
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Sawtak provides a secure platform for anonymous whistleblowing 
                        with blockchain-verified submissions and end-to-end encryption.
                    </p>
                    <div className="mt-12 flex gap-8 text-sm text-muted-foreground">
                        <div>
                            <div className="text-2xl font-semibold text-foreground">100%</div>
                            <div>Anonymous</div>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">256-bit</div>
                            <div>Encryption</div>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">Hedera</div>
                            <div>Blockchain</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/">
                            <LogoIcon className="w-10 h-10" />
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Sign in
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back. Please sign in to continue.
                        </p>
                    </div>

                    {/* Social login buttons */}
                    <div className="space-y-3">
                        {/* Google Sign In */}
                        <GoogleSignInButton />

                        {/* GitHub */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 justify-center gap-3 font-medium"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/>
                            </svg>
                            Continue with GitHub
                        </Button>

                        {/* Haweya (future) */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 justify-center gap-3 font-medium"
                            disabled
                        >
                            <Image 
                                src="/haweya.webp" 
                                alt="Haweya" 
                                width={20} 
                                height={20} 
                                className="w-5 h-5"
                            />
                            Continue with Haweya
                            <span className="text-xs text-muted-foreground ml-1">(Soon)</span>
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Email/Password form */}
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="name@company.com"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <Link 
                                    href="#" 
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    className="h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 font-medium">
                            Sign in
                        </Button>
                    </form>

                    {/* Sign up link */}
                    <p className="text-center mt-6 text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary font-medium hover:underline">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
