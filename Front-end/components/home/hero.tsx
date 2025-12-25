"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { TextEffect } from "@/components/ui/text-effect";
import { motion } from "motion/react";

export function Hero() {
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
                        <span>Blockchain-Secured Reporting</span>
                        <Sparkles className="h-3 w-3 text-primary/60" />
                    </motion.div>

                    {/* Main Heading with text effects */}
                    <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="relative inline-block">
                            <TextEffect
                                per="char"
                                preset="fade-in-blur"
                                delay={0.3}
                                speedReveal={1.5}
                                as="span"
                                className="inline"
                            >
                                Speak Up.
                            </TextEffect>
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
                        <TextEffect
                            per="char"
                            preset="blur"
                            delay={0.8}
                            speedReveal={1.5}
                            as="span"
                            className="text-muted-foreground inline"
                        >
                            Stay Safe.
                        </TextEffect>
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
                        A secure whistleblowing platform with blockchain-backed integrity. Report misconduct anonymously with cryptographic proof of your submission.
                    </TextEffect>

                    {/* CTA Buttons with fade in */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.8 }}
                        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                    >
                        <Button asChild size="lg" className="h-12 px-8 text-base group shadow-lg shadow-primary/20">
                            <Link href="/file-complaint">
                                File a Complaint
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-background/80">
                            <Link href="/feed">
                                View Public Feed
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Trust indicators with staggered fade in */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 2.2 }}
                        className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
                    >
                        <Link href="/docs#security" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse group-hover/indicator:scale-125 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-green-500">256-bit Encrypted</span>
                        </Link>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <Link href="/docs#blockchain" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                            <div className="h-2 w-2 rounded-full bg-blue-500 group-hover/indicator:scale-125 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-blue-500">Hedera Blockchain</span>
                        </Link>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <Link href="/docs#overview" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                            <div className="h-2 w-2 rounded-full bg-purple-500 group-hover/indicator:scale-125 transition-transform" />
                            <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-purple-500">Anonymous</span>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
