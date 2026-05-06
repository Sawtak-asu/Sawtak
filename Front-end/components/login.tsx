"use client";

import { LogoIcon } from '@/components/logo'
import { Link } from '@/i18n/navigation';
import { HaweyaSignInButton } from './haweya-sign-in-button'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('Login');

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
                        {t('brandHeading')}
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        {t('brandDescription')}
                    </p>
                    <div className="mt-12 flex gap-8 text-sm text-muted-foreground">
                        <div>
                            <div className="text-2xl font-semibold text-foreground">100%</div>
                            <div>{t('stat1Label')}</div>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">256-bit</div>
                            <div>{t('stat2Label')}</div>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-foreground">Sawtak</div>
                            <div>{t('stat3Label')}</div>
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
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* OAuth login buttons */}
                    <div className="space-y-3">
                        {/* DISABLED - Google Sign In */}
                        {/* <GoogleSignInButton /> */}
                        {/* Haweya  (mock xD) */}
                        <HaweyaSignInButton />
                    </div>

                    {/* Info text */}
                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                            {t('consent')}{' '}
                            <Link href="/terms" className="text-primary hover:underline">
                                {t('terms')}
                            </Link>{' '}
                            {t('and')}{' '}
                            <Link href="/privacy-policy" className="text-primary hover:underline">
                                {t('privacy')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
