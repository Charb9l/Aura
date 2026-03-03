import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PagePhotoStrip from "@/components/PagePhotoStrip";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PagePhotoStrip pageSlug="home" className="container mx-auto px-8 mt-8" />
    </div>
  );
};

export default Index;
