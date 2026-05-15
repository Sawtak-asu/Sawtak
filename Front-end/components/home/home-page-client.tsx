"use client";

import React from "react";
import { isMobileApp } from "@/lib/is-mobile";
import { MobileHome } from "@/components/home/mobile-home";
import { GridBackground } from "@/components/grid-background";
import FooterSection from "@/components/footer";
import { Hero } from "@/components/home/hero";
import { Aim } from "@/components/home/aim";
import { HowItWorks } from "@/components/home/how-it-works";
import { PoweredBy } from "@/components/home/powered-by";
import { Team } from "@/components/home/team";
import { CTA } from "@/components/home/cta";
import { FAQ } from "@/components/home/faq";
import { ComplaintFlow } from "@/components/home/complaint-flow";

export function HomePageClient() {
  const [isNative, setIsNative] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setIsNative(isMobileApp());
    setMounted(true);
  }, []);

  // Avoid flash: render nothing until we know the platform
  if (!mounted) return null;

  if (isNative) {
    return <MobileHome />;
  }

  return (
    <GridBackground>
      <main className="overflow-hidden relative">
        <Hero />
        <Aim />
        <HowItWorks />
        <PoweredBy />
        <ComplaintFlow />
        <FAQ />
        <Team />
        <CTA />
      </main>
      <FooterSection />
    </GridBackground>
  );
}
