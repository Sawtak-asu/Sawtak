"use client";

import { useEffect } from "react";
import { ComplaintForm } from "./complaint-form";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Lock, FileText, CheckCircle } from "lucide-react";

export default function ComplaintPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">File a Complaint</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Your voice matters. Submit a complaint securely and help build a more 
            transparent and accountable society.
          </p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-4">What to include:</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  A clear and concise title
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  Detailed description of the incident
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  Category that best fits your complaint
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  Approximate date and location
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  Any supporting evidence
                </li>
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Our Commitment</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                We are committed to a fair and thorough investigation of every
                complaint. Your submission will be reviewed by our team.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Privacy</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Anonymous mode:</strong> Your identity is encrypted and 
                stored on the blockchain. You'll receive a tracking code.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Identified mode:</strong> Your complaint is linked to 
                your account for direct follow-up.
              </p>
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
    </div>
  );
}
