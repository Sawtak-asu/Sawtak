/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";

import {
  CalendarIcon,
  Copy,
  Check,
  Shield,
  Eye,
  Lock,
  Building2,
  Upload,
  Play,
  FileIcon,
  X,
  Plus,
  ImageIcon,
  FileTextIcon,
  VideoIcon,
  MusicIcon,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import {
  MINISTRIES,
  GOVERNORATES,
  COMPLAINT_CATEGORIES,
  type DirectedTo,
  type DirectedToType
} from "@/lib/egypt-locations";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { apiUrl } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }).max(200, {
    message: "Title must be at most 200 characters.",
  }),
  mainText: z.string().min(20, {
    message: "Main text must be at least 20 characters.",
  }).max(5000, {
    message: "Main text must be at most 5000 characters.",
  }),
  category: z.string().min(1, "Please select a category."),
  directedToType: z.enum(["ministry", "governorate", "center"], {
    message: "Please select where to direct this complaint.",
  }),
  directedToMinistry: z.string().optional(),
  directedToGovernorate: z.string().optional(),
  directedToCenter: z.string().optional(),
  area: z.string().optional(),
  date: z.date().optional(),
  evidence: z.array(z.any()).optional(),
  submissionMode: z.enum(["anonymous", "public"]),
  visibility: z.enum(["public", "private"]),
}).refine((data) => {
  if (data.directedToType === "ministry") return !!data.directedToMinistry;
  if (data.directedToType === "governorate") return !!data.directedToGovernorate;
  if (data.directedToType === "center") return !!data.directedToGovernorate && !!data.directedToCenter;
  return false; // Should not reach here if enum matches
}, {
  message: "Please select the specific entity (Ministry or Governorate).",
  path: ["directedToType"],
});

type ComplaintFormData = z.infer<typeof formSchema>;

