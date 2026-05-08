"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { GridBackground } from "@/components/grid-background";
import FooterSection from "@/components/footer";
import { Link } from "@/i18n/navigation";
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
import { useTranslations } from "next-intl";

export default function PrivacyPolicyPage() {
    const [activeSection, setActiveSection] = React.useState("introduction");
    const t = useTranslations("PrivacyPolicy");

    const sections = [
        { id: "introduction", title: t("sections.introduction"), icon: FileText },
        { id: "data-collection", title: t("sections.dataCollection"), icon: Database },
        { id: "anonymous-mode", title: t("sections.anonymousMode"), icon: Eye },
        { id: "identified-mode", title: t("sections.identifiedMode"), icon: Shield },
        { id: "data-security", title: t("sections.dataSecurity"), icon: Lock },
        { id: "data-retention", title: t("sections.dataRetention"), icon: Clock },
        { id: "blockchain", title: t("sections.blockchain"), icon: Globe },
        { id: "your-rights", title: t("sections.yourRights"), icon: CheckCircle },
        { id: "third-parties", title: t("sections.thirdParties"), icon: AlertTriangle },
        { id: "contact", title: t("sections.contact"), icon: Mail },
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
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0,
            }
        );

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

    return (
        <GridBackground>
            <Navbar />

            <div className="container max-w-7xl mx-auto px-6 py-12" dir="ltr">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-64 shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="hidden lg:block">
                                <h3 className="font-semibold text-lg mb-4 px-4 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    {t("sidebarTitle")}
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
                                <h4 className="font-medium text-sm mb-2">{t("lastUpdated")}</h4>
                                <p className="text-sm text-muted-foreground">{t("lastUpdatedDate")}</p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="space-y-16">

                            {/* Header */}
                            <div className="border-b border-border/50 pb-8">
                                <h1 className="text-4xl font-bold tracking-tight mb-4">{t("pageTitle")}</h1>
                                <p className="text-xl text-muted-foreground">
                                    {t("pageSubtitle")}
                                </p>
                            </div>

                            {/* Introduction */}
                            <section id="introduction" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <FileText className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.introduction")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-lg leading-relaxed text-muted-foreground">
                                        {t("introduction.p1")}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {t("introduction.p2")}
                                    </p>
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-primary" />
                                            {t("introduction.principlesTitle")}
                                        </h4>
                                        <ul className="space-y-2 text-muted-foreground text-sm">
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("introduction.principle1Title")}</strong> {t("introduction.principle1")}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("introduction.principle2Title")}</strong> {t("introduction.principle2")}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("introduction.principle3Title")}</strong> {t("introduction.principle3")}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("introduction.principle4Title")}</strong> {t("introduction.principle4")}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Data We Collect */}
                            <section id="data-collection" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Database className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.dataCollection")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none">
                                    <p className="text-muted-foreground">
                                        {t("dataCollection.intro")}
                                    </p>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-purple-500" />
                                            {t("dataCollection.anonymousTitle")}
                                        </h3>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.anonymous1")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.anonymous2")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.anonymous3")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.anonymous4")}</span>
                                            </li>
                                        </ul>
                                        <div className="mt-4 p-3 bg-green-500/10 rounded-lg text-xs text-green-700 dark:text-green-400">
                                            <strong>{t("dataCollection.anonymousNote")}</strong>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-blue-500" />
                                            {t("dataCollection.identifiedTitle")}
                                        </h3>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.identified1")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.identified2")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.identified3")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                <span>{t("dataCollection.identified4")}</span>
                                            </li>
                                        </ul>
                                        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-xs text-blue-700 dark:text-blue-400">
                                            <strong>{t("dataCollection.identifiedNote")}</strong>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Anonymous Mode */}
                            <section id="anonymous-mode" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Eye className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.anonymousMode")}</h2>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm space-y-6">
                                    <p className="text-muted-foreground">
                                        {t("anonymousMode.intro")}
                                    </p>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">{t("anonymousMode.noIpTitle")}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {t("anonymousMode.noIpDesc")}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">{t("anonymousMode.noFingerprintTitle")}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {t("anonymousMode.noFingerprintDesc")}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">{t("anonymousMode.noAccountTitle")}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {t("anonymousMode.noAccountDesc")}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-foreground">{t("anonymousMode.trackingTitle")}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {t("anonymousMode.trackingDesc")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                            <strong>{t("anonymousMode.important")}</strong>
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Identified Mode */}
                            <section id="identified-mode" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Shield className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.identifiedMode")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-muted-foreground">
                                        {t("identifiedMode.intro")}
                                    </p>
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6 not-prose">
                                        <h4 className="font-medium mb-4">{t("identifiedMode.protectionTitle")}</h4>
                                        <ul className="space-y-4 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">1</span>
                                                <span>{t("identifiedMode.step1")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">2</span>
                                                <span>{t("identifiedMode.step2")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">3</span>
                                                <span>{t("identifiedMode.step3")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">4</span>
                                                <span>{t("identifiedMode.step4")}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Data Security */}
                            <section id="data-security" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Lock className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.dataSecurity")}</h2>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                                    <div className="grid gap-8 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-foreground">{t("dataSecurity.atRestTitle")}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("dataSecurity.atRestDesc")}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-foreground">{t("dataSecurity.inTransitTitle")}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("dataSecurity.inTransitDesc")}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-foreground">{t("dataSecurity.accessTitle")}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("dataSecurity.accessDesc")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Data Retention */}
                            <section id="data-retention" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Clock className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.dataRetention")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <div className="grid gap-4 not-prose">
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">{t("dataRetention.anonymousTitle")}</h3>
                                            <p className="text-muted-foreground">
                                                {t("dataRetention.anonymousDesc")}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">{t("dataRetention.identifiedTitle")}</h3>
                                            <p className="text-muted-foreground">
                                                {t("dataRetention.identifiedDesc")}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">{t("dataRetention.evidenceTitle")}</h3>
                                            <p className="text-muted-foreground">
                                                {t("dataRetention.evidenceDesc")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Blockchain & Immutability */}
                            <section id="blockchain" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Globe className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.blockchain")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-muted-foreground">
                                        {t("blockchain.intro")}
                                    </p>
                                    <div className="rounded-xl border border-border/50 bg-card/50 p-6 not-prose">
                                        <h4 className="font-medium mb-4">{t("blockchain.publishedTitle")}</h4>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>{t("blockchain.published1")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>{t("blockchain.published2")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>{t("blockchain.published3")}</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>{t("blockchain.published4")}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg not-prose">
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            <strong>{t("blockchain.important")}</strong>
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Your Rights */}
                            <section id="your-rights" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <CheckCircle className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.yourRights")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none">
                                    <p className="text-muted-foreground">
                                        {t("yourRights.intro")}
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                        <h3 className="font-medium text-lg mb-2">{t("yourRights.identifiedTitle")}</h3>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("yourRights.accessTitle")}</strong> {t("yourRights.access")}</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("yourRights.rectificationTitle")}</strong> {t("yourRights.rectification")}</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("yourRights.erasureTitle")}</strong> {t("yourRights.erasure")}</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span><strong>{t("yourRights.portabilityTitle")}</strong> {t("yourRights.portability")}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                        <h3 className="font-medium text-lg mb-2">{t("yourRights.anonymousTitle")}</h3>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                <span>{t("yourRights.anonymous1")}</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                <span>{t("yourRights.anonymous2")}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Third Parties */}
                            <section id="third-parties" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <AlertTriangle className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.thirdParties")}</h2>
                                </div>
                                <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                                    <p className="text-muted-foreground">
                                        {t("thirdParties.intro")}
                                    </p>
                                    <div className="grid gap-4 not-prose">
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">{t("thirdParties.blockchainTitle")}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("thirdParties.blockchainDesc")}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">{t("thirdParties.storageTitle")}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("thirdParties.storageDesc")}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                                            <h3 className="font-medium text-lg mb-2">{t("thirdParties.authTitle")}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("thirdParties.authDesc")}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground">
                                        {t("thirdParties.noSelling")}
                                    </p>
                                </div>
                            </section>

                            {/* Contact Us */}
                            <section id="contact" className="scroll-mt-24 space-y-6">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Mail className="h-6 w-6" />
                                    <h2 className="text-2xl font-semibold">{t("sections.contact")}</h2>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                                    <p className="text-muted-foreground mb-6">
                                        {t("contact.intro")}
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <h4 className="font-medium text-sm mb-2">{t("contact.emailTitle")}</h4>
                                            <a href="mailto:63ahmedkhaled@gmail.com" className="text-primary hover:underline">
                                                63ahmedkhaled@gmail.com
                                            </a>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <h4 className="font-medium text-sm mb-2">{t("contact.responseTitle")}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {t("contact.responseDesc")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Changes to Policy */}
                            <section className="scroll-mt-24 space-y-6 border-t border-border/50 pt-12">
                                <h2 className="text-xl font-semibold">{t("changes.title")}</h2>
                                <p className="text-muted-foreground">
                                    {t("changes.description")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>{t("lastUpdated")}:</strong> {t("lastUpdatedDate")}
                                </p>
                            </section>

                            {/* Back to Home */}
                            <div className="border-t border-border/50 pt-12 mt-12 mb-12">
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/"
                                        className="text-primary hover:underline inline-flex items-center gap-2"
                                    >
                                        {t("backToHome")}
                                    </Link>
                                    <span className="hidden sm:inline text-muted-foreground">•</span>
                                    <Link
                                        href="/docs"
                                        className="text-primary hover:underline inline-flex items-center gap-2"
                                    >
                                        {t("viewDocs")}
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </main>

                    {/* Right side TOC (Desktop) */}
                    <div className="hidden xl:block w-64 shrink-0">
                        <div className="sticky top-24">
                            <h4 className="font-medium text-sm mb-4 text-muted-foreground">{t("onThisPage")}</h4>
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
