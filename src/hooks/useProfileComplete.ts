import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useProfileComplete = () => {
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
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle();

      // Profile is complete if phone is present
      setIsComplete(!!data?.phone);
      setLoading(false);
    };

    check();
  }, [user, authLoading]);

  return { isComplete, loading: loading || authLoading };
};
