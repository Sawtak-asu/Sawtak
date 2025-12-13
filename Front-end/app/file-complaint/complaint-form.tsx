"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  mainText: z.string().min(10, {
    message: "Main text must be at least 10 characters.",
  }),
  category: z.string().nonempty("Please select a category."),
  area: z.string().optional(),
  date: z.date().optional(),
  evidence: z.any().optional(),
  submissionMode: z.enum(["anonymous", "public"]),
  visibility: z.enum(["public", "private"]),
});

type ComplaintFormData = z.infer<typeof formSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function ComplaintForm() {
  const { user, isLoggedIn, token } = useAuth();

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      mainText: "",
      area: "",
      category: "",
      submissionMode: "anonymous",
      visibility: "public",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { payload: any; mode: string }) => {
      // Both routes require authentication per backend middleware
      if (!token) {
        throw new Error("You must be logged in to submit a complaint.");
      }

      // Correct endpoints: /api/complaints/{type}/submit
      const endpoint = data.mode === "public" 
        ? `${API_URL}/api/complaints/identified/submit`
        : `${API_URL}/api/complaints/anonymous/submit`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(data.payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit complaint.");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const message = data.data?.transactionId 
        ? `Complaint submitted! Transaction ID: ${data.data.transactionId}`
        : "Complaint submitted successfully!";
      toast.success(message);
      console.log("Submission successful:", data);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit complaint.");
      console.error("Submission error:", error);
    },
  });

  function onSubmit(values: ComplaintFormData) {
    if (!isLoggedIn || !user) {
      toast.error("You must be logged in to submit a complaint.");
      return;
    }

    const isPublic = values.submissionMode === "public";
    
    const payload = isPublic ? {
      // Identified complaint payload - matches identified-complaint.controller.ts
      userId: user.id,
      title: values.title,
      text: values.mainText,
      category: values.category,
      area: values.area || undefined,
      incidentDate: values.date ? format(values.date, "yyyy-MM-dd") : undefined,
      evidenceUrls: [], // To be handled with file upload later
      visibility: values.visibility, // public = visible in feed, private = admin only
    } : {
      // Anonymous complaint payload - matches anonymous-complaint.controller.ts
      userId: user.id,
      anonymousIdentifier: user.anonymousIdentifier,
      title: values.title,
      text: values.mainText,
      category: values.category,
      area: values.area || undefined,
      incidentDate: values.date ? format(values.date, "yyyy-MM-dd") : undefined,
      evidenceCids: [], // IPFS CIDs to be handled later
    };
    
    mutation.mutate({ payload, mode: values.submissionMode });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>
              Please provide the essential details of your complaint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="submissionMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Submission Mode</FormLabel>
                  {!isLoggedIn && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Please log in to submit a complaint.
                    </p>
                  )}
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="anonymous" disabled={!isLoggedIn} className="mt-1" />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="font-medium">
                            🔒 Anonymous (Blockchain)
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Stored on Hedera blockchain. Immutable and publicly verifiable. 
                            Your identity is encrypted and hidden.
                          </p>
                        </div>
                      </FormItem>
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="public" disabled={!isLoggedIn} className="mt-1" />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="font-medium">
                            👤 Identified (Database)
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Stored in database. Admin can see your identity. 
                            Can be edited or deleted.
                            {isLoggedIn && ` Submitting as ${user?.name || user?.email}.`}
                          </p>
                        </div>
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
                  <FormItem className="space-y-3 pl-4 border-l-2 border-muted ml-2">
                    <FormLabel>Visibility</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="public" />
                          </FormControl>
                          <div>
                            <FormLabel className="font-medium">🌐 Public</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Visible on the public feed for everyone to see.
                            </p>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="private" />
                          </FormControl>
                          <div>
                            <FormLabel className="font-medium">🔐 Private</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Only visible to administrators. Not shown in public feed.
                            </p>
                          </div>
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the title" {...field} />
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
                  <FormLabel>Main Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your complaint in detail"
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
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="corruption">Corruption</SelectItem>
                      <SelectItem value="misconduct">Misconduct</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              This information is optional but can help us better understand the
              context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the area" {...field} />
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
                  <FormLabel>Date of Incident (Optional)</FormLabel>
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
                            <span>Pick a date</span>
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

        <Card>
          <CardHeader>
            <CardTitle>Supporting Evidence</CardTitle>
            <CardDescription>
              Upload any files that support your complaint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="evidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence (Optional, Multiple Files)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      ref={field.ref}
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        field.onChange(e.target.files);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Submit Complaint"}
        </Button>
      </form>
    </Form>
  );
}
