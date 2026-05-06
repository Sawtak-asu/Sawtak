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
// import { TechMarquee } from "@/components/home/tech-marquee";

export default function Home() {
  return (
    <GridBackground>
      <main className="overflow-hidden relative">
        <Hero />
        {/* <TechMarquee /> */}
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

