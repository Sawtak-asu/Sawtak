import { routing } from "@/i18n/routing";
import ComplaintDetailClient from "./complaint-detail-client";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
        id: "placeholder", // Next.js needs a placeholder for the dynamic segment
    }));
}

export default function ComplaintPage({ params }: { params: { id: string; locale: string } }) {
    return <ComplaintDetailClient params={params} />;
}
