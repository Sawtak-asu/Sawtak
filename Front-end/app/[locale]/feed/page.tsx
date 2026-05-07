"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ComplaintCard, Complaint } from "@/components/complaint-card";
import { ComplaintFilters } from "@/components/complaint-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, RefreshCw, FileText, Shield, Eye, Loader2, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { GridBackground } from "@/components/grid-background";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { type DirectedTo } from "@/lib/egypt-locations";
import { useTranslations, useLocale } from "next-intl";
import { apiUrl } from "@/lib/api";

interface FeedResponse {
    success: boolean;
    data?: {
        complaints: Complaint[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        filters: {
            categories: string[];
            areas: string[];
        };
    };
    error?: string;
}

async function fetchFeed(params: {
    search?: string;
    category?: string;
    area?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    page?: number;
    limit?: number;
    submissionMode?: string;
    directedTo?: DirectedTo;
}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.set("search", params.search);
    if (params.category && params.category !== "all") searchParams.set("category", params.category);
    if (params.area) searchParams.set("area", params.area);
    if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params.dateTo) searchParams.set("dateTo", params.dateTo);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.submissionMode && params.submissionMode !== "all") searchParams.set("submissionMode", params.submissionMode);
    if (params.directedTo) searchParams.set("directedTo", JSON.stringify(params.directedTo));

    const response = await fetch(apiUrl(`/api/feed?${searchParams.toString()}`));
    return response.json();
}

export default function FeedPage() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [submissionMode, setSubmissionMode] = useState("all");
    const [directedTo, setDirectedTo] = useState<DirectedTo | undefined>(undefined);
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [location, setLocation] = useState("");
    const [sort, setSort] = useState("newest");
    const t = useTranslations("Feed");
    const tCommon = useTranslations("Common");

    const ITEMS_PER_PAGE = 10;
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["feed", { search, category, submissionMode, location, directedTo, dateFrom, dateTo, sort }],
        queryFn: async ({ pageParam = 1 }) => {
            return fetchFeed({
                search: search || undefined,
                category: category !== "all" ? category : undefined,
                submissionMode: submissionMode !== "all" ? submissionMode : undefined,
                directedTo: directedTo || undefined,
                area: location || undefined,
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
                sort,
                page: pageParam,
                limit: ITEMS_PER_PAGE,
            });
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.data) return undefined;
            const { page, totalPages } = lastPage.data.pagination;
            return page < totalPages ? page + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 30000,
    });

    // Infinite scroll observer
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: "100px",
            threshold: 0,
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [handleObserver]);

    // Flatten all pages into a single array
    const allComplaints = data?.pages.flatMap(page => page.data?.complaints || []) || [];
    console.log("allComplaints: ", allComplaints);
    // Filter props shared between sidebar and mobile sheet
    const filterProps = {
        search,
        setSearch,
        category,
        setCategory,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        location,
        setLocation,
        submissionMode,
        setSubmissionMode,
        setDirectedTo,
    };

    return (
        <GridBackground>
            <Navbar />

            {/* Header Section */}
            <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-15 z-40" dir="ltr">
                <div className="container max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Eye className="h-4 w-4 text-primary" />
                            </div>
                            <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
                            <span className="text-muted-foreground">|</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {/* Mobile Filter Button */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="h-4 w-4 me-2" />
                                        {t("filters")}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80 overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            {t("filters")}
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-6">
                                        <ComplaintFilters
                                            {...filterProps}
                                            variant="sidebar"
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content with Sidebar */}
            <div className="container max-w-7xl mx-auto px-6 py-6" dir="ltr">
                <div className="flex gap-8">
                    {/* Sidebar Filters - Hidden on mobile, visible on md+ */}
                    <aside className="hidden md:block w-72 shrink-0">
                        <div className="sticky top-28">
                            <ComplaintFilters
                                {...filterProps}
                                variant="sidebar"
                            />
                        </div>
                    </aside>

                    {/* Feed - Takes remaining space */}
                    <main className="flex-1 max-w-2xl h-[calc(100vh-12rem)] overflow-y-auto scrollbar-none">
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card/50">
                                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                                <h3 className="text-lg font-medium">{t("failedToLoad")}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {(error as Error)?.message || "Please try again later."}
                                </p>
                                <Button onClick={() => refetch()}>
                                    {tCommon("tryAgain")}
                                </Button>
                            </div>
                        ) : allComplaints.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card/50">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">{t("noResults")}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {search || category !== "all" || location
                                        ? t("noResultsHint")
                                        : t("beFirst")}
                                </p>
                                <Button asChild>
                                    <Link href="/file-complaint">{tCommon("fileComplaint")}</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allComplaints.map((complaint) => (
                                    <ComplaintCard key={complaint.id} complaint={complaint} />
                                ))}

                                {/* Load more trigger */}
                                <div ref={loadMoreRef} className="py-4 flex justify-center">
                                    {isFetchingNextPage ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span className="text-sm">{t("loadingMore")}</span>
                                        </div>
                                    ) : hasNextPage ? (
                                        <div className="h-8" />
                                    ) : allComplaints.length > 0 ? (
                                        <p className="text-sm text-muted-foreground">{t("endOfResults")}</p>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all bg-primary text-primary-foreground border-2 border-background">
                    <Link href="/file-complaint">
                        <Plus className="h-6 w-6" />
                        <span className="sr-only">{tCommon("fileComplaint")}</span>
                    </Link>
                </Button>
            </div>
        </GridBackground>
    );
}
