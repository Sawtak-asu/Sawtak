"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Navbar() {
    const { logout, user, isLoggedIn } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    return (
        <header className="sticky top-0 flex items-center justify-center z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Logo />
                    </Link>
                    <Link
                        href="/feed"
                        className={cn(
                            "transition-colors hover:text-foreground/80",
                            pathname === "/feed" ? "text-foreground" : "text-foreground/60"
                        )}
                    >
                        Feed
                    </Link>
                    <Link
                        href="/file-complaint"
                        className={cn(
                            "transition-colors hover:text-foreground/80",
                            pathname === "/file-complaint" ? "text-foreground" : "text-foreground/60"
                        )}
                    >
                        File Complaint
                    </Link>
                </div>

                <div className="flex items-center justify-end space-x-2">
                    <div className="flex items-center space-x-4">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium hidden md:inline-block">
                                    {user?.name || user?.email}
                                </span>
                                <Button variant="ghost" size="sm" onClick={logout}>
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                                Login
                            </Button>
                        )}
                        <ModeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
