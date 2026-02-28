import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Gamepad2, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface Offering {
  id: string;
  name: string;
  slug: string;
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
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selections, setSelections] = useState<Selection[]>([
    { rank: 1, sport_id: "", level_id: "" },
    { rank: 2, sport_id: "", level_id: "" },
    { rank: 3, sport_id: "", level_id: "" },
  ]);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [offeringsRes, levelsRes, selectionsRes] = await Promise.all([
        supabase.from("offerings").select("id, name, slug").order("name"),
        supabase.from("player_levels").select("*").order("display_order"),
        user
          ? supabase.from("player_selections").select("*").eq("user_id", user.id).order("rank")
          : Promise.resolve({ data: [] }),
      ]);

      setOfferings((offeringsRes.data as Offering[]) || []);
      setLevels((levelsRes.data as Level[]) || []);

      const existing = (selectionsRes.data as any[]) || [];
      setHasSaved(existing.length > 0);

      if (existing.length > 0) {
        const mapped: Selection[] = existing.map((e: any, i: number) => ({
          rank: e.rank ?? i + 1,
          sport_id: e.sport_id,
          level_id: e.level_id,
        }));
        // Pad to at least 3 slots
        while (mapped.length < 3) {
          mapped.push({ rank: mapped.length + 1, sport_id: "", level_id: "" });
        }
        setSelections(mapped);
      }
      setLoaded(true);
    };
    fetchData();
  }, [user]);

  const filledSelections = selections.filter((s) => s.sport_id && s.level_id);
  const isValid = filledSelections.length >= 1;
  const hasDuplicateSports = (() => {
    const picked = selections.map((s) => s.sport_id).filter(Boolean);
    return new Set(picked).size !== picked.length;
  })();

  const addSlot = () => {
    const nextRank = selections.length + 1;
    setSelections((prev) => [...prev, { rank: nextRank, sport_id: "", level_id: "" }]);
  };

  const removeSlot = (rank: number) => {
    if (selections.length <= 1) return;
    setSelections((prev) =>
      prev.filter((s) => s.rank !== rank).map((s, i) => ({ ...s, rank: i + 1 }))
    );
  };

  const handleSave = async () => {
    if (!user || !isValid || hasDuplicateSports) return;
    setSaving(true);

    // Delete existing and re-insert only filled ones
    await supabase.from("player_selections").delete().eq("user_id", user.id);

    const rows = filledSelections.map((s, i) => ({
      user_id: user.id,
      sport_id: s.sport_id,
      level_id: s.level_id,
      rank: i + 1,
    }));

    const { error } = await supabase.from("player_selections").insert(rows);
    setSaving(false);

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("MyPlayer profile saved!");
      setHasSaved(true);
      setOpen(false);
    }
  };

  const updateSelection = (rank: number, field: "sport_id" | "level_id", value: string) => {
    setSelections((prev) =>
      prev.map((s) => (s.rank === rank ? { ...s, [field]: value } : s))
    );
  };

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
            <p className="text-sm text-muted-foreground">Pick your favourite sports and your level for each. At least 1 required.</p>
          </DialogHeader>

          {!loaded ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : offerings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sports configured yet. Check back soon!</p>
          ) : (
            <div className="space-y-6 pt-2">
              {selections.map((sel, idx) => {
                const otherSports = selections
                  .filter((s) => s.rank !== sel.rank && s.sport_id)
                  .map((s) => s.sport_id);

                return (
                  <div key={sel.rank} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        #{idx + 1} Sport {idx === 0 && <span className="text-xs text-muted-foreground font-normal">(required)</span>}
                      </p>
                      {selections.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSlot(sel.rank)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>

                    {/* Sport selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {offerings.map((offering) => {
                        const disabled = otherSports.includes(offering.id);
                        const selected = sel.sport_id === offering.id;
                        return (
                          <button
                            key={offering.id}
                            onClick={() => !disabled && updateSelection(sel.rank, "sport_id", offering.id)}
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
                            {offering.name}
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
                              onClick={() => updateSelection(sel.rank, "level_id", level.id)}
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

              {/* Add more button */}
              {selections.length < offerings.length && (
                <Button variant="outline" onClick={addSlot} className="w-full gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> Add another sport
                </Button>
              )}

              {hasDuplicateSports && (
                <p className="text-sm text-destructive">Each sport must be different.</p>
              )}

              <Button
                onClick={handleSave}
                disabled={!isValid || hasDuplicateSports || saving}
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
