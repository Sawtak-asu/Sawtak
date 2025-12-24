"use client";

import React from "react";
import { Lock, Shield, Eye, FileCheck, Users, BarChart3 } from "lucide-react";

export function Aim() {
    return (
        <section className="py-16 md:py-24 relative bg-background/30">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        Our Mission & <span className="text-primary">Vision</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        Sawtak aims to empower citizens to speak up against misconduct without fear.
                        We believe in transparency, integrity, and the right to safety.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
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
                    ].map((feature, i) => (
                        <div
                            key={feature.title}
                            className="group relative rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1"
                        >
                            {/* Corner accent */}
                            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-primary/10 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <feature.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">{feature.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
