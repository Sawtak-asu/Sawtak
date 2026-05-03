"use client";

import { useState, Suspense, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import { useTranslations } from "next-intl";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Check, X, Clock, User, FileText, Key, AlertTriangle, Eye, EyeOff, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { MINISTRIES, GOVERNORATES } from "@/lib/egypt-locations";

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
    requester: {
        id: string;
        name: string | null;
        email: string;
        picture: string | null;
    };
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

export default function RevealRequestsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <RevealRequestsContent />
        </Suspense>
    );
}

function RevealRequestsContent() {
    const { token } = useAuth();
    const { isPlatformAdmin } = useAdmin();
    const queryClient = useQueryClient();
    const router = useRouter();
    const t = useTranslations("Admin.revealRequests");

    const [statusFilter, setStatusFilter] = useState("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [entityFilter, setEntityFilter] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState<RevealRequest | null>(null);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [decryptionKey, setDecryptionKey] = useState("");
    const [approveNote, setApproveNote] = useState("");
    const [rejectNote, setRejectNote] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [revealedUser, setRevealedUser] = useState<{ id: string; name: string | null; email: string; picture: string | null } | null>(null);

    // Build entity options
    const entityOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [
            { value: "all", label: "All Entities" }
        ];
        MINISTRIES.forEach(m => options.push({ value: m.id, label: m.name }));
        GOVERNORATES.forEach(g => options.push({ value: g.id, label: g.name }));
        return options;
    }, []);

    // Redirect if not platform admin
    if (!isPlatformAdmin) {
        router.push("/admin");
        return null;
    }

    // Fetch requests
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["reveal-requests", { status: statusFilter, search: searchQuery, entity: entityFilter }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (searchQuery) params.set("search", searchQuery);
            if (entityFilter && entityFilter !== "all") params.set("entity", entityFilter);
            params.set("limit", "50");

            const res = await fetch(`/api/admin/identity-reveal-requests?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch reveal requests");
            return await res.json();
        },
        enabled: !!token && isPlatformAdmin,
    });

    const requests: RevealRequest[] = data?.data?.requests || [];

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async () => {
            if (!selectedRequest) return;
            const res = await fetch(`/api/admin/identity-reveal-requests/${selectedRequest.id}/approve`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    decryptionKey: decryptionKey.trim(),
                    note: approveNote || undefined
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to approve request");
            }
            return data;
        },
        onSuccess: (data) => {
            toast.success(t("approveSuccess"));
            setRevealedUser(data.data?.user || null);
            queryClient.invalidateQueries({ queryKey: ["reveal-requests"] });
        },
        onError: (err: Error) => toast.error(err.message)
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async () => {
            if (!selectedRequest) return;
            const res = await fetch(`/api/admin/identity-reveal-requests/${selectedRequest.id}/reject`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    note: rejectNote.trim()
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || t("failedToReject"));
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(t("rejectSuccess"));
            setRejectDialogOpen(false);
            setRejectNote("");
            setSelectedRequest(null);
            queryClient.invalidateQueries({ queryKey: ["reveal-requests"] });
        },
        onError: (err: Error) => toast.error(err.message)
    });

    const handleApprove = (request: RevealRequest) => {
        setSelectedRequest(request);
        setRevealedUser(null);
        setDecryptionKey("");
        setApproveNote("");
        setShowKey(false);
        setApproveDialogOpen(true);
    };

    const handleReject = (request: RevealRequest) => {
        setSelectedRequest(request);
        setRejectNote("");
        setRejectDialogOpen(true);
    };

    const closeApproveDialog = () => {
        setApproveDialogOpen(false);
        setDecryptionKey("");
        setApproveNote("");
        setRevealedUser(null);
        setSelectedRequest(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />{t("pending")}</Badge>;
            case "approved":
                return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="w-3 h-3 mr-1" />{t("approved")}</Badge>;
            case "rejected":
                return <Badge variant="outline" className="text-red-600 border-red-600"><X className="w-3 h-3 mr-1" />{t("rejected")}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: "Identity Reveal Requests" }]}>
            <div className="space-y-6 max-w-7xl mx-auto p-6">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                            <p className="text-muted-foreground">
                                {t("subtitle")}
                            </p>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-9"
                            />
                        </div>

                        {/* Entity Filter */}
                        <Select value={entityFilter} onValueChange={setEntityFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder={t("filterEntity")} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {entityOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder={t("filterStatus")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("allRequests")}</SelectItem>
                                <SelectItem value="pending">{t("pending")}</SelectItem>
                                <SelectItem value="approved">{t("approved")}</SelectItem>
                                <SelectItem value="rejected">{t("rejected")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-400">{t("securityNotice")}</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-500">
                            {t("securityNoticeText")}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-muted/10">
                        <h3 className="text-lg font-semibold">{t("noRequests")}</h3>
                        <p className="text-muted-foreground">
                            {statusFilter === "pending" 
                                ? "There are no pending identity reveal requests."
                                : "Try adjusting your filter."}
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
                                                Complaint ID: <code className="text-xs">{request.complaint_id.substring(0, 20)}...</code>
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Requested by:</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{request.requester?.name || request.requester?.email}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Requested:</span>
                                            <div className="mt-1">
                                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-sm text-muted-foreground">{t("justification")}:</span>
                                        <p className="mt-1 p-3 bg-muted/50 rounded-md text-sm">{request.reason}</p>
                                    </div>

                                    {request.status === "approved" && request.revealed_user_email && (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                                            <span className="text-sm font-medium text-green-700 dark:text-green-400">{t("revealedUser")}:</span>
                                            <p className="mt-1 text-sm">
                                                <strong>{request.revealed_user_name}</strong> ({request.revealed_user_email})
                                            </p>
                                            {request.review_note && (
                                                <p className="mt-2 text-xs text-muted-foreground">Note: {request.review_note}</p>
                                            )}
                                        </div>
                                    )}

                                    {request.status === "rejected" && request.review_note && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Rejection Reason:</span>
                                            <p className="mt-1 text-sm">{request.review_note}</p>
                                        </div>
                                    )}
                                </CardContent>
                                {request.status === "pending" && (
                                    <CardFooter className="flex justify-end gap-2 pt-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(request)}
                                        >
                                            <X className="h-4 w-4 me-1" />
                                            {t("reject")}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(request)}
                                        >
                                            <Key className="h-4 w-4 me-1" />
                                            {t("approve")}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Approve Dialog */}
                <Dialog open={approveDialogOpen} onOpenChange={(open) => !open && closeApproveDialog()}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t("approveRequest")}</DialogTitle>
                            <DialogDescription>
                                To reveal the identity, you must enter the decryption key. This action is irreversible and will be audited.
                            </DialogDescription>
                        </DialogHeader>

                        {revealedUser ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <h3 className="font-medium text-green-700 dark:text-green-400 mb-2">{t("actionSuccessful")}</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Name:</strong> {revealedUser.name || "N/A"}</p>
                                        <p><strong>Email:</strong> {revealedUser.email}</p>
                                        <p><strong>User ID:</strong> <code className="text-xs">{revealedUser.id}</code></p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={closeApproveDialog}>Done</Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <div className="space-y-4 py-2">
                                {selectedRequest && (
                                    <div className="text-sm text-muted-foreground">
                                        <p><strong>Complaint:</strong> {selectedRequest.complaint?.title}</p>
                                        <p><strong>Requested by:</strong> {selectedRequest.requester?.name || selectedRequest.requester?.email}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Key className="h-4 w-4" />
                                        {t("decryptionKey")}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showKey ? "text" : "password"}
                                            placeholder={t("decryptionKeyPlaceholder")}
                                            value={decryptionKey}
                                            onChange={(e) => setDecryptionKey(e.target.value)}
                                            className="font-mono pe-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowKey(!showKey)}
                                        >
                                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Characters entered: {decryptionKey.length} / 64
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("approvalNote")} (Optional)</label>
                                    <Textarea
                                        placeholder={t("notePlaceholder")}
                                        value={approveNote}
                                        onChange={(e) => setApproveNote(e.target.value)}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button variant="ghost" onClick={closeApproveDialog}>Cancel</Button>
                                    <Button
                                        onClick={() => approveMutation.mutate()}
                                        disabled={decryptionKey.length !== 64 || approveMutation.isPending}
                                    >
                                        {approveMutation.isPending ? t("pending") : t("approve")}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("rejectRequest")}</DialogTitle>
                            <DialogDescription>
                                Provide a reason for rejecting this request. The team admin will be notified.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("rejectionNote")}</label>
                                <Textarea
                                    placeholder={t("notePlaceholder")}
                                    value={rejectNote}
                                    onChange={(e) => setRejectNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={() => rejectMutation.mutate()}
                                disabled={rejectNote.trim().length < 10 || rejectMutation.isPending}
                            >
                                {rejectMutation.isPending ? t("pending") : t("reject")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </AdminLayout>
    );
}
