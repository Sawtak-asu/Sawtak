"use client"

import * as React from "react"
import { ChevronsUpDown, Building2, MapPin, Shield } from "lucide-react"
import { useAdmin } from "@/lib/admin-context"
import { Badge } from "@/components/ui/badge"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const {
    isPlatformAdmin,
    teamMemberships,
    selectedTeam,
    selectedTeamRole,
    switchTeam,
    isLoading
  } = useAdmin()

  // Platform admin view - no team switching
  if (isPlatformAdmin) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Shield className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Platform Admin</span>
              <span className="truncate text-xs text-muted-foreground">Global Access</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // No teams - show placeholder
  if (teamMemberships.length === 0) {
    if (isLoading) {
      return (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <div className="bg-muted flex aspect-square size-8 items-center justify-center rounded-lg animate-pulse" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-muted-foreground">Loading...</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )
    }
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="bg-muted text-muted-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-muted-foreground">No Teams</span>
              <span className="truncate text-xs text-muted-foreground">Contact admin</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Get icon based on team type
  const getTeamIcon = (type: string) => {
    return type === "ministry" ? Building2 : MapPin
  }

  // Get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "reviewer": return "secondary"
      case "manager": return "default"
      case "team_admin": return "destructive"
      default: return "outline"
    }
  }

  const TeamIcon = selectedTeam ? getTeamIcon(selectedTeam.type) : Building2

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <TeamIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedTeam?.displayName || "Select Team"}
                </span>
                <span className="truncate text-xs capitalize">
                  {selectedTeamRole?.replace("_", " ") || "—"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              My Teams
            </DropdownMenuLabel>
            {teamMemberships.map((membership) => {
              const Icon = getTeamIcon(membership.team.type)
              const isActive = selectedTeam?.id === membership.team.id
              return (
                <DropdownMenuItem
                  key={membership.team.id}
                  onClick={() => switchTeam(membership.team.id)}
                  className={`gap-2 p-2 ${isActive ? "bg-accent" : ""}`}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Icon className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex-1 truncate">{membership.team.displayName}</div>
                  <Badge variant={getRoleBadgeVariant(membership.role) as any} className="text-xs capitalize">
                    {membership.role.replace("_", " ")}
                  </Badge>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {teamMemberships.length} team{teamMemberships.length !== 1 ? "s" : ""}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
