"use client";

import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, Hash, Globe, CheckCircle2, CircleDashed, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


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
    evidence?: string[];
    user?: {
        name: string | null;
        picture?: string;
    };
}

interface ComplaintCardProps {
    complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
    const isAnonymous = complaint.submissionMode === "anonymous";

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="group mb-4 overflow-hidden border-white/5 bg-background/20 backdrop-blur-xl transition-all duration-300 hover:bg-background/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                    <CardHeader className="flex flex-row items-start gap-4 p-5 pb-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={complaint.user?.picture} />
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
                        
                        {/* Footer hint */}
                        <div className="flex items-center text-xs text-muted-foreground/50">
                            <span className="flex items-center gap-1 group-hover:text-primary/70 transition-colors">
                                <FileText className="h-3 w-3" />
                                View Full Details
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-background/80 backdrop-blur-2xl border-white/10 sm:rounded-2xl">
                <DialogHeader className="p-6 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono text-xs uppercase bg-primary/5">
                            {complaint.submissionMode}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                            {new Date(complaint.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight">
                        {complaint.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <div className="space-y-8">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={complaint.user?.picture} />
                                <AvatarFallback className="text-lg">
                                    {isAnonymous ? "A" : complaint.user?.name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-base">
                                    {isAnonymous ? "Anonymous Reporter" : complaint.user?.name || "Public User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isAnonymous ? "Identity encrypted & protected" : "Verified Community Member"}
                                </p>
                            </div>
                        </div>

                        {/* Main Text */}
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 p-5 rounded-xl border border-white/5">
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                                {complaint.text}
                            </p>
                        </div>

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
                        {complaint.evidence && complaint.evidence.length > 0 && (
                             <div className="space-y-3">
                                <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Attached Evidence</span>
                                <div className="grid grid-cols-2 gap-3">
                                    {complaint.evidence.map((url, i) => (
                                        <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="group relative aspect-video bg-muted/50 rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-all">
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <FileText className="h-6 w-6" />
                                                <span className="ml-2 text-xs">View File {i + 1}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Blockchain Proof for Anon */}
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
                                        {complaint.transactionId || complaint.id /* Fallback */ }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
