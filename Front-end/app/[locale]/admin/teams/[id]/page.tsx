import { routing } from "@/i18n/routing";
import TeamDetailClient from "./team-detail-client";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
        id: "placeholder",
    }));
}

export default function TeamDetailPage({ params }: { params: { id: string; locale: string } }) {
    return <TeamDetailClient params={params} />;
}
