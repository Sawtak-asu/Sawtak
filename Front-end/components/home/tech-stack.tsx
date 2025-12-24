"use client";

import React from "react";
import { Server, Database, Lock, Globe, Zap, Cpu } from "lucide-react";

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
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        Built with <span className="text-primary">Modern Tech</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        Leveraging the latest in Web3 and high-performance computing to ensure speed, security, and scalability.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stack.map((tech) => (
                        <div key={tech.name} className="flex items-start space-x-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <tech.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{tech.name}</h3>
                                <p className="text-xs font-mono text-primary/80 mb-1">{tech.role}</p>
                                <p className="text-sm text-muted-foreground">{tech.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
