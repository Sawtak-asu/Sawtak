"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Lock, Zap, Database, Shield, Cloud, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

const poweredByTech = [
    {
        name: "Hedera Hashgraph",
        icon: Lock,
        iconColor: "text-purple-400",
        description: "Enterprise-grade public distributed ledger technology. Immutable record-keeping with 10,000+ TPS and carbon-negative operations.",
        link: "https://hedera.com"
    },
    {
        name: "Bun & Elysia",
        icon: Zap,
        iconColor: "text-amber-400",
        description: "Blazing-fast JavaScript runtime and type-safe framework. Up to 18x faster than Node.js with end-to-end type safety.",
        link: "https://bun.sh"
    },
    {
        name: "IPFS",
        icon: Cloud,
        iconColor: "text-cyan-400",
        description: "Decentralized, content-addressed file storage. Censorship-resistant evidence preservation with cryptographic verification.",
        link: "https://ipfs.tech"
    }
];

const additionalTech = [
    {
        name: "AES-256 Encryption",
        icon: Shield,
        iconColor: "text-green-400",
        description: "Military-grade encryption for all sensitive data. Your information is protected at rest and in transit."
    },
    {
        name: "PostgreSQL",
        icon: Database,
        iconColor: "text-blue-400",
        description: "Enterprise relational database for fast querying and reliable data indexing of blockchain records."
    },
    {
        name: "Haweya Integration",
        icon: Fingerprint,
        iconColor: "text-pink-400",
        description: "National ID verification for identified submissions. Secure government-grade identity verification."
    }
];

