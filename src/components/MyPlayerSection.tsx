import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Gamepad2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import SportSelectionCard, { type Selection, type PlaystyleOption, type GoalOption, type PeriodOption } from "@/components/SportSelectionCard";

interface Offering {
  id: string;
  name: string;
  slug: string;
  brand_color: string | null;
}

interface Level {
  id: string;
  label: string;
  display_order: number;
}

interface Location {
  id: string;
  name: string;
}

const emptySelection = (rank: number): Selection => ({
  rank,
  sport_id: "",
  level_id: "",
  playstyle: "",
  availability: [],
  goals: [],
  location_ids: [],
  years_experience: null,
});

const MyPlayerSection = ({ externalOpen, onExternalOpenChange }: { externalOpen?: boolean; onExternalOpenChange?: (open: boolean) => void } = {}) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [playstyles, setPlaystyles] = useState<PlaystyleOption[]>([]);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [selections, setSelections] = useState<Selection[]>([
    emptySelection(1),
    emptySelection(2),
    emptySelection(3),
  ]);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [offeringsRes, levelsRes, locationsRes, playstylesRes, goalsRes, periodsRes, selectionsRes] = await Promise.all([
        supabase.from("offerings").select("id, name, slug, brand_color").order("name"),
        supabase.from("player_levels").select("*").order("display_order"),
        supabase.from("locations").select("id, name").order("name"),
        supabase.from("playstyles").select("label, value").order("display_order"),
        supabase.from("goals").select("label, value").order("display_order"),
        supabase.from("availability_periods").select("label, value").order("display_order"),
        user
          ? supabase.from("player_selections").select("*").eq("user_id", user.id).order("rank")
          : Promise.resolve({ data: [] }),
      ]);

      setOfferings((offeringsRes.data as Offering[]) || []);
      setLevels((levelsRes.data as Level[]) || []);
      setLocations((locationsRes.data as any[])?.filter((l: any) => l.clubs?.published !== false) || []);
      setPlaystyles((playstylesRes.data as PlaystyleOption[]) || []);
      setGoals((goalsRes.data as GoalOption[]) || []);
      setPeriods((periodsRes.data as PeriodOption[]) || []);

      const existing = (selectionsRes.data as any[]) || [];
      setHasSaved(existing.length > 0);

      if (existing.length > 0) {
        const mapped: Selection[] = existing.map((e: any, i: number) => ({
          rank: e.rank ?? i + 1,
          sport_id: e.sport_id,
          level_id: e.level_id,
          playstyle: e.playstyle || "",
          availability: (e.availability as any[]) || [],
          goals: e.goals || [],
          location_ids: e.location_ids || [],
          years_experience: e.years_experience ?? null,
        }));
        while (mapped.length < 3) {
          mapped.push(emptySelection(mapped.length + 1));
        }
        setSelections(mapped);
      }
      setLoaded(true);
    };
    fetchData();
  }, [user]);

  const filledSelections = selections.filter((s) => s.sport_id && s.level_id && s.playstyle);
  const isValid = filledSelections.length >= 1;
  const hasDuplicateSports = (() => {
    const picked = selections.map((s) => s.sport_id).filter(Boolean);
    return new Set(picked).size !== picked.length;
  })();

  const addSlot = () => {
    setSelections((prev) => [...prev, emptySelection(prev.length + 1)]);
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

    await supabase.from("player_selections").delete().eq("user_id", user.id);

    const rows = filledSelections.map((s, i) => ({
      user_id: user.id,
      sport_id: s.sport_id,
      level_id: s.level_id,
      playstyle: s.playstyle,
      availability: s.availability,
      goals: s.goals,
      location_ids: s.location_ids,
      years_experience: s.years_experience,
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

  const updateSelection = (rank: number, field: keyof Selection, value: any) => {
    setSelections((prev) =>
      prev.map((s) => (s.rank === rank ? { ...s, [field]: value } : s))
    );
  };

  const toggleLocation = (rank: number, locationId: string) => {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.rank !== rank) return s;
        const has = s.location_ids.includes(locationId);
        return {
          ...s,
          location_ids: has ? s.location_ids.filter((id) => id !== locationId) : [...s.location_ids, locationId],
        };
      })
    );
  };

  const toggleAvailability = (rank: number, day: string, period: string) => {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.rank !== rank) return s;
        const has = s.availability.some((a) => a.day === day && a.period === period);
        return {
          ...s,
          availability: has
            ? s.availability.filter((a) => !(a.day === day && a.period === period))
            : [...s.availability, { day, period }],
        };
      })
    );
  };

  const toggleGoal = (rank: number, goal: string) => {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.rank !== rank) return s;
        const has = s.goals.includes(goal);
        return {
          ...s,
          goals: has ? s.goals.filter((g) => g !== goal) : [...s.goals, goal],
        };
      })
    );
  };

  const dialogContent = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            MyPlayer Profile
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Set up your sports profile — skill level, playstyle, availability, goals, and preferred locations.
          </p>
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
              const sportSlug = offerings.find(o => o.id === sel.sport_id)?.slug;
              const filteredLocations = sportSlug
                ? locations.filter(l => !l.activity || l.activity === sportSlug)
                : locations;

              return (
                <SportSelectionCard
                  key={sel.rank}
                  sel={sel}
                  idx={idx}
                  offerings={offerings}
                  levels={levels}
                  locations={filteredLocations}
                  playstyles={playstyles}
                  goals={goals}
                  periods={periods}
                  otherSports={otherSports}
                  canRemove={selections.length > 1}
                  onUpdate={updateSelection}
                  onToggleLocation={toggleLocation}
                  onToggleAvailability={toggleAvailability}
                  onToggleGoal={toggleGoal}
                  onRemove={removeSlot}
                />
              );
            })}

            {selections.length < offerings.length && (
              <Button variant="outline" onClick={addSlot} className="w-full gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Add another sport
              </Button>
            )}

            {hasDuplicateSports && (
              <p className="text-sm text-destructive">Each sport must be different.</p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Complete at least one sport with level and playstyle to save.
            </p>

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
  );

  // If externally controlled, only render the dialog (no standalone button)
  if (externalOpen !== undefined) {
    return dialogContent;
  }

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
      {dialogContent}
    </>
  );
};

export default MyPlayerSection;
