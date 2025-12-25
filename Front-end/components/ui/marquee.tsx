"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
    children: React.ReactNode;
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    speed?: "slow" | "normal" | "fast";
}

export function Marquee({
    children,
    className,
    reverse = false,
    pauseOnHover = true,
    speed = "normal",
}: MarqueeProps) {
    const speedClass = {
        slow: "animate-marquee-slow",
        normal: "animate-marquee",
        fast: "animate-marquee-fast",
    }[speed];

    return (
        <div
            className={cn(
                "group flex overflow-hidden [--gap:1rem] gap-[--gap]",
                pauseOnHover && "[&:hover_.marquee-content]:pause",
                className
            )}
        >
            <div
                className={cn(
                    "marquee-content flex min-w-full shrink-0 items-center justify-around gap-[--gap]",
                    speedClass,
                    reverse && "direction-reverse"
                )}
            >
                {children}
            </div>
            <div
                className={cn(
                    "marquee-content flex min-w-full shrink-0 items-center justify-around gap-[--gap]",
                    speedClass,
                    reverse && "direction-reverse"
                )}
                aria-hidden="true"
            >
                {children}
            </div>
        </div>
    );
}

// Vertical marquee variant
export function VerticalMarquee({
    children,
    className,
    reverse = false,
    pauseOnHover = true,
    speed = "normal",
}: MarqueeProps) {
    const speedClass = {
        slow: "animate-marquee-vertical-slow",
        normal: "animate-marquee-vertical",
        fast: "animate-marquee-vertical-fast",
    }[speed];

    return (
        <div
            className={cn(
                "group flex flex-col overflow-hidden [--gap:1rem] gap-[--gap]",
                pauseOnHover && "[&:hover_.marquee-content]:pause",
                className
            )}
        >
            <div
                className={cn(
                    "marquee-content flex flex-col min-h-full shrink-0 items-center justify-around gap-[--gap]",
                    speedClass,
                    reverse && "direction-reverse"
                )}
            >
                {children}
            </div>
            <div
                className={cn(
                    "marquee-content flex flex-col min-h-full shrink-0 items-center justify-around gap-[--gap]",
                    speedClass,
                    reverse && "direction-reverse"
                )}
                aria-hidden="true"
            >
                {children}
            </div>
        </div>
    );
}
