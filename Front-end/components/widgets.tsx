import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function Widgets() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Sawtak News</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </CardHeader>
            <CardContent className="space-y-4">
                <NewsItem
                    title="New anti-corruption laws passed"
                    subtitle="Top news • 1,234 readers"
                />
                <NewsItem
                    title="Community cleanup drive this weekend"
                    subtitle="Local events • 856 readers"
                />
                <NewsItem
                    title="City council meeting highlights"
                    subtitle="Politics • 2,453 readers"
                />
                <NewsItem
                    title="Report: Public transport improvements"
                    subtitle="Infrastructure • 1,102 readers"
                />
                <NewsItem
                    title="How to report misconduct safely"
                    subtitle="Education • 5,678 readers"
                />
            </CardContent>
        </Card>
    );
}

function NewsItem({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="cursor-pointer hover:bg-muted/50 p-1 rounded">
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                <h4 className="text-sm font-semibold line-clamp-1">{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground pl-3.5">{subtitle}</p>
        </div>
    );
}
