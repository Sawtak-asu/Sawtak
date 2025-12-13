"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { GridBackground } from "@/components/grid-background";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Shield, 
  Lock, 
  Database, 
  Hash, 
  FileText, 
  ChevronRight, 
  Server, 
  Key, 
  Globe 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocsPage() {
  const [activeSection, setActiveSection] = React.useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: FileText },
    { id: "architecture", title: "How it Works", icon: Server },
    { id: "security", title: "Encryption & Privacy", icon: Lock },
    { id: "blockchain", title: "Blockchain Trust", icon: Hash },
    { id: "faq", title: "FAQ", icon: Database },
  ];

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
      
      <div className="container max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div className="hidden lg:block">
                <h3 className="font-semibold text-lg mb-4 px-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Documentation
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
                <h4 className="font-medium text-sm mb-2">HCS Topic ID</h4>
                <code className="block bg-muted p-2 rounded text-xs font-mono text-muted-foreground break-all">
                  0.0.7303531 
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Use this ID to verify messages on any Hedera explorer.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-16">
              
              {/* Header */}
              <div className="border-b border-border/50 pb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Sawtak Documentation</h1>
                <p className="text-xl text-muted-foreground">
                  Learn about the architecture, security, and philosophy behind the Sawtak whistleblowing platform.
                </p>
              </div>

              {/* Overview */}
              <section id="overview" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <FileText className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">Overview</h2>
                </div>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Sawtak is a hybrid whistleblowing platform designed to balance 
                    <span className="text-foreground font-medium"> absolute anonymity </span> 
                    with <span className="text-foreground font-medium"> actionable accountability</span>.
                  </p>
                  <p className="text-muted-foreground">
                    Unlike traditional reporting tools, Sawtak leverages the <strong>Hedera Hashgraph</strong> network 
                    to create an immutable, public audit trail of anonymous complaints. This ensures that once a complaint 
                    is filed, it cannot be deleted or altered by anyone—not even system administrators.
                  </p>
                </div>
              </section>

              {/* Architecture */}
              <section id="architecture" className="scroll-mt-24 space-y-6">
                 <div className="flex items-center gap-2 text-primary mb-2">
                  <Server className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">How it Works</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-500" />
                      Anonymous Flow
                    </h3>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">1</span>
                        <span>User submits complaint. Identity is stripped immediately on the client side.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">2</span>
                        <span>Data is sent to our privacy proxy, which hashes the content.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">3</span>
                        <span>The hash and metadata are published to the Hedera Consensus Service (HCS).</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">4</span>
                        <span>The complaint appears in the public feed, verified by the blockchain timestamp.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/50 p-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Identified Flow
                    </h3>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">1</span>
                        <span>User logs in and submits with "Identified" mode.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">2</span>
                        <span>Identity and complaint are encrypted with <strong>AES-256</strong>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">3</span>
                        <span>Stored in our secure PostgreSQL database.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">4</span>
                        <span>Only authorized admins can decrypt and view the identity for follow-up.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24 space-y-6">
                 <div className="flex items-center gap-2 text-primary mb-2">
                  <Key className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">Encryption & Privacy</h2>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                  <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-2">
                       <h3 className="font-medium text-foreground">Data at Rest</h3>
                       <p className="text-sm text-muted-foreground">
                         All sensitive fields in our database are encrypted using AES-256-GCM. 
                         Database backups are also encrypted.
                       </p>
                    </div>
                    <div className="space-y-2">
                       <h3 className="font-medium text-foreground">Data in Transit</h3>
                       <p className="text-sm text-muted-foreground">
                         All traffic between your browser and our servers is secured via TLS 1.3. 
                         We implement HSTS to prevent protocol downgrade attacks.
                       </p>
                    </div>
                    <div className="space-y-2">
                       <h3 className="font-medium text-foreground">Zero-Knowledge</h3>
                       <p className="text-sm text-muted-foreground">
                         For anonymous complaints, our servers do not log IP addresses or browser fingerprints associated with the submission.
                       </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Blockchain */}
              <section id="blockchain" className="scroll-mt-24 space-y-6">
                 <div className="flex items-center gap-2 text-primary mb-2">
                  <Hash className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">Why Blockchain?</h2>
                </div>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    We use the <strong>Hedera Consensus Service (HCS)</strong> as a public notary. 
                    When you submit an anonymous complaint, we publish a cryptographic hash of your message to a public "Topic" on Hedera.
                  </p>
                  <div className="my-6 rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-50 border border-zinc-800 overflow-x-auto">
                    <div className="flex items-center justify-between text-zinc-500 mb-2 border-b border-zinc-800 pb-2">
                      <span>Example HCS Message</span>
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
                    This proves that the complaint existed at that specific time and has not been altered since. 
                    Anyone can verify this by checking the topic on a Hedera explorer like 
                    <a href="https://hashscan.io/testnet/topic/0.0.7303531" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 font-medium inline-flex items-center gap-1">
                      HashScan
                      <Globe className="h-3 w-3" />
                    </a>.
                  </p>
                </div>
              </section>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Database className="h-6 w-6" />
                  <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                    <h3 className="font-medium text-lg mb-2">Why are anonymous complaints public?</h3>
                    <p className="text-muted-foreground">
                      Anonymity implies that the <strong>identity</strong> is hidden, not necessarily the message. 
                      By making the complaint content public and backed by the blockchain, we ensure <strong>transparency</strong>. 
                      It prevents the system (or authorities) from "burying" complaints. The public nature is the guarantee that your voice was heard.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                    <h3 className="font-medium text-lg mb-2">Can I delete my complaint?</h3>
                    <p className="text-muted-foreground">
                      <strong>Anonymous complaints cannot be deleted</strong> because they are recorded on the blockchain immutable ledger. 
                      Identified complaints can be withdrawn, but an audit log may remain for administrative purposes.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card/30 p-6">
                    <h3 className="font-medium text-lg mb-2">Is it truly anonymous?</h3>
                    <p className="text-muted-foreground">
                      Yes. When you choose "Anonymous" mode, we do not require login, we do not store your IP address, 
                      and we do not ask for any PII (Personally Identifiable Information). The tracking code you receive 
                      is the only link to your report.
                    </p>
                  </div>
                </div>
              </section>

              {/* Footer CTA */}
              <div className="border-t border-border/50 pt-12 mt-12 mb-12">
                <div className="rounded-2xl bg-primary/5 p-8 text-center border border-primary/10">
                  <h3 className="text-2xl font-semibold mb-4">Ready to seek justice?</h3>
                  <div className="flex items-center justify-center gap-4">
                    <Button asChild size="lg">
                      <Link href="/file-complaint">File a Complaint</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/track">Track Status</Link>
                    </Button>
                  </div>
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
    </GridBackground>
  );
}
