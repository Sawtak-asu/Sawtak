"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, Hash, Globe, CheckCircle2, CircleDashed, FileText, Shield, Lock, Eye, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Complaint {
    id: string;
    title: string;
    text: string;
    category: string;
    area?: string;
    incidentDate?: string;
    createdAt: string;
    status?: string;
    submissionMode: "anonymous" | "public";
    transactionId?: string;
    trackingCode?: string;
    encryptedAnonId?: string;
    trackingHash?: string;
    topicId?: string;
    adminResponse?: string;
    evidence?: string[];  // Legacy field
    evidenceUrls?: string[];  // For identified complaints (R2 URLs)
    evidenceCids?: string[];  // For anonymous complaints (IPFS CIDs)
    user?: {
        name: string | null;
        picture?: string | null;
        email?: string;
    };
}

interface ComplaintCardProps {
    complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
    const { user, token } = useAuth();
    const isAdmin = user?.role?.toUpperCase() === "ADMIN";
    const queryClient = useQueryClient();
    const isAnonymous = complaint.submissionMode === "anonymous";

    const [newStatus, setNewStatus] = useState(complaint.status || "submitted");
    const [statusNote, setStatusNote] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStatus = async () => {
        if (!token) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/complaints/${complaint.id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus, note: statusNote }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success("Status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            setStatusNote(""); // Clear note
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="group mb-4 overflow-hidden border-white/5 bg-background/20 backdrop-blur-xl transition-all duration-300 hover:bg-background/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                    <CardHeader className="flex flex-row items-start gap-4 p-5 pb-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={complaint.user?.picture ?? undefined} />
                            <AvatarFallback>
                                {isAnonymous ? "A" : complaint.user?.name?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-sm truncate">
                                    {isAnonymous ? "Anonymous User" : complaint.user?.name || "Public User"}
                                </span>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] uppercase tracking-wide border-opacity-50",
                                    complaint.status === "resolved"
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                    {complaint.status || "Pending"}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground uppercase tracking-wide font-mono">
                                <span>{formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</span>
                                <span>•</span>
                                <span>{complaint.category}</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-2">
                        <h3 className="font-semibold text-lg mb-2 leading-tight group-hover:text-primary transition-colors duration-200 line-clamp-1">
                            {complaint.title}
                        </h3>
                        <p className="text-sm text-muted-foreground/90 whitespace-pre-wrap mb-4 leading-relaxed line-clamp-2">
                            {complaint.text}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground/50">
                            <span className="flex items-center gap-1 group-hover:text-primary/70 transition-colors">
                                <FileText className="h-3 w-3" />
                                View Full Details
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>

            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-2xl border-white/10 sm:rounded-2xl">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-background/50">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono text-xs uppercase bg-primary/5">
                            {complaint.submissionMode}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                            {new Date(complaint.createdAt).toLocaleString()}
                        </span>
                        {isAdmin && isAnonymous && (
                            <Badge variant="secondary" className="font-mono text-[10px] ml-auto">
                                ADMIN VIEW
                            </Badge>
                        )}
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight">
                        {complaint.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={complaint.user?.picture ?? undefined} />
                                <AvatarFallback className="text-lg">
                                    {isAnonymous ? "A" : complaint.user?.name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-base">
                                    {isAnonymous ? "Anonymous Reporter" : complaint.user?.name || "Public User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isAnonymous ? "Identity encrypted & protected" : (isAdmin ? complaint.user?.email : "Verified Community Member")}
                                </p>
                            </div>
                        </div>

                        {/* Main Text */}
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 p-6 rounded-xl border border-white/5 min-h-[120px]">
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-base">
                                {complaint.text}
                            </p>
                        </div>

                        {/* Admin Response (feed view) */}
                        {complaint.adminResponse && !isAdmin && (
                            <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Official Response
                                </h4>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                    {complaint.adminResponse}
                                </p>
                            </div>
                        )}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Category</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {complaint.category}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Status</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {complaint.status === "resolved" ? (
                                        <span className="text-green-500 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4" /> Resolved
                                        </span>
                                    ) : (
                                        <span className="text-amber-500 flex items-center gap-1.5">
                                            <CircleDashed className="h-4 w-4" /> Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                            {complaint.area && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Location</span>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {complaint.area}
                                    </div>
                                </div>
                            )}
                            {complaint.incidentDate && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Date</span>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {new Date(complaint.incidentDate).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Evidence Section */}
                        {(() => {
                            // Combine all evidence sources
                            const allEvidence: string[] = [
                                ...(complaint.evidenceUrls || []),
                                ...(complaint.evidence || []),
                                // For IPFS CIDs, construct gateway URL
                                ...(complaint.evidenceCids || []).map(cid => `https://w3s.link/ipfs/${cid}`)
                            ].filter(Boolean);
                            
                            if (allEvidence.length === 0) return null;
                            
                            return (
                                <div className="space-y-3">
                                    <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Attached Evidence ({allEvidence.length})</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {allEvidence.map((url, i) => {
                                            const isImage = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(url);
                                            const isPdf = /\.pdf$/i.test(url);
                                            const isVideo = /\.(mp4|webm|mov)$/i.test(url);
                                            
                                            return (
                                                <a 
                                                    href={url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    key={i} 
                                                    className="group relative aspect-video bg-muted/50 rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                                                >
                                                    {isImage ? (
                                                        <>
                                                            <img 
                                                                src={url} 
                                                                alt={`Evidence ${i + 1}`} 
                                                                loading="lazy"
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                                                                <span className="text-white text-xs font-medium flex items-center gap-1">
                                                                    <Eye className="h-4 w-4" /> View Full
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : isPdf ? (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                                                            <FileText className="h-10 w-10 mb-2" />
                                                            <span className="text-xs font-medium">PDF Document</span>
                                                            <span className="text-[10px] opacity-60 mt-1">Click to open</span>
                                                        </div>
                                                    ) : isVideo ? (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                                            <Eye className="h-10 w-10 mb-2" />
                                                            <span className="text-xs font-medium">Video</span>
                                                            <span className="text-[10px] opacity-60 mt-1">Click to view</span>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                            <FileText className="h-10 w-10 mb-2" />
                                                            <span className="text-xs font-medium">File {i + 1}</span>
                                                            <span className="text-[10px] opacity-60 mt-1">Click to open</span>
                                                        </div>
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Blockchain Proof (shown to everyone for anon) */}
                        {isAnonymous && (
                            <div className="space-y-3 pt-6 border-t border-white/5">
                                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-2">
                                    <Globe className="h-3 w-3" /> Blockchain Verification
                                </span>
                                <div className="rounded-lg bg-black/40 p-4 font-mono text-xs text-zinc-400 border border-white/5 break-all shadow-inner">
                                    <div className="flex items-center justify-between mb-2 opacity-50 text-[10px]">
                                        <span>TRANSACTION HASH</span>
                                    </div>
                                    <span className="text-purple-400 select-all">
                                        {complaint.transactionId || complaint.id}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Admin Only Section */}
                        {isAdmin && (
                            <div className="space-y-4 pt-6 mt-6 border-t border-primary/20 bg-primary/5 -mx-6 px-6 pb-6">
                                <div className="flex items-center gap-2 text-primary mb-4">
                                    <Lock className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Admin Panel</span>
                                </div>

                                {/* For identified complaints - simpler view */}
                                {!isAnonymous && (
                                    <div className="space-y-4">
                                        {complaint.user?.email && (
                                            <div className="rounded-lg bg-background border border-border p-3">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">User Email</p>
                                                <code className="text-sm font-mono text-foreground select-all">{complaint.user.email}</code>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* For anonymous complaints - show blockchain identifiers */}
                                {isAnonymous && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {complaint.trackingCode && (
                                            <div className="rounded-lg bg-background border border-border p-3">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tracking Code</p>
                                                <code className="text-sm font-mono text-red-400 select-all">{complaint.trackingCode}</code>
                                            </div>
                                        )}
                                        <div className="rounded-lg bg-background border border-border p-3 md:col-span-2">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Anonymous Identifier (Encrypted)</p>
                                            <code className="text-xs font-mono text-red-400 break-all select-all block">
                                                {(() => {
                                                    console.log('[ComplaintCard] Anonymous complaint data:', {
                                                        id: complaint.id,
                                                        encryptedAnonId: complaint.encryptedAnonId,
                                                        submissionMode: complaint.submissionMode,
                                                        isAnonymous
                                                    });
                                                    return complaint.encryptedAnonId || "Not available";
                                                })()}
                                            </code>
                                        </div>
                                        {complaint.trackingHash && (
                                            <div className="rounded-lg bg-background border border-border p-3">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tracking Hash</p>
                                                <code className="text-xs font-mono text-muted-foreground break-all select-all block">{complaint.trackingHash}</code>
                                            </div>
                                        )}
                                        <div className="rounded-lg bg-background border border-border p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">HCS Topic ID</p>
                                            <code className="text-xs font-mono text-primary break-all select-all block">
                                                {complaint.topicId || "0.0.7303531"}
                                            </code>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Actions Form - shown for all complaints */}
                                <div className="space-y-4 pt-4 border-t border-primary/20">
                                    <h4 className="text-sm font-semibold">Update Status & Response</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium">Status</label>
                                            <Select value={newStatus} onValueChange={setNewStatus}>
                                                <SelectTrigger className="bg-background">
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
                                        <div className="md:row-span-2 grid gap-2">
                                            <label className="text-xs font-medium">Admin Note / Public Response</label>
                                            <Textarea
                                                placeholder="Add a public response that will be visible to the user..."
                                                value={statusNote}
                                                onChange={(e) => setStatusNote(e.target.value)}
                                                className="bg-background min-h-[120px] resize-y"
                                                rows={5}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={handleUpdateStatus}
                                                disabled={isUpdating}
                                                className="w-full"
                                                size="lg"
                                            >
                                                {isUpdating ? (
                                                    <CircleDashed className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-2" />
                                                )}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
