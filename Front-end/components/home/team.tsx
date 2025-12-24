"use client";

import React from "react";
import { User } from "lucide-react";

export function Team() {
    const team = [
        {
            name: "Ahmed Hassan",
            role: "Lead Developer",
            bio: "Full-stack engineer passionate about civic tech and blockchain."
        },
        {
            name: "Sarah Kareem",
            role: "Security Researcher",
            bio: "Expert in cryptography and privacy-preserving protocols."
        },
        {
            name: "Omar Youssef",
            role: "Product Designer",
            bio: "Crafting intuitive experiences for complex systems."
        },
        {
            name: "Layla Mahmoud",
            role: "Legal Advisor",
            bio: "Ensuring compliance and protecting whistleblower rights."
        }
    ];

    return (
        <section className="py-16 md:py-24 border-t border-border/50 bg-background/30 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-semibold md:text-4xl">
                        Meet Our <span className="text-primary">Team</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        A dedicated group of professionals working to bring transparency to the forefront.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {team.map((member) => (
                        <div key={member.name} className="group relative text-center">
                            <div className="mx-auto mb-6 h-32 w-32 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary transition-colors">
                                <div className="h-full w-full flex items-center justify-center bg-secondary/50">
                                    <User className="h-12 w-12 text-muted-foreground" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold">{member.name}</h3>
                            <p className="text-sm text-primary mb-2">{member.role}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed px-2">{member.bio}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
