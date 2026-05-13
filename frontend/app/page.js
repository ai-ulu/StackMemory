export const dynamic = 'force-dynamic';

import { BuilderQuickStartSection } from '@/components/landing/BuilderQuickStartSection';
import { DemoFlowsSection } from '@/components/landing/DemoFlowsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { IntegrationSurfacesSection } from '@/components/landing/IntegrationSurfacesSection';
import { LandingNav } from '@/components/landing/LandingNav';
import { QuickStartsSection } from '@/components/landing/QuickStartsSection';
import { UsageSection } from '@/components/landing/UsageSection';
import {
  builderQuickStarts,
  demoScenarios,
  developerMemoryPack,
  heroBenefits,
  integrationSurfaces,
  proofPoints,
  quickStartWorkflows,
  workflowTargets,
} from '@/content/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection
        heroBenefits={heroBenefits}
        proofPoints={proofPoints}
        workflowTargets={workflowTargets}
        developerMemoryPack={developerMemoryPack}
      />
      <FeaturesSection />
      <UsageSection />
      <IntegrationSurfacesSection surfaces={integrationSurfaces} />
      <BuilderQuickStartSection items={builderQuickStarts} />
      <DemoFlowsSection scenarios={demoScenarios} />
      <QuickStartsSection workflows={quickStartWorkflows} />
      <FinalCtaSection />
    </div>
  );
}
