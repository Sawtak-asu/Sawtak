"use client";

import React from "react";
import { Marquee } from "@/components/ui/marquee";
import { Server, Database, Lock, Globe, Zap, Cpu, Shield, FileCode, Cloud, Fingerprint } from "lucide-react";

const technologies = [
    { name: "Sawtak Blockchain", icon: Lock, color: "text-purple-500" },
    { name: "Next.js", icon: Globe, color: "text-white" },
    { name: "Bun Runtime", icon: Zap, color: "text-amber-400" },
    { name: "IPFS", icon: Cloud, color: "text-cyan-400" },
    { name: "PostgreSQL", icon: Database, color: "text-blue-400" },
    { name: "Haweya", icon: Fingerprint, color: "text-green-400" },
    { name: "AES-256", icon: Shield, color: "text-red-400" },
    { name: "TypeScript", icon: FileCode, color: "text-blue-500" },
    { name: "Elysia", icon: Server, color: "text-pink-400" },
    { name: "React 19", icon: Cpu, color: "text-cyan-500" },
];

function TechCard({ name, icon: Icon, color }: { name: string; icon: typeof Lock; color: string }) {
    return (
        <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/30 transition-all duration-300 group">
            <Icon className={`h-5 w-5 ${color} group-hover:scale-110 transition-transform`} />
            <span className="font-medium text-sm whitespace-nowrap">{name}</span>
        </div>
    );
}

export function TechMarquee() {
    return (
        <section className="py-12 border-y border-border/50 relative bg-background/50 overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="space-y-4">
                {/* First row - normal direction */}
                <Marquee pauseOnHover speed="slow" className="py-2">
                    {technologies.map((tech) => (
                        <TechCard key={tech.name} {...tech} />
                    ))}
                </Marquee>

                {/* Second row - reverse direction */}
                <Marquee pauseOnHover speed="slow" reverse className="py-2">
                    {technologies.map((tech) => (
                        <TechCard key={tech.name} {...tech} />
                    ))}
                </Marquee>
            </div>
        </section>
    );
}
