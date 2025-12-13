import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Calendar, ThumbsUp, MessageSquare, Share2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    user?: {
        name: string;
        picture?: string;
    };
}

interface ComplaintCardProps {
    complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
    return (
        <Card className="mb-4">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
                <Avatar>
                    <AvatarImage src={complaint.user?.picture} />
                    <AvatarFallback>
                        {complaint.submissionMode === "anonymous" ? "A" : complaint.user?.name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                            {complaint.submissionMode === "anonymous"
                                ? "Anonymous User"
                                : complaint.user?.name || "Public User"}
                        </span>
                        {complaint.submissionMode === "anonymous" && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Anonymous</Badge>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(complaint.createdAt), {
                            addSuffix: true,
                        })} • {complaint.category}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <h3 className="font-semibold text-lg mb-2">{complaint.title}</h3>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-4">
                    {complaint.text}
                </p>

                <div className="flex flex-wrap gap-2 mb-2">
                    {complaint.area && (
                        <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            <MapPin className="mr-1 h-3 w-3" />
                            {complaint.area}
                        </div>
                    )}
                    {complaint.incidentDate && (
                        <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(complaint.incidentDate).toLocaleDateString()}
                        </div>
                    )}
                    <Badge variant={complaint.status === "resolved" ? "default" : "outline"} className="capitalize">
                        Status: {complaint.status || "Pending"}
                    </Badge>
                </div>
            </CardContent>

        </Card>
    );
}
