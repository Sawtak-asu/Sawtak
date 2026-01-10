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
  NotebookText
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

// Platform Admin navigation - full access
const platformAdminNav = [
  [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,

    },
    {
      title: "Teams",
      url: "/admin/teams",
      icon: Shield,
    }
  ],
  [{
    title: "Users",
    url: "/admin/users",
    icon: Users,
    isActive: true,
    items: [
      { title: "All Users", url: "/admin/users" },
      { title: "Blocked Users", url: "/admin/users?blocked=true" },
    ],
  },]
]

// Reviewer navigation - view queue, escalate
const reviewerNav = [
  [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,

    },
    {
      title: "Team Members",
      url: "/admin/team",
      icon: Users,
    },

  ],
  [
    {
      title: "Complaints Queue",
      url: "/admin/complaints",
      icon: ClipboardList,
      isActive: true,
      items: [
        { title: "Incoming (Pending)", url: "/admin/complaints?status=submitted" },
        { title: "Escalated", url: "/admin/complaints?status=investigating" },
        { title: "Closed History", url: "/admin/complaints?status=closed" },
      ],
    },
  ]
]

// Manager navigation - investigate, resolve, flag
const managerNav = [
  [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Team",
      url: "/admin/team",
      icon: Users,
    },
  ], [
    {
      title: "Complaints Queue",
      url: "/admin/complaints",
      icon: ClipboardList,
      isActive: true,
      items: [
        { title: "In Progress", url: "/admin/complaints?status=investigating" },
        { title: "Resolved", url: "/admin/complaints?status=resolved" },
        { title: "Closed History", url: "/admin/complaints?status=closed" },
        { title: "Flagged Inaccurate", url: "/admin/complaints?status=flagged" },
      ],
    },
  ]
]


// Team Admin navigation - legal escalation, audits
const teamAdminNav = [
  [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Team Members",
      url: "/admin/team-members",
      icon: Users,
    },
  ], [
    {
      title: "Complaints Queue",
      url: "/admin/complaints",
      icon: FileText,
      isActive: true,
      items: [
        // { title: "All", url: "/admin/complaints" },
        { title: "Flagged Complaints", url: "/admin/complaints?status=flagged" },
      ],
    },
  ]

]

const general = [
  { title: "Home page", url: "/", icon: Home },
  { title: "Feed", url: "/feed", icon: NotebookText },
  { title: "File Complaint", url: "/file-complaint", icon: SquarePen },
  { title: "Documents", url: "/docs", icon: BookOpenText }
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { isPlatformAdmin, selectedTeamRole } = useAdmin()

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
