"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, Clock, FileText, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RevealRequest {
    id: string;
    complaint_id: string;
    complaint_type: string;
    requested_by: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    reviewed_by: string | null;
    review_note: string | null;
    revealed_user_id: string | null;
    revealed_user_name: string | null;
    revealed_user_email: string | null;
    created_at: string;
    reviewed_at: string | null;
    reviewer: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    complaint: {
        hcs_hash: string;
        title: string;
        status: string;
    } | null;
}

export default function MyRevealRequestsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <MyRevealRequestsContent />
        </Suspense>
    );
}

function MyRevealRequestsContent() {
    const { token } = useAuth();

    // Fetch my requests
    const { data, isLoading } = useQuery({
        queryKey: ["my-reveal-requests"],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admin/my-reveal-requests?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch your reveal requests");
            return await res.json();
        },
        enabled: !!token,
    });

    const requests: RevealRequest[] = data?.data?.requests || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
            case "approved":
                return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
            case "rejected":
                return <Badge variant="outline" className="text-red-600 border-red-600"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: "My Reveal Requests" }]}>
            <div className="space-y-6 max-w-7xl mx-auto p-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Identity Reveal Requests</h1>
                    <p className="text-muted-foreground">
                        Track the status of identity reveal requests you have submitted for flagged complaints.
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Identity reveal requests must be approved by a platform admin who will manually enter the decryption key.
                        You will see the revealed identity here once approved.
                    </p>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-muted/10">
                        <h3 className="text-lg font-semibold">No reveal requests</h3>
                        <p className="text-muted-foreground">
                            You haven't submitted any identity reveal requests yet. You can request identity reveals for flagged anonymous complaints.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((request) => (
                            <Card key={request.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                {request.complaint?.title || "Anonymous Complaint"}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Submitted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Your justification:</span>
                                        <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">{request.reason}</p>
                                    </div>

                                    {request.status === "approved" && request.revealed_user_email && (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                                            <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Revealed Identity
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                                <p><strong>Name:</strong> {request.revealed_user_name || "N/A"}</p>
                                                <p><strong>Email:</strong> {request.revealed_user_email}</p>
                                                <p><strong>User ID:</strong> <code className="text-xs bg-muted p-1 rounded">{request.revealed_user_id}</code></p>
                                            </div>
                                            {request.reviewer && (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Approved by {request.reviewer.name || request.reviewer.email} • {request.reviewed_at && formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}
                                                </p>
                                            )}
                                            {request.review_note && (
                                                <p className="mt-2 text-xs text-muted-foreground">Note: {request.review_note}</p>
                                            )}
                                        </div>
                                    )}

                                    {request.status === "rejected" && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                                            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Request Rejected</h4>
                                            <p className="text-sm">{request.review_note}</p>
                                            {request.reviewer && (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    By {request.reviewer.name || request.reviewer.email} • {request.reviewed_at && formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {request.status === "pending" && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                                ⏳ Awaiting review from a platform administrator...
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
