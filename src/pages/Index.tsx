import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ClubBubbleStrip from "@/components/ClubBubbleStrip";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <HeroSection />

      <div className="container mx-auto px-6 py-12 flex flex-col gap-12">
        <ClubBubbleStrip title="Clubs & Partners" linkTo="/clubs" />
        <ClubBubbleStrip title="Academies" linkTo="/academy" filterAcademy />
      </div>
    </div>
  );
};

export default Index;
