"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { Separator } from "@/components/ui/separator";
import { Bookmark, SquareActivity } from "lucide-react";

export function Sidebar() {
    const { user, isLoggedIn } = useAuth();

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <CardHeader className="pb-0 pt-0 px-4 -mt-8">
                    <div className="flex justify-center">
                        <Avatar className="h-16 w-16 border-4 border-background cursor-pointer">
                            <AvatarImage src={user?.picture} />
                            <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="text-center mt-2 pb-4">
                        <h3 className="font-semibold hover:underline cursor-pointer">
                            {isLoggedIn ? user?.name : "Guest User"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {isLoggedIn ? user?.email : "Welcome to Sawtak"}
                        </p>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="py-4 text-sm text-muted-foreground">
                    <div className="flex justify-between items-center hover:bg-muted/50 p-1 rounded cursor-pointer">
                        <span>Profile viewers</span>
                        <span className="text-primary font-semibold">0</span>
                    </div>
                    <div className="flex justify-between items-center hover:bg-muted/50 p-1 rounded cursor-pointer">
                        <span>Post impressions</span>
                        <span className="text-primary font-semibold">0</span>
                    </div>
                </CardContent>
                <Separator />
                <CardContent className="py-4 hover:bg-muted/50 cursor-pointer flex items-center gap-2 text-sm">
                    <Bookmark className="h-4 w-4" />
                    <span>Saved items</span>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="py-4 space-y-4 text-xs font-semibold text-primary">
                    <div className="group flex justify-between items-center cursor-pointer">
                        <span className="group-hover:underline">Groups</span>
                    </div>
                    <div className="group flex justify-between items-center cursor-pointer">
                        <span className="group-hover:underline">Events</span>
                        <PlusIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="group flex justify-between items-center cursor-pointer">
                        <span className="group-hover:underline">Followed Hashtags</span>
                    </div>
                </CardContent>
                <Separator />
                <CardContent className="py-3 hover:bg-muted/50 cursor-pointer text-sm text-muted-foreground text-center font-semibold">
                    Discover more
                </CardContent>
            </Card>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
