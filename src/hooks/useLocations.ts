import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LocationRow {
  id: string;
  name: string;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .order("name");
    if (data) setLocations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return { locations, loading, refetch: fetchLocations };
};