function CircuitLines() {
    // Define paths for animated dots to follow
    const leftPaths = [
        { id: "path-l1", d: "M0 100 H250 L270 100", delay: 0 },
        { id: "path-l2", d: "M50 60 H200 L250 100", delay: 0.5 },
        { id: "path-l3", d: "M80 140 H220 L250 100", delay: 1 },
    ];

    const rightPaths = [
        { id: "path-r1", d: "M800 100 H550 L530 100", delay: 0.3 },
        { id: "path-r2", d: "M750 60 H600 L550 100", delay: 0.8 },
        { id: "path-r3", d: "M720 140 H580 L550 100", delay: 1.3 },
    ];

    return (
        <svg
            className="absolute inset-0 w-full h-full text-black/20 dark:text-white/10"
            viewBox="0 0 800 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Left circuit lines - static paths */}
            {leftPaths.map((path) => (
                <motion.path
                    key={path.id}
                    d={path.d}
                    stroke="currentColor"
                    strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: path.delay * 0.3, ease: "easeOut" }}
                />
            ))}

            {/* Right circuit lines - static paths */}
            {rightPaths.map((path) => (
                <motion.path
                    key={path.id}
                    d={path.d}
                    stroke="currentColor"
                    strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: path.delay * 0.3, ease: "easeOut" }}
                />
            ))}

            {/* Animated flowing dots on left paths */}
            {leftPaths.map((path, index) => (
                <React.Fragment key={`dot-${path.id}`}>
                    {/* Hidden path for motion reference */}
                    <path id={path.id} d={path.d} fill="none" />

                    {/* Glowing animated dot */}
                    <motion.circle
                        r="4"
                        fill="url(#dot-gradient)"
                        filter="url(#glow)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{
                            duration: 3,
                            delay: path.delay,
                            repeat: Infinity,
                            repeatDelay: 1,
                        }}
                    >
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            begin={`${path.delay}s`}
                        >
                            <mpath href={`#${path.id}`} />
                        </animateMotion>
                    </motion.circle>

                    {/* Trail effect - secondary dot */}
                    <motion.circle
                        r="2"
                        fill="currentColor"
                        className="text-primary/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0.6, 0] }}
                        transition={{
                            duration: 3,
                            delay: path.delay + 0.1,
                            repeat: Infinity,
                            repeatDelay: 1,
                        }}
                    >
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            begin={`${path.delay + 0.1}s`}
                        >
                            <mpath href={`#${path.id}`} />
                        </animateMotion>
                    </motion.circle>
                </React.Fragment>
            ))}

            {/* Animated flowing dots on right paths */}
            {rightPaths.map((path) => (
                <React.Fragment key={`dot-${path.id}`}>
                    {/* Hidden path for motion reference */}
                    <path id={path.id} d={path.d} fill="none" />

                    {/* Glowing animated dot */}
                    <motion.circle
                        r="4"
                        fill="url(#dot-gradient)"
                        filter="url(#glow)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{
                            duration: 3,
                            delay: path.delay,
                            repeat: Infinity,
                            repeatDelay: 1,
                        }}
                    >
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            begin={`${path.delay}s`}
                        >
                            <mpath href={`#${path.id}`} />
                        </animateMotion>
                    </motion.circle>

                    {/* Trail effect */}
                    <motion.circle
                        r="2"
                        fill="currentColor"
                        className="text-primary/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0.6, 0] }}
                        transition={{
                            duration: 3,
                            delay: path.delay + 0.1,
                            repeat: Infinity,
                            repeatDelay: 1,
                        }}
                    >
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            begin={`${path.delay + 0.1}s`}
                        >
                            <mpath href={`#${path.id}`} />
                        </animateMotion>
                    </motion.circle>
                </React.Fragment>
            ))}

            {/* Static endpoint dots with pulse animation */}
            {[
                { cx: 50, cy: 60 },
                { cx: 80, cy: 140 },
                { cx: 0, cy: 100 },
                { cx: 750, cy: 60 },
                { cx: 720, cy: 140 },
                { cx: 800, cy: 100 },
            ].map((dot, i) => (
                <React.Fragment key={`endpoint-${i}`}>
                    {/* Pulse ring */}
                    <motion.circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-primary/30"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                        }}
                    />
                    {/* Static dot */}
                    <motion.circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r="3"
                        fill="currentColor"
                        className="text-primary/50"
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    />
                </React.Fragment>
            ))}

            {/* Center connection points - where lines meet the chip */}
            {[
                { cx: 270, cy: 100 },
                { cx: 530, cy: 100 },
            ].map((dot, i) => (
                <React.Fragment key={`center-${i}`}>
                    <motion.circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r="5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-primary/40"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    />
                    <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r="4"
                        fill="currentColor"
                        className="text-primary/60"
                    />
                </React.Fragment>
            ))}

            <defs>
                {/* Radial gradient for glowing dot */}
                <radialGradient id="dot-gradient">
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>

                {/* Glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
}


function TechCard({
    name,
    icon: Icon,
    iconColor,
    description,
    link,
    index
}: {
    name: string;
    icon: typeof Lock;
    iconColor: string;
    description: string;
    link?: string;
    index: number;
}) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Generate pseudo-random values based on index for consistent randomization
    const randomDuration = 5 + (index * 0.5) % 2; // Duration between 5-7 seconds
    const randomStartAngle = (index * 137) % 360; // Golden angle distribution for varied starting points

    // Border colors for light and dark mode (default to dark mode colors during SSR)
    const isDark = !mounted || resolvedTheme === "dark";
    const borderColor = isDark
        ? "rgba(255,255,255,0.8)"
        : "rgba(80,80,80,0.9)";
    const borderColorBright = isDark
        ? "white"
        : "rgba(50,50,50,1)";

    const CardContent = (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative h-full flex items-center justify-center"
        >
            {/* Animated border container */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                {/* Spinning line */}
                <motion.div
                    className="absolute w-[200%] h-[200%] top-[-55%] left-[-55%]"
                    style={{
                        background: `conic-gradient(from ${randomStartAngle}deg, transparent 0%, transparent 85%, ${borderColor} 90%, ${borderColorBright} 95%, ${borderColor} 97%, transparent 100%)`
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: randomDuration,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </div>

            {/* Static border fallback */}
            <div className="absolute inset-0 rounded-2xl border border-border/30 pointer-events-none" />

            {/* Card content with solid background */}
            <div className="relative h-[calc(100%-2px)] mx-px p-6 rounded-[14px] bg-card backdrop-blur-sm transition-all duration-300">
                {/* Icon */}
                <div className="relative mb-4">
                    <Icon className={`relative h-10 w-10 ${iconColor} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                </div>

                {/* Title with link arrow */}
                <h3 className="relative text-lg font-semibold mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {name}
                    {link && (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    )}
                </h3>

                {/* Description */}
                <p className="relative text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </motion.div>
    );

    if (link) {
        return (
            <Link href={link} target="_blank" rel="noopener noreferrer" className="block h-full">
                {CardContent}
            </Link>
        );
    }

    return CardContent;
}

export function PoweredBy() {
    return (
        <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-6">
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                        Built on a foundation of{" "}
                        <span className="text-primary">secure</span>,{" "}
                        <span className="text-primary">decentralized</span> tech
                    </h2>
                </motion.div>

                {/* Circuit diagram with Powered By badge */}
                <div className="relative h-48 md:h-56 mb-16">
                    <CircuitLines />

                    {/* Central "Powered By" chip */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="relative">
                            {/* Chip border */}
                            <div className="absolute -inset-3 border border-border rounded-lg" />
                            <div className="absolute -inset-6 border border-border/80 rounded-xl" />

                            {/* Chip pins - top */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-3 bg-primary/50 rounded-full" />
                                ))}
                            </div>

                            {/* Chip pins - bottom */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-3 bg-primary/50 rounded-full" />
                                ))}
                            </div>

                            {/* Main badge */}
                            <div className="px-6 py-3 bg-card border border-border rounded-lg shadow-2xl">
                                <span className="text-sm font-medium text-muted-foreground">Powered By</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Primary tech cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    {poweredByTech.map((tech, index) => (
                        <TechCard key={tech.name} {...tech} index={index} />
                    ))}
                </div>

                {/* Secondary tech cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {additionalTech.map((tech, index) => (
                        <TechCard key={tech.name} {...tech} index={index + 3} />
                    ))}
                </div>
            </div>
        </section>
    );
}
