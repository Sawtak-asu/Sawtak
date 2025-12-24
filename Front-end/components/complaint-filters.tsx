"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { type DirectedToType, GOVERNORATES, MINISTRIES, type DirectedTo } from "@/lib/egypt-locations";
import { FormItem } from "./ui/form";

interface ComplaintFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    dateFrom: Date | undefined;
    setDateFrom: (date: Date | undefined) => void;
    dateTo: Date | undefined;
    setDateTo: (date: Date | undefined) => void;
    location: string;
    setLocation: (value: string) => void;
    submissionMode: string;
    setSubmissionMode: (value: string) => void;
    setDirectedTo: (value: DirectedTo | undefined) => void;
    variant?: "popover" | "sidebar";
}

export function ComplaintFilters({
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
    variant = "popover",
}: ComplaintFiltersProps) {
    const [directedToType, setDirectedToType] = useState("none");
    const [directedToMinistry, setDirectedToMinistry] = useState("");
    const [directedToGovernorate, setDirectedToGovernorate] = useState("");
    const [directedToCenter, setDirectedToCenter] = useState("");

    const onChangeDirectedTo = (value: string) => {
        switch (directedToType) {
            case "none":
                setDirectedToMinistry(""),
                    setDirectedToGovernorate(""),
                    setDirectedToCenter(""),
                    setDirectedTo(undefined);
                break;
            case "ministry":
                setDirectedToMinistry(value),
                    setDirectedToGovernorate(""),
                    setDirectedToCenter(""),
                    setDirectedTo({
                        type: "ministry",
                        ministryId: value
                    });
                break;
            case "governorate":
                setDirectedToMinistry(""),
                    setDirectedToGovernorate(value),
                    setDirectedToCenter(""),
                    setDirectedTo({
                        type: "governorate",
                        governorateId: value
                    });
                break;
            case "center":
                setDirectedToMinistry(""),
                    setDirectedToGovernorate(""),
                    setDirectedToCenter(value),
                    setDirectedTo({
                        type: "center",
                        centerId: value
                    });
                break;
        }
    };

    const clearFilters = () => {
        setCategory("all");
        setLocation("");
        setDateFrom(undefined);
        setDateTo(undefined);
        setSubmissionMode("all");
        setDirectedToType("none");
        setDirectedToMinistry("");
        setDirectedToGovernorate("");
        setDirectedToCenter("");
        setDirectedTo(undefined);
    };

    // Count active filters
    const activeFilterCount = [
        category !== "all",
        location !== "",
        dateFrom !== undefined,
        dateTo !== undefined,
        submissionMode !== "all",
        directedToType !== "none",
    ].filter(Boolean).length;

    // Filter controls - shared between both variants
    const FilterControls = () => (
        <>
            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="corruption">Corruption</SelectItem>
                        <SelectItem value="misconduct">Misconduct</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Location
                </Label>
                <Input
                    id="location"
                    placeholder="Enter location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Submission Type */}
            <div className="space-y-2">
                <Label htmlFor="mode" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Submission Type
                </Label>
                <Select value={submissionMode} onValueChange={setSubmissionMode}>
                    <SelectTrigger id="mode" className="w-full">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="anonymous">Anonymous</SelectItem>
                        <SelectItem value="public">Identified</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Directed To */}
            <div className="space-y-2">
                <Label htmlFor="directTo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Directed To
                </Label>
                <Select value={directedToType} onValueChange={setDirectedToType}>
                    <SelectTrigger id="directTo" className="w-full">
                        <SelectValue placeholder="Select target (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Not Specified</SelectItem>
                        <SelectItem value="ministry">Ministry</SelectItem>
                        <SelectItem value="governorate">Governorate</SelectItem>
                        <SelectItem value="center">Center / Township</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Ministry Selector */}
            {directedToType === "ministry" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Ministry
                    </Label>
                    <Select value={directedToMinistry} onValueChange={onChangeDirectedTo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a ministry" />
                        </SelectTrigger>
                        <SelectContent>
                            {MINISTRIES.map((ministry) => (
                                <SelectItem key={ministry.id} value={ministry.id}>
                                    {ministry.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Governorate Selector */}
            {directedToType === "governorate" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Governorate
                    </Label>
                    <Select value={directedToGovernorate} onValueChange={onChangeDirectedTo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a governorate" />
                        </SelectTrigger>
                        <SelectContent>
                            {GOVERNORATES.map((gov) => (
                                <SelectItem key={gov.id} value={gov.id}>
                                    {gov.name} ({gov.nameAr})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Center Selector */}
            {directedToType === "center" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Center
                    </Label>
                    <Select value={directedToCenter} onValueChange={onChangeDirectedTo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a center" />
                        </SelectTrigger>
                        <SelectContent>
                            {GOVERNORATES.map((gov) => (
                                <SelectItem key={gov.id} value={gov.id}>
                                    {gov.name} ({gov.nameAr})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Date Range */}
            <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal text-sm",
                                    !dateFrom && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {dateFrom ? format(dateFrom, "PP") : <span>From</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal text-sm",
                                    !dateTo && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {dateTo ? format(dateTo, "PP") : <span>To</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
                <Button
                    variant="ghost"
                    className="w-full mt-2 text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters ({activeFilterCount})
                </Button>
            )}
        </>
    );

    // Sidebar variant - for md+ screens
    if (variant === "sidebar") {
        return (
            <div className="w-full">
                {/* Search bar at top */}
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search complaints..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {/* Filter panel */}
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Filter className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">Filters</h3>
                        {activeFilterCount > 0 && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {activeFilterCount} active
                            </span>
                        )}
                    </div>
                    <FilterControls />
                </div>
            </div>
        );
    }

    // Popover variant - original behavior for mobile
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search complaints..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 min-w-52"
                    />
                </div>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2" size={'lg'}>
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Refine your search results.
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    <FilterControls />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
