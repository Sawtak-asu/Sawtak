/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin-layout";
import {
    ArrowLeft,
    RefreshCw,
    Plus,
    Users,
    AlertCircle,
    MoreHorizontal,
    Trash2,
    Shield,
    Eye,
    FileCheck,
    Building2,
    MapPin,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface TeamMember {
    id: string;
    role: "reviewer" | "manager" | "team_admin";
    created_at: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        picture: string | null;
        role: string;
    };
}

interface Team {
    id: string;
    entity_id: string;
    type: "ministry" | "governorate" | "center";
    displayName: string;
    displayNameAr: string;
    created_at: string;
    members: TeamMember[];
}

interface User {
    id: string;
    email: string;
    name: string | null;
}

export default function TeamDetailClient({ params }: { params: { id: string; locale: string } }) {
    const teamId = params.id;
    const { token, user } = useAuth();
    const locale = useLocale();
    const t = useTranslations("Admin.teams");
    const queryClient = useQueryClient();

    // Check if user is platform admin
    const isPlatformAdmin = user?.role === "platform_admin";

    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
    const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRole, setSelectedRole] = useState<"reviewer" | "manager" | "team_admin">("reviewer");
    const [userSearch, setUserSearch] = useState("");

    // Fetch team details
    const { data: teamData, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-team", teamId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/teams/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch team");
            return await res.json();
        },
        enabled: !!token && !!teamId,
    });

    // Search users for adding to team
    const { data: usersData, isLoading: isSearching } = useQuery({
        queryKey: ["admin-users-search", userSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (userSearch) params.set("search", userSearch);
            params.set("limit", "5");
            params.set("excludeRole", "platform_admin"); // Don't show platform admins
            const res = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to search users");
            return await res.json();
        },
        enabled: !!token && addMemberDialogOpen,
    });

    const searchResults = usersData?.data?.users || [];

    // Add member mutation
    const addMemberMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const res = await fetch(`/api/admin/teams/${teamId}/members`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, role }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to add member");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["admin-team", teamId] });
            setAddMemberDialogOpen(false);
            setSelectedUserId("");
            setUserSearch("");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/admin/teams/${teamId}/members/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to remove member");
            }
            return await res.json();
        },
        onSuccess: () => {
            toast.success("Member removed successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-team", teamId] });
            setRemoveMemberDialogOpen(false);
            setSelectedMember(null);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Update member role mutation
    const updateMemberRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const res = await fetch(`/api/admin/teams/${teamId}/members/${userId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update member role");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["admin-team", teamId] });
            setChangeRoleDialogOpen(false);
            setSelectedMember(null);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const team: Team | null = teamData?.data || null;
    const users: User[] = usersData?.data?.users || [];

    // Filter out users already in the team
    const existingMemberIds = new Set(team?.members.map(m => m.user.id) || []);
    const availableUsers = users.filter(u => !existingMemberIds.has(u.id));

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "reviewer": return <Eye className="h-4 w-4" />;
            case "manager": return <FileCheck className="h-4 w-4" />;
            case "team_admin": return <Shield className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "reviewer": return "secondary";
            case "manager": return "default";
            case "team_admin": return "destructive";
            default: return "outline";
        }
    };

    const getTypeIcon = (type: string) => {
        return type === "ministry" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />;
    };

    if (isLoading) {
        return (
            <AdminLayout breadcrumbs={[{ label: t("title"), href: `/${locale}/admin/teams` }, { label: t("loading") }]}>
                <div className="p-6 space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </AdminLayout>
        );
    }

    if (isError || !team) {
        return (
            <AdminLayout breadcrumbs={[{ label: t("title"), href: `/${locale}/admin/teams` }, { label: t("error") }]}>
                <div className="p-6">
                    <div className="text-center p-12 bg-red-500/5 rounded-xl border border-red-500/20">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-500">{t("failedToLoad")}</h3>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            {t("tryAgain")}
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={[{ label: t("title"), href: `/${locale}/admin/teams` }, { label: team.displayName }]}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/${locale}/admin/teams`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            {getTypeIcon(team.type)}
                            <h1 className="text-2xl font-semibold">
                                {locale === "ar" ? team.displayNameAr : team.displayName}
                            </h1>
                            <Badge>{team.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {locale === "ar" ? team.displayName : team.displayNameAr}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 me-2" />
                        {t("refresh")}
                    </Button>
                </div>

                {/* Team Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {t("teamMembersCount", { count: team.members.length })}
                        </CardTitle>
                        <CardDescription>
                            {t("addMembersDescription")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isPlatformAdmin && (
                            <Button onClick={() => setAddMemberDialogOpen(true)}>
                                <Plus className="h-4 w-4 me-2" />
                                {t("addMember")}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Role Legend */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary"><Eye className="h-3 w-3 me-1" />{t("roles.reviewer")}</Badge>
                        <span>{t("roles.reviewerDesc")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge><FileCheck className="h-3 w-3 me-1" />{t("roles.manager")}</Badge>
                        <span>{t("roles.managerDesc")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-black font-semibold"><Shield className="h-3 w-3 me-1 text-black" />{t("roles.teamAdmin")}</Badge>
                        <span>{t("roles.teamAdminDesc")}</span>
                    </div>
                </div>

                {/* Members Table */}
                {team.members.length === 0 ? (
                    <div className="text-center p-16 border border-dashed border-border rounded-xl">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">{t("noMembersYet")}</h3>
                        <p className="text-muted-foreground mb-4">
                            {isPlatformAdmin
                                ? t("noMembersDescription")
                                : t("noMembersAssigned")}
                        </p>
                        {isPlatformAdmin && (
                            <Button onClick={() => setAddMemberDialogOpen(true)}>
                                <Plus className="h-4 w-4 me-2" />
                                {t("addFirstMember")}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("member")}</TableHead>
                                    <TableHead>{t("email")}</TableHead>
                                    <TableHead>{t("teamRole")}</TableHead>
                                    <TableHead className="text-end">{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {team.members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.user.picture || ""} />
                                                    <AvatarFallback>
                                                        {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.user.name || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {member.user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleBadgeVariant(member.role) as any}>
                                                {getRoleIcon(member.role)}
                                                <span className="ms-1">{t(`roles.${member.role === "team_admin" ? "teamAdmin" : member.role}`)}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                                                    {isPlatformAdmin && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setSelectedRole(member.role);
                                                                    setChangeRoleDialogOpen(true);
                                                                }}
                                                            >
                                                                <RefreshCw className="h-4 w-4 me-2" />
                                                                {t("changeRole")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setRemoveMemberDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4 me-2" />
                                                                {t("removeFromTeam")}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Add Member Dialog */}
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("addTeamMember")}</DialogTitle>
                        <DialogDescription>
                            {t("searchUserDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("searchUser")}</label>
                            <Input
                                placeholder={t("typeToSearch")}
                                value={userSearch}
                                onChange={(e) => {
                                    setUserSearch(e.target.value);
                                    if (selectedUserId) setSelectedUserId("");
                                }}
                            />
                            {userSearch && (
                                <div className="border rounded-md mt-2 max-h-48 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="p-2 text-sm text-center text-muted-foreground">{t("searching")}</div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="flex flex-col">
                                            {searchResults.map((user: any) => (
                                                <button
                                                    key={user.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 text-sm text-left hover:bg-muted transition-colors",
                                                        selectedUserId === user.id ? "bg-primary/10 text-primary font-medium" : ""
                                                    )}
                                                    onClick={() => {
                                                        setSelectedUserId(user.id);
                                                        setUserSearch(user.email);
                                                    }}
                                                >
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={user.picture || ""} />
                                                        <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span>{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-2 text-sm text-center text-muted-foreground">{t("noUsersFound")}</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedUserId && (
                            <div className="p-2 bg-muted/50 rounded-md flex items-center gap-2 border border-primary/20">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{t("userSelected")}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("role")}</label>
                            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reviewer">{t("roles.reviewer")}</SelectItem>
                                    <SelectItem value="manager">{t("roles.manager")}</SelectItem>
                                    <SelectItem value="team_admin">{t("roles.teamAdmin")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>{t("cancel")}</Button>
                        <Button
                            onClick={() => addMemberMutation.mutate({ userId: selectedUserId, role: selectedRole })}
                            disabled={!selectedUserId || addMemberMutation.isPending}
                        >
                            {addMemberMutation.isPending ? t("adding") : t("addMember")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Member AlertDialog */}
            <AlertDialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("removeConfirmation", { name: selectedMember?.user.name || selectedMember?.user.email || "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedMember && removeMemberMutation.mutate(selectedMember.user.id)}
                            className="bg-red-600 hover:bg-red-700 font-semibold"
                        >
                            {removeMemberMutation.isPending ? t("removing") : t("remove")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Change Role Dialog */}
            <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("changeMemberRole")}</DialogTitle>
                        <DialogDescription>
                            {t("updateRoleDescription", { name: selectedMember?.user.name || selectedMember?.user.email || "" })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("newRole")}</label>
                            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reviewer">{t("roles.reviewer")}</SelectItem>
                                    <SelectItem value="manager">{t("roles.manager")}</SelectItem>
                                    <SelectItem value="team_admin">{t("roles.teamAdmin")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>{t("cancel")}</Button>
                        <Button
                            onClick={() => selectedMember && updateMemberRoleMutation.mutate({ userId: selectedMember.user.id, role: selectedRole })}
                            disabled={updateMemberRoleMutation.isPending}
                        >
                            {updateMemberRoleMutation.isPending ? t("updating") : t("updateRole")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
