"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface AdminLayoutProps {
    children: React.ReactNode
    breadcrumbs?: { label: string; href?: string }[]
}

export function AdminLayout({ children, breadcrumbs = [] }: AdminLayoutProps) {
    const { user, isLoggedIn, isLoading } = useAuth()
    const router = useRouter()

    // Protect admin routes
    useEffect(() => {
        if (!isLoading) {
            const isAdmin = user?.role?.toUpperCase() === 'ADMIN'
            if (!isLoggedIn || !isAdmin) {
                router.replace("/")
            }
        }
    }, [isLoading, isLoggedIn, user, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!isLoggedIn || user?.role?.toUpperCase() !== 'ADMIN') {
        return null
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {/* Header with breadcrumbs */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((crumb, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {crumb.href ? (
                                            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                {/* Main content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
