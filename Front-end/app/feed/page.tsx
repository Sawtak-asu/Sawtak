"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ComplaintCard, Complaint } from "@/components/complaint-card";
import { ComplaintFilters } from "@/components/complaint-filters";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    const response = await fetch(`${API_URL}/api/feed?${searchParams.toString()}`);
    return response.json();
}

export default function FeedPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [location, setLocation] = useState("");
    const [sort, setSort] = useState("newest");
    const { user } = useAuth();

    const ITEMS_PER_PAGE = 10;

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["feed", { search, category, location, dateFrom, dateTo, sort, page }],
        queryFn: () =>
            fetchFeed({
                search: search || undefined,
                category: category !== "all" ? category : undefined,
                area: location || undefined,
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
                sort,
                page,
                limit: ITEMS_PER_PAGE,
            }),
        staleTime: 30000, // 30 seconds
    });

    const complaints = data?.data?.complaints || [];
    const pagination = data?.data?.pagination;
    const totalPages = pagination?.totalPages || 1;

    return (
        <div className="min-h-screen bg-muted/20">
            <Navbar />
            <div className="overflow-y-auto h-[calc(100vh-5rem)] w-screen">
                <main className="container py-6 max-w-2xl mx-auto">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold">Public Complaints Feed</h1>
                                <p className="text-sm text-muted-foreground">
                                    Browse {pagination?.total || 0} complaints from the community
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        {/* Filters */}
                        <ComplaintFilters
                            search={search}
                            setSearch={(val) => { setSearch(val); setPage(1); }}
                            category={category}
                            setCategory={(val) => { setCategory(val); setPage(1); }}
                            dateFrom={dateFrom}
                            setDateFrom={(val) => { setDateFrom(val); setPage(1); }}
                            dateTo={dateTo}
                            setDateTo={(val) => { setDateTo(val); setPage(1); }}
                            location={location}
                            setLocation={(val) => { setLocation(val); setPage(1); }}
                            sort={sort}
                            setSort={setSort}
                        />

                        {/* Content */}
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                                <h3 className="text-lg font-medium">Failed to load complaints</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {(error as Error)?.message || "Please try again later."}
                                </p>
                                <Button onClick={() => refetch()}>
                                    Try Again
                                </Button>
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No complaints found</h3>
                                <p className="text-sm text-muted-foreground">
                                    {search || category !== "all" || location
                                        ? "Try adjusting your filters."
                                        : "Be the first to file a complaint!"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {complaints.map((complaint) => (
                                        <ComplaintCard key={complaint.id} complaint={complaint} />
                                    ))}
                                </div>
                                
                                {totalPages > 1 && (
                                    <div className="flex justify-center pt-4 pb-8">
                                        <Pagination
                                            currentPage={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
