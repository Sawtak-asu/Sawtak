"use client";

import React, { useEffect, useState } from "react";
import { Activity, Shield, Database, Lock, Globe, Server, Cpu } from "lucide-react";
import { motion, useSpring, useTransform } from "motion/react";

// Simulated data stream component
const DataStream = () => {
    const [stream, setStream] = useState<string[]>([]);

    useEffect(() => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%$&";
        const interval = setInterval(() => {
            setStream(prev => {
                const newLines = [...prev, `TX_HASH: 0.0.${Math.floor(Math.random() * 99999)}...${chars[Math.floor(Math.random() * chars.length)]}`];
                if (newLines.length > 5) newLines.shift();
                return newLines;
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-[10px] text-primary/60 leading-tight opacity-50 select-none">
            {stream.map((line, i) => (
                <div key={i}>{line}</div>
            ))}
        </div>
    );
};

export function LiveStats() {
    const [counter, setCounter] = useState(1240);

    useEffect(() => {
        // Simulate live counter ticking
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setCounter(c => c + 1);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 relative overflow-hidden bg-zinc-950 text-white border-y border-zinc-900">
            {/* Background World Map / Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-900/40 via-zinc-950 to-zinc-950" />
                <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="mx-auto max-w-7xl px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justified-between mb-12 gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-green-500 mb-2 animate-pulse">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs font-mono uppercase tracking-widest">System Online</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                            Transparency <span className="text-zinc-500">Monitor</span>
                        </h2>
                        <p className="mt-4 text-zinc-400 max-w-xl">
                            Real-time metrics from the Sawtak Blockchain network.
                            Verifiable proof that the platform is active and secure.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-md">
                            <div className="text-xs text-zinc-500 mb-2 font-mono">LIVE FEED</div>
                            <DataStream />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat Card 1: Total Reports */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group relative p-6 bg-zinc-900/40 border border-zinc-800 hover:border-primary/50 rounded-2xl transition-all"
                    >
                        <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-8">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Shield className="w-6 h-6" />
                            </div>
                            <Activity className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="text-4xl font-mono font-bold tracking-tighter mb-1">
                            {counter.toLocaleString()}
                        </div>
                        <div className="text-sm text-zinc-500">
                            Complaints Secured
                        </div>
                    </motion.div>

                    {/* Stat Card 2: Blockchain Transactions */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group relative p-6 bg-zinc-900/40 border border-zinc-800 hover:border-primary/50 rounded-2xl transition-all"
                    >
                        <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-8">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Globe className="w-6 h-6" />
                            </div>
                            <Cpu className="w-4 h-4 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                        </div>

                        <div className="text-4xl font-mono font-bold tracking-tighter mb-1 flex items-center gap-2">
                            2.4s
                            <span className="text-xs font-sans font-normal text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Avg Time</span>
                        </div>
                        <div className="text-sm text-zinc-500">
                            Consensus Latency
                        </div>
                    </motion.div>

                    {/* Stat Card 3: Storage */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group relative p-6 bg-zinc-900/40 border border-zinc-800 hover:border-primary/50 rounded-2xl transition-all"
                    >
                        <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-8">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                <Database className="w-6 h-6" />
                            </div>
                            <Server className="w-4 h-4 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                        </div>

                        <div className="text-4xl font-mono font-bold tracking-tighter mb-1">
                            100%
                        </div>
                        <div className="text-sm text-zinc-500">
                            Uptime (last 90d)
                        </div>
                    </motion.div>

                    {/* Stat Card 4: Encryption */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group relative p-6 bg-zinc-900/40 border border-zinc-800 hover:border-primary/50 rounded-2xl transition-all"
                    >
                        <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-8">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <Lock className="w-6 h-6" />
                            </div>
                            <Shield className="w-4 h-4 text-zinc-600 group-hover:text-green-500 transition-colors" />
                        </div>

                        <div className="text-4xl font-mono font-bold tracking-tighter mb-1">
                            AES-256
                        </div>
                        <div className="text-sm text-zinc-500">
                            Encryption Standard
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
