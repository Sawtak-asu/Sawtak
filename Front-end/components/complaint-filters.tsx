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
import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { type DirectedToType, GOVERNORATES, MINISTRIES, type DirectedTo, COMPLAINT_CATEGORIES } from "@/lib/egypt-locations";
import { FormItem } from "./ui/form";
import { useTranslations, useLocale } from "next-intl";

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
    const t = useTranslations("ComplaintFilters");
    const tCategories = useTranslations("Categories");
    const tModes = useTranslations("SubmissionModes");
    const tDirected = useTranslations("DirectedTo");
    const locale = useLocale();

    const [directedToType, setDirectedToType] = useState("none");
    const [directedToMinistry, setDirectedToMinistry] = useState("");
    const [directedToGovernorate, setDirectedToGovernorate] = useState("");
    const [directedToCenter, setDirectedToCenter] = useState("");

    // Local state for location input with debouncing
    const [localLocation, setLocalLocation] = useState(location);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce location changes
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            setLocation(localLocation);
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [localLocation, setLocation]);

    // Sync local location with external location when cleared
    useEffect(() => {
        if (location === "" && localLocation !== "") {
            setLocalLocation("");
        }
    }, [location]);

    // Handle directedToType changes - clear values and notify parent
    useEffect(() => {
        if (directedToType === "none") {
            setDirectedToMinistry("");
            setDirectedToGovernorate("");
            setDirectedToCenter("");
            setDirectedTo(undefined);
        }
    }, [directedToType, setDirectedTo]);

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
        setLocalLocation("");
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

    // Filter controls - shared between both variants (as JSX, not a component to prevent remounting)
    const filterControls = (
        <>
            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("category")}
                </Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allCategories")}</SelectItem>
                        {COMPLAINT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {locale === "ar" ? cat.nameAr : cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("location")}
                </Label>
                <Input
                    id="location"
                    placeholder={t("enterLocation")}
                    value={localLocation}
                    onChange={(e) => setLocalLocation(e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Submission Type */}
            <div className="space-y-2">
                <Label htmlFor="mode" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("submissionType")}
                </Label>
                <Select value={submissionMode} onValueChange={setSubmissionMode}>
                    <SelectTrigger id="mode" className="w-full">
                        <SelectValue placeholder={t("allTypes")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allTypes")}</SelectItem>
                        <SelectItem value="anonymous">{tModes("anonymous")}</SelectItem>
                        <SelectItem value="public">{tModes("identified")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Directed To */}
            <div className="space-y-2">
                <Label htmlFor="directTo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {tDirected("label")}
                </Label>
                <Select value={directedToType} onValueChange={setDirectedToType}>
                    <SelectTrigger id="directTo" className="w-full">
                        <SelectValue placeholder={tDirected("notSpecified")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">{tDirected("notSpecified")}</SelectItem>
                        <SelectItem value="ministry">{tDirected("ministry")}</SelectItem>
                        <SelectItem value="governorate">{tDirected("governorate")}</SelectItem>
                        <SelectItem value="center">{tDirected("center")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Ministry Selector */}
            {directedToType === "ministry" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {tDirected("ministry")}
                    </Label>
                    <Select value={directedToMinistry} onValueChange={onChangeDirectedTo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={tDirected("selectMinistry")} />
                        </SelectTrigger>
                        <SelectContent>
                            {MINISTRIES.map((ministry) => (
                                <SelectItem key={ministry.id} value={ministry.id}>
                                    {locale === "ar" ? ministry.nameAr : ministry.name}
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
                        {tDirected("governorate")}
                    </Label>
                    <Select value={directedToGovernorate} onValueChange={onChangeDirectedTo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={tDirected("selectGovernorate")} />
                        </SelectTrigger>
                        <SelectContent>
                            {GOVERNORATES.map((gov) => (
                                <SelectItem key={gov.id} value={gov.id}>
                                    {locale === "ar" ? gov.nameAr : gov.name}
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
                        {tDirected("center")}
                    </Label>
                    <Select value={directedToCenter} onValueChange={onChangeDirectedTo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={tDirected("selectCenter")} />
                        </SelectTrigger>
                        <SelectContent>
                            {GOVERNORATES.map((gov) => (
                                <SelectItem key={gov.id} value={gov.id}>
                                    {locale === "ar" ? gov.nameAr : gov.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Date Range */}
            <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("dateRange")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal text-xs px-2 overflow-hidden",
                                    !dateFrom && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-1 h-3 w-3 shrink-0" />
                                <span className="truncate">{dateFrom ? format(dateFrom, "MMM d, yy") : t("from")}</span>
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
                                    "w-full justify-start text-left font-normal text-xs px-2 overflow-hidden",
                                    !dateTo && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-1 h-3 w-3 shrink-0" />
                                <span className="truncate">{dateTo ? format(dateTo, "MMM d, yy") : t("to")}</span>
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
                    {t("clearFilters")} ({activeFilterCount})
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
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {/* Filter panel */}
                <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Filter className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">{t("filters")}</h3>
                        {activeFilterCount > 0 && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {activeFilterCount} {t("active")}
                            </span>
                        )}
                    </div>
                    {filterControls}
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
                        placeholder={t("searchPlaceholder")}
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
                                {t("filters")}
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
                                    <h4 className="font-medium leading-none">{t("filters")}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {t("refineSearch")}
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    {filterControls}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
