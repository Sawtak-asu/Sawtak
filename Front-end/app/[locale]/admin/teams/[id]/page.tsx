"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin-layout";
import { useParams } from "next/navigation";
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
import { useLocale } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export default function TeamDetailPage() {
    const params = useParams();
    const teamId = params.id as string;
    const { token, user } = useAuth();
    const locale = useLocale();
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
            const res = await fetch(`${API_URL}/api/admin/teams/${teamId}`, {
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
            const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to search users");
            return await res.json();
        },
        enabled: !!token && addMemberDialogOpen,
    });

    const searchResults = usersData?.data?.users || [];
    // ...
    // Add member mutation
    const addMemberMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const res = await fetch(`${API_URL}/api/admin/teams/${teamId}/members`, {
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
            const res = await fetch(`${API_URL}/api/admin/teams/${teamId}/members/${userId}`, {
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
            const res = await fetch(`${API_URL}/api/admin/teams/${teamId}/members/${userId}`, {
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
            case "reviewer":
                return <Eye className="h-4 w-4" />;
            case "manager":
                return <FileCheck className="h-4 w-4" />;
            case "team_admin":
                return <Shield className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "reviewer":
                return "secondary";
            case "manager":
                return "default";
            case "team_admin":
                return "destructive";
            default:
                return "outline";
        }
    };

    const getTypeIcon = (type: string) => {
        return type === "ministry" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />;
    };

    if (isLoading) {
        return (
            <AdminLayout breadcrumbs={[{ label: "Teams", href: `/${locale}/admin/teams` }, { label: "Loading..." }]}>
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
            <AdminLayout breadcrumbs={[{ label: "Teams", href: `/${locale}/admin/teams` }, { label: "Error" }]}>
                <div className="p-6">
                    <div className="text-center p-12 bg-red-500/5 rounded-xl border border-red-500/20">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-500">Failed to load team</h3>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={[{ label: "Teams", href: `/${locale}/admin/teams` }, { label: team.displayName }]}>
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
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Team Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members ({team.members.length})
                        </CardTitle>
                        <CardDescription>
                            Add reviewers, managers, or admins to handle complaints for this entity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isPlatformAdmin && (
                            <Button onClick={() => setAddMemberDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Role Legend */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Reviewer</Badge>
                        <span>Close or escalate with priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge><FileCheck className="h-3 w-3 mr-1" />Manager</Badge>
                        <span>Investigate, resolve, or flag</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-black font-semibold"><Shield className="h-3 w-3 mr-1 text-black" />Team Admin</Badge>
                        <span>Legal escalation & audits</span>
                    </div>
                </div>

                {/* Members Table */}
                {team.members.length === 0 ? (
                    <div className="text-center p-16 border border-dashed border-border rounded-xl">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No members yet</h3>
                        <p className="text-muted-foreground mb-4">
                            {isPlatformAdmin
                                ? "Add team members to handle complaints."
                                : "No members have been assigned yet."}
                        </p>
                        {isPlatformAdmin && (
                            <Button onClick={() => setAddMemberDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Member
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Team Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
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
                                                <span className="ml-1 capitalize">{member.role}</span>
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
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                                Change Role
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setRemoveMemberDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Remove from Team
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
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Search for a user and assign them a role in this team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search User (Email or Name)</label>
                            <Input
                                placeholder="Type to search..."
                                value={userSearch}
                                onChange={(e) => {
                                    setUserSearch(e.target.value);
                                    if (selectedUserId) setSelectedUserId(""); // Clear selection on search
                                }}
                            />

                            {/* Search Results */}
                            {userSearch && (
                                <div className="border rounded-md mt-2 max-h-48 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="p-2 text-sm text-center text-muted-foreground">Searching...</div>
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
                                                        setUserSearch(user.email); // Set input to email
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
                                                    {user.role === "user" && (
                                                        <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                                            Will promote
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-2 text-sm text-center text-muted-foreground">No users found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedUserId && (
                            <div className="p-2 bg-muted/50 rounded-md flex items-center gap-2 border border-primary/20">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">User selected</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reviewer">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Reviewer - Close or escalate with priority
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="manager">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4" />
                                            Manager - Investigate, resolve, or flag
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="team_admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Team Admin - Legal escalation & audits
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => addMemberMutation.mutate({ userId: selectedUserId, role: selectedRole })}
                            disabled={!selectedUserId || addMemberMutation.isPending}
                        >
                            {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Member Confirmation */}
            <AlertDialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {selectedMember?.user.name || selectedMember?.user.email} from this team?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedMember && removeMemberMutation.mutate(selectedMember.user.id)}
                            className="bg-red-600 hover:bg-red-700 font-semibold"
                        >
                            {removeMemberMutation.isPending ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Change Role Dialog */}
            <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Member Role</DialogTitle>
                        <DialogDescription>
                            Update the role for {selectedMember?.user.name || selectedMember?.user.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Role</label>
                            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reviewer">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Reviewer - Close or escalate with priority
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="manager">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4" />
                                            Manager - Investigate, resolve, or flag
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="team_admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Team Admin - Legal escalation & audits
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedMember && updateMemberRoleMutation.mutate({ userId: selectedMember.user.id, role: selectedRole })}
                            disabled={updateMemberRoleMutation.isPending}
                        >
                            {updateMemberRoleMutation.isPending ? "Updating..." : "Update Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
