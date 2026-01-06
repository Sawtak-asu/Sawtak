"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { GridBackground } from "@/components/grid-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DirectedTo, GOVERNORATES, MINISTRIES } from "@/lib/egypt-locations";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Hash,
    Globe,
    CheckCircle2,
    CircleDashed,
    FileText,
    Shield,
    Lock,
    Eye,
    Save,
    ArrowBigUp,
    MessageCircle,
    Share2,
    LogIn,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations, useLocale } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Complaint {
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

export default function ComplaintPage() {
    const params = useParams();
    const router = useRouter();
    const { user, token, isLoggedIn } = useAuth();
    const queryClient = useQueryClient();
    const t = useTranslations("ComplaintDetail");
    const tCard = useTranslations("ComplaintCard");
    const tCategories = useTranslations("Categories");
    const tStatuses = useTranslations("Statuses");
    const tModes = useTranslations("SubmissionModes");
    const tDirected = useTranslations("DirectedTo");
    const locale = useLocale();

    // URL-decode the ID to handle hashes with slashes
    const rawId = params.id as string;
    const complaintId = decodeURIComponent(rawId);

    const isAdmin = user?.role?.toUpperCase() === "ADMIN";

    const [newStatus, setNewStatus] = useState("submitted");
    const [statusNote, setStatusNote] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [localUpvotes, setLocalUpvotes] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["complaint", complaintId],
        queryFn: async () => {
            // URL-encode the ID when sending to API to handle special characters
            const res = await fetch(`${API_URL}/api/feed/${encodeURIComponent(complaintId)}`);
            const json = await res.json();

            if (!json.success) throw new Error(json.error);
            return json.data as Complaint;
        },
        enabled: !!complaintId,
    });

    const complaint = data;
    const isAnonymous = complaint?.submissionMode === "anonymous";
    const canUpvote = complaint && !isAnonymous;

    // Check vote status when complaint loads (same pattern as complaint-card)
    useEffect(() => {
        if (!complaint) return;

        setNewStatus(complaint.status || "submitted");

        // For public complaints, fetch vote status
        if (!isAnonymous && isLoggedIn && token) {
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
        } else if (!isAnonymous) {
            // For public complaints without auth, just get vote count
            const getVoteCount = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/vote/status?complaintId=${complaint.id}`);
                    const data = await res.json();
                    if (data.success) {
                        setLocalUpvotes(data.data.voteCount);
                    }
                } catch (error) {
                    // Silently fail
                }
            };
            getVoteCount();
        }
    }, [complaint, isAnonymous, isLoggedIn, token]);


    const handleUpvote = useCallback(async () => {
        if (!complaint) return;

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
                toast.success(data.data.hasVoted ? t("upvoted") : t("voteRemoved"));
            }
        } catch (error) {
            toast.error(t("failedToVote"));
        } finally {
            setIsVoting(false);
        }
    }, [complaint, token, isVoting, isLoggedIn, isAnonymous, t]);

    const handleUpdateStatus = async () => {
        if (!token || !complaint) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/complaints/${encodeURIComponent(complaint.id)}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus, note: statusNote }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(t("statusUpdated"));
            queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            setStatusNote("");
        } catch (error) {
            toast.error(t("failedToUpdateStatus"));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success(tCard("linkCopied"));
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
        if (!complaint?.directedTo) return null;
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

    // Evidence handling
    const allEvidence: string[] = complaint ? [
        ...(complaint.evidenceUrls || []),
        ...(complaint.evidence || []),
        ...(complaint.evidenceCids || []).map(cid => `https://w3s.link/ipfs/${cid}`)
    ].filter(Boolean) : [];

    if (isLoading) {
        return (
            <GridBackground>
                <Navbar />
                <div className="container max-w-2xl mx-auto px-4 py-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </GridBackground>
        );
    }

    if (isError || !complaint) {
        return (
            <GridBackground>
                <Navbar />
                <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
                    <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">{t("notFoundTitle")}</h1>
                    <p className="text-muted-foreground mb-6">
                        {t("notFoundMessage")}
                    </p>
                    <Button onClick={() => router.push("/feed")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t("backToFeed")}
                    </Button>
                </div>
            </GridBackground>
        );
    }

    return (
        <GridBackground>
            <Navbar />

            {/* Login Dialog */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LogIn className="h-5 w-5" />
                            {tCard("loginRequired")}
                        </DialogTitle>
                        <DialogDescription>
                            {tCard("loginDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                            {tCard("cancel")}
                        </Button>
                        <Button asChild>
                            <Link href="/login">
                                <LogIn className="h-4 w-4 mr-2" />
                                {tCard("signIn")}
                            </Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="container max-w-2xl mx-auto px-4 py-4">
                {/* Back Button */}
                <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("back")}
                </Button>

                {/* Main Content */}
                <motion.article
                    layoutId={`complaint-card-${complaint.id}`}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-background/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 pb-3 border-b border-white/5">
                        <div className="flex items-start gap-3">
                            <motion.div layoutId={`complaint-avatar-${complaint.id}`}>
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={complaint.user?.picture ?? undefined} />
                                    <AvatarFallback>
                                        {isAnonymous ? "🔒" : complaint.user?.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">
                                        {isAnonymous ? tModes("anonymous") : complaint.user?.name || t("user")}
                                    </span>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase h-5 px-1.5",
                                        isAnonymous
                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}>
                                        {isAnonymous ? tModes("anonymous") : tModes("public")}
                                    </Badge>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase h-5 px-1.5",
                                        complaint.status === "resolved"
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : complaint.status === "investigating"
                                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    )}>
                                        {getStatusName(complaint.status || "pending")}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Title */}
                        <motion.h1
                            layoutId={`complaint-title-${complaint.id}`}
                            className="text-xl font-bold leading-tight"
                        >
                            {complaint.title}
                        </motion.h1>

                        {/* Description */}
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {complaint.text}
                        </p>

                        {/* Evidence Grid */}
                        {allEvidence.length > 0 && (
                            <div className={cn(
                                "grid gap-1 rounded-xl overflow-hidden",
                                allEvidence.length === 1 && "grid-cols-1",
                                allEvidence.length === 2 && "grid-cols-2",
                                allEvidence.length === 3 && "grid-cols-2",
                                allEvidence.length >= 4 && "grid-cols-2"
                            )}>
                                {allEvidence.slice(0, 4).map((url, i) => {
                                    const isImage = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(url);
                                    const isLast = i === 3 && allEvidence.length > 4;
                                    const remaining = allEvidence.length - 4;

                                    return (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "relative aspect-video bg-muted/50",
                                                allEvidence.length === 3 && i === 0 && "row-span-2 aspect-square"
                                            )}
                                        >
                                            {isImage ? (
                                                <img
                                                    src={url}
                                                    alt={`Evidence ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                            {isLast && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-white">+{remaining}</span>
                                                </div>
                                            )}
                                        </a>
                                    );
                                })}
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <Hash className="h-3.5 w-3.5" />
                                {getCategoryName(complaint.category)}
                            </span>
                            {complaint.area && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {complaint.area}
                                </span>
                            )}
                            {complaint.incidentDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(complaint.incidentDate).toLocaleDateString()}
                                </span>
                            )}
                            {getDirectedToName() && (
                                <span className="flex items-center gap-1 font-semibold">
                                    <span>{tDirected("to")}</span>
                                    {getDirectedToName()}
                                </span>
                            )}
                        </div>

                        {/* Blockchain Proof for Anonymous */}
                        {isAnonymous && (
                            <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                                <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
                                    <Globe className="h-3.5 w-3.5" />
                                    <span className="uppercase font-mono tracking-wider">{t("blockchainVerified")}</span>
                                </div>
                                <code className="text-xs text-purple-300 break-all font-mono">
                                    {complaint.transactionId || complaint.id}
                                </code>
                            </div>
                        )}

                        {/* Admin Response */}
                        {complaint.adminResponse && !isAdmin && (
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    {t("officialResponse")}
                                </h4>
                                <p className="text-sm whitespace-pre-wrap">
                                    {complaint.adminResponse}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="px-4 py-3 border-t border-white/5 flex items-center gap-1">
                        {canUpvote ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "gap-2 rounded-full hover:text-orange-500 hover:bg-orange-500/10",
                                    hasVoted && "text-orange-500 bg-orange-500/10"
                                )}
                                onClick={handleUpvote}
                                disabled={isVoting}
                            >
                                <ArrowBigUp className={cn(
                                    "h-5 w-5",
                                    hasVoted && "fill-orange-500"
                                )} />
                                <span>{localUpvotes}</span>
                            </Button>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-400">
                                <Shield className="h-4 w-4" />
                                <span>{tCard("protectedByBlockchain")}</span>
                            </div>
                        )}

                        <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                            <MessageCircle className="h-5 w-5" />
                            <span>0</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="rounded-full ml-auto" onClick={handleShare}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Admin Panel */}
                    {isAdmin && (
                        <div className="p-4 bg-primary/5 border-t border-primary/20">
                            <div className="flex items-center gap-2 text-primary mb-4">
                                <Lock className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t("adminPanel")}</span>
                            </div>

                            {!isAnonymous && complaint.user?.email && (
                                <div className="rounded-lg bg-background border border-border p-3 mb-4">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("userEmail")}</p>
                                    <code className="text-sm font-mono">{complaint.user.email}</code>
                                </div>
                            )}

                            {isAnonymous && (
                                <div className="grid gap-3 mb-4">
                                    {complaint.trackingCode && (
                                        <div className="rounded-lg bg-background border border-border p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase mb-1">{t("trackingCode")}</p>
                                            <code className="text-sm font-mono text-red-400">{complaint.trackingCode}</code>
                                        </div>
                                    )}
                                    <div className="rounded-lg bg-background border border-border p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">{t("anonymousIdEncrypted")}</p>
                                        <code className="text-xs font-mono text-red-400 break-all">
                                            {complaint.encryptedAnonId || t("notAvailable")}
                                        </code>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-primary/20">
                                <h4 className="text-sm font-semibold">{t("updateStatus")}</h4>
                                <div className="grid gap-4">
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="submitted">{tStatuses("pending")}</SelectItem>
                                            <SelectItem value="investigating">{tStatuses("investigating")}</SelectItem>
                                            <SelectItem value="resolved">{tStatuses("resolved")}</SelectItem>
                                            <SelectItem value="dismissed">{tStatuses("dismissed")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Textarea
                                        placeholder={t("addPublicResponse")}
                                        value={statusNote}
                                        onChange={(e) => setStatusNote(e.target.value)}
                                        className="bg-background"
                                        rows={3}
                                    />
                                    <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                                        {isUpdating ? (
                                            <CircleDashed className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        {t("saveChanges")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.article>
            </div>
        </GridBackground>
    );
}
