"use client";

import { useEffect } from "react";
import { ComplaintForm } from "./complaint-form";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { GridBackground } from "@/components/grid-background";
import { Shield, Lock, FileText, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ComplaintPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("FileComplaint");

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <GridBackground>
        <Navbar />
        <div className="container max-w-6xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </GridBackground>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect
  }

  return (
    <GridBackground>
      <Navbar />

      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm ">
        <div className="container max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-md shadow-sm">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          </div>
          <p className="mt-4 text-md text-muted-foreground font-mono leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="">
            <div className="lg:col-span-1 space-y-6 h-fit sticky top-24">
              <div className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-4">{t("whatToInclude")}</h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{t("include1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{t("include2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{t("include3")}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">{t("commitment")}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("commitmentText")}
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">{t("privacyTitle")}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>{t("anonymousMode")}</strong> {t("anonymousModeText")}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>{t("identifiedMode")}</strong> {t("identifiedModeText")}
                </p>
              </div>
            </div>
          </div>
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6">
              <ComplaintForm />
            </div>
          </div>
        </div>
      </div>
    </GridBackground>
  );
}
