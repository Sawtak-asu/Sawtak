"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  Scale,
  ClipboardList,
  Flag,
  History,
  BookOpenText,
  Home,
  SquarePen,
  NotebookText,
  UserSearch
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useAdmin } from "@/lib/admin-context"
import { useTranslations } from "next-intl"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { isPlatformAdmin, selectedTeamRole } = useAdmin()
  const t = useTranslations("Sidebar")

  // Platform Admin navigation - full access
  const platformAdminNav = [
    [
      {
        title: t("nav.dashboard"),
        url: "/admin",
        icon: LayoutDashboard,

      },
      {
        title: t("nav.teams"),
        url: "/admin/teams",
        icon: Shield,
      },
      {
        title: t("nav.revealRequests"),
        url: "/admin/reveal-requests",
        icon: UserSearch,
      },
      {
        title: t("nav.auditLogs"),
        url: "/admin/audits",
        icon: History,
      }
    ],
    [{
      title: t("nav.users"),
      url: "/admin/users",
      icon: Users,
      isActive: true,
      items: [
        { title: t("nav.allUsers"), url: "/admin/users" },
        { title: t("nav.blockedUsers"), url: "/admin/users?blocked=true" },
      ],
    },]
  ]

  // Reviewer navigation - view queue, escalate
  const reviewerNav = [
    [
      {
        title: t("nav.dashboard"),
        url: "/admin",
        icon: LayoutDashboard,

      },
      {
        title: t("nav.teamMembers"),
        url: "/admin/team",
        icon: Users,
      },

    ],
    [
      {
        title: t("nav.complaintsQueue"),
        url: "/admin/complaints",
        icon: ClipboardList,
        isActive: true,
        items: [
          { title: t("nav.incoming"), url: "/admin/complaints?status=submitted" },
          { title: t("nav.escalated"), url: "/admin/complaints?status=investigating" },
          { title: t("nav.closedHistory"), url: "/admin/complaints?status=closed" },
        ],
      },
    ]
  ]

  // Manager navigation - investigate, resolve, flag
  const managerNav = [
    [
      {
        title: t("nav.dashboard"),
        url: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: t("nav.teamMembers"),
        url: "/admin/team",
        icon: Users,
      },
      {
        title: t("nav.auditLogs"),
        url: "/admin/audits",
        icon: History,
      },
    ], [
      {
        title: t("nav.complaintsQueue"),
        url: "/admin/complaints",
        icon: ClipboardList,
        isActive: true,
        items: [
          { title: t("nav.inProgress"), url: "/admin/complaints?status=investigating" },
          { title: t("nav.resolved"), url: "/admin/complaints?status=resolved" },
          { title: t("nav.closedHistory"), url: "/admin/complaints?status=closed" },
          { title: t("nav.flaggedInaccurate"), url: "/admin/complaints?status=flagged" },
        ],
      },
    ]
  ]

  // Team Admin navigation - legal escalation, audits
  const teamAdminNav = [
    [
      {
        title: t("nav.dashboard"),
        url: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: t("nav.teamMembers"),
        url: "/admin/team",
        icon: Users,
      },
      {
        title: t("nav.myRevealRequests"),
        url: "/admin/my-reveal-requests",
        icon: UserSearch,
      },
      {
        title: t("nav.auditLogs"),
        url: "/admin/audits",
        icon: History,
      },
    ], [
      {
        title: t("nav.complaintsQueue"),
        url: "/admin/complaints",
        icon: FileText,
        isActive: true,
        items: [
          { title: t("nav.flaggedComplaints"), url: "/admin/complaints?status=flagged" },
        ],
      },
    ]

  ]

  const general = [
    { title: t("nav.home"), url: "/", icon: Home },
    { title: t("nav.feed"), url: "/feed", icon: NotebookText },
    { title: t("nav.fileComplaint"), url: "/file-complaint", icon: SquarePen },
    { title: t("nav.documents"), url: "/docs", icon: BookOpenText }
  ];

  // Determine which navigation to show based on role
  const getNavItems = () => {
    if (isPlatformAdmin) {
      return platformAdminNav
    }

    switch (selectedTeamRole) {
      case "reviewer":
        return reviewerNav
      case "manager":
        return managerNav
      case "team_admin":
        return teamAdminNav
      default:
        return reviewerNav // Fallback
    }
  }

  // Format user data for NavUser component
  const userData = {
    name: user?.name || user?.email || "Admin",
    email: user?.email || "",
    avatar: user?.picture || "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <NavMain items={getNavItems()} general={general} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
