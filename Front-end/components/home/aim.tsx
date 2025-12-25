"use client";

import React, { useRef, useState, useEffect } from "react";
import { Lock, Shield, Eye, FileCheck, Users, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { TextEffect } from "@/components/ui/text-effect";

const features = [
    {
        icon: Lock,
        title: "Uncompromising Privacy",
        description: "We use advanced encryption and anonymous blockchain submission to ensure your identity remains protected at all times.",
    },
    {
        icon: Shield,
        title: "Immutable Truth",
        description: "By leveraging the Hedera Hashgraph, we guarantee that once a record is submitted, it cannot be altered or deleted by anyone, including us.",
    },
    {
        icon: Eye,
        title: "Transparency First",
        description: "Our public feed allows the community to verify that complaints are being heard, creating a culture of accountability.",
    },
    {
        icon: FileCheck,
        title: "Verifiable Evidence",
        description: "Uploaded evidence is secured on decentralized storage (IPFS), ensuring that proof of misconduct is never lost or tampered with.",
    },
    {
        icon: Users,
        title: "Empowering Authorities",
        description: "We provide tools for authorities to efficiently manage and investigate valid complaints while filtering out spam.",
    },
    {
        icon: BarChart3,
        title: "Data-Driven Change",
        description: "Aggregated statistics help identify systemic issues and trends, enabling policymakers to make informed decisions.",
    },
];

function FeatureCard({
    feature,
    index,
    mousePosition
}: {
    feature: typeof features[0];
    index: number;
    mousePosition: { x: number; y: number };
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [relativePosition, setRelativePosition] = useState({ x: 0, y: 0 });
    const [isNear, setIsNear] = useState(false);

    useEffect(() => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = mousePosition.x - rect.left;
        const y = mousePosition.y - rect.top;

        // Check if mouse is within 10000px of the card
        const padding = 10000;
        const isNearCard =
            mousePosition.x >= rect.left - padding &&
            mousePosition.x <= rect.right + padding &&
            mousePosition.y >= rect.top - padding &&
            mousePosition.y <= rect.bottom + padding;

        setRelativePosition({ x, y });
        setIsNear(isNearCard);
    }, [mousePosition]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
            }}
            className="group relative h-full"
        >
            {/* Card content with solid background - rendered first (below) */}
            <div className="relative h-full rounded-xl bg-card backdrop-blur-sm p-6 transition-all duration-300 border-black/10 border">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                </p>
            </div>

            {/* Static border */}
            <div className="absolute inset-0 rounded-xl border border-border/30 pointer-events-none" />

            {/* Border highlight effect - only shows on the border, not inside */}
            <div
                className="absolute inset-[-3px] rounded-xl pointer-events-none transition-opacity duration-200"
                style={{
                    opacity: isNear ? 1 : 0,
                    background: `radial-gradient(600px circle at ${relativePosition.x + 3}px ${relativePosition.y + 3}px, rgba(168, 85, 247, 1), transparent 40%)`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                    padding: "3px",
                }}
            />
        </motion.div>
    );
}

export function Aim() {
    const sectionRef = useRef<HTMLElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <section ref={sectionRef} className="py-16 md:py-24 relative bg-background/30">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        <TextEffect per="word" preset="blur" speedReveal={2}>
                            Our Mission &
                        </TextEffect>{" "}
                        <TextEffect per="word" preset="fade-in-blur" delay={0.3} speedReveal={2} className="text-primary inline">
                            Vision
                        </TextEffect>
                    </h2>
                    <TextEffect
                        per="word"
                        preset="slide"
                        delay={0.5}
                        speedReveal={3}
                        as="p"
                        className="mt-4 text-muted-foreground max-w-2xl mx-auto"
                    >
                        Sawtak aims to empower citizens to speak up against misconduct without fear. We believe in transparency, integrity, and the right to safety.
                    </TextEffect>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, i) => (
                        <FeatureCard
                            key={feature.title}
                            feature={feature}
                            index={i}
                            mousePosition={mousePosition}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
