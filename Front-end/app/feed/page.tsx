"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ComplaintCard, Complaint } from "@/components/complaint-card";
import { ComplaintFilters } from "@/components/complaint-filters";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, RefreshCw, FileText, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GridBackground } from "@/components/grid-background";

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
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [submissionMode, setSubmissionMode] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [location, setLocation] = useState("");
    const [sort, setSort] = useState("newest");
    const { user } = useAuth();

    const ITEMS_PER_PAGE = 10;

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["feed", { search, category, submissionMode, location, dateFrom, dateTo, sort, page }],
        queryFn: () =>
            fetchFeed({
                search: search || undefined,
                category: category !== "all" ? category : undefined,
                submissionMode: submissionMode !== "all" ? submissionMode : undefined,
                area: location || undefined,
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
                sort,
                page,
                limit: ITEMS_PER_PAGE,
            }),
        staleTime: 30000,
    });

    const complaints = data?.data?.complaints || [];
    const pagination = data?.data?.pagination;
    const totalPages = pagination?.totalPages || 1;

    return (
        <GridBackground>
            <Navbar />
            
            {/* Header Section */}
            <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
                <div className="container max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-md shadow-sm">
                                    <Eye className="h-5 w-5 text-primary" />
                                </div>
                                <h1 className="text-2xl font-semibold tracking-tight">Public Feed</h1>
                            </div>
                            <p className="mt-2 text-base md:text-md text-muted-foreground font-mono leading-relaxed">
                                Browse {pagination?.total || 0} public complaints from the community. 
                                All information displayed respects user privacy settings.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="shadow-sm bg-background/50"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button asChild size="sm" className="shadow-sm">
                                <Link href="/file-complaint">
                                    <FileText className="h-4 w-4 mr-2" />
                                    File Complaint
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
                        <div className="text-center">
                            <p className="text-2xl font-semibold">{pagination?.total || 0}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Complaints</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-semibold">
                                {complaints.filter(c => c.submissionMode === "anonymous").length || 0}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Anonymous</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-semibold">
                                {complaints.filter(c => c.submissionMode === "public").length || 0}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Identified</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container max-w-6xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Filters */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-6 space-y-4">
                            <div className="rounded-xl border border-border bg-card p-4">
                                <h3 className="font-medium mb-4 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Filters
                                </h3>
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
                                    submissionMode={submissionMode}
                                    setSubmissionMode={(val) => { setSubmissionMode(val); setPage(1); }}
                                />
                            </div>
                        </div>
                    </aside>

                    {/* Complaints List */}
                    <main className="lg:col-span-3">
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
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
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
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
                            <>
                                <div className="space-y-4">
                                    {complaints.map((complaint) => (
                                        <ComplaintCard key={complaint.id} complaint={complaint} />
                                    ))}
                                </div>
                                
                                {totalPages > 1 && (
                                    <div className="flex justify-center pt-6 pb-4">
                                        <Pagination
                                            currentPage={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </GridBackground>
    );
}
