import { routing } from "@/i18n/routing";
import ComplaintDetailClient from "./complaint-detail-client";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
        id: "placeholder", // Next.js needs a placeholder for the dynamic segment
    }));
}

export default async function ComplaintPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const resolvedParams = await params;
    return <ComplaintDetailClient params={resolvedParams} />;
}
