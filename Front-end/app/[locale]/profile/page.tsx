"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
    User,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Calendar,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserComplaint {
    id: string;
    title: string;
    category: string;
    status: string;
    visibility: string;
    createdAt: string;
}

const statusColors: Record<string, string> = {
    submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    investigating: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    resolved: "bg-green-500/10 text-green-600 border-green-500/20",
    dismissed: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function ProfilePage() {
    const { user, isLoggedIn, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const t = useTranslations("Profile");
    const tCommon = useTranslations("Common");

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.replace("/login");
        }
    }, [authLoading, isLoggedIn, router]);

    // Fetch user's complaints
    const { data, isLoading } = useQuery({
        queryKey: ["my-complaints", user?.id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/complaints/identified/user/${user?.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.json();
        },
        enabled: isLoggedIn && !!user?.id && !!token,
    });

    const complaints: UserComplaint[] = data?.data?.complaints || [];

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container max-w-4xl mx-auto px-6 py-12">
                    <Skeleton className="h-32 w-full rounded-xl mb-6" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container max-w-4xl mx-auto px-6 py-8">
                {/* Profile Header */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-xl">
                                    {user?.name?.[0] || user?.email?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h1 className="text-xl font-semibold">{user?.name || "User"}</h1>
                                <p className="text-muted-foreground">{user?.email}</p>
                            </div>
                            <Button asChild>
                                <Link href="/file-complaint">
                                    <FileText className="h-4 w-4 me-2" />
                                    {t("newComplaint")}
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* My Complaints Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{t("myComplaints")}</h2>
                        <Badge variant="outline">{complaints.length} {t("total")}</Badge>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : complaints.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium">{t("noComplaints")}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {t("noComplaintsHint")}
                                    </p>
                                    <Button asChild className="mt-4">
                                        <Link href="/file-complaint">
                                            {t("fileFirst")}
                                            <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {complaints.map((complaint) => (
                                <Card key={complaint.id} className="hover:border-primary/30 transition-colors">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{complaint.title}</h3>
                                                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                    <span className="capitalize">{complaint.category}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {complaint.visibility === "private" ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        <EyeOff className="h-3 w-3 me-1" />
                                                        {tCommon("private")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Eye className="h-3 w-3 me-1" />
                                                        {tCommon("public")}
                                                    </Badge>
                                                )}
                                                <Badge className={statusColors[complaint.status]}>
                                                    {complaint.status === "submitted" && <Clock className="h-3 w-3 me-1" />}
                                                    {complaint.status === "resolved" && <CheckCircle className="h-3 w-3 me-1" />}
                                                    {complaint.status === "dismissed" && <XCircle className="h-3 w-3 me-1" />}
                                                    {complaint.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <Card className="mt-8 bg-muted/30">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <h3 className="font-medium">{t("aboutTitle")}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t("aboutDescription")}
                                </p>
                                <Button asChild variant="link" className="px-0 mt-2">
                                    <Link href="/track">
                                        {t("trackAnonymous")}
                                        <ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
