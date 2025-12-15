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
import Link from "next/link";
import { GridBackground } from "@/components/grid-background";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    const response = await fetch(`${API_URL}/api/feed?${searchParams.toString()}`);
    return response.json();
}

export default function FeedPage() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [submissionMode, setSubmissionMode] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [location, setLocation] = useState("");
    const [sort, setSort] = useState("newest");
    const { user } = useAuth();
    
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
        queryKey: ["feed", { search, category, submissionMode, location, dateFrom, dateTo, sort }],
        queryFn: async ({ pageParam = 1 }) => {
            return fetchFeed({
                search: search || undefined,
                category: category !== "all" ? category : undefined,
                submissionMode: submissionMode !== "all" ? submissionMode : undefined,
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
    const totalComplaints = data?.pages[0]?.data?.pagination.total || 0;

    return (
        <GridBackground>
            <Navbar />
            
            {/* Header Section - aligned with navbar */}
            <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-[3.5rem] z-40">
                <div className="container max-w-6xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Eye className="h-4 w-4 text-primary" />
                            </div>
                            <h1 className="text-lg font-semibold tracking-tight">Public Feed</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Mobile Filter Button */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="lg:hidden"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filters
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80">
                                    <SheetHeader>
                                        <SheetTitle className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Filters
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-6">
                                        <ComplaintFilters
                                            search={search}
                                            setSearch={setSearch}
                                            category={category}
                                            setCategory={setCategory}
                                            dateFrom={dateFrom}
                                            setDateFrom={setDateFrom}
                                            dateTo={dateTo}
                                            setDateTo={setDateTo}
                                            location={location}
                                            setLocation={setLocation}
                                            submissionMode={submissionMode}
                                            setSubmissionMode={setSubmissionMode}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="hidden sm:flex"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button asChild size="sm" className="hidden sm:flex">
                                <Link href="/file-complaint">
                                    <FileText className="h-4 w-4 mr-2" />
                                    File Complaint
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container max-w-6xl mx-auto px-6 py-6">
                <div className="flex gap-8">
                    {/* Sidebar Filters */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-36 space-y-4">
                            <h3 className="font-medium flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                Filters
                            </h3>
                            <ComplaintFilters
                                search={search}
                                setSearch={setSearch}
                                category={category}
                                setCategory={setCategory}
                                dateFrom={dateFrom}
                                setDateFrom={setDateFrom}
                                dateTo={dateTo}
                                setDateTo={setDateTo}
                                location={location}
                                setLocation={setLocation}
                                submissionMode={submissionMode}
                                setSubmissionMode={setSubmissionMode}
                            />
                        </div>
                    </aside>

                    {/* Feed - Takes remaining space */}
                    <main className="flex-1 max-w-2xl">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card/50">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-lg font-medium">Failed to load complaints</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {(error as Error)?.message || "Please try again later."}
                            </p>
                            <Button onClick={() => refetch()}>
                                Try Again
                            </Button>
                        </div>
                    ) : allComplaints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card/50">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No complaints found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {search || category !== "all" || location
                                    ? "Try adjusting your filters."
                                    : "Be the first to file a complaint!"}
                            </p>
                            <Button asChild>
                                <Link href="/file-complaint">File a Complaint</Link>
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
                                        <span className="text-sm">Loading more...</span>
                                    </div>
                                ) : hasNextPage ? (
                                    <div className="h-8" /> 
                                ) : allComplaints.length > 0 ? (
                                    <p className="text-sm text-muted-foreground">You've reached the end</p>
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
                        <span className="sr-only">File Complaint</span>
                    </Link>
                </Button>
            </div>
        </GridBackground>
    );
}

