"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ComplaintCard, Complaint } from "@/components/complaint-card";
import { ComplaintFilters } from "@/components/complaint-filters";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Image as ImageIcon, Calendar, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/sidebar";
import { Widgets } from "@/components/widgets";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";

const MOCK_COMPLAINTS: Complaint[] = [
    {
        id: "1",
        title: "Broken Street Light",
        text: "The street light at the corner of 5th and Main has been out for a week. It's very dark and dangerous at night.",
        category: "other",
        area: "Downtown",
        incidentDate: "2023-10-25",
        createdAt: "2023-10-26T10:00:00Z",
        status: "pending",
        submissionMode: "public",
        user: { name: "John Doe" },
    },
    {
        id: "2",
        title: "Bribery Attempt at Local Office",
        text: "I was asked to pay a 'speeding fee' to get my documents processed faster at the local municipality office.",
        category: "corruption",
        area: "City Hall",
        incidentDate: "2023-10-20",
        createdAt: "2023-10-21T14:30:00Z",
        status: "investigating",
        submissionMode: "anonymous",
    },
    {
        id: "3",
        title: "Police Misconduct",
        text: "An officer was very rude and aggressive during a routine traffic stop. He refused to provide his badge number.",
        category: "misconduct",
        area: "Westside",
        incidentDate: "2023-10-28",
        createdAt: "2023-10-29T09:15:00Z",
        status: "resolved",
        submissionMode: "anonymous",
    },
    {
        id: "4",
        title: "Potholes on Elm Street",
        text: "There are several large potholes on Elm Street that are damaging cars. They need to be fixed ASAP.",
        category: "other",
        area: "Elm Street",
        createdAt: "2023-10-30T11:20:00Z",
        status: "pending",
        submissionMode: "public",
        user: { name: "Jane Smith" },
    },
    {
        id: "5",
        title: "Unfair Treatment in Hospital",
        text: "I was ignored for hours in the ER while others who came after me were seen first. I believe it was discrimination.",
        category: "misconduct",
        area: "General Hospital",
        incidentDate: "2023-10-22",
        createdAt: "2023-10-23T16:45:00Z",
        status: "investigating",
        submissionMode: "anonymous",
    },
];

export default function FeedPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [location, setLocation] = useState("");
    const [sort, setSort] = useState("newest");
    const { user } = useAuth();

    // Using mock data directly for now as requested
    const isLoading = false;
    const isError = false;

    let filtered = [...MOCK_COMPLAINTS];

    // Search Filter
    if (search) {
        filtered = filtered.filter(
            (c) =>
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.text.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Category Filter
    if (category && category !== "all") {
        filtered = filtered.filter((c) => c.category === category);
    }

    // Location Filter
    if (location) {
        filtered = filtered.filter((c) =>
            c.area?.toLowerCase().includes(location.toLowerCase())
        );
    }

    // Date Range Filter
    if (dateFrom) {
        filtered = filtered.filter((c) => new Date(c.createdAt) >= dateFrom);
    }
    if (dateTo) {
        // Set time to end of day for dateTo
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        filtered = filtered.filter((c) => new Date(c.createdAt) <= endOfDay);
    }

    // Sorting
    filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (sort === "oldest") {
            return dateA - dateB;
        }
        return dateB - dateA; // Default to newest
    });

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedComplaints = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-muted/20">
            <Navbar />
            <div className="overflow-y-auto h-[calc(100vh-5rem)] w-screen">
                <main className="container py-6 max-w-2xl mx-auto ">
                    <div className="space-y-4">
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
                            sort={sort}
                            setSort={setSort}
                        />

                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-10 text-destructive">
                                Failed to load complaints. Please try again later.
                            </div>
                        ) : paginatedComplaints.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No complaints found.
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedComplaints.map((complaint) => (
                                        <ComplaintCard key={complaint.id} complaint={complaint} />
                                    ))}
                                </div>
                                <div className="flex justify-center pt-4 pb-8">
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
