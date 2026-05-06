"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { MapPin, Hash, Shield, ArrowBigUp, MessageCircle, Share2, LogIn, Image as ImageIcon, FileText, Play } from "lucide-react";
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
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

    // Check if user has voted on mount
    useEffect(() => {
        if (!isLoggedIn || !token || !canUpvote) return;

        const checkVoteStatus = async () => {
            try {
                const res = await fetch(`/api/vote/status?complaintId=${complaint.id}`, {
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

    const ipfsGateway = "https://gateway.pinata.cloud/ipfs";
    const isImageUrl = (url: string) => /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
    const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
    const isIpfsUrl = (url: string) => url.includes("/ipfs/") || url.startsWith("ipfs://");
    const toIpfsGatewayUrl = (cid: string) => {
        if (!cid) return "";
        if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
        if (cid.startsWith("ipfs://")) return `${ipfsGateway}/${cid.replace("ipfs://", "")}`;
        return `${ipfsGateway}/${cid}`;
    };

    // Evidence handling
    const allEvidence: string[] = [
        ...(complaint.evidenceUrls || []),
        ...(complaint.evidence || []),
        ...(complaint.evidenceCids || []).map(toIpfsGatewayUrl),
    ].filter(Boolean);

    // Filter for images and videos for preview
    const previewEvidence = allEvidence.filter((url) => isImageUrl(url) || isVideoUrl(url) || isIpfsUrl(url));

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
            const res = await fetch(`/api/vote`, {
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
        // Fallback for UI if exact string isn't found
        if (!status) return status;
        
        try {
            // First try exact match
            return tStatuses(status);
        } catch {
            // Try to map or return as is if translation throws
            try {
                // Mapping common status variations
                if (status.includes("flagged")) return tStatuses("flagged");
                if (status === "pending") return tStatuses("submitted");
                if (status === "under_investigation") return tStatuses("investigating");
                return status; // Return as is if still fails
            } catch {
                return status;
            }
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
                            {previewEvidence.length > 0 && (
                                <div className={cn(
                                    "grid gap-1 mt-3 rounded-2xl overflow-hidden",
                                    previewEvidence.length === 1 && "grid-cols-1",
                                    previewEvidence.length === 2 && "grid-cols-2",
                                    previewEvidence.length >= 3 && "grid-cols-2"
                                )}>
                                    {previewEvidence.slice(0, 4).map((url, i) => {
                                        const isVideo = isVideoUrl(url);
                                        const isLastVisible = i === 3;
                                        const hasMore = previewEvidence.length > 4;
                                        const remaining = previewEvidence.length - 4;

                                        // For 3 images: first is tall
                                        const isTall = previewEvidence.length === 3 && i === 0;

                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "relative bg-muted/50 overflow-hidden",
                                                    previewEvidence.length === 1 ? "aspect-video max-h-72 rounded-2xl" : "aspect-square",
                                                    isTall && "row-span-2",
                                                    // Corner rounding based on position for multi-image grids
                                                    previewEvidence.length === 2 && i === 0 && "rounded-l-2xl",
                                                    previewEvidence.length === 2 && i === 1 && "rounded-r-2xl",
                                                    previewEvidence.length >= 3 && i === 0 && "rounded-tl-2xl",
                                                    previewEvidence.length >= 3 && !isTall && i === 1 && "rounded-tr-2xl",
                                                    previewEvidence.length >= 3 && i === 2 && "rounded-bl-2xl",
                                                    previewEvidence.length >= 3 && i === 3 && "rounded-br-2xl",
                                                    previewEvidence.length === 3 && i === 0 && "rounded-l-2xl",
                                                    previewEvidence.length === 3 && i === 1 && "rounded-tr-2xl",
                                                    previewEvidence.length === 3 && i === 2 && "rounded-br-2xl"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isVideo) {
                                                        setActiveVideoUrl(url);
                                                    } else {
                                                        // For images, maybe open in new tab or just let the card click handle it
                                                        // but since we stop propagation, we should probably open it.
                                                        window.open(url, "_blank");
                                                    }
                                                }}
                                            >
                                                {isVideo ? (
                                                    <div className="relative w-full h-full">
                                                        <video
                                                            src={`${url}#t=0.1`}
                                                            className="w-full h-full object-cover"
                                                            preload="metadata"
                                                            muted
                                                            playsInline
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                                                                <Play className="h-6 w-6 fill-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                )}
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
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
 
            {/* Video Player Dialog */}
            <Dialog open={!!activeVideoUrl} onOpenChange={(open) => !open && setActiveVideoUrl(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Video Preview</DialogTitle>
                    </DialogHeader>
                    {activeVideoUrl && (
                        <div className="relative aspect-video w-full">
                            <video
                                src={activeVideoUrl}
                                className="w-full h-full"
                                controls
                                autoPlay
                                playsInline
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
