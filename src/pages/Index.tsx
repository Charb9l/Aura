import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <HeroSection />
    </div>
  );
};

export default Index;
