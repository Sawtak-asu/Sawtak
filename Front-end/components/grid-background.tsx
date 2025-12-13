"use client";

import React from "react";

export function GridBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-background selection:bg-primary/10">
      {/* Fixed Background Layer - pointer-events-none ensures clicks pass through */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Glowing orbs/blobs - Jira/Corporate style (Blue/Indigo variants) */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Light mask to fade grid at edges for cleaner look */}
        <div className="absolute inset-0 bg-background/40 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
