"use client";

import { ReactNode } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { usePathname } from "next/navigation";

interface PageTransitionProviderProps {
    children: ReactNode;
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
    const pathname = usePathname();

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
