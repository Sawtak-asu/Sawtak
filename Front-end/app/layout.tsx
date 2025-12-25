import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { PageTransitionProvider } from "@/components/page-transition-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  keywords: ["Sawtak", "Anonimous Complaints", "Complaint System", "Complaints"],
  authors: [{ name: "Sawtak" }],
  openGraph: {
    title: "Sawtak",
    description: "",
    type: "website",
    locale: "en",
    siteName: "Sawtak",
  },
  icons: {
    icon: "/favicon.ico",
  },
  title: "Sawtak - Anonymous Whistleblowing Platform",
  description: "A secure, resilient, and trustworthy platform for anonymous reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="origin-when-cross-origin" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange>
              <PageTransitionProvider>
                {children}
              </PageTransitionProvider>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
