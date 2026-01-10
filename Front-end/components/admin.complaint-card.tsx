"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { MapPin, Hash, Shield, ArrowBigUp, MessageCircle, Share2, LogIn, Image as ImageIcon, FileText, Clock, Loader2, Eye, AlertTriangle, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DirectedTo, GOVERNORATES, MINISTRIES } from "@/lib/egypt-locations";
import { useTranslations, useLocale } from "next-intl";
import { useAdmin } from "@/lib/admin-context";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Complaint {
    id: string;
    title: string;
    text: string;
    category: string;
    area?: string;
    directedTo?: DirectedTo;
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
    evidence?: string[];
    evidenceUrls?: string[];
    evidenceCids?: string[];
    upvoteCount?: number;
    hasVoted?: boolean;
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
    const router = useRouter();
    const { token, isLoggedIn } = useAuth();
    const isAnonymous = complaint.submissionMode === "anonymous";
    const canUpvote = !isAnonymous;
    const t = useTranslations("ComplaintCard");
    const tCategories = useTranslations("Categories");
    const tStatuses = useTranslations("Statuses");
    const tModes = useTranslations("SubmissionModes");
    const tDirected = useTranslations("DirectedTo");
    const locale = useLocale();

    const [localUpvotes, setLocalUpvotes] = useState(complaint.upvoteCount || 0);
    const [hasVoted, setHasVoted] = useState(complaint.hasVoted || false);
    const [isVoting, setIsVoting] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const { isPlatformAdmin, selectedTeamRole } = useAdmin();
    // Reviewer action states
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"investigating" | "closed">("investigating");
    const [actionNote, setActionNote] = useState("");
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    // Manager action states
    const [managerDialogOpen, setManagerDialogOpen] = useState(false);
    const [managerActionType, setManagerActionType] = useState<"resolved" | "closed" | "flagged">("resolved");
    const [managerNote, setManagerNote] = useState("");
    const [isSubmittingManagerAction, setIsSubmittingManagerAction] = useState(false);

    // Identity Reveal Request State
    const [isRequestingReveal, setIsRequestingReveal] = useState(false);
    const [showRevealRequestDialog, setShowRevealRequestDialog] = useState(false);
    const [revealReason, setRevealReason] = useState("");
    const [revealRequestSubmitted, setRevealRequestSubmitted] = useState(false);

    const handleRequestReveal = async () => {
        if (!token || !complaint) return;
        if (revealReason.trim().length < 10) {
            toast.error("Please provide a detailed justification (at least 10 characters)");
            return;
        }
        setIsRequestingReveal(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/complaints/${encodeURIComponent(complaint.id)}/request-identity-reveal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: revealReason.trim() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit reveal request");

            if (data.success) {
                setRevealRequestSubmitted(true);
                toast.success("Identity reveal request submitted for platform admin review");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRequestingReveal(false);
        }
    };

    // Complaint history state
    interface HistoryItem {
        id: string;
        action: string;
        old_status: string;
        new_status: string;
        note: string | null;
        created_at: string;
        performer: {
            id: string;
            name: string | null;
            email: string;
            picture: string | null;
        } | null;
    }
    const [complaintHistory, setComplaintHistory] = useState<HistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Fetch complaint history when manager dialog opens
    useEffect(() => {
        if (!managerDialogOpen || !token) return;

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const res = await fetch(`${API_URL}/api/admin/complaints/${encodeURIComponent(complaint.id)}/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setComplaintHistory(data.data?.history || []);
                }
            } catch (error) {
                console.error("Failed to fetch complaint history:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [managerDialogOpen, complaint.id, token]);

    // Check if user has voted on mount
    useEffect(() => {
        if (!isLoggedIn || !token || !canUpvote) return;

        const checkVoteStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/api/vote/status?complaintId=${complaint.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (data.success) {
                    setHasVoted(data.data.hasVoted);
                    setLocalUpvotes(data.data.voteCount);
                }
            } catch (error) {
                // Silently fail - not critical
            }
        };

        checkVoteStatus();
    }, [complaint.id, token, isLoggedIn, canUpvote]);

    // Evidence handling
    const allEvidence: string[] = [
        ...(complaint.evidenceUrls || []),
        ...(complaint.evidence || []),
        ...(complaint.evidenceCids || []).map(cid => `https://w3s.link/ipfs/${cid}`)
    ].filter(Boolean);

    // Filter for images only for preview
    const imageEvidence = allEvidence.filter(url => /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(url));

    const handleUpvote = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!isLoggedIn || !token) {
            setShowLoginDialog(true);
            return;
        }

        if (isVoting || isAnonymous) return;
        setIsVoting(true);

        try {
            const res = await fetch(`${API_URL}/api/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ complaintId: complaint.id }),
            });

            const data = await res.json();

            if (data.requiresLogin) {
                setShowLoginDialog(true);
                return;
            }

            if (data.success) {
                setLocalUpvotes(data.data.voteCount);
                setHasVoted(data.data.hasVoted);
            }
        } catch (error) {
            console.error("Failed to vote:", error);
        } finally {
            setIsVoting(false);
        }
    }, [complaint.id, token, isVoting, isLoggedIn, isAnonymous]);

    const handleActionSubmit = async () => {
        if (!actionNote && actionType === "closed") {
            toast.error("Note is required when closing a complaint");
            return;
        }

        setIsSubmittingAction(true);
        try {
            if (!token) {
                toast.error("You must be logged in to perform this action");
                return;
            }
            const res = await fetch(`${API_URL}/api/admin/complaints/${encodeURIComponent(complaint.id)}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: actionType,
                    note: actionNote,
                }),
            });

            if (!res.ok) {
                let errorMessage = "Failed to update status";
                try {
                    const data = await res.json();
                    errorMessage = data.error || errorMessage;
                } catch {
                    // Response was not JSON, use default message
                    errorMessage = `Request failed with status ${res.status}`;
                }
                throw new Error(errorMessage);
            }

            toast.success("Status updated successfully");
            setActionDialogOpen(false);
            setActionNote("");
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmittingAction(false);
        }
    };

    // Manager action handler
    const handleManagerActionSubmit = async () => {
        if (!managerNote) {
            toast.error("Note is required for manager actions");
            return;
        }

        setIsSubmittingManagerAction(true);
        try {
            if (!token) {
                toast.error("You must be logged in to perform this action");
                return;
            }
            const res = await fetch(`${API_URL}/api/admin/complaints/${encodeURIComponent(complaint.id)}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: managerActionType,
                    note: managerNote,
                }),
            });

            if (!res.ok) {
                let errorMessage = "Failed to update status";
                try {
                    const data = await res.json();
                    errorMessage = data.error || errorMessage;
                } catch {
                    errorMessage = `Request failed with status ${res.status}`;
                }
                throw new Error(errorMessage);
            }

            toast.success(`Complaint marked as ${managerActionType}`);
            setManagerDialogOpen(false);
            setManagerNote("");
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmittingManagerAction(false);
        }
    };

    const handleCardClick = () => {
        // URL-encode the ID to handle hashes with slashes
        router.push(`/complaint/${encodeURIComponent(complaint.id)}`);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(window.location.origin + "/complaint/" + encodeURIComponent(complaint.id));
        toast.success(t("linkCopied"));
    };

    // Get translated category
    const getCategoryName = (categoryId: string) => {
        try {
            return tCategories(categoryId);
        } catch {
            return categoryId;
        }
    };

    // Get translated status
    const getStatusName = (status: string) => {
        try {
            return tStatuses(status);
        } catch {
            return status;
        }
    };

    // Get directed to name
    const getDirectedToName = () => {
        if (!complaint.directedTo) return null;
        const { ministryId, governorateId, centerId } = complaint.directedTo;
        if (ministryId) {
            const ministry = MINISTRIES.find(m => m.id === ministryId);
            return ministry ? (locale === "ar" ? ministry.nameAr : ministry.name) : null;
        }
        if (governorateId) {
            const gov = GOVERNORATES.find(g => g.id === governorateId);
            return gov ? (locale === "ar" ? gov.nameAr : gov.name) : null;
        }
        if (centerId) {
            const gov = GOVERNORATES.find(g => g.id === centerId);
            return gov ? (locale === "ar" ? gov.nameAr : gov.name) : null;
        }
        return null;
    };

    return (
        <>
            {/* Login Required Dialog */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LogIn className="h-5 w-5" />
                            {t("loginRequired")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("loginDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                            {t("cancel")}
                        </Button>
                        <Button asChild>
                            <Link href="/login">
                                <LogIn className="h-4 w-4 mr-2" />
                                {t("signIn")}
                            </Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Review Action Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Complaint</DialogTitle>
                        <DialogDescription>
                            Take action on this submitted complaint.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <RadioGroup value={actionType} onValueChange={(v) => setActionType(v as "investigating" | "closed")}>
                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50" onClick={() => setActionType("investigating")}>
                                <RadioGroupItem value="investigating" id="r-investigating" />
                                <Label htmlFor="r-investigating" className="cursor-pointer font-medium">Investigate</Label>
                                <span className="text-xs text-muted-foreground ml-auto">Move to Investigating</span>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50" onClick={() => setActionType("closed")}>
                                <RadioGroupItem value="closed" id="r-closed" />
                                <Label htmlFor="r-closed" className="cursor-pointer font-medium">Close</Label>
                                <span className="text-xs text-muted-foreground ml-auto">Mark as Invalid/Done</span>
                            </div>
                        </RadioGroup>

                        <div className="space-y-2">
                            <Label>Note {actionType === "closed" && <span className="text-red-500">*</span>}</Label>
                            <Textarea
                                placeholder="Add a note explaining your decision..."
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleActionSubmit} disabled={isSubmittingAction}>
                            {isSubmittingAction ? "Saving..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manager Action Dialog */}
            <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manager Decision</DialogTitle>
                        <DialogDescription>
                            Take final action on this investigated complaint.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Previous Actions / History */}
                    {complaintHistory.length > 0 && (
                        <div className="border rounded-lg p-3 bg-muted/30 mb-2">
                            <div className="flex items-center gap-2 text-sm font-medium mb-3">
                                <Clock className="h-4 w-4" />
                                Previous Actions
                            </div>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {complaintHistory.map((item) => (
                                    <div key={item.id} className="border-l-2 border-primary/30 pl-3 py-1">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={item.performer?.picture ?? undefined} />
                                                <AvatarFallback className="text-[10px]">
                                                    {item.performer?.name?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">
                                                {item.performer?.name || item.performer?.email || "System"}
                                            </span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: locale === "ar" ? ar : enUS })}</span>
                                        </div>
                                        <div className="mt-1">
                                            <Badge variant="outline" className="text-[10px] mr-1">
                                                {item.old_status} → {item.new_status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground capitalize">{item.action.replace("_", " ")}</span>
                                        </div>
                                        {item.note && (
                                            <p className="text-sm mt-1 bg-background p-2 rounded border text-muted-foreground italic">
                                                "{item.note}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLoadingHistory && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    <div className="space-y-4 py-2">
                        <RadioGroup value={managerActionType} onValueChange={(v) => setManagerActionType(v as "resolved" | "closed" | "flagged")}>
                            <div className="flex items-center space-x-2 border border-green-500/30 p-3 rounded-md cursor-pointer hover:bg-green-500/10" onClick={() => setManagerActionType("resolved")}>
                                <RadioGroupItem value="resolved" id="m-resolved" />
                                <Label htmlFor="m-resolved" className="cursor-pointer font-medium text-green-600 dark:text-green-400">Resolved</Label>
                                <span className="text-xs text-muted-foreground ml-auto">Mark as successfully addressed</span>
                            </div>
                            <div className="flex items-center space-x-2 border border-slate-500/30 p-3 rounded-md cursor-pointer hover:bg-slate-500/10" onClick={() => setManagerActionType("closed")}>
                                <RadioGroupItem value="closed" id="m-closed" />
                                <Label htmlFor="m-closed" className="cursor-pointer font-medium text-slate-600 dark:text-slate-400">Closed</Label>
                                <span className="text-xs text-muted-foreground ml-auto">Close without resolution</span>
                            </div>
                            <div className="flex items-center space-x-2 border border-amber-500/30 p-3 rounded-md cursor-pointer hover:bg-amber-500/10" onClick={() => setManagerActionType("flagged")}>
                                <RadioGroupItem value="flagged" id="m-flagged" />
                                <Label htmlFor="m-flagged" className="cursor-pointer font-medium text-amber-600 dark:text-amber-400">Flagged</Label>
                                <span className="text-xs text-muted-foreground ml-auto">Flag for further review</span>
                            </div>
                        </RadioGroup>

                        <div className="space-y-2">
                            <Label>Note <span className="text-red-500">*</span></Label>
                            <Textarea
                                placeholder="Explain your decision..."
                                value={managerNote}
                                onChange={(e) => setManagerNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setManagerDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleManagerActionSubmit} disabled={isSubmittingManagerAction}>
                            {isSubmittingManagerAction ? "Saving..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complaint Card */}
            <motion.div
                layoutId={`complaint-card-${complaint.id}`}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <Card
                    onClick={handleCardClick}
                    className="group overflow-hidden dark:border-white/5 bg-background/30 backdrop-blur-xl transition-all duration-200 hover:bg-background/40 dark:hover:border-white/10 cursor-pointer border border-black/20"
                >
                    <div className="flex gap-3 p-4">
                        {/* Avatar */}
                        <motion.div layoutId={`complaint-avatar-${complaint.id}`}>
                            <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={complaint.user?.picture ?? undefined} />
                                <AvatarFallback className="text-xs font-medium">
                                    {isAnonymous ? "🔒" : complaint.user?.name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Header Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm truncate">
                                    {isAnonymous ? tModes("anonymous") : complaint.user?.name || tModes("identified")}
                                </span>
                                <span className="text-muted-foreground text-xs">·</span>
                                <span className="text-muted-foreground text-xs">
                                    {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true, locale: locale === "ar" ? ar : enUS })}
                                </span>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] uppercase h-5 px-1.5 shrink-0",
                                    isAnonymous
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    {isAnonymous ? tModes("anon") : tModes("public")}
                                </Badge>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] uppercase h-5 px-1.5 shrink-0",
                                    complaint.status === "resolved"
                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                        : complaint.status === "investigating"
                                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                )}>
                                    {getStatusName(complaint.status || "pending")}
                                </Badge>
                                {/* Official Response indicator */}
                                {(complaint.status === "closed" || complaint.status === "resolved" || complaint.status === "flagged") && (
                                    <Badge variant="outline" className="text-[10px] uppercase h-5 px-1.5 shrink-0 bg-primary/10 text-primary border-primary/20">
                                        <MessageCircle className="h-3 w-3 mr-1" />
                                        Official Response
                                    </Badge>
                                )}
                            </div>

                            {/* Title */}
                            <motion.h3
                                layoutId={`complaint-title-${complaint.id}`}
                                className="font-medium text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors"
                            >
                                {complaint.title}
                            </motion.h3>

                            {/* Description Preview */}
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {complaint.text}
                            </p>

                            {/* Image Grid - Max 4 images */}
                            {imageEvidence.length > 0 && (
                                <div className={cn(
                                    "grid gap-1 mt-3 rounded-2xl overflow-hidden",
                                    imageEvidence.length === 1 && "grid-cols-1",
                                    imageEvidence.length === 2 && "grid-cols-2",
                                    imageEvidence.length >= 3 && "grid-cols-2"
                                )}>
                                    {imageEvidence.slice(0, 4).map((url, i) => {
                                        const isLastVisible = i === 3;
                                        const hasMore = imageEvidence.length > 4;
                                        const remaining = imageEvidence.length - 4;

                                        // For 3 images: first is tall
                                        const isTall = imageEvidence.length === 3 && i === 0;

                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "relative bg-muted/50 overflow-hidden",
                                                    imageEvidence.length === 1 ? "aspect-video max-h-72 rounded-2xl" : "aspect-square",
                                                    isTall && "row-span-2",
                                                    // Corner rounding based on position for multi-image grids
                                                    imageEvidence.length === 2 && i === 0 && "rounded-l-2xl",
                                                    imageEvidence.length === 2 && i === 1 && "rounded-r-2xl",
                                                    imageEvidence.length >= 3 && i === 0 && "rounded-tl-2xl",
                                                    imageEvidence.length >= 3 && !isTall && i === 1 && "rounded-tr-2xl",
                                                    imageEvidence.length >= 3 && i === 2 && "rounded-bl-2xl",
                                                    imageEvidence.length >= 3 && i === 3 && "rounded-br-2xl",
                                                    imageEvidence.length === 3 && i === 0 && "rounded-l-2xl",
                                                    imageEvidence.length === 3 && i === 1 && "rounded-tr-2xl",
                                                    imageEvidence.length === 3 && i === 2 && "rounded-br-2xl"
                                                )}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <img
                                                    src={url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                {isLastVisible && hasMore && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <span className="text-xl font-bold text-white">+{remaining}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Metadata - Category & Location (only if exists) */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 w-fit" dir="auto">
                                <span className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    {getCategoryName(complaint.category)}
                                </span>
                                {complaint.area && complaint.area.toLowerCase() !== 'unknown' && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {complaint.area}
                                    </span>
                                )}
                                {getDirectedToName() && (
                                    <span className="flex items-center gap-1 font-semibold">
                                        <span>{tDirected("to")}</span>
                                        {getDirectedToName()}
                                    </span>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center gap-1 pt-1 -ml-2">
                                {/* Upvote Button - Only for public/identified complaints */}
                                {canUpvote ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 px-3 gap-1.5 rounded-full text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-all",
                                            hasVoted && "text-orange-500 bg-orange-500/10"
                                        )}
                                        onClick={handleUpvote}
                                        disabled={isVoting}
                                    >
                                        <ArrowBigUp className={cn(
                                            "h-4 w-4 transition-transform",
                                            hasVoted && "fill-orange-500",
                                            isVoting && "animate-pulse"
                                        )} />
                                        <span className="text-xs font-medium">{localUpvotes}</span>
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-400/80">
                                        <Shield className="h-3.5 w-3.5" />
                                        <span>{t("verified")}</span>
                                    </div>
                                )}

                                {/* Comment indicator */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 gap-1.5 rounded-full text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                        {(complaint.status === "closed" || complaint.status === "resolved" || complaint.status === "flagged") ? 1 : 0}
                                    </span>
                                </Button>

                                {/* Share Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 rounded-full text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4" />
                                </Button>

                                {/* Action Button for Reviewers */}
                                {/* Reviewer action button */}
                                {selectedTeamRole === "reviewer" && complaint.status === "submitted" && (
                                    <Button
                                        size="sm"
                                        className="h-8 px-3 ml-auto bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActionDialogOpen(true);
                                        }}
                                    >
                                        Take Action
                                    </Button>
                                )}

                                {/* Manager action button */}
                                {(selectedTeamRole === "manager") && complaint.status === "investigating" && (
                                    <Button
                                        size="sm"
                                        className="h-8 px-3 ml-auto bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setManagerDialogOpen(true);
                                        }}
                                    >
                                        Take Action
                                    </Button>
                                )}

                                {/* Request Identity Reveal Button (Team Admin Only, Flagged Anonymous Complaints) */}
                                {(selectedTeamRole === "team_admin") && isAnonymous && complaint.status?.includes("flagged") && (
                                    <Button
                                        size="sm"
                                        className="h-8 px-3 ml-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRevealReason("");
                                            setRevealRequestSubmitted(false);
                                            setShowRevealRequestDialog(true);
                                        }}
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                        Request Reveal
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Reveal Identity Dialog */}
            {/* Request Identity Reveal Dialog */}
            <Dialog open={showRevealRequestDialog} onOpenChange={(open) => {
                setShowRevealRequestDialog(open);
                if (!open) {
                    setRevealReason("");
                    setRevealRequestSubmitted(false);
                }
            }}>
                <DialogContent>
                    {!revealRequestSubmitted ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-amber-500">
                                    <Eye className="h-5 w-5" />
                                    Request Identity Reveal
                                </DialogTitle>
                                <DialogDescription className="space-y-3 pt-3">
                                    <p className="font-medium text-foreground">
                                        This will submit a request to reveal the anonymous user's identity.
                                    </p>
                                    <p>
                                        A <strong>Platform Administrator</strong> must review and approve this request with the decryption key.
                                    </p>
                                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs text-amber-600 dark:text-amber-400">
                                        <strong>Note:</strong> You will be able to track the status of your request in the "My Reveal Requests" page.
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                                <Label>Justification <span className="text-red-500">*</span></Label>
                                <Textarea
                                    placeholder="Explain why this identity needs to be revealed (min 10 characters)..."
                                    value={revealReason}
                                    onChange={(e) => setRevealReason(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Characters: {revealReason.length} / 10 minimum
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setShowRevealRequestDialog(false)}>Cancel</Button>
                                <Button
                                    onClick={handleRequestReveal}
                                    disabled={isRequestingReveal || revealReason.trim().length < 10}
                                >
                                    {isRequestingReveal ? "Submitting..." : "Submit Request"}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-green-500">
                                    <Check className="h-5 w-5" />
                                    Request Submitted
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-6">
                                <div className="flex flex-col items-center gap-4 p-6 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/50">
                                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Awaiting Platform Admin Review</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Your request has been submitted. A platform administrator will review it and manually enter the decryption key if approved.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Track your request in <strong>My Reveal Requests</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setShowRevealRequestDialog(false)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
