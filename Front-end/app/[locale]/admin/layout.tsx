"use client";

import { AdminProvider } from "@/lib/admin-context";

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminProvider>{children}</AdminProvider>;
}
