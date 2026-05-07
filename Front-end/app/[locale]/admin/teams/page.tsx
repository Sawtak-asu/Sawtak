"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import {
    Search,
    RefreshCw,
    Plus,
    Building2,
    MapPin,
    Users,
    AlertCircle,
    MoreHorizontal,
    Trash2,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface Team {
    id: string;
    entity_id: string;
    type: "ministry" | "governorate" | "center";
    displayName: string;
    displayNameAr: string;
    memberCount: number;
    created_at: string;
    members?: Array<{
        id: string;
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
            picture: string | null;
        };
    }>;
}

interface AvailableEntity {
    id: string;
    name: string;
    nameAr: string;
}

export default function TeamsPage() {
    const { token, user } = useAuth();
    const locale = useLocale();
    const t = useTranslations("Admin.teams");
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [selectedEntityType, setSelectedEntityType] = useState<"ministry" | "governorate">("ministry");
    const [selectedEntityId, setSelectedEntityId] = useState("");

    // Check if user is platform admin
    const isPlatformAdmin = user?.role === "platform_admin";

    // Fetch teams
    const { data: teamsData, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-teams"],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/admin/teams`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch teams");
            return await res.json();
        },
        enabled: !!token,
    });

    // Fetch available entities (not yet created as teams)
    const { data: availableData } = useQuery({
        queryKey: ["available-entities"],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/admin/teams/available-entities`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch entities");
            return await res.json();
        },
        enabled: !!token && createDialogOpen,
    });

    // Create team mutation
    const createMutation = useMutation({
        mutationFn: async ({ entityId, type }: { entityId: string; type: string }) => {
            console.log("User:", user);
            const res = await fetch(apiUrl(`/api/admin/teams`), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ entityId, type }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create team");
            }
            return await res.json();
        },
        onSuccess: () => {
            toast.success("Team created successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
            queryClient.invalidateQueries({ queryKey: ["available-entities"] });
            setCreateDialogOpen(false);
            setSelectedEntityId("");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete team mutation
    const deleteMutation = useMutation({
        mutationFn: async (teamId: string) => {
            const res = await fetch(apiUrl(`/api/admin/teams/${teamId}`), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete team");
            }
            return await res.json();
        },
        onSuccess: () => {
            toast.success("Team deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
            setDeleteDialogOpen(false);
            setSelectedTeam(null);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const teams: Team[] = teamsData?.data?.teams || [];
    const availableMinistries: AvailableEntity[] = availableData?.data?.ministries || [];
    const availableGovernorates: AvailableEntity[] = availableData?.data?.governorates || [];

    const filteredTeams = teams.filter(team =>
        team.displayName.toLowerCase().includes(search.toLowerCase()) ||
        team.displayNameAr.includes(search)
    );

    const handleCreateTeam = () => {
        if (!selectedEntityId) {
            toast.error("Please select an entity");
            return;
        }
        createMutation.mutate({ entityId: selectedEntityId, type: selectedEntityType });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "ministry":
                return <Building2 className="h-4 w-4" />;
            case "governorate":
            case "center":
                return <MapPin className="h-4 w-4" />;
            default:
                return <Building2 className="h-4 w-4" />;
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case "ministry":
                return "default";
            case "governorate":
                return "secondary";
            case "center":
                return "outline";
            default:
                return "secondary";
        }
    };

    return (
        <AdminLayout breadcrumbs={[{ label: t("title") }]}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{t("teamsManagement")}</h1>
                        <p className="text-muted-foreground">
                            {t("teamsSubtitle")}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />
                            {t("refresh")}
                        </Button>
                        {isPlatformAdmin && (
                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 me-2" />
                                        {t("createTeam")}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t("createNewTeam")}</DialogTitle>
                                        <DialogDescription>
                                            {t("createTeamDescription")}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t("entityType")}</label>
                                            <Select
                                                value={selectedEntityType}
                                                onValueChange={(v: "ministry" | "governorate") => {
                                                    setSelectedEntityType(v);
                                                    setSelectedEntityId("");
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ministry">{t("ministry")}</SelectItem>
                                                    <SelectItem value="governorate">{t("governorate")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">{t("entity")}</label>
                                            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("selectEntity")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(selectedEntityType === "ministry" ? availableMinistries : availableGovernorates).map(entity => (
                                                        <SelectItem key={entity.id} value={entity.id}>
                                                            {locale === "ar" ? entity.nameAr : entity.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                            {t("cancel")}
                                        </Button>
                                        <Button onClick={handleCreateTeam} disabled={createMutation.isPending}>
                                            {createMutation.isPending ? t("creating") : t("createTeam")}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchTeams")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9 bg-background"
                        />
                    </div>
                </div>

                {/* Teams Grid */}
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-center p-12 bg-red-500/5 rounded-xl border border-red-500/20">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-500">{t("failedToLoadTeams")}</h3>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            {t("tryAgain")}
                        </Button>
                    </div>
                ) : filteredTeams.length === 0 ? (
                    <div className="text-center p-16 border border-dashed border-border rounded-xl">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">{t("noTeamsYet")}</h3>
                        <p className="text-muted-foreground mb-4">
                            {isPlatformAdmin
                                ? t("noTeamsDescription")
                                : t("noTeamsContact")}
                        </p>
                        {isPlatformAdmin && (
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 me-2" />
                                {t("createFirstTeam")}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTeams.map((team) => (
                            <Card key={team.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(team.type)}
                                            <Badge variant={getTypeBadgeVariant(team.type) as any}>
                                                {team.type}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <Link href={`/${locale}/admin/teams/${team.id}`}>
                                                    <DropdownMenuItem>
                                                        <Eye className="h-4 w-4 me-2" />
                                                        {t("viewDetails")}
                                                    </DropdownMenuItem>
                                                </Link>
                                                {isPlatformAdmin && (
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            setSelectedTeam(team);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 me-2" />
                                                        {t("deleteTeam")}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="text-lg mt-2">
                                        {locale === "ar" ? team.displayNameAr : team.displayName}
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        {locale === "ar" ? team.displayName : team.displayNameAr}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{t("members", { count: team.memberCount })}</span>
                                    </div>
                                    <Link href={`/${locale}/admin/teams/${team.id}`}>
                                        <Button variant="outline" size="sm" className="w-full mt-4">
                                            {t("manageTeam")}
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteTeam")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteTeamConfirmation", { name: selectedTeam?.displayName || "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedTeam && deleteMutation.mutate(selectedTeam.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending ? t("deleting") : t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
