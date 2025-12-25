"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { GridBackground } from "@/components/grid-background";
import FooterSection from "@/components/footer";
import Link from "next/link";
import {
    Shield,
    Lock,
    Eye,
    Database,
    Globe,
    FileText,
    Mail,
    Clock,
    AlertTriangle,
    CheckCircle,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PrivacyPolicyPage() {
    const [activeSection, setActiveSection] = React.useState("introduction");

    const sections = [
        { id: "introduction", title: "Introduction", icon: FileText },
        { id: "data-collection", title: "Data We Collect", icon: Database },
        { id: "anonymous-mode", title: "Anonymous Mode", icon: Eye },
        { id: "identified-mode", title: "Identified Mode", icon: Shield },
        { id: "data-security", title: "Data Security", icon: Lock },
        { id: "data-retention", title: "Data Retention", icon: Clock },
        { id: "blockchain", title: "Blockchain & Immutability", icon: Globe },
        { id: "your-rights", title: "Your Rights", icon: CheckCircle },
        { id: "third-parties", title: "Third Parties", icon: AlertTriangle },
        { id: "contact", title: "Contact Us", icon: Mail },
    ];

    // Scroll spy: update active section based on scroll position
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: "-20% 0px -70% 0px", // Trigger when section is in the upper third of viewport
                threshold: 0,
            }
        );

        // Observe all sections
        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            sections.forEach((section) => {
                const element = document.getElementById(section.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const lastUpdated = "December 25, 2024";

    return (
        <GridBackground>
            <Navbar />

            <div className="container max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-64 shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="hidden lg:block">
                                <h3 className="font-semibold text-lg mb-4 px-4 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Privacy Policy
                                </h3>
                                <nav className="space-y-1">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                                activeSection === section.id
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <section.icon className="h-4 w-4" />
                                            {section.title}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                                <h4 className="font-medium text-sm mb-2">Last Updated</h4>
                                <p className="text-sm text-muted-foreground">{lastUpdated}</p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="space-y-16">

                            {/* Header */}
                            <div className="border-b border-border/50 pb-8">
                                <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                                <p className="text-xl text-muted-foreground">
                                    Your privacy is at the core of everything we build. This policy explains how Sawtak handles your data.
                                </p>
                            </div>

                            {/* Introduction */}
                            <section id="introduction" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <FileText className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Introduction</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-lg leading-relaxed text-muted-foreground">
                                        Sawtak ("we," "our," or "us") is a secure whistleblowing platform designed to enable individuals to report misconduct while maintaining complete anonymity or controlled identification.
                                    </p>
                                    <p className="text-muted-foreground">
                                        This Privacy Policy describes how we collect, use, store, and protect your information when you use the Sawtak platform. We are committed to transparency and want you to understand exactly what happens with your data.
                                    </p>
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-primary" />
                                            Our Core Privacy Principles
                                        </h4>
                                        <ul className="space-y-2 text-muted-foreground text-sm">
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Anonymity by Design:</strong> Anonymous complaints never require or collect personal identification.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Minimal Data Collection:</strong> We only collect what is strictly necessary for the platform to function.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Encryption First:</strong> All sensitive data is encrypted using military-grade AES-256 encryption.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Transparency:</strong> Blockchain verification ensures complaint integrity without compromising privacy.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Data We Collect */}
                            <section id="data-collection" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Database className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Data We Collect</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none">
                                    <p className="text-muted-foreground">
                                        The data we collect depends on how you choose to use Sawtak. We offer two distinct modes: <strong>Anonymous Mode</strong> and <strong>Identified Mode</strong>.
                                    </p>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-purple-500" />
                                            Anonymous Complaints
                                        </h3>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Complaint content and category</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>General location (governorate level only)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Attached evidence files (encrypted)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>Unique tracking code</span>
                                            </li>
                                        </ul>
                                        <div className="mt-4 p-3 bg-green-500/10 rounded-lg text-xs text-green-700 dark:text-green-400">
                                            <strong>We do NOT collect:</strong> IP addresses, browser fingerprints, device identifiers, or any personal information.
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-blue-500" />
                                            Identified Complaints
                                        </h3>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span>Everything in Anonymous mode, plus:</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span>Name (as provided during login)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span>Email address (for communication)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span>Authentication provider data (Google/National ID)</span>
                                            </li>
                                        </ul>
                                        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                                            <strong>All personal data is encrypted</strong> with AES-256 and only accessible to authorized administrators.
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Anonymous Mode */}
                            <section id="anonymous-mode" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Eye className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Anonymous Mode</h2>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm space-y-6">
                                    <p className="text-muted-foreground">
                                        When you submit an anonymous complaint, Sawtak implements multiple layers of privacy protection:
                                    </p>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">No IP Logging</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Our servers are configured to not log IP addresses for anonymous submissions. We use a privacy proxy that strips identifying metadata before the request reaches our application server.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">No Browser Fingerprinting</h4>
                                            <p className="text-sm text-muted-foreground">
                                                We do not use browser fingerprinting techniques. No cookies, local storage tokens, or device identifiers are stored for anonymous users.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">No Account Required</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Anonymous complaints can be submitted without creating an account or providing any personal information whatsoever.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">Tracking Code Only</h4>
                                            <p className="text-sm text-muted-foreground">
                                                You receive a unique tracking code that is the only link between you and your complaint. Keep it safe—we cannot recover it.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                            <strong>Important:</strong> Anonymous complaints are published to the public feed and recorded on the blockchain. While your identity is protected, the complaint content (category and general details) is publicly visible for transparency.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Identified Mode */}
                            <section id="identified-mode" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Shield className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Identified Mode</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-muted-foreground">
                                        When you choose to submit an identified complaint, you provide additional personal information that allows authorities to follow up with you directly.
                                    </p>
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6 not-prose">
                                        <h4 className="font-medium mb-4">How Your Data is Protected</h4>
                                        <ul className="space-y-4 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">1</span>
                                                <span>Your personal data is <strong>encrypted using AES-256-GCM</strong> before being stored in our database.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">2</span>
                                                <span>Encryption keys are managed through a <strong>secure key management system</strong> with strict access controls.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">3</span>
                                                <span>Only <strong>authorized administrators</strong> can decrypt and view your identity, and all access is logged.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">4</span>
                                                <span>Identified complaints are <strong>not publicly visible</strong>—only status updates (without personal details) may appear.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Data Security */}
                            <section id="data-security" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Lock className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Data Security</h2>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                                    <div className="grid gap-8 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-foreground">Encryption at Rest</h3>
                                            <p className="text-sm text-muted-foreground">
                                                All sensitive data stored in our PostgreSQL database is encrypted using AES-256-GCM. Database backups are also encrypted and stored securely.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-foreground">Encryption in Transit</h3>
                                            <p className="text-sm text-muted-foreground">
                                                All communications between your browser and our servers use TLS 1.3. We enforce HTTPS and implement HSTS to prevent downgrade attacks.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-foreground">Access Controls</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Administrative access is restricted through role-based access control (RBAC). All access to sensitive data is logged and audited.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Data Retention */}
                            <section id="data-retention" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Clock className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Data Retention</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <div className="grid gap-4 not-prose">
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">Anonymous Complaints</h3>
                                            <p className="text-muted-foreground">
                                                Anonymous complaints are stored indefinitely as they are part of the public record and recorded on the blockchain. The blockchain record is permanent and cannot be deleted.
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">Identified Complaints</h3>
                                            <p className="text-muted-foreground">
                                                Identified complaint data is retained for up to <strong>5 years</strong> after the complaint is resolved, or as required by applicable law. You may request early deletion in certain circumstances (see "Your Rights").
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">Evidence Files</h3>
                                            <p className="text-muted-foreground">
                                                Evidence files uploaded to IPFS are encrypted and may persist on the network indefinitely due to the decentralized nature of IPFS. However, without the decryption key, these files are inaccessible.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Blockchain & Immutability */}
                            <section id="blockchain" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Globe className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Blockchain & Immutability</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-muted-foreground">
                                        Sawtak uses the <strong>Hedera Consensus Service (HCS)</strong> to create an immutable audit trail of anonymous complaints.
                                    </p>
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6 not-prose">
                                        <h4 className="font-medium mb-4">What is published to the blockchain:</h4>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>A <strong>cryptographic hash</strong> of the complaint content (not the content itself)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>Category of the complaint (e.g., corruption, harassment)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>General location (governorate level)</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>Consensus timestamp (when the complaint was recorded)</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg not-prose">
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            <strong>Important:</strong> Data published to the blockchain <strong>cannot be deleted or modified</strong> by anyone, including Sawtak administrators. This is by design to ensure the integrity and trustworthiness of the platform.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Your Rights */}
                            <section id="your-rights" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <CheckCircle className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Your Rights</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none">
                                    <p className="text-muted-foreground">
                                        Depending on your jurisdiction, you may have certain rights regarding your personal data:
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                        <h3 className="font-medium text-lg mb-2">For Identified Users</h3>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Access:</strong> Request a copy of your personal data</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Rectification:</strong> Correct inaccurate personal data</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Erasure:</strong> Request deletion (with limitations)</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span><strong>Portability:</strong> Receive data in a portable format</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                        <h3 className="font-medium text-lg mb-2">For Anonymous Users</h3>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <span>Since we do not collect personal data for anonymous submissions, we cannot verify your identity to process data requests.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <span>Anonymous complaints cannot be deleted due to blockchain immutability.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Third Parties */}
                            <section id="third-parties" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <AlertTriangle className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Third Parties</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-muted-foreground">
                                        We work with a limited number of third-party services essential to platform operation:
                                    </p>
                                    <div className="grid gap-4 not-prose">
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">Hedera Hashgraph</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Public blockchain network for recording complaint hashes. Data published is intentionally public for verification purposes.
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">Cloudflare R2 / IPFS</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Encrypted evidence storage. Files are encrypted before upload; the storage provider cannot access the content.
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">Authentication Providers</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Google OAuth and Haweya (National ID) for identified logins. We receive only basic profile information (name, email) necessary for account creation.
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground">
                                        We do not sell, rent, or share your personal data with advertisers or data brokers.
                                    </p>
                                </div>
                            </section>

                            {/* Contact Us */}
                            <section id="contact" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Mail className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">Contact Us</h2>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                                    <p className="text-muted-foreground mb-6">
                                        If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <h4 className="font-medium text-sm mb-2">Email</h4>
                                            <a href="mailto:privacy@sawtak.org" className="text-primary hover:underline">
                                                63ahmedkhaled@gmail.com
                                            </a>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <h4 className="font-medium text-sm mb-2">Response Time</h4>
                                            <p className="text-sm text-muted-foreground">
                                                We aim to respond to all privacy-related inquiries within 30 days.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Changes to Policy */}
                            <section className="scroll-mt-24 space-y-6 border-t border-border/50 pt-12">
                                <h2 className="text-xl font-semibold">Changes to This Policy</h2>
                                <p className="text-muted-foreground">
                                    We may update this Privacy Policy from time to time. When we make significant changes, we will notify users through a prominent notice on the platform. We encourage you to review this policy periodically.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Last updated:</strong> {lastUpdated}
                                </p>
                            </section>

                            {/* Back to Home */}
                            <div className="border-t border-border/50 pt-12 mt-12 mb-12">
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/"
                                        className="text-primary hover:underline inline-flex items-center gap-2"
                                    >
                                        ← Back to Home
                                    </Link>
                                    <span className="hidden sm:inline text-muted-foreground">•</span>
                                    <Link
                                        href="/docs"
                                        className="text-primary hover:underline inline-flex items-center gap-2"
                                    >
                                        View Documentation
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </main>

                    {/* Right side TOC (Desktop) */}
                    <div className="hidden xl:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <h4 className="font-medium text-sm mb-4 text-muted-foreground">On this page</h4>
                            <nav className="space-y-2 border-l border-border/50">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "block w-full text-left pl-4 py-1 text-sm border-l-2 -ml-[2px] transition-colors",
                                            activeSection === section.id
                                                ? "border-primary text-primary font-medium"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                </div>
            </div>
            <FooterSection />
        </GridBackground>
    );
}
