"use client";

import { useSearchParams } from "next/navigation";

import { useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import {
    Search,
    RefreshCw,
    UserX,
    UserCheck,
    MoreHorizontal,
    Mail,
    Calendar,
    Shield,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

interface User {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    role: string;
    is_blocked: boolean;
    auth_provider: string;
    created_at: string;
    _count?: {
        complaints_identified: number;
    };
}

interface UsersResponse {
    success: boolean;
    data?: {
        users: User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    error?: string;
}

// Wrapper component with Suspense boundary
export default function UsersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <UsersPageContent />
        </Suspense>
    );
}

function UsersPageContent() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const blockedParam = searchParams.get("blocked");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [blockAction, setBlockAction] = useState<"block" | "unblock">("block");

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-users", { page, search, blocked: blockedParam }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "20");
            if (search) params.set("search", search);
            if (blockedParam) params.set("blocked", blockedParam);

            const res = await fetch(apiUrl(`/api/admin/users?${params}`), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Failed to fetch users");
            }
            return await res.json() as UsersResponse;
        },
        enabled: !!token,
    });

    const blockMutation = useMutation({
        mutationFn: async ({ userId, action }: { userId: string; action: "block" | "unblock" }) => {
            const res = await fetch(apiUrl(`/api/admin/users/${userId}/${action}`), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Failed to ${action} user`);
            }
            return await res.json();
        },
        onSuccess: (_, variables) => {
            toast.success(`User ${variables.action === "block" ? "blocked" : "unblocked"} successfully`);
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setBlockDialogOpen(false);
            setSelectedUser(null);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const users = data?.data?.users || [];
    const pagination = data?.data?.pagination;

    const handleBlockClick = (user: User, action: "block" | "unblock") => {
        setSelectedUser(user);
        setBlockAction(action);
        setBlockDialogOpen(true);
    };

    const confirmBlockAction = () => {
        if (selectedUser) {
            blockMutation.mutate({ userId: selectedUser.id, action: blockAction });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <AdminLayout breadcrumbs={[{ label: "Users" }]}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">User Management</h1>
                        <p className="text-muted-foreground">Manage users and their permissions</p>
                    </div>
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Search */}
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>

                {/* Users Table */}
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-center p-12 bg-red-500/5 rounded-xl border border-red-500/20">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-500">Failed to load users</h3>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            Try Again
                        </Button>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center p-16 border border-dashed border-border rounded-xl">
                        <h3 className="text-lg font-medium">No users found</h3>
                        <p className="text-muted-foreground">Try adjusting your search criteria</p>
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.picture || ""} />
                                                    <AvatarFallback>
                                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.name || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.is_blocked ? (
                                                <Badge variant="destructive">
                                                    <UserX className="h-3 w-3 mr-1" />
                                                    Blocked
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-600">
                                                    <UserCheck className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.auth_provider}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(user.created_at)}
                                            </div>
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
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>View Complaints</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.is_blocked ? (
                                                        <DropdownMenuItem
                                                            onClick={() => handleBlockClick(user, "unblock")}
                                                            className="text-green-600"
                                                        >
                                                            <UserCheck className="h-4 w-4 mr-2" />
                                                            Unblock User
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => handleBlockClick(user, "block")}
                                                            className="text-red-600"
                                                        >
                                                            <UserX className="h-4 w-4 mr-2" />
                                                            Block User
                                                        </DropdownMenuItem>
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

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm font-mono text-muted-foreground">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* Block/Unblock Confirmation Dialog */}
            <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {blockAction === "block" ? "Block User" : "Unblock User"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {blockAction === "block"
                                ? `Are you sure you want to block ${selectedUser?.email}? They will not be able to submit new complaints.`
                                : `Are you sure you want to unblock ${selectedUser?.email}? They will be able to use the platform again.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBlockAction}
                            className={blockAction === "block" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {blockMutation.isPending ? "Processing..." : blockAction === "block" ? "Block" : "Unblock"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
