import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const usePlayerProfileComplete = () => {
  const { user, loading: authLoading } = useAuth();
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsComplete(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { count } = await supabase
        .from("player_selections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // At least 1 selection means complete
      setIsComplete((count ?? 0) >= 1);
      setLoading(false);
    };

    check();
  }, [user, authLoading]);

  return { isComplete, loading: loading || authLoading };
};
