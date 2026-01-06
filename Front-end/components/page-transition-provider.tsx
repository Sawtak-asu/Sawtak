"use client";

import { ReactNode, useState, useEffect } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { usePathname } from "next/navigation";

interface PageTransitionProviderProps {
    children: ReactNode;
}

// Routes that should have page transition animations
const ANIMATED_ROUTES = ["/feed", "/complaint/"];

function shouldAnimate(pathname: string): boolean {
    return ANIMATED_ROUTES.some(route => pathname.startsWith(route));
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Avoid hydration mismatch by rendering without wrapper on server
    if (!mounted) {
        return <>{children}</>;
    }

    // Only apply animations for specific routes
    if (!shouldAnimate(pathname)) {
        return <>{children}</>;
    }

    return (
        <LayoutGroup>
            <AnimatePresence mode="wait" initial={false}>
                <div key={pathname}>
                    {children}
                </div>
            </AnimatePresence>
        </LayoutGroup>
    );
}
