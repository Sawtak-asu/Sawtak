"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

// Team member role within a team
export type TeamRole = "reviewer" | "manager" | "team_admin";

// User's global role
export type UserRole = "user" | "platform_admin";

interface Team {
    id: string;
    entity_id: string;
    type: "ministry" | "governorate" | "center";
    displayName: string;
    displayNameAr: string;
}

interface TeamMembership {
    team: Team;
    role: TeamRole;
}

interface AdminContextType {
    // User's global role (user or platform_admin)
    userRole: UserRole;

    // Is the user any kind of admin (platform_admin or team member)?
    isAdmin: boolean;

    // Is the user a platform admin?
    isPlatformAdmin: boolean;

    // User's team memberships (empty for platform_admin)
    teamMemberships: TeamMembership[];

    // Currently selected team (null for platform_admin)
    selectedTeam: Team | null;

    // Role in the currently selected team
    selectedTeamRole: TeamRole | null;

    // Switch to a different team
    switchTeam: (teamId: string) => void;

    // Loading state
    isLoading: boolean;

    // Refresh team data
    refreshTeams: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { user, token, isLoggedIn } = useAuth();
    const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Determine user's global role
    const userRole: UserRole = user?.role === "platform_admin" ? "platform_admin" : "user";
    const isPlatformAdmin = userRole === "platform_admin";

    // Check if user is any kind of admin
    const isAdmin = isPlatformAdmin || teamMemberships.length > 0;

    // Get selected team and role
    const selectedMembership = teamMemberships.find(m => m.team.id === selectedTeamId);
    const selectedTeam = selectedMembership?.team || null;
    const selectedTeamRole = selectedMembership?.role || null;

    // Fetch user's team memberships
    const fetchTeamMemberships = useCallback(async () => {
        if (!token || isPlatformAdmin) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/admin/teams/my-teams`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const memberships: TeamMembership[] = data.data?.teams || [];
                setTeamMemberships(memberships);

                // Auto-select logic with persistence
                if (memberships.length > 0) {
                    const storedTeamId = typeof window !== 'undefined' ? localStorage.getItem("admin_selected_team_id") : null;

                    if (storedTeamId && memberships.some(m => m.team.id === storedTeamId)) {
                        // Use stored preference if valid
                        if (selectedTeamId !== storedTeamId) {
                            setSelectedTeamId(storedTeamId);
                        }
                    } else if (!selectedTeamId) {
                        // Default to first team
                        setSelectedTeamId(memberships[0].team.id);
                    }
                }
            }
        } catch (error) {
            console.error("[AdminContext] Failed to fetch team memberships:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, isPlatformAdmin, selectedTeamId]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchTeamMemberships();
        } else {
            setTeamMemberships([]);
            setSelectedTeamId(null);
            setIsLoading(false);
        }
    }, [isLoggedIn, fetchTeamMemberships]);

    const switchTeam = (teamId: string) => {
        const exists = teamMemberships.some(m => m.team.id === teamId);
        if (exists) {
            setSelectedTeamId(teamId);
            if (typeof window !== 'undefined') {
                localStorage.setItem("admin_selected_team_id", teamId);
            }
        }
    };

    const refreshTeams = async () => {
        setIsLoading(true);
        await fetchTeamMemberships();
    };

    return (
        <AdminContext.Provider
            value={{
                userRole,
                isAdmin,
                isPlatformAdmin,
                teamMemberships,
                selectedTeam,
                selectedTeamRole,
                switchTeam,
                isLoading,
                refreshTeams,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
}

// Helper to check if user can perform an action
export function canPerformAction(
    role: TeamRole | null,
    isPlatformAdmin: boolean,
    action: "close" | "escalate" | "investigate" | "resolve" | "flag" | "legal_escalate" | "manage_team"
): boolean {
    if (isPlatformAdmin) return true; // Platform admin can do everything

    if (!role) return false;

    switch (action) {
        case "close":
        case "escalate":
            return role === "reviewer" || role === "manager" || role === "team_admin";
        case "investigate":
        case "resolve":
        case "flag":
            return role === "manager" || role === "team_admin";
        case "legal_escalate":
            return role === "team_admin";
        case "manage_team":
            return false; // Only platform_admin
        default:
            return false;
    }
}
