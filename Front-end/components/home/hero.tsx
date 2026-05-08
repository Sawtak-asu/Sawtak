"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { TextEffect } from "@/components/ui/text-effect";
import { motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";

import { isMobileApp } from "@/lib/is-mobile";
import { Search, BookOpen, LayoutGrid, FilePlus2 } from "lucide-react";

export function Hero() {
    const t = useTranslations("Hero");
    const tNav = useTranslations("Navbar");
    const locale = useLocale();
    const [isNative, setIsNative] = React.useState(false);

    React.useEffect(() => {
        setIsNative(isMobileApp());
    }, []);

    // Use Inter for English, inherit Cairo for Arabic
    const headingFontClass = locale === "ar" ? "font-harmattan" : "font-inter";

    return (
        <section className="relative pt-24 md:pt-36 pb-16 md:pb-24 overflow-hidden">
            <div className="absolute top-0 left-0 w-full z-50">
                <Navbar variant="floating" />
            </div>
            <div className="mx-auto max-w-7xl px-6 relative z-10">
                <div className="text-center">
                    {/* Badge with subtle animation */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground shadow-sm hover:border-primary/30 transition-colors"
                    >
                        <Shield className="h-4 w-4 text-primary" />
                        <span>{t("badge")}</span>
                        <Sparkles className="h-3 w-3 text-primary/60" />
                    </motion.div>

                    {/* Main Heading with text effects */}
                    <h1 className={`mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl ${headingFontClass}`}>
                        <span className="relative inline-block">
                            {locale === "ar" ? (
                                <motion.span
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="inline font-light"
                                >
                                    {t("heading1")}
                                </motion.span>
                            ) : (
                                <TextEffect
                                    per="char"
                                    preset="fade-in-blur"
                                    delay={0.3}
                                    speedReveal={1.5}
                                    as="span"
                                    className="inline"
                                >
                                    {t("heading1")}
                                </TextEffect>
                            )}
                            <motion.svg
                                className="absolute -bottom-2 left-0 w-full h-3 text-primary/20"
                                viewBox="0 0 200 10"
                                preserveAspectRatio="none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2, delay: 0.7 }}
                            >
                                <motion.path
                                    d="M0 5 Q50 0 100 5 T200 5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                                />
                            </motion.svg>
                        </span>{" "}
                        {locale === "ar" ? (
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="text-muted-foreground inline"
                            >
                                {t("heading2")}
                            </motion.span>
                        ) : (
                            <TextEffect
                                per="char"
                                preset="blur"
                                delay={0.8}
                                speedReveal={1.5}
                                as="span"
                                className="text-muted-foreground inline"
                            >
                                {t("heading2")}
                            </TextEffect>
                        )}
                    </h1>

                    {/* Subheading with slide effect */}
                    <TextEffect
                        per="word"
                        preset="slide"
                        delay={1.2}
                        speedReveal={2}
                        as="p"
                        className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
                    >
                        {t("subheading")}
                    </TextEffect>

                    {/* CTA Buttons with fade in */}
                    {isNative ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1.5 }}
                            className="mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto px-2"
                        >
                            <Button asChild size="lg" className="h-28 flex-col gap-3 text-lg font-semibold shadow-xl shadow-primary/20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 border-none group transition-all active:scale-95">
                                <Link href="/file-complaint">
                                    <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                                        <FilePlus2 className="h-6 w-6" />
                                    </div>
                                    {tNav("fileComplaint")}
                                </Link>
                            </Button>
                            
                            <Button asChild variant="outline" size="lg" className="h-28 flex-col gap-3 text-lg font-semibold rounded-2xl bg-background/50 backdrop-blur-md border-border/50 hover:border-primary/50 group transition-all active:scale-95">
                                <Link href="/feed">
                                    <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                        <LayoutGrid className="h-6 w-6 text-primary" />
                                    </div>
                                    {tNav("feed")}
                                </Link>
                            </Button>

                            <Button asChild variant="outline" size="lg" className="h-28 flex-col gap-3 text-lg font-semibold rounded-2xl bg-background/50 backdrop-blur-md border-border/50 hover:border-primary/50 group transition-all active:scale-95">
                                <Link href="/track">
                                    <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                        <Search className="h-6 w-6 text-primary" />
                                    </div>
                                    {tNav("track")}
                                </Link>
                            </Button>

                            <Button asChild variant="outline" size="lg" className="h-28 flex-col gap-3 text-lg font-semibold rounded-2xl bg-background/50 backdrop-blur-md border-border/50 hover:border-primary/50 group transition-all active:scale-95">
                                <Link href="/docs">
                                    <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>
                                    {tNav("docs")}
                                </Link>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.8 }}
                            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                        >
                            <Button asChild size="lg" className="h-12 px-8 text-base group shadow-lg shadow-primary/20">
                                <Link href="/file-complaint">
                                    {t("cta1")}
                                    <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-background/80">
                                <Link href="/feed">
                                    {t("cta2")}
                                </Link>
                            </Button>
                        </motion.div>
                    )}

                    {/* Trust indicators with staggered fade in */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 2.2 }}
                        className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
                    >
                        <Link href="/docs#security" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse group-hover/indicator:scale-125 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-green-500">{t("indicator1")}</span>
                        </Link>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <Link href="/docs#blockchain" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                            <div className="h-2 w-2 rounded-full bg-blue-500 group-hover/indicator:scale-125 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-blue-500">{t("indicator2")}</span>
                        </Link>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <Link href="/docs#overview" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                            <div className="h-2 w-2 rounded-full bg-purple-500 group-hover/indicator:scale-125 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-purple-500">{t("indicator3")}</span>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
