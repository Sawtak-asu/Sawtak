import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo, Inter, Harmattan} from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { PageTransitionProvider } from "@/components/page-transition-provider";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages, setRequestLocale } from "next-intl/server";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const harmattan = Harmattan({
    variable: "--font-harmattan",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
    variable: "--font-cairo",
    subsets: ["arabic", "latin"],
    weight: ["400", "500", "600", "700"],
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    keywords: ["Sawtak", "Anonimous Complaints", "Complaint System", "Complaints"],
    authors: [{ name: "Sawtak" }],
    openGraph: {
        title: "Sawtak",
        description: "",
        type: "website",
        locale: "en",
        siteName: "Sawtak",
    },
    icons: {
        icon: "/favicon.ico",
    },
    title: "Sawtak - Anonymous Whistleblowing Platform",
    description: "A secure, resilient, and trustworthy platform for anonymous reporting",
};

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Get messages for the current locale
    const messages = await getMessages();

    const isRTL = locale === "ar";

    // Use Cairo font for Arabic, Geist for other locales
    const fontClass = isRTL
        ? `${cairo.variable} ${inter.variable} font-cairo`
        : `${geistSans.variable} ${geistMono.variable} ${inter.variable}`;

    return (
        <html lang={locale} dir={isRTL ? "rtl" : "ltr"} suppressHydrationWarning>
            <head>
                <meta name="referrer" content="origin-when-cross-origin" />
            </head>
            <body
                className={`${fontClass} ${harmattan.variable} antialiased`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>
                            <ThemeProvider
                                attribute="class"
                                defaultTheme="system"
                                enableSystem
                                disableTransitionOnChange
                            >
                                <PageTransitionProvider>{children}</PageTransitionProvider>
                                <Toaster />
                            </ThemeProvider>
                        </AuthProvider>
                    </QueryClientProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

