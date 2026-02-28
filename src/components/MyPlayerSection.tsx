import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface Sport {
  id: string;
  name: string;
  display_order: number;
}

interface Level {
  id: string;
  label: string;
  display_order: number;
}

interface Selection {
  rank: number;
  sport_id: string;
  level_id: string;
}

const MyPlayerSection = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selections, setSelections] = useState<Selection[]>([
    { rank: 1, sport_id: "", level_id: "" },
    { rank: 2, sport_id: "", level_id: "" },
    { rank: 3, sport_id: "", level_id: "" },
  ]);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [sportsRes, levelsRes, selectionsRes] = await Promise.all([
        supabase.from("player_sports").select("*").order("display_order"),
        supabase.from("player_levels").select("*").order("display_order"),
        user
          ? supabase.from("player_selections").select("*").eq("user_id", user.id).order("rank")
          : Promise.resolve({ data: [] }),
      ]);

      setSports((sportsRes.data as Sport[]) || []);
      setLevels((levelsRes.data as Level[]) || []);

      const existing = (selectionsRes.data as any[]) || [];
      setExistingIds(existing.map((e: any) => e.id));

      if (existing.length > 0) {
        const mapped: Selection[] = [1, 2, 3].map((rank) => {
          const found = existing.find((e: any) => e.rank === rank);
          return found
            ? { rank, sport_id: found.sport_id, level_id: found.level_id }
            : { rank, sport_id: "", level_id: "" };
        });
        setSelections(mapped);
      }
      setLoaded(true);
    };
    fetchData();
  }, [user]);

  const isComplete = selections.every((s) => s.sport_id && s.level_id);
  const hasDuplicateSports = (() => {
    const picked = selections.map((s) => s.sport_id).filter(Boolean);
    return new Set(picked).size !== picked.length;
  })();

  const handleSave = async () => {
    if (!user || !isComplete || hasDuplicateSports) return;
    setSaving(true);

    // Delete existing and re-insert
    if (existingIds.length > 0) {
      await supabase.from("player_selections").delete().eq("user_id", user.id);
    }

    const rows = selections.map((s) => ({
      user_id: user.id,
      sport_id: s.sport_id,
      level_id: s.level_id,
      rank: s.rank,
    }));

    const { error } = await supabase.from("player_selections").insert(rows);
    setSaving(false);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("MyPlayer profile saved!");
      setExistingIds(rows.map(() => "temp")); // mark as saved
      setOpen(false);
    }
  };

  const updateSelection = (rank: number, field: "sport_id" | "level_id", value: string) => {
    setSelections((prev) =>
      prev.map((s) => (s.rank === rank ? { ...s, [field]: value } : s))
    );
  };

  const getSportName = (id: string) => sports.find((s) => s.id === id)?.name || "";
  const getLevelLabel = (id: string) => levels.find((l) => l.id === id)?.label || "";

  const savedSelections = selections.filter((s) => s.sport_id && s.level_id);
  const hasSaved = existingIds.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-8"
      >
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className={cn(
            "h-14 px-6 rounded-xl font-bold text-base gap-3 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all",
            !hasSaved && "animate-pulse border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
          )}
        >
          <Gamepad2 className="h-5 w-5 text-primary" />
          MyPlayer
          {!hasSaved && (
            <span className="ml-1 h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
          )}
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              MyPlayer Profile
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Pick your top 3 sports and your level for each.</p>
          </DialogHeader>

          {!loaded ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : sports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sports configured yet. Check back soon!</p>
          ) : (
            <div className="space-y-6 pt-2">
              {[1, 2, 3].map((rank) => {
                const sel = selections.find((s) => s.rank === rank)!;
                const otherSports = selections
                  .filter((s) => s.rank !== rank && s.sport_id)
                  .map((s) => s.sport_id);

                return (
                  <div key={rank} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      #{rank} Sport
                    </p>

                    {/* Sport selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {sports.map((sport) => {
                        const disabled = otherSports.includes(sport.id);
                        const selected = sel.sport_id === sport.id;
                        return (
                          <button
                            key={sport.id}
                            onClick={() => !disabled && updateSelection(rank, "sport_id", sport.id)}
                            disabled={disabled}
                            className={cn(
                              "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left",
                              disabled
                                ? "border-border bg-muted text-muted-foreground/30 cursor-not-allowed"
                                : selected
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                            )}
                          >
                            {selected && <Check className="h-3 w-3 inline mr-1" />}
                            {sport.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Level selector */}
                    {sel.sport_id && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Your level:</p>
                        {levels.map((level) => {
                          const selected = sel.level_id === level.id;
                          return (
                            <button
                              key={level.id}
                              onClick={() => updateSelection(rank, "level_id", level.id)}
                              className={cn(
                                "w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left",
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                              )}
                            >
                              {selected && <Check className="h-3 w-3 inline mr-1.5" />}
                              {level.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasDuplicateSports && (
                <p className="text-sm text-destructive">Each sport must be different.</p>
              )}

              <Button
                onClick={handleSave}
                disabled={!isComplete || hasDuplicateSports || saving}
                className="w-full h-12 font-bold rounded-xl glow"
              >
                {saving ? "Saving..." : "Save MyPlayer Profile"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyPlayerSection;
