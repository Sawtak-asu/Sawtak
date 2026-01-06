"use client";

import React, { useRef } from "react";
import {
    FileText,
    Lock,
    Globe,
    Server,
    Terminal,
    ShieldCheck,
    Check,
    Hash
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const timelineSteps = [
    {
        title: "Submission Interface",
        subtitle: "User Action",
        icon: FileText,
        description: "User submits data via secure HTTPS. Identity metadata is immediately stripped at the edge proxy layer.",
        tech: ["Next.js Form", "Edge Proxy", "Metadata Stripping"],
        visual: (
            <div className="w-full p-4 bg-zinc-950 rounded-lg font-mono text-xs text-green-400 border border-zinc-800 shadow-inner">
                <div className="flex gap-2 mb-2 border-b border-zinc-800 pb-2">
                    <span className="text-red-500">●</span>
                    <span className="text-yellow-500">●</span>
                    <span className="text-green-500">●</span>
                    <span className="text-zinc-500">submission_log.sh</span>
                </div>
                <div className="space-y-1 opacity-80">
                    <p><span className="text-blue-400">POST</span> /api/submit/anon</p>
                    <p className="text-zinc-500"># Stripping metadata...</p>
                    <p>User-Agent: <span className="text-red-400 line-through">Mozilla/5.0...</span> [REDACTED]</p>
                    <p>IP-Address: <span className="text-red-400 line-through">192.168.1.1</span> [REDACTED]</p>
                    <p className="text-yellow-400">{`>`} Generated Anon_ID: 8f92-x7a1</p>
                </div>
            </div>
        )
    },
    {
        title: "Encryption Engine",
        subtitle: "Security Layer",
        icon: Lock,
        description: "Payload enters the TEE (Trusted Execution Environment). Data is encrypted using AES-256-GCM before storage.",
        tech: ["AES-256", "Zero Knowledge", "Key Management"],
        visual: (
            <div className="w-full h-32 relative bg-zinc-100 dark:bg-zinc-900 border border-border rounded-lg overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
                <div className="flex items-center gap-4 z-10 transition-transform hover:scale-105 duration-300">
                    <div className="w-12 h-16 bg-white dark:bg-black border border-border shadow-sm flex flex-col items-center justify-center gap-1 rounded">
                        <FileText className="w-4 h-4" />
                        <span className="text-[8px] font-mono">RAW</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="h-0.5 w-8 bg-primary animate-pulse" />
                        <Lock className="w-4 h-4 text-primary -my-2 bg-background z-20" />
                    </div>
                    <div className="w-12 h-16 bg-zinc-950 border border-zinc-800 shadow-sm flex flex-col items-center justify-center gap-1 rounded text-white">
                        <Hash className="w-4 h-4" />
                        <span className="text-[8px] font-mono">ENC</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Distributed Ledger",
        subtitle: "Immutability Layer",
        icon: Globe,
        description: "A cryptographic hash of the encrypted payload is submitted to the Hedera Consensus Service (HCS).",
        tech: ["Hedera HCS", "Consensus Timestamp", "Public Topic"],
        visual: (
            <div className="w-full p-4 bg-background border border-border rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-border pb-2">
                    <span>HCS Topic 0.0.12345</span>
                    <span className="flex items-center gap-1 text-green-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live</span>
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-mono p-1.5 bg-muted/50 rounded hover:bg-muted transition-colors">
                        <span className="text-zinc-400">#{1042 + i}</span>
                        <span className="truncate w-24 opacity-60">0x7f3a...91b2</span>
                        <span className="ml-auto text-[10px] border border-border px-1 rounded bg-background">Confirmed</span>
                    </div>
                ))}
            </div>
        )
    },
    {
        title: "Decentralized Storage",
        subtitle: "Evidence Retention",
        icon: Server,
        description: "Encrypted evidence files are chunked and pinned to the IPFS network, ensuring redundancy and availability.",
        tech: ["IPFS", "Content Addressing", "Redundancy"],
        visual: (
            <div className="w-full h-full min-h-[120px] flex items-center justify-center relative">
                <div className="absolute w-24 h-24 border-2 border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute w-32 h-32 border border-dashed border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                <div className="z-10 bg-background border border-border px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold">CID: QmXy...7z9</span>
                </div>
                <div className="absolute top-0 w-2 h-2 bg-primary rounded-full" />
                <div className="absolute bottom-0 w-2 h-2 bg-primary/50 rounded-full" />
                <div className="absolute left-0 w-2 h-2 bg-primary/30 rounded-full" />
            </div>
        )
    },
    {
        title: "Admin Resolution",
        subtitle: "Final Action",
        icon: ShieldCheck,
        description: "Admins investigate via the dashboard. Actions are logged and status updates are pushed back to the public ledger.",
        tech: ["RBAC Dashboard", "Audit Trails", "Public Updates"],
        visual: (
            <div className="w-full p-3 bg-zinc-50 border border-border rounded-lg space-y-3">
                <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Status Change</div>
                    <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-green-500 origin-left animate-[scaleX_1s_ease-out]" />
                        </div>
                        <span className="text-xs font-bold text-green-600">Resolved</span>
                    </div>
                </div>
                <div className="p-2 bg-white border border-zinc-200 rounded text-xs text-zinc-600 flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5 text-green-500" />
                    <span>Investigated by Admin #42. Misconduct confirmed. Report filed with HR.</span>
                </div>
            </div>
        )
    }
];

