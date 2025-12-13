"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { 
    Shield, 
    Users, 
    FileText, 
    Eye, 
    EyeOff, 
    Clock, 
    CheckCircle, 
    XCircle,
    AlertCircle,
    Search,
    Filter,
    RefreshCw,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdminComplaint {
    id: string;
    title: string;
    text: string;
    category: string;
    area: string;
    status: string;
    submissionMode: "anonymous" | "public";
    visibility?: "public" | "private";
    createdAt: string;
    incidentDate?: string;
    user?: {
        name: string | null;
        email?: string;
    };
    transactionId?: string;
    trackingCode?: string;
}

interface AdminFeedResponse {
    success: boolean;
    data?: {
        complaints: AdminComplaint[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        stats: {
            total: number;
            pending: number;
            investigating: number;
            resolved: number;
            dismissed: number;
        };
    };
    error?: string;
}

const statusColors: Record<string, string> = {
    submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    investigating: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    resolved: "bg-green-500/10 text-green-600 border-green-500/20",
    dismissed: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusIcons: Record<string, React.ReactNode> = {
    submitted: <Clock className="h-3 w-3" />,
    investigating: <Search className="h-3 w-3" />,
    resolved: <CheckCircle className="h-3 w-3" />,
    dismissed: <XCircle className="h-3 w-3" />,
};

export default function AdminDashboard() {
    const { user, isLoggedIn, token } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");
    const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [statusNote, setStatusNote] = useState("");

    // Fetch complaints (including private ones for admin)
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-complaints", { page, search, statusFilter, visibilityFilter }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "20");
            params.set("includePrivate", "true");
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);

            const res = await fetch(`${API_URL}/api/admin/complaints?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.json() as Promise<AdminFeedResponse>;
        },
        enabled: isLoggedIn && !!token,
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ complaintId, status, note }: { complaintId: string, status: string, note: string }) => {
            const res = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status, note }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
            setSelectedComplaint(null);
            setNewStatus("");
            setStatusNote("");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update status");
        },
    });

    // Redirect if not admin (TODO: implement proper role check)
    // For now, we'll show the UI but the API will reject unauthorized requests

    const complaints = data?.data?.complaints || [];
    const stats = data?.data?.stats;
    const pagination = data?.data?.pagination;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            {/* Header */}
            <div className="border-b border-border bg-muted/30">
                <div className="container max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage and review all complaints including private submissions
                    </p>
                </div>
            </div>

            <div className="container max-w-7xl mx-auto px-6 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total</CardDescription>
                            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Pending
                            </CardDescription>
                            <CardTitle className="text-3xl text-yellow-600">{stats?.pending || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Search className="h-3 w-3" /> Investigating
                            </CardDescription>
                            <CardTitle className="text-3xl text-blue-600">{stats?.investigating || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Resolved
                            </CardDescription>
                            <CardTitle className="text-3xl text-green-600">{stats?.resolved || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Dismissed
                            </CardDescription>
                            <CardTitle className="text-3xl text-red-600">{stats?.dismissed || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search complaints..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="submitted">Pending</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="public">Public Only</SelectItem>
                            <SelectItem value="private">Private Only</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Complaints Table */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="p-12 text-center">
                                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                                <p className="text-lg font-medium">Failed to load complaints</p>
                                <p className="text-sm text-muted-foreground mb-4">Make sure you have admin access</p>
                                <Button onClick={() => refetch()}>Try Again</Button>
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No complaints found</p>
                                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Visibility</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {complaints.map((complaint) => (
                                            <tr key={complaint.id} className="hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-sm truncate max-w-[200px]">
                                                            {complaint.title}
                                                        </p>
                                                        {complaint.user?.name && (
                                                            <p className="text-xs text-muted-foreground">
                                                                by {complaint.user.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="capitalize">
                                                        {complaint.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={complaint.submissionMode === "anonymous" ? "secondary" : "default"}>
                                                        {complaint.submissionMode === "anonymous" ? "🔒 Anonymous" : "👤 Identified"}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={`${statusColors[complaint.status] || ''} flex items-center gap-1 w-fit`}>
                                                        {statusIcons[complaint.status]}
                                                        {complaint.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {complaint.visibility === "private" ? (
                                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <EyeOff className="h-3 w-3" /> Private
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-sm">
                                                            <Eye className="h-3 w-3" /> Public
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedComplaint(complaint);
                                                                    setNewStatus(complaint.status);
                                                                }}
                                                            >
                                                                Update
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>{complaint.title}</DialogTitle>
                                                                <DialogDescription>
                                                                    Update the status of this complaint
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div>
                                                                    <p className="text-sm font-medium mb-1">Complaint Text</p>
                                                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                                                        {complaint.text}
                                                                    </p>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-sm font-medium mb-1">Category</p>
                                                                        <p className="text-sm capitalize">{complaint.category}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium mb-1">Area</p>
                                                                        <p className="text-sm">{complaint.area || "N/A"}</p>
                                                                    </div>
                                                                </div>
                                                                {complaint.transactionId && (
                                                                    <div>
                                                                        <p className="text-sm font-medium mb-1">Transaction ID</p>
                                                                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                                                                            {complaint.transactionId}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-sm font-medium mb-2">New Status</p>
                                                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="submitted">Pending</SelectItem>
                                                                            <SelectItem value="investigating">Investigating</SelectItem>
                                                                            <SelectItem value="resolved">Resolved</SelectItem>
                                                                            <SelectItem value="dismissed">Dismissed</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium mb-2">Note (optional)</p>
                                                                    <Textarea
                                                                        placeholder="Add a note about this status change..."
                                                                        value={statusNote}
                                                                        onChange={(e) => setStatusNote(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    onClick={() => {
                                                                        if (complaint) {
                                                                            updateStatusMutation.mutate({
                                                                                complaintId: complaint.id,
                                                                                status: newStatus,
                                                                                note: statusNote,
                                                                            });
                                                                        }
                                                                    }}
                                                                    disabled={updateStatusMutation.isPending}
                                                                >
                                                                    {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm">
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
        </div>
    );
}
