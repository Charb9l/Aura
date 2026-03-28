import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface BadgePointAssignment {
  id: string;
  user_id: string;
  club_id: string;
  badge_level: number;
  created_at: string;
}

export const useBadgePoints = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<BadgePointAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!user) { setAssignments([]); setLoading(false); return; }
    const { data } = await supabase
      .from("badge_point_assignments")
      .select("*")
      .eq("user_id", user.id);
    setAssignments((data as BadgePointAssignment[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const assignPoint = async (clubId: string, badgeLevel: number) => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("assign_badge_point" as any, {
      _club_id: clubId,
      _badge_level: badgeLevel,
    });
    if (error) return false;
    await fetchAssignments();
    return true;
  };

  const assignedLevels = new Set(assignments.map(a => a.badge_level));

  return { assignments, assignedLevels, loading, assignPoint, refetch: fetchAssignments };
};
