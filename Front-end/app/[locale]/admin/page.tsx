"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import {
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    TrendingUp,
    Users,
    Shield,
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
import { ComplaintCard, Complaint } from "@/components/complaint-card";
import { AdminLayout } from "@/components/admin-layout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdminFeedResponse {
    success: boolean;
    data?: {
        complaints: Complaint[];
        stats: {
            total: number;
            pending: number;
            investigating: number;
            resolved: number;
            dismissed: number;
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
    const t = useTranslations("Admin");

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-complaints", { page, search, statusFilter, visibilityFilter }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "12");
            params.set("includePrivate", "true");
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);

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
        enabled: isLoggedIn && !!token && user?.role?.toUpperCase() === 'ADMIN',
    });

    const complaints = data?.data?.complaints || [];
    const stats = data?.data?.stats;
    const pagination = data?.data?.pagination;

    return (
        <AdminLayout breadcrumbs={[{ label: "Dashboard" }]}>
            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                <Clock className="h-3 w-3" /> {t("stats.pending")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.pending || 0}</CardTitle>
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
                            <CardDescription className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" /> {t("stats.resolved")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.resolved || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-3 w-3" /> {t("stats.dismissed")}
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats?.dismissed || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Pending Review</CardTitle>
                                    <CardDescription>{stats?.pending || 0} complaints need attention</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">User Management</CardTitle>
                                    <CardDescription>Manage users and permissions</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Shield className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Admin Team</CardTitle>
                                    <CardDescription>View admin activity</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("filters.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder={t("filters.status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                            <SelectItem value="submitted">{t("stats.pending")}</SelectItem>
                            <SelectItem value="investigating">{t("stats.investigating")}</SelectItem>
                            <SelectItem value="resolved">{t("stats.resolved")}</SelectItem>
                            <SelectItem value="dismissed">{t("stats.dismissed")}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder={t("filters.visibility")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("filters.allVisibility")}</SelectItem>
                            <SelectItem value="public">{t("filters.public")}</SelectItem>
                            <SelectItem value="private">{t("filters.private")}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {t("refresh")}
                    </Button>
                </div>

                {/* Recent Complaints */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Recent Complaints</h2>
                    {isLoading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="text-center p-12 bg-red-500/5 rounded-xl border border-red-500/20">
                            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                            <h3 className="text-lg font-semibold text-red-500">{t("error.title")}</h3>
                            <p className="text-sm text-red-400">{t("error.message")}</p>
                            <Button variant="outline" className="mt-4 border-red-500/20 hover:bg-red-500/10" onClick={() => refetch()}>{t("error.retry")}</Button>
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center p-16 border border-dashed border-border rounded-xl">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                            <p className="text-muted-foreground">{t("empty.message")}</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {complaints.slice(0, 6).map((complaint) => (
                                <ComplaintCard key={complaint.id} complaint={complaint} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2">
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
            </div>
        </AdminLayout>
    );
}
