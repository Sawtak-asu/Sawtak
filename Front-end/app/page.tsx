import { GridBackground } from "@/components/grid-background";
import FooterSection from "@/components/footer";
import { Hero } from "@/components/home/hero";
import { Aim } from "@/components/home/aim";
import { HowItWorks } from "@/components/home/how-it-works";
import { TechStack } from "@/components/home/tech-stack";
import { Team } from "@/components/home/team";
import { CTA } from "@/components/home/cta";

export default function Home() {
  return (
    <GridBackground>
      <main className="overflow-hidden relative">
        <Hero />
        <Aim />
        <HowItWorks />
        <TechStack />
        <Team />
        <CTA />
      </main>
      <FooterSection />
    </GridBackground>
  );
}
