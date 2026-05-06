"use client";

import { useState, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import { useTranslations } from "next-intl";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, History, ShieldAlert, User, FileText, AlertTriangle, Clock, ArrowRightLeft, Eye, Ban, Flag, Scale } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MINISTRIES, GOVERNORATES } from "@/lib/egypt-locations";

interface AuditEntry {
    id: string;
    complaint_id: string;
    complaint_type: string;
    action: string;
    old_status: string | null;
    new_status: string | null;
    note: string | null;
    performed_by: string;
    created_at: string;
    performer: {
        id: string;
        name: string | null;
        email: string;
        picture: string | null;
    };
    performerRoles: {
        role: string;
        teamName: string;
    }[];
}

const ACTION_LABELS: Record<string, { label: string; icon: typeof History; color: string }> = {
    status_change: { label: "Status Change", icon: ArrowRightLeft, color: "text-blue-500" },
    escalate: { label: "Escalation", icon: ShieldAlert, color: "text-orange-500" },
    flag_inaccurate: { label: "Flagged Inaccurate", icon: Flag, color: "text-yellow-500" },
    flag_legal: { label: "Legal Escalation", icon: Scale, color: "text-red-500" },
    identity_reveal: { label: "Identity Revealed", icon: Eye, color: "text-purple-500" },
    identity_reveal_request: { label: "Reveal Requested", icon: Eye, color: "text-amber-500" },
    identity_reveal_approved: { label: "Reveal Approved", icon: Eye, color: "text-green-500" },
    identity_reveal_rejected: { label: "Reveal Rejected", icon: Eye, color: "text-red-500" },
    ban_user: { label: "User Banned", icon: Ban, color: "text-red-600" },
};

export default function AuditsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <AuditsContent />
        </Suspense>
    );
}

