"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import { AdminLayout } from "@/components/admin-layout";
import { useTranslations, useLocale } from "next-intl";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, FileCheck, Users, Mail, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function MyTeamPage() {
    const { token } = useAuth();
    const { selectedTeam } = useAdmin();
    const t = useTranslations("Admin.myTeam");
    const tRoles = useTranslations("Admin.teams.roles");
    const tCommon = useTranslations("Admin.teams"); // For "member", "email", "role", "teamAdmin", etc. use existing keys if possible or duplicate. Actually "member", "email" are in Admin.teams
    const locale = useLocale();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-team-members", selectedTeam?.id],
        queryFn: async () => {
            if (!selectedTeam?.id) throw new Error("No team selected");
            const res = await fetch(apiUrl(`/api/admin/teams/${selectedTeam.id}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch team details");
            return await res.json();
        },
        enabled: !!token && !!selectedTeam?.id,
    });

    const teamData = data?.data;
    const members = teamData?.members || [];

    const getRoleBadge = (role: string) => {
        const roleName = tRoles(role === "team_admin" ? "teamAdmin" : role);
        switch (role) {
            case "team_admin":
                return <Badge variant="destructive" className="flex w-fit items-center gap-1"><Shield className="h-3 w-3" /> {roleName}</Badge>;
            case "manager":
                return <Badge variant="secondary" className="flex w-fit items-center gap-1"><FileCheck className="h-3 w-3" /> {roleName}</Badge>;
            case "reviewer":
                return <Badge variant="outline" className="flex w-fit items-center gap-1"><Eye className="h-3 w-3" /> {roleName}</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    if (!selectedTeam) {
        return (
            <AdminLayout breadcrumbs={[{ label: t("title") }]}>
                <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-muted/10 rounded-lg mx-6 mt-6 border border-dashed">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{t("noTeamSelected")}</h2>
                    <p className="text-muted-foreground max-w-md">
                        {t("selectTeamHint")}
                    </p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={[{ label: t("title"), href: "/admin/my-team" }]}>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">{selectedTeam.displayName}</h1>
                    <p className="text-muted-foreground">{t("teamMembersRoles")}</p>
                </div>

                <div className="rounded-md border bg-card">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-start">{tCommon("member")}</TableHead>
                                    <TableHead className="text-start">{tCommon("role")}</TableHead>
                                    <TableHead className="text-start">{tCommon("email")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            {t("noMembersFound")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((member: any) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={member.user.picture} />
                                                        <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getRoleBadge(member.role)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                    {member.user.email}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
