"use client";

import { Link } from "@/i18n/navigation";
import {
  FilePlus2,
  LayoutGrid,
  Search,
  BookOpen,
  Shield,
  User,
  ChevronRight,
  Sparkles,
  Lock,
  Globe,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

function truncateName(name: string | null | undefined): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  return words.slice(0, 2).join(" ");
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MobileHome() {
  const t = useTranslations("Navbar");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const { user, isLoggedIn } = useAuth();
  const isRTL = locale === "ar";

  const actions = [
    {
      href: "/feed",
      label: t("feed"),
      icon: LayoutGrid,
      description: isRTL ? "البلاغات العامة" : "Public reports",
    },
    {
      href: "/track",
      label: t("track"),
      icon: Search,
      description: isRTL ? "تتبع بلاغك" : "Track complaint",
    },
    {
      href: "/docs",
      label: t("docs"),
      icon: BookOpen,
      description: isRTL ? "كيف يعمل النظام" : "How it works",
    },
  ];

  const trustBadges = [
    { icon: Lock, label: isRTL ? "مشفر بالكامل" : "256-bit Encrypted" },
    { icon: Globe, label: isRTL ? "سلسلة بلوكتشين" : "Blockchain Backed" },
    { icon: Shield, label: isRTL ? "مجهول الهوية" : "100% Anonymous" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 flex items-center justify-between px-5 pt-12 pb-4 bg-background/80 backdrop-blur-xl border-b border-border/40"
      >
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          {isLoggedIn ? (
            <Link href="/profile">
              <Avatar className="h-8 w-8 ring-2 ring-border ring-offset-1 ring-offset-background">
                <AvatarFallback className="text-xs bg-muted text-foreground font-semibold">
                  {user?.name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-foreground"
            >
              <User className="h-4 w-4" />
            </Link>
          )}
        </div>
      </motion.header>

      {/* ── Scrollable Content ── */}
      <main className="flex-1 overflow-y-auto px-5 pb-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-7 mb-6"
        >
          {isLoggedIn && user ? (
            <>
              <p className="text-sm text-muted-foreground font-medium">
                {getGreeting()} 👋
              </p>
              <h1 className="text-2xl font-bold mt-0.5 truncate">
                {truncateName(user.name) || user.email}
              </h1>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted rounded-full px-3 py-1 mb-3 border border-border">
                <Sparkles className="h-3 w-3" />
                <span>{isRTL ? "صوتك مجهول وآمن" : "Your voice, protected"}</span>
              </div>
              <h1 className="text-2xl font-bold leading-tight">
                {isRTL ? (
                  <>
                    تكلم بحرية.{" "}
                    <span className="text-muted-foreground font-light">ابقَ آمناً.</span>
                  </>
                ) : (
                  <>
                    Speak Up.{" "}
                    <span className="text-muted-foreground font-light">Stay Safe.</span>
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {isRTL
                  ? "منصة تبليغ مجهولة مدعومة بالبلوكتشين."
                  : "Anonymous whistleblowing backed by blockchain."}
              </p>
            </>
          )}
        </motion.div>

        {/* ── Primary Action (File Complaint) ── */}
        {/* Uses bg-foreground / text-background so it's always dark-on-light or light-on-dark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4"
        >
          <Link href="/file-complaint" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-foreground p-5 shadow-lg active:scale-[0.98] transition-transform duration-150">
              {/* Subtle texture circles */}
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-background/10" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-background/5" />

              <div className="relative flex items-center justify-between">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-background/15 flex items-center justify-center mb-3 group-active:scale-95 transition-transform">
                    <FilePlus2 className="h-6 w-6 text-background" />
                  </div>
                  <p className="text-background/60 text-xs font-medium uppercase tracking-widest">
                    {isRTL ? "إجراء رئيسي" : "Primary Action"}
                  </p>
                  <h2 className="text-background text-xl font-bold mt-0.5">
                    {t("fileComplaint")}
                  </h2>
                  <p className="text-background/60 text-sm mt-1">
                    {isRTL ? "تقديم بلاغ مجهول وآمن" : "Submit anonymously & securely"}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-background/50 shrink-0 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Secondary Actions Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.07 }}
              >
                <Link href={action.href} className="block group">
                  <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 flex flex-col items-center text-center gap-2.5 active:scale-[0.96] transition-all duration-150 hover:bg-muted hover:border-border/80">
                    <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:bg-background transition-colors">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {action.label}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Profile / Login Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6"
        >
          {isLoggedIn ? (
            <Link href="/profile" className="block group">
              <div className="flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-3.5 active:scale-[0.98] transition-transform duration-150 hover:bg-muted">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-muted text-foreground font-bold text-base border border-border">
                    {user?.name?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {truncateName(user?.name) || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "عرض بلاغاتي" : t("myComplaints")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </div>
            </Link>
          ) : (
            <Link href="/login" className="block group">
              <div className="flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-3.5 active:scale-[0.98] transition-transform duration-150 hover:bg-muted">
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {isRTL ? "تسجيل الدخول" : tCommon("signIn")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL
                      ? "لتتبع بلاغاتك المُعرَّفة"
                      : "Track your identified complaints"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </div>
            </Link>
          )}
        </motion.div>

        {/* ── Trust Badges ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="flex gap-2 justify-between"
        >
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border py-3 px-2"
              >
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                  {badge.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