function AuditsContent() {
    const { token } = useAuth();
    const { isPlatformAdmin, selectedTeamRole } = useAdmin();
    const router = useRouter();
    const t = useTranslations("Admin.audits");
    const tr = useTranslations("Admin.revealRequests");

    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");
    const [page, setPage] = useState(1);
    const locale = useLocale();
    const dateLocale = locale === "ar" ? ar : enUS;

    // Check access - reviewers don't have access
    const hasAccess = isPlatformAdmin || selectedTeamRole === "team_admin" || selectedTeamRole === "manager";

    // Build entity options
    const entityOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [
            { value: "all", label: t("allEntities") || "All Entities" }
        ];
        MINISTRIES.forEach(m => options.push({ value: m.id, label: m.name }));
        GOVERNORATES.forEach(g => options.push({ value: g.id, label: g.name }));
        return options;
    }, []);

    // Fetch audits
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["audits", { search: searchQuery, action: actionFilter, entity: entityFilter, page }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
            if (entityFilter && entityFilter !== "all") params.set("entity", entityFilter);
            params.set("page", String(page));
            params.set("limit", "50");

            const res = await fetch(`/api/admin/audits?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fetch audits");
            }
            return await res.json();
        },
        enabled: !!token && hasAccess,
    });

    const audits: AuditEntry[] = data?.data?.audits || [];
    const pagination = data?.data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 };

    if (!hasAccess) {
        return (
            <AdminLayout breadcrumbs={[{ label: t("title") }]}>
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{t("accessDenied") || "Access Denied"}</h2>
                    <p className="text-muted-foreground">
                        {t("noPermission") || "You don't have permission to view audit logs."}
                    </p>
                </div>
            </AdminLayout>
        );
    }

    const getActionInfo = (action: string) => {
        const info = ACTION_LABELS[action] || { label: action.replace(/_/g, " "), icon: History, color: "text-muted-foreground" };
        
        // Use translated label if available
        let translatedLabel = info.label;
        switch (action) {
            case "status_change": translatedLabel = t("statusChanges"); break;
            case "escalate": translatedLabel = t("escalations"); break;
            case "flag_inaccurate": translatedLabel = t("flaggedInaccurate"); break;
            case "flag_legal": translatedLabel = t("legalEscalations"); break;
            case "identity_reveal": translatedLabel = t("identityReveals"); break;
            case "identity_reveal_request": translatedLabel = t("revealRequests"); break;
            case "identity_reveal_approved": translatedLabel = tr("approved"); break;
            case "identity_reveal_rejected": translatedLabel = tr("rejected"); break;
            case "ban_user": translatedLabel = t("userBans"); break;
        }

        return { ...info, label: translatedLabel };
    };

    const getRoleBadge = (role: string) => {
        const tTeams = (key: string) => {
            switch (key) {
                case "teamAdmin": return locale === "ar" ? "مسؤول الفريق" : "Team Admin";
                case "manager": return locale === "ar" ? "مدير" : "Manager";
                case "reviewer": return locale === "ar" ? "مراجع" : "Reviewer";
                default: return role;
            }
        };
        switch (role) {
            case "team_admin":
                return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30">{tTeams("teamAdmin")}</Badge>;
            case "manager":
                return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">{tTeams("manager")}</Badge>;
            case "reviewer":
                return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">{tTeams("reviewer")}</Badge>;
            default:
                return <Badge variant="outline" className="text-xs">{role}</Badge>;
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: t("title") }]}>
            <div className="space-y-6 max-w-7xl mx-auto p-6">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <History className="h-6 w-6" />
                                {t("title")}
                            </h1>
                            <p className="text-muted-foreground">
                                {isPlatformAdmin 
                                    ? t("platformSubtitle")
                                    : selectedTeamRole === "team_admin"
                                        ? t("teamAdminSubtitle")
                                        : t("managerSubtitle")
                                }
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {t("totalEntries", { total: pagination.total })}
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={tr("searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-9"
                            />
                        </div>

                        {/* Entity Filter - Only for platform admin */}
                        {isPlatformAdmin && (
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
                        )}

                        {/* Action Filter */}
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder={t("filterAction")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("allActions")}</SelectItem>
                                <SelectItem value="status_change">{t("statusChanges")}</SelectItem>
                                <SelectItem value="escalate">{t("escalations")}</SelectItem>
                                <SelectItem value="flag_inaccurate">{t("flaggedInaccurate")}</SelectItem>
                                <SelectItem value="flag_legal">{t("legalEscalations")}</SelectItem>
                                <SelectItem value="identity_reveal">{t("identityReveals")}</SelectItem>
                                <SelectItem value="identity_reveal_request">{t("revealRequests")}</SelectItem>
                                <SelectItem value="ban_user">{t("userBans")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-blue-800 dark:text-blue-400">{t("auditTrail")}</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-500">
                            {t("auditTrailText")}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : audits.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-muted/10">
                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">{t("noEntries")}</h3>
                        <p className="text-muted-foreground">
                            {searchQuery || actionFilter !== "all" || entityFilter !== "all"
                                ? t("noEntriesHint")
                                : "No actions have been logged yet."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {isFetching && !isLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {locale === "ar" ? "جاري التحديث..." : "Refreshing..."}
                            </div>
                        )}
                        {audits.map((audit) => {
                            const actionInfo = getActionInfo(audit.action);
                            const ActionIcon = actionInfo.icon;
                            
                            return (
                                <Card key={audit.id} className="hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`p-2 rounded-full bg-muted ${actionInfo.color}`}>
                                                <ActionIcon className="h-4 w-4" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="font-medium">{actionInfo.label}</span>
                                                    {audit.old_status && audit.new_status && (
                                                        <span className="text-sm text-muted-foreground">
                                                            <Badge variant="outline" className="text-xs">{audit.old_status}</Badge>
                                                            <span className="mx-1">→</span>
                                                            <Badge variant="outline" className="text-xs">{audit.new_status}</Badge>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={audit.performer?.picture || undefined} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {audit.performer?.name?.[0] || "?"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{audit.performer?.name || audit.performer?.email}</span>
                                                    </div>
                                                    {audit.performerRoles.slice(0, 2).map((pr, i) => (
                                                        <span key={i}>
                                                            {getRoleBadge(pr.role)}
                                                        </span>
                                                    ))}
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true, locale: dateLocale })}
                                                    </span>
                                                </div>

                                                {/* Complaint Reference */}
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                                    <FileText className="h-3 w-3" />
                                                    <span>Complaint:</span>
                                                    <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                                                        {audit.complaint_id.substring(0, 24)}...
                                                    </code>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {audit.complaint_type}
                                                    </Badge>
                                                </div>

                                                {audit.note && (
                                                    <div className="text-sm bg-muted/50 p-2 rounded border">
                                                        <span className="text-muted-foreground italic">"{audit.note}"</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <div className="text-xs text-muted-foreground text-right shrink-0">
                                                {format(new Date(audit.created_at), "MMM d, yyyy")}
                                                <div>{format(new Date(audit.created_at), "HH:mm")}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2 pt-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                >
                                    {useTranslations("Admin.pagination")("previous")}
                                </button>
                                <span className="px-3 py-1 text-sm text-muted-foreground">
                                    {useTranslations("Admin.pagination")("pageOf", { page, total: pagination.totalPages })}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                >
                                    {useTranslations("Admin.pagination")("next")}
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
