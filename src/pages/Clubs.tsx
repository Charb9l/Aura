import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";




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
  const [pageTitle, setPageTitle] = useState("Our Clubs & Partners");
  const [pageSubtitle, setPageSubtitle] = useState("Meet the clubs and studios that power our platform.");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, contentRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("page_content").select("content").eq("page_slug", "clubs").single(),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as Club[]);
      if (contentRes.data) {
        const c = contentRes.data.content as any;
        if (c?.title) setPageTitle(c.title);
        if (c?.subtitle) setPageSubtitle(c.subtitle);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">{pageTitle}</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-12">{pageSubtitle}</p>
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
                  {(() => {
                    const logoSrc = club.logo_url?.startsWith("http") ? club.logo_url : null;
                    return logoSrc ? (
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                        <img
                          src={logoSrc}
                          alt={club.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : null;
                  })()}
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
