"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { GridBackground } from "@/components/grid-background";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Shield,
  Lock,
  Database,
  Hash,
  FileText,
  ChevronRight,
  Server,
  Key,
  Globe,
  Eye,
  Users,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function DocsPage() {
  const [activeSection, setActiveSection] = React.useState("overview");
  const t = useTranslations("Docs");

  const sections = [
    { id: "overview", title: t("sections.overview"), icon: FileText },
    { id: "architecture", title: t("sections.architecture"), icon: Server },
    { id: "security", title: t("sections.security"), icon: Lock },
    { id: "blockchain", title: t("sections.blockchain"), icon: Hash },
    { id: "moderation", title: t("sections.moderation"), icon: Eye },
    { id: "faq", title: t("sections.faq"), icon: Database },
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

  return (
    <GridBackground>
      <Navbar />

      <div className="container max-w-7xl mx-auto px-6 py-12" dir="ltr">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div className="hidden lg:block">
                <h3 className="font-semibold text-lg mb-4 px-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
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
                <h4 className="font-medium text-sm mb-2">{t("hcsTopicTitle")}</h4>
                <code className="block bg-muted p-2 rounded text-xs font-mono text-muted-foreground break-all">
                  0.0.7303531
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("hcsTopicHint")}
                </p>
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

              {/* Overview */}
              <section id="overview" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <FileText className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">{t("sections.overview")}</h2>
                </div>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {t("overview.intro")}
                    <span className="text-foreground font-medium"> {t("overview.anonymity")} </span>
                    {t("overview.with")} <span className="text-foreground font-medium">{t("overview.accountability")}</span>.
                  </p>
                  <p className="text-muted-foreground">
                    {t("overview.description")}
                  </p>
                </div>
              </section>

              {/* Architecture */}
              <section id="architecture" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Server className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">{t("sections.architecture")}</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-500" />
                      {t("architecture.anonymousTitle")}
                    </h3>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">1</span>
                        <span>{t("architecture.anonymousStep1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">2</span>
                        <span>{t("architecture.anonymousStep2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">3</span>
                        <span>{t("architecture.anonymousStep3")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">4</span>
                        <span>{t("architecture.anonymousStep4")}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      {t("architecture.identifiedTitle")}
                    </h3>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">1</span>
                        <span>{t("architecture.identifiedStep1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">2</span>
                        <span>{t("architecture.identifiedStep2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">3</span>
                        <span>{t("architecture.identifiedStep3")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">4</span>
                        <span>{t("architecture.identifiedStep4")}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Key className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">{t("sections.security")}</h2>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                  <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">{t("security.dataAtRest")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("security.dataAtRestDesc")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">{t("security.dataInTransit")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("security.dataInTransitDesc")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">{t("security.zeroKnowledge")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("security.zeroKnowledgeDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Blockchain */}
              <section id="blockchain" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Hash className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">{t("blockchain.title")}</h2>
                </div>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    {t("blockchain.description")}
                  </p>
                  <div className="my-6 rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-50 border border-zinc-800 overflow-x-auto">
                    <div className="flex items-center justify-between text-zinc-500 mb-2 border-b border-zinc-800 pb-2">
                      <span>{t("blockchain.exampleTitle")}</span>
                      <span>Topic: 0.0.1234567</span>
                    </div>
                    <pre className="text-green-400">
                      {`{
  "timestamp": "2024-03-15T10:30:00.000Z",
  "sequenceNumber": 42,
  "message": {
    "hash": "8f434346648f6b96df89dda901c5176b...",
    "category": "corruption",
    "area": "Cairo"
  }
}`}
                    </pre>
                  </div>
                  <p className="text-muted-foreground">
                    {t("blockchain.proof")}
                    <a href="https://hashscan.io/testnet/topic/0.0.7303531" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 font-medium inline-flex items-center gap-1">
                      HashScan
                      <Globe className="h-3 w-3" />
                    </a>.
                  </p>
                </div>
              </section>

              {/* Trust & Moderation */}
              <section id="moderation" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Eye className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">{t("moderation.title")}</h2>
                </div>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-muted-foreground mb-6">
                    {t("moderation.intro")}
                  </p>
                </div>

                {/* Key Principle */}
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Hash className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t("moderation.immutablePrinciple")}</h3>
                      <p className="text-muted-foreground">
                        {t("moderation.immutableDescription")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Admin Flagging */}
                  <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {t("moderation.adminFlaggingTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("moderation.adminFlaggingIntro")}
                    </p>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-500">1</span>
                        <span>{t("moderation.adminStep1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-500">2</span>
                        <span>{t("moderation.adminStep2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-500">3</span>
                        <span>{t("moderation.adminStep3")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-500">4</span>
                        <span>{t("moderation.adminStep4")}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Community Moderation */}
                  <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      {t("moderation.communityTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("moderation.communityIntro")}
                    </p>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-500">1</span>
                        <span>{t("moderation.communityStep1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-500">2</span>
                        <span>{t("moderation.communityStep2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-500">3</span>
                        <span>{t("moderation.communityStep3")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-500">4</span>
                        <span>{t("moderation.communityStep4")}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Transparency Guarantee */}
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-500/10 p-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t("moderation.transparencyTitle")}</h3>
                      <p className="text-muted-foreground">
                        {t("moderation.transparencyDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Database className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">{t("faq.title")}</h2>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                    <h3 className="font-medium text-lg mb-2">{t("faq.q1")}</h3>
                    <p className="text-muted-foreground">
                      {t("faq.a1")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                    <h3 className="font-medium text-lg mb-2">{t("faq.q2")}</h3>
                    <p className="text-muted-foreground">
                      {t("faq.a2")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                    <h3 className="font-medium text-lg mb-2">{t("faq.q3")}</h3>
                    <p className="text-muted-foreground">
                      {t("faq.a3")}
                    </p>
                  </div>
                </div>
              </section>

              {/* Footer CTA */}
              <div className="border-t border-border/50 pt-12 mt-12 mb-12">
                <div className="rounded-2xl bg-primary/5 p-8 text-center border border-primary/10">
                  <h3 className="text-2xl font-semibold mb-4">{t("cta.title")}</h3>
                  <div className="flex items-center justify-center gap-4">
                    <Button asChild size="lg">
                      <Link href="/file-complaint">{t("cta.fileComplaint")}</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/track">{t("cta.trackStatus")}</Link>
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </main>

          {/* Right side TOC (Desktop) */}
          <div className="hidden xl:block w-64 flex-shrink-0">
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
    </GridBackground>
  );
}
