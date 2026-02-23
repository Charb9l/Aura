import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";

import tennisImg from "@/assets/tennis-court.png";
import basketballImg from "@/assets/basketball-court.png";
import hardcourtLogo from "@/assets/hardcourt-logo.png";
import beirutLogo from "@/assets/beirut-logo.png";

const sports = [
  { slug: "tennis", name: "Hard Court Tennis Academy", image: tennisImg, logo: hardcourtLogo, brand: "tennis" as const, description: "Master your strokes with professional coaching on our blue hard courts." },
  { slug: "basketball", name: "Beirut Basketball Academy", image: basketballImg, logo: beirutLogo, brand: "basketball" as const, description: "Develop your game with elite trainers at Beirut Sports Club." },
];

const brandBorder = {
  tennis: "border-brand-tennis shadow-[0_0_20px_hsl(212_70%_55%/0.3)]",
  basketball: "border-brand-basketball shadow-[0_0_20px_hsl(262_50%_55%/0.3)]",
};

const AcademyPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("sport") || "";

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [selectedSport, setSelectedSport] = useState(preselected);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="font-heading text-4xl font-bold text-foreground mb-3">Application Submitted!</h1>
            <p className="text-muted-foreground text-lg">
              We've received your {sports.find(s => s.slug === selectedSport)?.name} application.
            </p>
            <p className="text-muted-foreground">Our team will reach out to {email} shortly.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Join Our Academy</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-10">Train with the best. Elevate your game.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
          {/* Sport selection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Choose Your Sport</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sports.map((s) => (
                <button
                  type="button"
                  key={s.slug}
                  onClick={() => setSelectedSport(s.slug)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border-2 transition-all text-left",
                    selectedSport === s.slug
                      ? brandBorder[s.brand]
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="aspect-video overflow-hidden">
                    <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <img src={s.logo} alt={s.name} className="h-10 w-10 rounded-full object-cover shadow-lg" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-heading text-xl font-bold text-foreground mb-1">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Personal info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Personal Information</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 bg-secondary border-border" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-secondary border-border" />
              <PhoneInput value={phone} onChange={setPhone} required />
              <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required className="h-12 bg-secondary border-border" />
            </div>
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Label className="text-sm font-medium text-muted-foreground mb-4 block">Experience Level</Label>
            <Textarea
              placeholder="Tell us about your experience level, goals, and any previous training..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="min-h-[120px] bg-secondary border-border"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              type="submit"
              disabled={!selectedSport || !name || !email || !phone || !age}
              className="h-14 px-10 text-lg font-bold rounded-xl glow"
            >
              Submit Application
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default AcademyPage;
