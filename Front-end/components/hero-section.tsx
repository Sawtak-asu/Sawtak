"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Lock, Eye, FileCheck, Users, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "./navbar";
import { GridBackground } from "@/components/grid-background";

export default function HeroSection() {
  return (
    <GridBackground>
      <HeroHeader />
      <main className="overflow-hidden relative">
        <section className="relative pt-24 md:pt-36 pb-16 md:pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              {/* Badge with subtle animation */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground shadow-sm hover:border-primary/30 transition-colors">
                <Shield className="h-4 w-4 text-primary" />
                <span>Blockchain-Secured Reporting</span>
                <Sparkles className="h-3 w-3 text-primary/60" />
              </div>

              {/* Main Heading with highlight */}
              <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="relative">
                  Speak Up.
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 200 10" preserveAspectRatio="none">
                    <path d="M0 5 Q50 0 100 5 T200 5" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </span>{" "}
                <span className="text-muted-foreground">Stay Safe.</span>
              </h1>

              {/* Subheading */}
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                A secure whistleblowing platform with <span className="text-foreground font-medium">blockchain-backed integrity</span>. 
                Report misconduct anonymously with cryptographic proof of your submission.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-8 text-base group shadow-lg shadow-primary/20">
                  <Link href="/file-complaint">
                    File a Complaint
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-background/80">
                  <Link href="/feed">
                    View Public Feed
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <Link href="/docs#security" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse group-hover/indicator:scale-125 transition-transform" />
                  <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-green-500">256-bit Encrypted</span>
                </Link>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <Link href="/docs#blockchain" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                  <div className="h-2 w-2 rounded-full bg-blue-500 group-hover/indicator:scale-125 transition-transform" />
                  <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-blue-500">Hedera Blockchain</span>
                </Link>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <Link href="/docs#overview" className="flex items-center gap-2 hover:text-foreground transition-colors group/indicator">
                  <div className="h-2 w-2 rounded-full bg-purple-500 group-hover/indicator:scale-125 transition-transform" />
                  <span className="underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 hover:decoration-purple-500">Anonymous</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section with cards */}
        <section className="border-y border-border/50 py-12 relative bg-background/30 backdrop-blur-sm">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { value: "100%", label: "Anonymous", icon: Lock },
                { value: "256-bit", label: "Encryption", icon: Shield },
                { value: "Hedera", label: "Blockchain", icon: BarChart3 },
                { value: "24/7", label: "Available", icon: Eye },
              ].map((stat, i) => (
                <div 
                  key={stat.label} 
                  className="group relative bg-background/40 backdrop-blur-md rounded-xl border border-border/50 p-4 text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary/60 group-hover:text-primary transition-colors" />
                  <p className="text-2xl font-semibold md:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-24 relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold md:text-4xl">
                Why Choose <span className="text-primary">Sawtak</span>?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Built with privacy and transparency at its core
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: "End-to-End Encryption",
                  description: "Your identity is encrypted with AES-256 before being stored. Only authorized personnel can access sensitive information.",
                },
                {
                  icon: Shield,
                  title: "Blockchain Immutability",
                  description: "Anonymous complaints are recorded on Hedera's distributed ledger, creating an immutable and tamper-proof audit trail.",
                },
                {
                  icon: Eye,
                  title: "Public Transparency",
                  description: "Browse the public feed to see reported complaints and their status. Full transparency without compromising anonymity.",
                },
                {
                  icon: FileCheck,
                  title: "Dual Submission Modes",
                  description: "Choose anonymous blockchain submission for maximum privacy, or identified submission for direct follow-up capability.",
                },
                {
                  icon: Users,
                  title: "Secure Administration",
                  description: "Authorized administrators can investigate and manage complaints through a secure, role-based access portal.",
                },
                {
                  icon: BarChart3,
                  title: "Track Your Complaint",
                  description: "Use your unique tracking code to monitor the status of your anonymous complaint without revealing your identity.",
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

        {/* CTA Section */}
        <section className="border-t border-border/50 py-16 md:py-24 relative overflow-hidden bg-background/30 backdrop-blur-sm">
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 rotate-3 hover:rotate-0 transition-transform shadow-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Your voice matters. Report misconduct safely and help build a more 
              transparent and accountable society.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base group shadow-lg shadow-primary/20">
                <Link href="/file-complaint">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/50 hover:bg-background/80">
                <Link href="/track">
                  Track a Complaint
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </GridBackground>
  );
}
