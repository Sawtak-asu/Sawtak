"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import { useTranslations } from "next-intl";
import {
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    AlertTriangle,
    FileText,
    TrendingUp,
    Users,
    Shield,
    Ban,
    ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ComplaintCard, Complaint } from "@/components/admin.complaint-card";
import { AdminLayout } from "@/components/admin-layout";
import { useRouter } from "next/navigation";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdminFeedResponse {
    success: boolean;
    data?: {
        complaints: Complaint[];
        stats: {
            total: number;
            submitted: number;
            investigating: number;
            closed: number;
            resolved: number;
            flagged: number;
        };
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    error?: string;
}

export default function AdminDashboard() {
    const { user, isLoggedIn, token, isLoading: isAuthLoading } = useAuth();
    const { selectedTeam } = useAdmin();
    const t = useTranslations("Admin");
    const queryClient = useQueryClient();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");
    // Action States
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
    const [closeNote, setCloseNote] = useState("");
    const [escalateNote, setEscalateNote] = useState("");
    const [escalatePriority, setEscalatePriority] = useState("medium");
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-complaints", { page, search, statusFilter, visibilityFilter, team: selectedTeam?.entity_id }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "12");
            params.set("includePrivate", "true");
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);

            // Filter by team entity if selected (using entity param for JSON filtering)
            if (selectedTeam?.entity_id) {
                params.set("entity", selectedTeam.entity_id);
            }

            const res = await fetch(`${API_URL}/api/admin/complaints?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Failed to fetch complaints");
            }
            return await res.json() as AdminFeedResponse;
        },
        enabled: isLoggedIn && !!token,
    });

    const complaints = data?.data?.complaints || [];
    const stats = data?.data?.stats;
    const pagination = data?.data?.pagination;

    // Close Mutation
    const closeMutation = useMutation({
        mutationFn: async () => {
            if (!selectedComplaint) return;
            const res = await fetch(`${API_URL}/api/admin/complaints/${selectedComplaint.id}/status`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status: "closed", note: closeNote })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Complaint closed");
            setCloseDialogOpen(false);
            setCloseNote("");
            queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
        },
        onError: (err: Error) => toast.error(err.message)
    });

    // Escalate Mutation
    const escalateMutation = useMutation({
        mutationFn: async () => {
            if (!selectedComplaint) return;
            const res = await fetch(`${API_URL}/api/admin/complaints/${selectedComplaint.id}/escalate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ priority: escalatePriority, note: escalateNote })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Complaint escalated");
            setEscalateDialogOpen(false);
            setEscalateNote("");
            queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
        },
        onError: (err: Error) => toast.error(err.message)
    });

    return (
        <AdminLayout breadcrumbs={[{ label: t("dashboard.title") }]}>
            <div className="p-6 space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
                    {selectedTeam && <p className="text-muted-foreground">{t("dashboard.overviewFor", { team: selectedTeam.displayName })}</p>}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> {t("stats.total")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1 text-yellow-600">
                                <Clock className="h-3 w-3" /> {t("stats.submitted")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.submitted || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1 text-blue-600">
                                <Search className="h-3 w-3" /> {t("stats.investigating")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.investigating || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1 text-slate-600">
                                <XCircle className="h-3 w-3" /> {t("stats.closed")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.closed || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" /> {t("stats.resolved")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.resolved || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1 text-red-600">
                                <AlertTriangle className="h-3 w-3" /> {t("stats.flagged")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.flagged || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("filters.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9 bg-background"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder={t("filters.status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                            <SelectItem value="submitted">{t("stats.submitted")}</SelectItem>
                            <SelectItem value="investigating">{t("stats.investigating")}</SelectItem>
                            <SelectItem value="closed">{t("stats.closed")}</SelectItem>
                            <SelectItem value="resolved">{t("stats.resolved")}</SelectItem>
                            <SelectItem value="flagged">{t("stats.flagged")}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {t("refresh")}
                    </Button>
                </div>

                {/* Complaint List */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{t("dashboard.recentComplaints")}</h2>
                    </div>
                    {isLoading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center p-16 border border-dashed border-border rounded-xl">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                            <p className="text-muted-foreground">{t("empty.message")}</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {complaints.map((complaint) => (
                                <ComplaintCard key={complaint.id} complaint={complaint} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            {t("pagination.previous")}
                        </Button>
                        <span className="flex items-center px-4 text-sm font-mono text-muted-foreground">
                            {t("pagination.pageOf", { page, total: pagination.totalPages })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            {t("pagination.next")}
                        </Button>
                    </div>
                )}

                {/* Action Dialogs */}
                <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("dashboard.closeComplaint")}</DialogTitle>
                            <DialogDescription>{t("dashboard.closeReason")}</DialogDescription>
                        </DialogHeader>
                        <div className="py-2"><Textarea value={closeNote} onChange={e => setCloseNote(e.target.value)} placeholder={t("dashboard.note")} /></div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setCloseDialogOpen(false)}>{t("dashboard.cancel")}</Button>
                            <Button variant="destructive" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>{t("dashboard.close")}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("dashboard.escalate")}</DialogTitle>
                            <DialogDescription>{t("dashboard.selectPriority")}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <Select onValueChange={setEscalatePriority} defaultValue="medium">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">{t("dashboard.low")}</SelectItem>
                                    <SelectItem value="medium">{t("dashboard.medium")}</SelectItem>
                                    <SelectItem value="high">{t("dashboard.high")}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea value={escalateNote} onChange={e => setEscalateNote(e.target.value)} placeholder={t("dashboard.internalNote")} />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setEscalateDialogOpen(false)}>{t("dashboard.cancel")}</Button>
                            <Button onClick={() => escalateMutation.mutate()} disabled={escalateMutation.isPending}>{t("dashboard.escalate")}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
