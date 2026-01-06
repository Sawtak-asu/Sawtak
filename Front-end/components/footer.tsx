"use client";

import { Logo } from '@/components/logo'
import { Github, Linkedin } from 'lucide-react'
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function FooterSection() {
    const t = useTranslations('Footer');

    const links = [
        { title: t('home'), href: '/' },
        { title: t('fileComplaint'), href: '/file-complaint' },
        { title: t('trackStatus'), href: '/track' },
        { title: t('publicFeed'), href: '/feed' },
        { title: t('documentation'), href: '/docs' },
        { title: t('privacyPolicy'), href: '/privacy-policy' },
    ];

    return (
        <footer className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit"
                    dir="ltr">
                    <Logo />
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="text-muted-foreground hover:text-primary block duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>
                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    <a
                        href="https://www.linkedin.com/company/wearemasons/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="text-muted-foreground hover:text-primary block">
                        <Linkedin />
                    </a>
                    <a
                        href="https://github.com/Sawtak-asu"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Github"
                        className="text-muted-foreground hover:text-primary block">
                        <Github />
                    </a>
                </div>
                <span className="text-muted-foreground block text-center text-sm">
                    {t('copyright', { year: new Date().getFullYear() })}
                </span>
            </div>
        </footer>
    )
}
