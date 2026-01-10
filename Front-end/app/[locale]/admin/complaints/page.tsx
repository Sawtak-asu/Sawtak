"use client";

import { useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import { useSearchParams } from "next/navigation";
import { ComplaintCard, Complaint } from "@/components/admin.complaint-card";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin-layout";
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
import { Loader2, Search, Filter, Ban, ArrowUpCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Wrapper component with Suspense boundary
export default function ComplaintsQueuePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ComplaintsQueueContent />
        </Suspense>
    );
}

function ComplaintsQueueContent() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get("status") || "all";

    const { token } = useAuth();
    const { selectedTeam, isPlatformAdmin } = useAdmin();
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [searchQuery, setSearchQuery] = useState("");

    // Action States
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);

    // Form States
    const [closeNote, setCloseNote] = useState("");
    const [escalateNote, setEscalateNote] = useState("");
    const [escalatePriority, setEscalatePriority] = useState("medium");

    // Fetch Complaints
    const { data, isLoading } = useQuery({
        queryKey: ["admin-complaints", { status: statusFilter, teamId: selectedTeam?.entity_id, search: searchQuery }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (searchQuery) params.set("search", searchQuery);
            params.set("limit", "50"); // Fetch more for queue

            // Filter by team entity if selected (Platform Admin sees all if no team selected)
            if (selectedTeam?.entity_id) {
                params.set("entity", selectedTeam.entity_id);
            }

            const res = await fetch(`${API_URL}/api/admin/complaints?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch complaints");
            return await res.json();
        },
        enabled: !!token,
    });

    const complaints: Complaint[] = data?.data?.complaints || [];

    // Close Mutation
    const closeMutation = useMutation({
        mutationFn: async () => {
            if (!selectedComplaint) return;
            const res = await fetch(`${API_URL}/api/admin/complaints/${selectedComplaint.id}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "closed",
                    note: closeNote
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to close complaint");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Complaint closed successfully");
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
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    priority: escalatePriority,
                    note: escalateNote
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to escalate complaint");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Complaint escalated successfully");
            setEscalateDialogOpen(false);
            setEscalateNote("");
            queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
        },
        onError: (err: Error) => toast.error(err.message)
    });

    return (
        <AdminLayout breadcrumbs={[{ label: "Complaints Queue" }]}>
            <div className="space-y-6 max-w-7xl mx-auto p-6">

                {/* Header & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Complaints Queue</h1>
                        <p className="text-muted-foreground">
                            {selectedTeam ? `Managing complaints for ${selectedTeam.displayName}` : "Viewing all complaints"}
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search complaints..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-muted/10">
                        <h3 className="text-lg font-semibold">No complaints found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {complaints.map((complaint) => (
                            <div key={complaint.id} className="flex flex-col gap-2">
                                <ComplaintCard complaint={complaint} />

                                { /* Quick Actions Removed - Moved to ComplaintCard */}
                            </div>
                        ))}
                    </div>
                )}

                {/* Close Dialog */}
                <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Close Complaint</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to close this complaint? This normally implies it's invalid or duplicate.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reason / Note (Required)</label>
                                <Textarea
                                    placeholder="Why is this being closed?"
                                    value={closeNote}
                                    onChange={(e) => setCloseNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={() => closeMutation.mutate()}
                                disabled={!closeNote || closeMutation.isPending}
                            >
                                {closeMutation.isPending ? "Closing..." : "Close Complaint"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Escalate Dialog */}
                <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Escalate to Manager</DialogTitle>
                            <DialogDescription>
                                Flag this complaint for higher-level review. It will be marked as In Progress.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <Select value={escalatePriority} onValueChange={setEscalatePriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Note (Optional)</label>
                                <Textarea
                                    placeholder="Add context for the manager..."
                                    value={escalateNote}
                                    onChange={(e) => setEscalateNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setEscalateDialogOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => escalateMutation.mutate()}
                                disabled={escalateMutation.isPending}
                            >
                                {escalateMutation.isPending ? "Escalating..." : "Confirm Escalation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </AdminLayout>
    );
}
