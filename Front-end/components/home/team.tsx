"use client";

import React from "react";
import { User, Github } from "lucide-react";
import Link from "next/link";
import sh from "@/public/team/sherif.jpeg";
import sayed from "@/public/team/sayed.png";
import ahmed from "@/public/team/ahmed.jpeg";
import Image from "next/image";

export function Team() {
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
            bio: "“Code is like lifting weights: the more reps, the stronger you get.”",
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

    return (
        <section className="py-16 md:py-24 border-t border-border/50 bg-background/30 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        Meet Our <span className="text-primary">Team</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        A graduation project by 4th-year students from the Department of Computer Science, Faculty of Science, Ain Shams University.
                    </p>
                </div>

                <div className="flex justify-center items-center gap-8 md:gap-40">
                    {team.map((member) => (
                        <div key={member.name} className="group relative text-center">
                            <div className="mx-auto mb-6 h-32 w-32 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary transition-colors">
                                <div className="h-full w-full flex items-center justify-center bg-secondary/50">
                                    {/* <User className="h-12 w-12 text-muted-foreground" /> */}
                                    <Image src={member.image} alt={member.name} width={1000} height={1000} />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold">{member.name}</h3>
                            <p className="text-sm text-primary mb-2">{member.role}</p>
                            {/* <p className="text-sm text-muted-foreground leading-relaxed px-2 mb-4">{member.bio}</p> */}

                            <div className="flex justify-center">
                                <Link
                                    href={`https://github.com/${member.github}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                    <span className="flex w-fit items-center gap-2 px-2"><Github className="h-5 w-5" />| {member.github}</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
