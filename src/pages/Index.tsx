import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandingClubsSection from "@/components/LandingClubsSection";
import LandingAcademiesSection from "@/components/LandingAcademiesSection";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <HeroSection />

      <div className="container mx-auto px-6 py-6 md:py-12 flex flex-col gap-10 md:gap-16">
        <LandingClubsSection />
        <LandingAcademiesSection />
      </div>
    </div>
  );
};

export default Index;
