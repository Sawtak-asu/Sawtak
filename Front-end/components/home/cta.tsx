"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
    return (
        <section className="border-t border-border/50 py-16 md:py-24 relative overflow-hidden bg-background/30 backdrop-blur-sm">
            <div className="relative mx-auto max-w-7xl px-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 rotate-3 hover:rotate-0 transition-transform shadow-lg">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-semibold md:text-4xl">
                    Ready to Make a Difference?
                </h2>
                <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                    Your voice matters. Report misconduct safely and help build a more
                    transparent and accountable society.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button asChild size="lg" className="h-12 px-8 text-base group shadow-lg shadow-primary/20">
                        <Link href="/file-complaint">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 hover:bg-background/80">
                        <Link href="/track">
                            Track a Complaint
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
