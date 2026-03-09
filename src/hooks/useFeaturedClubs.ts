import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedClub {
  id: string;
  club_id: string;
  featured_image_url: string;
  display_order: number;
  active: boolean;
  club_name: string;
  club_logo: string | null;
}

export function useFeaturedClubs() {
  const [featuredClubs, setFeaturedClubs] = useState<FeaturedClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("featured_clubs")
        .select("*, clubs(name, logo_url)")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (data) {
        setFeaturedClubs(
          data.map((fc: any) => ({
            id: fc.id,
            club_id: fc.club_id,
            featured_image_url: fc.featured_image_url,
            display_order: fc.display_order,
            active: fc.active,
            club_name: fc.clubs?.name || "",
            club_logo: fc.clubs?.logo_url || null,
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { featuredClubs, loading };
}