export function ComplaintForm() {
  const { user, isLoggedIn, token } = useAuth();
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showSpamWarningDialog, setShowSpamWarningDialog] = useState(false);
  const [showAIErrorDialog, setShowAIErrorDialog] = useState(false);
  const [isAIValidating, setIsAIValidating] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = useTranslations("ComplaintForm");
  const locale = useLocale();

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      mainText: "",
      area: "",
      category: "",
      directedToType: "" as any,
      directedToMinistry: "",
      directedToGovernorate: "",
      directedToCenter: "",
      submissionMode: "anonymous",
      visibility: "public",
      evidence: [],
    },
  });

  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ id: string, file: File, preview: string, type: string }[]>([]);

  // Watch directedToType and governorate for conditional rendering
  const directedToType = useWatch({ control: form.control, name: "directedToType" });
  const selectedGovernorate = useWatch({ control: form.control, name: "directedToGovernorate" });

  // Get centers for selected governorate
  const selectedGovData = GOVERNORATES.find(g => g.id === selectedGovernorate);

  const copyToClipboard = async () => {
    if (trackingCode) {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: { payload: any; mode: string }) => {
      // Both routes require authentication per backend middleware
      if (!token) {
        throw new Error(t("loginRequired"));
      }

      // Correct endpoints: /api/complaints/{type}/submit
      const endpoint = data.mode === "public"
        ? `/api/complaints/identified/submit`
        : `/api/complaints/anonymous/submit`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers,
        body: JSON.stringify(data.payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[ComplaintForm] Backend error response:", errorData);
        throw new Error(errorData.error || t("submitFailed"));
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // For anonymous submissions, show the tracking code prominently
      if (variables.mode === "anonymous" && data.data?.trackingCode) {
        setTrackingCode(data.data.trackingCode);
        setShowTrackingDialog(true);
        toast.success(t("anonymousSubmitted"));
      } else {
        toast.success(t("identifiedSubmitted"));
      }
      
      // Comprehensive cleanup
      // 1. Revoke all preview URLs to prevent memory leaks
      previews.forEach(p => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      // 2. Clear state-managed fields
      setPreviews([]);
      // 3. Reset the form
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || t("submitFailed"));
      console.error("Submission error:", error);
    },
  });

  /**
   * Calls the backend AI validation endpoint before allowing submission.
   * Returns "real" | "fake" | "error"
   */
  async function runAIValidation(title: string, text: string, category: string): Promise<string> {
    if (!token) return "real"; // Skip validation if not authenticated (will be caught later)

    try {
      setIsAIValidating(true);
      const response = await fetch(apiUrl("/api/complaints/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, text, category }),
      });

      if (!response.ok) {
        console.warn("[ComplaintForm] AI validation request failed.");
        return "error"; 
      }

      const data = await response.json();
      const verdict: string = data.verdict;

      console.log(`[ComplaintForm] AI verdict: ${verdict}`);
      return verdict;
    } catch (err) {
      console.error("[ComplaintForm] AI validation error:", err);
      return "error";
    } finally {
      setIsAIValidating(false);
    }
  }

  async function onSubmit(values: ComplaintFormData) {
    if (!isLoggedIn || !user) {
      toast.error(t("loginRequired"));
      return;
    }

    // ── Step 1: AI Validation (Always run for both modes) ─────────
    const aiVerdict = await runAIValidation(
      values.title,
      values.mainText,
      values.category
    );

    if (aiVerdict === "fake") {
      setShowSpamWarningDialog(true);
      return;
    }

    if (aiVerdict === "error") {
      setShowAIErrorDialog(true);
      return;
    }

    // ── Step 2: File uploads ─────────────────────────────────────

    const isPublic = values.submissionMode === "public";
    let evidenceUrls: string[] = [];
    let evidenceCids: string[] = [];

    // Handle file upload for both identified and anonymous complaints
    if (values.evidence && values.evidence.length > 0) {
      try {
        const formData = new FormData();
        (values.evidence as File[]).forEach((file) => {
          formData.append("files", file);
        });

        // Determine the correct upload endpoint based on submission mode
        // Anonymous -> IPFS (Pinata)
        // Public/Identified -> Default storage (Supabase/R2)
        const uploadEndpoint = isPublic ? `/api/upload` : `/api/upload/ipfs`;

        const uploadResponse = await fetch(apiUrl(uploadEndpoint), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || t("uploadFailed"));
        }

        const data = await uploadResponse.json();
        if (data.urls) {
          evidenceUrls = data.urls;
        }
        if (data.ipfs_hashes) {
          evidenceCids = data.ipfs_hashes;
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.message || t("uploadFailed"));
        return;
      }
    }

    // Build directedTo object - now required
    const directedTo: DirectedTo = {
      type: values.directedToType as DirectedToType,
    };
    if (values.directedToType === "ministry" && values.directedToMinistry) {
      directedTo.ministryId = values.directedToMinistry;
    } else if (values.directedToType === "governorate" && values.directedToGovernorate) {
      directedTo.governorateId = values.directedToGovernorate;
    } else if (values.directedToType === "center" && values.directedToGovernorate && values.directedToCenter) {
      directedTo.governorateId = values.directedToGovernorate;
      directedTo.centerId = values.directedToCenter;
    }
    const payload = isPublic ? {
      // Identified complaint payload - matches identified-complaint.controller.ts
      userId: user.id,
      title: values.title,
      text: values.mainText,
      category: values.category,
      directedTo: directedTo,
      area: values.area || undefined,
      incidentDate: values.date ? format(values.date, "yyyy-MM-dd") : undefined,
      evidenceUrls: evidenceUrls,
      visibility: values.visibility, // public = visible in feed, private = admin only
    } : {
      // Anonymous complaint payload - matches anonymous-complaint.controller.ts
      // userId: user.id,
      anonymousIdentifier: user.anonymousIdentifier,
      title: values.title,
      text: values.mainText,
      category: values.category,
      directedTo: directedTo,
      area: values.area || undefined,
      incidentDate: values.date ? format(values.date, "yyyy-MM-dd") : undefined,
      evidenceCids: evidenceCids, // Populated from IPFS response
    };

    mutation.mutate({ payload, mode: values.submissionMode });
  }

  const handleFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    const updatedEvidence = [...(form.getValues("evidence") || []), ...newFiles];
    form.setValue("evidence", updatedEvidence, { shouldValidate: true });

    const newPreviews = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: (file.type.startsWith('image/') || file.type.startsWith('video/')) ? URL.createObjectURL(file) : '',
      type: file.type
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (id: string) => {
    const fileToRemove = previews.find(p => p.id === id);
    if (!fileToRemove) return;

    if (fileToRemove.preview) URL.revokeObjectURL(fileToRemove.preview);

    const updatedPreviews = previews.filter(p => p.id !== id);
    setPreviews(updatedPreviews);

    const updatedEvidence = updatedPreviews.map(p => p.file);
    form.setValue("evidence", updatedEvidence, { shouldValidate: true });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-6 w-6" />;
    if (type.startsWith('audio/')) return <MusicIcon className="h-6 w-6" />;
    if (type.includes('pdf')) return <FileTextIcon className="h-6 w-6" />;
    return <FileIcon className="h-6 w-6" />;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" dir="ltr">
        <Card>
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
            <CardDescription>
              {t("detailsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="submissionMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t("submissionMode")}</FormLabel>
                  {!isLoggedIn && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {t("loginRequired")}
                    </p>
                  )}
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="anonymous" className="peer sr-only" disabled={!isLoggedIn} />
                        </FormControl>
                        <FormLabel className="group flex flex-col items-start justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:border-purple-500/50 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/5 [&:has([data-state=checked])]:border-purple-500 cursor-pointer h-full transition-all duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200">
                              <Shield className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-base">{t("anonymous")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t("anonymousDesc")}
                          </p>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="public" className="peer sr-only" disabled={!isLoggedIn} />
                        </FormControl>
                        <FormLabel className="group flex flex-col items-start justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:border-blue-500/50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/5 [&:has([data-state=checked])]:border-blue-500 cursor-pointer h-full transition-all duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                              <Check className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-base">{t("identified")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t("identifiedDesc")}
                          </p>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility option - only shown for identified complaints */}
            {form.watch("submissionMode") === "public" && (
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                    <FormLabel>{t("visibility")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="public" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="group flex flex-row items-center gap-3 rounded-xl border border-muted bg-background p-3 hover:bg-accent/50 hover:border-green-500/50 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-500/5 cursor-pointer transition-all duration-200">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                              <Eye className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold block text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{t("public")}</span>
                              <span className="text-xs text-muted-foreground">{t("publicDesc")}</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="private" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="group flex flex-row items-center gap-3 rounded-xl border border-muted bg-background p-3 hover:bg-accent/50 hover:border-amber-500/50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/5 cursor-pointer transition-all duration-200">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold block text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{t("private")}</span>
                              <span className="text-xs text-muted-foreground">{t("privateDesc")}</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mainText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("mainText")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("mainTextPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPLAINT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {locale === "ar" ? cat.nameAr : cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Directed To Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t("directTitle")}
            </CardTitle>
            <CardDescription>
              {t("directDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="directedToType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("directedTo")}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset dependent fields
                      if (value !== "ministry") form.setValue("directedToMinistry", "");
                      if (value !== "governorate" && value !== "center") {
                        form.setValue("directedToGovernorate", "");
                        form.setValue("directedToCenter", "");
                      }
                    }}
                    value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("directedToPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ministry">{t("ministry")}</SelectItem>
                      <SelectItem value="governorate">{t("governorate")}</SelectItem>
                      {/* <SelectItem value="center">{t("center")}</SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("directedToDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ministry Selector */}
            {directedToType === "ministry" && (
              <FormField
                control={form.control}
                name="directedToMinistry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ministry")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectMinistry")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MINISTRIES.map((ministry) => (
                          <SelectItem key={ministry.id} value={ministry.id}>
                            {locale === "ar" ? ministry.nameAr : ministry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Governorate Selector (for governorate or center type) */}
            {(directedToType === "governorate" || directedToType === "center") && (
              <FormField
                control={form.control}
                name="directedToGovernorate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("governorate")}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("directedToCenter", "");
                      }}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectGovernorate")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOVERNORATES.map((gov) => (
                          <SelectItem key={gov.id} value={gov.id}>
                            {locale === "ar" ? gov.nameAr : gov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Center / Township Selector */}
            {directedToType === "center" && selectedGovernorate && selectedGovData?.centers && (
              <FormField
                control={form.control}
                name="directedToCenter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("center")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCenter")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedGovData!.centers!.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {locale === "ar" ? center.nameAr : center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("additionalTitle")}</CardTitle>
            <CardDescription>
              {t("additionalDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("area")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("areaPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("incidentDate")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}>
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{t("pickDate")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className={cn(isDragging && "border-primary border-dashed bg-primary/5")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("evidenceTitle")}</CardTitle>
              <CardDescription>
                {t("evidenceDescription")}
              </CardDescription>
            </div>
            {previews.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => document.getElementById('evidence-upload')?.click()}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("browse")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="evidence"
              render={({ }) => (
                <FormItem>
                  <FormControl>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                      }}
                      className={cn(
                        "relative min-h-[160px] rounded-xl transition-all duration-200",
                        previews.length === 0 
                          ? "border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex flex-col items-center justify-center p-8 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                          : "bg-background p-4"
                      )}
                      onClick={() => previews.length === 0 && document.getElementById('evidence-upload')?.click()}
                    >
                      <input
                        id="evidence-upload"
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          if (e.target.files) handleFiles(e.target.files);
                        }}
                      />

                      {previews.length === 0 ? (
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            {t("dragAndDropTitle")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("dragAndDropSubtitle")}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {previews.map((p) => (
                            <div key={p.id} className="group relative aspect-square rounded-lg border bg-muted overflow-hidden">
                              {p.type.startsWith('video/') ? (
                                <div className="relative h-full w-full">
                                  <video 
                                    src={`${p.preview}#t=1`} 
                                    className="h-full w-full object-cover"
                                    onLoadedMetadata={(e) => {
                                      // Force seeking to 1s to show a frame
                                      (e.target as HTMLVideoElement).currentTime = 1;
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                    <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                      <Play className="h-6 w-6 text-white fill-white" />
                                    </div>
                                  </div>
                                </div>
                              ) : p.preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.preview} alt="preview" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center">
                                  {getFileIcon(p.type)}
                                  <span className="mt-1 text-[10px] text-muted-foreground truncate w-full px-1">
                                    {p.file.name}
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(p.id)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={mutation.isPending || form.formState.isSubmitting || isAIValidating}
          className="relative"
        >
          {isAIValidating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("aiValidating")}
            </>
          ) : mutation.isPending || form.formState.isSubmitting ? (
            t("submitting")
          ) : (
            t("submit")
          )}
        </Button>
      </form>

      {/* Tracking Code Dialog - shown after successful anonymous submission */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t("trackingTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("trackingDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="bg-muted rounded-lg p-4 w-full text-center mb-4">
              <p className="text-2xl font-mono font-bold tracking-wider">
                {trackingCode}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t("copied")}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t("copyToClipboard")}
                </>
              )}
            </Button>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              {t("importantWarning")}
            </p>
            <p className="text-muted-foreground mt-1">
              {t("trackingHint")}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTrackingDialog(false)}>
              {t("savedCode")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* AI Spam Warning Dialog */}
      <Dialog open={showSpamWarningDialog} onOpenChange={setShowSpamWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("aiSpamWarningTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("aiSpamWarningDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm mt-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-muted-foreground leading-relaxed">
                {t("aiSpamWarningHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSpamWarningDialog(false)}
              className="w-full"
            >
              {t("aiSpamDismiss")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Service Error Dialog */}
      <Dialog open={showAIErrorDialog} onOpenChange={setShowAIErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              {t("aiValidationErrorTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("aiValidationErrorDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm mt-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-muted-foreground leading-relaxed">
                {t("aiValidationErrorHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAIErrorDialog(false)}
              className="w-full"
            >
              {t("aiValidationDismiss")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
