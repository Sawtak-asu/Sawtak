"use client";

import React from "react";
import { Github } from "lucide-react";
import Link from "next/link";
import sh from "@/public/team/sherif.jpeg";
import sayed from "@/public/team/sayed.png";
import ahmed from "@/public/team/ahmed.jpeg";
import drnull from "@/public/team/drmm.jpg"
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Team() {
    const t = useTranslations("Team");
    const team = [
        {
            name: "Ahmed Khaled",
            role: "Backend Developer",
            bio: "cs student @ ain shams university, you'll find me writing (sometimes horrible) code every now and then",
            github: "a04k",
            image: ahmed
        },
        {
            name: "Sayed Ibrahim",
            role: "Blockchain Developer",
            bio: "Code is like lifting weights: the more reps, the stronger you get.",
            github: "sayedibrahimQ",
            image: sayed
        },
        {
            name: "Sherif Lotfy",
            role: "Frontend Developer",
            bio: "I'm a Software Engineer | Web Developer",
            github: "sizif-22",
            image: sh
        },

    ];
    const professor = [
        {
            name: "Dr. Mohamed Mostafa",
            role: "A Game Designer, Teaching Assistant at Ain Shams University and Data Scientist.",
            bio: "A Game Designer, Teaching Assistant at Ain Shams University and Data Scientist.",
            github: "DoctorNULL",
            image: drnull
        },
    ]

    return (
        <section dir="ltr" className="py-16 md:py-24 border-t border-border/50 bg-background/30 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        {t("title")} <span className="text-primary">{t("titleHighlight")}</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="flex flex-col gap-6 md:flex-row md:justify-center md:items-center md:gap-40">
                    {team.map((member) => (
                        <div key={member.name} className="group relative flex items-center gap-4 text-left w-full max-w-sm mx-auto md:flex-col md:text-center md:w-auto md:max-w-none md:gap-0">
                            <div className="flex-shrink-0 h-20 w-20 md:h-32 md:w-32 md:mx-auto md:mb-6 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary transition-colors">
                                <div className="h-full w-full flex items-center justify-center bg-secondary/50">
                                    <Image src={member.image} alt={member.name} width={1000} height={1000} />
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-center">
                                <h3 className="text-lg font-semibold">{member.name}</h3>
                                <p className="text-sm text-primary mb-2">{member.role}</p>

                                <div className="flex justify-start md:justify-center">
                                    <Link
                                        href={`https://github.com/${member.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 md:p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                        <span className="flex w-fit items-center gap-2 px-2 text-xs md:text-sm"><Github className="h-4 w-4 md:h-5 md:w-5" />| {member.github}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="justify-center mt-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-semibold md:text-4xl">
                            <span className="text-primary">{t("ProfessorHighlight")}</span>
                        </h2>
                    </div>
                    {professor.map((professor) => (
                        <div key={professor.name} className="group relative flex items-center gap-4 text-left w-full max-w-sm mx-auto md:flex-col md:text-center md:w-auto md:max-w-none md:gap-0">
                            <div className="flex-shrink-0 h-20 w-20 md:h-32 md:w-32 md:mx-auto md:mb-6 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary transition-colors">
                                <div className="h-full w-full flex items-center justify-center bg-secondary/50">
                                    <Image src={professor.image} alt={professor.name} width={1000} height={1000} />
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-center">
                                <h3 className="text-lg font-semibold">{professor.name}</h3>
                                <p className="text-sm text-primary mb-2">{professor.role}</p>

                                <div className="flex justify-start md:justify-center">
                                    <Link
                                        href={`https://github.com/${professor.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 md:p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                        <span className="flex w-fit items-center gap-2 px-2 text-xs md:text-sm"><Github className="h-4 w-4 md:h-5 md:w-5" />| {professor.github}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
