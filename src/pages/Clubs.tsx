import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

import beirutLogo from "@/assets/beirut-logo.png";
import hardcourtLogo from "@/assets/hardcourt-logo.png";
import enformeLogo from "@/assets/enforme-logo.png";

const logoMap: Record<string, string> = {
  "/beirut-logo.png": beirutLogo,
  "/hardcourt-logo.png": hardcourtLogo,
  "/enforme-logo.png": enformeLogo,
};

interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  created_at: string;
}

const clubActivityMap: Record<string, string> = {
  "Beirut Basketball Club": "basketball",
  "Hardcourt Dbayeh Tennis Academy": "tennis",
  "En Forme": "pilates",
};

const ClubsPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase.from("clubs").select("*").order("name");
      if (data) setClubs(data as unknown as Club[]);
      setLoading(false);
    };
    fetchClubs();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Our Clubs & Partners</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-12">
            Meet the clubs and studios that power our platform.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-center py-20">Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club, i) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  const activity = clubActivityMap[club.name];
                  if (activity) navigate(`/book?activity=${activity}`);
                }}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  {club.logo_url && logoMap[club.logo_url] && (
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                      <img
                        src={logoMap[club.logo_url]}
                        alt={club.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <h2 className="font-heading text-xl font-bold text-foreground">{club.name}</h2>
                </div>
                {club.description && (
                  <p className="text-muted-foreground text-sm mb-4">{club.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {club.offerings.map((offering) => (
                    <Badge key={offering} variant="secondary" className="text-xs">
                      {offering}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsPage;
