"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  FileQuestion,
  BarChart3,
  Settings,
  AlertTriangle,
  UserX,
  Scale,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

// Admin navigation structure
const adminNavMain = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Complaints",
    url: "/admin/complaints",
    icon: FileText,
    items: [
      {
        title: "All Complaints",
        url: "/admin/complaints",
      },
      {
        title: "Pending Review",
        url: "/admin/complaints?status=submitted",
      },
      {
        title: "Investigating",
        url: "/admin/complaints?status=investigating",
      },
      {
        title: "Escalated",
        url: "/admin/complaints?escalated=true",
      },
    ],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    items: [
      {
        title: "All Users",
        url: "/admin/users",
      },
      {
        title: "Blocked Users",
        url: "/admin/users?blocked=true",
      },
    ],
  },
  {
    title: "Admin Team",
    url: "/admin/team",
    icon: Shield,
    items: [
      {
        title: "All Admins",
        url: "/admin/team",
      },
      {
        title: "Activity Log",
        url: "/admin/team/activity",
      },
    ],
  },
  // {
  //   title: "Data Requests",
  //   url: "/admin/data-requests",
  //   icon: FileQuestion,
  //   items: [
  //     {
  //       title: "Pending Requests",
  //       url: "/admin/data-requests?status=pending",
  //     },
  //     {
  //       title: "All Requests",
  //       url: "/admin/data-requests",
  //     },
  //   ],
  // },
  // {
  //   title: "Analytics",
  //   url: "/admin/analytics",
  //   icon: BarChart3,
  // },
  // {
  //   title: "Settings",
  //   url: "/admin/settings",
  //   icon: Settings,
  //   items: [
  //     {
  //       title: "General",
  //       url: "/admin/settings",
  //     },
  //     {
  //       title: "Escalation Rules",
  //       url: "/admin/settings/escalation",
  //     },
  //     {
  //       title: "Notifications",
  //       url: "/admin/settings/notifications",
  //     },
  //   ],
  // },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Format user data for NavUser component
  const userData = {
    name: user?.name || user?.email || "Admin",
    email: user?.email || "",
    avatar: user?.picture || "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Scale className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Sawtak Admin</span>
                  <span className="truncate text-xs text-muted-foreground">Management Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
