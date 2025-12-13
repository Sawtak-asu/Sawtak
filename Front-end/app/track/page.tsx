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
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    submitted: {
        icon: <Clock className="h-5 w-5" />,
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
        label: "Pending Review",
    },
    investigating: {
        icon: <Search className="h-5 w-5" />,
        color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        label: "Under Investigation",
    },
    resolved: {
        icon: <CheckCircle className="h-5 w-5" />,
        color: "bg-green-500/10 text-green-600 border-green-500/30",
        label: "Resolved",
    },
    dismissed: {
        icon: <XCircle className="h-5 w-5" />,
        color: "bg-red-500/10 text-red-600 border-red-500/30",
        label: "Dismissed",
    },
};

export default function TrackPage() {
    const [trackingCode, setTrackingCode] = useState("");
    const [result, setResult] = useState<TrackingResult | null>(null);

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
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Header */}
            <div className="border-b border-border bg-muted/30">
                <div className="container max-w-4xl mx-auto px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <Search className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-semibold md:text-4xl">
                        Track Your Complaint
                    </h1>
                    <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                        Enter your tracking code to check the status of your complaint. 
                        Your identity remains protected - we only show the status.
                    </p>
                </div>
            </div>

            <div className="container max-w-4xl mx-auto px-6 py-12">
                {/* Search Form */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="flex gap-3">
                            <div className="relative flex-1">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Enter your tracking code (e.g., SAWTAK-A7B3C9D2)"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                    className="pl-11 h-12 text-lg font-mono"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                size="lg"
                                className="h-12 px-8"
                                disabled={trackingCode.length < 8 || trackMutation.isPending}
                            >
                                {trackMutation.isPending ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        Track
                                        <ArrowRight className="ml-2 h-4 w-4" />
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
                                <Card className={`border-2 ${status?.color || ''}`}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${status?.color || ''}`}>
                                                {status?.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Current Status</p>
                                                <p className="text-2xl font-semibold">{status?.label}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {result.type === "anonymous" ? "🔒 Anonymous" : "👤 Identified"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Complaint Details */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{result.complaint.title}</CardTitle>
                                        <CardDescription>
                                            Submitted {formatDistanceToNow(new Date(result.complaint.createdAt), { addSuffix: true })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Category</p>
                                                    <p className="text-sm font-medium capitalize">{result.complaint.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Area</p>
                                                    <p className="text-sm font-medium">{result.complaint.area || "N/A"}</p>
                                                </div>
                                            </div>
                                            {result.complaint.incidentDate && (
                                                <div className="flex items-start gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Incident Date</p>
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
                                <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Your Privacy is Protected</p>
                                        <p className="text-sm text-muted-foreground">
                                            Only basic complaint information is shown. Your identity and detailed 
                                            complaint text remain confidential and are not displayed here.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">Complaint Not Found</h3>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                                            {result.message}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-4">
                                            Make sure you're using the exact tracking code provided when you 
                                            submitted your complaint.
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Where do I find my tracking code?</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>
                                    Your tracking code was displayed after you successfully submitted your 
                                    complaint. It's a unique identifier that looks like <code className="bg-muted px-1 py-0.5 rounded">SAWTAK-XXXXXXXX</code>.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Lost your tracking code?</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>
                                    For anonymous complaints, we cannot recover your tracking code as it's 
                                    not linked to any account. For identified complaints, please contact 
                                    support.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-4">Need to file a new complaint?</p>
                    <Button asChild variant="outline">
                        <Link href="/file-complaint">
                            File a Complaint
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
