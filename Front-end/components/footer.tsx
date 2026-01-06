import { Logo } from '@/components/logo'
import { Github, Linkedin } from 'lucide-react'
import Link from 'next/link'

const links = [
    {
        title: 'Home',
        href: '/',
    },
    {
        title: 'File Complaint',
        href: '/file-complaint',
    },
    {
        title: 'Track Status',
        href: '/track',
    },
    {
        title: 'Public Feed',
        href: '/feed',
    },
    {
        title: 'Documentation',
        href: '/docs',
    },
    {
        title: 'Privacy Policy',
        href: '/privacy-policy',
    },
]

export default function FooterSection() {
    return (
        <footer className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
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
                    <Link
                        href="https://www.linkedin.com/company/wearemasons/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="text-muted-foreground hover:text-primary block">
                        <Linkedin />
                    </Link>
                    <Link
                        href="https://github.com/Sawtak-asu"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Github"
                        className="text-muted-foreground hover:text-primary block">
                        <Github />
                    </Link>


                </div>
                <span className="text-muted-foreground block text-center text-sm"> © {new Date().getFullYear()} Sawtak, All rights reserved</span>
            </div>
        </footer>
    )
}
