"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, ShieldAlert, BadgeInfo, EyeOff, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const questionKeys = [
    { key: "ip", icon: EyeOff },
    { key: "hacked", icon: ShieldAlert },
    { key: "defamation", icon: BadgeInfo },
    { key: "action", icon: Gavel },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const t = useTranslations("FAQ");

    return (
        <section dir="ltr" className="py-24 relative">
            <div className="mx-auto max-w-4xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                        {t("title")} {t("titleHighlight")}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="grid gap-4">
                    {questionKeys.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={false}
                            animate={{ backgroundColor: openIndex === index ? "var(--muted)" : "var(--background)" }}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className={cn(
                                "group border border-border rounded-2xl overflow-hidden cursor-pointer transition-colors hover:border-primary/30",
                                openIndex === index ? "border-primary/50" : ""
                            )}
                        >
                            <div className="p-6 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-colors",
                                        openIndex === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                                    )}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className={cn(
                                        "text-lg font-semibold transition-colors",
                                        openIndex === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {t(`questions.${item.key}.question`)}
                                    </h3>
                                </div>
                                <div className="text-primary">
                                    {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 pt-0 pl-18 text-muted-foreground leading-relaxed">
                                            {t(`questions.${item.key}.answer`)}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
