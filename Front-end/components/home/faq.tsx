"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, ShieldAlert, BadgeInfo, EyeOff, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const fears = [
    {
        icon: EyeOff,
        question: "Can my employer track my IP address?",
        answer: "No. Your connection is routed through our Privacy Proxy which strips all metadata (IP, User-Agent, Device Info) before it ever reaches our servers. We cannot see who you are, so neither can they."
    },
    {
        icon: ShieldAlert,
        question: "What if the database gets hacked?",
        answer: "Your anonymous report isn't just in a database—it's hashed on the Hedera public ledger. Even if our servers are compromised, the cryptographic proof of your report exists independently on the blockchain and cannot be altered or deleted."
    },
    {
        icon: BadgeInfo,
        question: "Can I be sued for defamation?",
        answer: "We employ a strict vetting process. While we protect your identity, we also filter out malicious spam. If your report is made in good faith with evidence, existing whistleblower protection laws (and our anonymity layer) provide a robust shield."
    },
    {
        icon: Gavel,
        question: "How do I know action was taken?",
        answer: "You receive a unique tracking code. You can use this to check the status of your report (e.g. 'Under Investigation', 'Resolved') on the public feed without ever logging in or revealing who you are."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 relative bg-background">
            <div className="mx-auto max-w-4xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                        Addressing Your <span className="text-primary italic">Fears</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        We know speaking up is scary. Here is how we engineered safety into the system to protect you.
                    </p>
                </div>

                <div className="grid gap-4">
                    {fears.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={false}
                            animate={{ backgroundColor: openIndex === index ? "var(--muted)" : "transparent" }}
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
                                        {item.question}
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
                                            {item.answer}
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
