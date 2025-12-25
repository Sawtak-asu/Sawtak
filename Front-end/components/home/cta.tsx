"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { TextEffect } from "@/components/ui/text-effect";
import { LogoIcon } from "../logo";

export function CTA() {
    return (
        <section className="border-t border-border/50 py-16 md:py-24 relative overflow-hidden bg-background/30 backdrop-blur-sm">
            <div className="relative mx-auto max-w-7xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 3 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, type: "spring" }}
                    whileHover={{ rotate: 0, scale: 1.05 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 shadow-lg"
                >
                    {/* <Shield className="h-8 w-8 text-primary" /> */}
                    <LogoIcon className="size-9" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        <TextEffect per="word" preset="blur" speedReveal={2}>
                            Ready to Make a Difference?
                        </TextEffect>
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <TextEffect
                        per="word"
                        preset="slide"
                        delay={0.3}
                        speedReveal={3}
                        as="p"
                        className="mt-4 text-muted-foreground max-w-xl mx-auto"
                    >
                        Your voice matters. Report misconduct safely and help build a more transparent and accountable society.
                    </TextEffect>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Button asChild size="lg" className="h-12 px-8 text-base group shadow-lg shadow-primary/20">
                        <Link href="/file-complaint">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 hover:bg-background/80">
                        <Link href="/docs">
                            Learn More
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