function ParallaxCard({ step, index, progress }: { step: typeof timelineSteps[0], index: number, progress: any }) {
    const yRange = index % 2 === 0 ? [50, -50] : [100, -100];
    const y = useTransform(progress, [0, 1], yRange);

    return (
        <motion.div
            style={{ y }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={cn(
                "relative flex flex-col md:flex-row gap-8 items-center mb-16",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            )}
        >
            <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-background border-4 border-primary rounded-full z-10 -translate-x-1/2 shadow-[0_0_0_4px_rgba(var(--background),1)]">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
            </div>

            <div className={cn(
                "ml-16 md:ml-0 md:w-1/2 p-6 bg-background/80 backdrop-blur-sm border border-border/60 hover:border-primary/50 transition-colors rounded-2xl shadow-sm hover:shadow-xl duration-300",
                index % 2 === 0 ? "md:mr-12" : "md:ml-12"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-lg text-primary">
                            <step.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-mono text-muted-foreground uppercase">{step.subtitle}</div>
                            <h3 className="font-bold text-lg">{step.title}</h3>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground/30 select-none">
                        0{index + 1}
                    </div>
                </div>

                <div className="mb-6 bg-muted/30 p-1 rounded-lg border border-border/50 overflow-hidden">
                    {step.visual}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                </p>

                <div className="flex flex-wrap gap-2">
                    {step.tech.map((t) => (
                        <span key={t} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            <div className="hidden md:block md:w-1/2" />
        </motion.div>
    );
}

export function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null);
    const t = useTranslations("HowItWorks");

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const lineHeight = useTransform(smoothProgress, [0.1, 0.9], ["0%", "100%"]);
    const bgY = useTransform(smoothProgress, [0, 1], ["0%", "20%"]);

    return (
        <section dir="ltr" ref={containerRef} className="py-32 relative bg-zinc-50/50 dark:bg-background overflow-hidden border-t border-border">
            <motion.div
                style={{ y: bgY }}
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
            >
                <div className="w-full h-[120%] -mt-[10%]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </motion.div>

            <div className="mx-auto max-w-5xl px-6 relative z-10">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-medium mb-4"
                    >
                        <Terminal className="w-3 h-3" />
                        {t("badge")}
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="relative pb-24">
                    <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-1 bg-border/40 -translate-x-1/2 rounded-full" />

                    <motion.div
                        style={{ height: lineHeight }}
                        className="absolute left-8 md:left-1/2 top-4 w-1 bg-linear-to-b from-primary via-primary/80 to-primary/20 -translate-x-1/2 rounded-full z-0 origin-top"
                    />

                    <div className="space-y-0">
                        {timelineSteps.map((step, index) => (
                            <ParallaxCard
                                key={index}
                                step={step}
                                index={index}
                                progress={smoothProgress}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
