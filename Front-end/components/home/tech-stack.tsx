"use client";

import React from "react";
import { Server, Database, Lock, Globe, Zap, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { TiltCard, StaggerContainer, StaggerItem } from "@/components/parallax-effects";

export function TechStack() {
    const stack = [
        {
            name: "Hedera Hashgraph",
            role: "Blockchain Layer",
            icon: Lock,
            description: "High-performance distributed ledger technology for immutable record-keeping."
        },
        {
            name: "Next.js 14",
            role: "Frontend Framework",
            icon: Globe,
            description: "React framework for a fast, responsive, and SEO-friendly user interface."
        },
        {
            name: "Bun & Elysia",
            role: "Backend Runtime",
            icon: Zap,
            description: "Blazing fast JavaScript runtime and framework for high-performance API handling."
        },
        {
            name: "IPFS",
            role: "Decentralized Storage",
            icon: Server,
            description: "InterPlanetary File System for censorship-resistant evidence storage."
        },
        {
            name: "PostgreSQL",
            role: "Data Indexing",
            icon: Database,
            description: "Robust relational database for querying and indexing blockchain data."
        },
        {
            name: "Haweya",
            role: "Identity Provider",
            icon: Cpu,
            description: "National ID integration for verified (identified) submission mode."
        }
    ];

    return (
        <section className="py-16 md:py-24 border-y border-border/50 relative bg-background/50">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        Built with <span className="text-primary">Modern Tech</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        Leveraging the latest in Web3 and high-performance computing to ensure speed, security, and scalability.
                    </p>
                </motion.div>

                <StaggerContainer
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    staggerDelay={0.1}
                >
                    {stack.map((tech) => (
                        <StaggerItem key={tech.name}>
                            <TiltCard className="h-full">
                                <div className="flex items-start space-x-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all duration-300 h-full">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <tech.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{tech.name}</h3>
                                        <p className="text-xs font-mono text-primary/80 mb-1">{tech.role}</p>
                                        <p className="text-sm text-muted-foreground">{tech.description}</p>
                                    </div>
                                </div>
                            </TiltCard>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}

