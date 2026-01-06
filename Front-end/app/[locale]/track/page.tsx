"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    MapPin,
    Calendar,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { GridBackground } from "@/components/grid-background";
import { useTranslations } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TrackingResult {
    found: boolean;
    type?: "anonymous" | "identified";
    complaint?: {
        id: string;
        title: string;
        category: string;
        area: string;
        status: string;
        createdAt: string;
        incidentDate?: string;
    };
    message: string;
}

export default function TrackPage() {
    const [trackingCode, setTrackingCode] = useState("");
    const [result, setResult] = useState<TrackingResult | null>(null);
    const t = useTranslations("Track");
    const tStatus = useTranslations("Status");
    const tCommon = useTranslations("Common");

    const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
        submitted: {
            icon: <Clock className="h-5 w-5" />,
            color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
            label: tStatus("submitted"),
        },
        investigating: {
            icon: <Search className="h-5 w-5" />,
            color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
            label: tStatus("investigating"),
        },
        resolved: {
            icon: <CheckCircle className="h-5 w-5" />,
            color: "bg-green-500/10 text-green-600 border-green-500/30",
            label: tStatus("resolved"),
        },
        dismissed: {
            icon: <XCircle className="h-5 w-5" />,
            color: "bg-red-500/10 text-red-600 border-red-500/30",
            label: tStatus("dismissed"),
        },
    };

    const trackMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await fetch(`${API_URL}/api/track/${encodeURIComponent(code)}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.data as TrackingResult;
        },
        onSuccess: (data) => {
            setResult(data);
        },
        onError: (error: Error) => {
            setResult({
                found: false,
                message: error.message || "Failed to look up tracking code",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingCode.trim().length >= 8) {
            trackMutation.mutate(trackingCode.trim());
        }
    };

    const status = result?.complaint?.status ? statusConfig[result.complaint.status] : null;

    return (
        <GridBackground>
            <Navbar />

            {/* Header */}
            <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
                <div className="container max-w-4xl mx-auto px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 backdrop-blur-md shadow-sm mb-6">
                        <Search className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-semibold md:text-4xl tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="mt-4 text-base md:text-md text-muted-foreground font-mono max-w-xl mx-auto leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>
            </div>

            <div className="container max-w-4xl mx-auto px-6 py-12">
                {/* Search Form */}
                <Card className="mb-8 border-muted/50 shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="flex gap-3">
                            <div className="relative flex-1">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder={t("placeholder")}
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                    className="ps-11 h-12 text-lg font-mono bg-background/50"
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="h-12 px-8 shadow-sm"
                                disabled={trackingCode.length < 8 || trackMutation.isPending}
                            >
                                {trackMutation.isPending ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full me-2" />
                                        {t("searching")}
                                    </>
                                ) : (
                                    <>
                                        {t("searchButton")}
                                        <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Result */}
                {result && (
                    <div className="space-y-6">
                        {result.found && result.complaint ? (
                            <>
                                {/* Status Card */}
                                <Card className={`border-2 ${status?.color || ''} shadow-sm bg-background/80 backdrop-blur-sm`}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${status?.color || ''}`}>
                                                {status?.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">{t("currentStatus")}</p>
                                                <p className="text-2xl font-semibold">{status?.label}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {result.type === "anonymous" ? `🔒 ${tCommon("anonymous")}` : `👤 ${tCommon("identified")}`}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Complaint Details */}
                                <Card className="shadow-sm border-muted/50 bg-background/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{result.complaint.title}</CardTitle>
                                        <CardDescription>
                                            {t("submitted")} {formatDistanceToNow(new Date(result.complaint.createdAt), { addSuffix: true })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">{t("category")}</p>
                                                    <p className="text-sm font-medium capitalize">{result.complaint.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">{t("area")}</p>
                                                    <p className="text-sm font-medium">{result.complaint.area || "N/A"}</p>
                                                </div>
                                            </div>
                                            {result.complaint.incidentDate && (
                                                <div className="flex items-start gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">{t("incidentDate")}</p>
                                                        <p className="text-sm font-medium">
                                                            {new Date(result.complaint.incidentDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Privacy Notice */}
                                <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3 border border-border/50">
                                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">{t("privacyNotice")}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t("privacyNoticeText")}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Card className="shadow-sm border-muted/50 bg-background/80 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">{t("notFound")}</h3>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                                            {result.message}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-4">
                                            {t("notFoundHint")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Help Section */}
                {!result && (
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        <Card className="border-muted/50 bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-base">{t("helpTitle1")}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>
                                    {t("helpText1")} <code className="bg-muted px-1 py-0.5 rounded">SAWTAK-XXXXXXXX</code>.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-muted/50 bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-base">{t("helpTitle2")}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>
                                    {t("helpText2")}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-4">{t("newComplaintCta")}</p>
                    <Button asChild variant="outline" className="shadow-sm bg-background/50">
                        <Link href="/file-complaint">
                            {tCommon("fileComplaint")}
                            <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                        </Link>
                    </Button>
                </div>
            </div>
        </GridBackground>
    );
}
