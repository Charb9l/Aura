import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Gamepad2, Check, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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
  location: string;
}

interface Selection {
  rank: number;
  sport_id: string;
  level_id: string;
  location_id: string;
}

const MyPlayerSection = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selections, setSelections] = useState<Selection[]>([
    { rank: 1, sport_id: "", level_id: "", location_id: "" },
    { rank: 2, sport_id: "", level_id: "", location_id: "" },
    { rank: 3, sport_id: "", level_id: "", location_id: "" },
  ]);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [offeringsRes, levelsRes, locationsRes, selectionsRes] = await Promise.all([
        supabase.from("offerings").select("id, name, slug, brand_color").order("name"),
        supabase.from("player_levels").select("*").order("display_order"),
        supabase.from("club_locations").select("*").order("name"),
        user
          ? supabase.from("player_selections").select("*").eq("user_id", user.id).order("rank")
          : Promise.resolve({ data: [] }),
      ]);

      setOfferings((offeringsRes.data as Offering[]) || []);
      setLevels((levelsRes.data as Level[]) || []);
      setLocations((locationsRes.data as Location[]) || []);

      const existing = (selectionsRes.data as any[]) || [];
      setHasSaved(existing.length > 0);

      if (existing.length > 0) {
        const mapped: Selection[] = existing.map((e: any, i: number) => ({
          rank: e.rank ?? i + 1,
          sport_id: e.sport_id,
          level_id: e.level_id,
          location_id: e.location_id || "",
        }));
        while (mapped.length < 3) {
          mapped.push({ rank: mapped.length + 1, sport_id: "", level_id: "", location_id: "" });
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
    setSelections((prev) => [...prev, { rank: nextRank, sport_id: "", level_id: "", location_id: "" }]);
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
      location_id: s.location_id || null,
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

  const updateSelection = (rank: number, field: keyof Selection, value: string) => {
    setSelections((prev) =>
      prev.map((s) => (s.rank === rank ? { ...s, [field]: value } : s))
    );
  };

  const getBrandColor = (sportId: string): string | null => {
    return offerings.find((o) => o.id === sportId)?.brand_color || null;
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
            <p className="text-sm text-muted-foreground">Pick your favourite sports, your level, and preferred location for each.</p>
          </DialogHeader>

          {!loaded ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : offerings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sports configured yet. Check back soon!</p>
          ) : (
            <div className="space-y-6 pt-2">
              {selections.map((sel, idx) => {
                const brandColor = getBrandColor(sel.sport_id);
                const otherSports = selections
                  .filter((s) => s.rank !== sel.rank && s.sport_id)
                  .map((s) => s.sport_id);

                const cardStyle = brandColor
                  ? {
                      borderColor: `hsl(${brandColor})`,
                      boxShadow: `0 0 15px hsl(${brandColor} / 0.25), inset 0 0 30px hsl(${brandColor} / 0.05)`,
                    }
                  : {};

                return (
                  <div
                    key={sel.rank}
                    className={cn(
                      "rounded-xl border bg-secondary/30 p-4 space-y-3 transition-all duration-300",
                      !brandColor && "border-border"
                    )}
                    style={cardStyle}
                  >
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
                        const offeringColor = offering.brand_color;

                        const selectedStyle = selected && offeringColor
                          ? {
                              borderColor: `hsl(${offeringColor})`,
                              backgroundColor: `hsl(${offeringColor} / 0.15)`,
                              color: `hsl(${offeringColor})`,
                              boxShadow: `0 0 10px hsl(${offeringColor} / 0.2)`,
                            }
                          : {};

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
                                  ? "shadow-sm"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                            )}
                            style={selectedStyle}
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
                          const levelStyle = selected && brandColor
                            ? {
                                borderColor: `hsl(${brandColor})`,
                                backgroundColor: `hsl(${brandColor} / 0.12)`,
                                color: `hsl(${brandColor})`,
                              }
                            : {};

                          return (
                            <button
                              key={level.id}
                              onClick={() => updateSelection(sel.rank, "level_id", level.id)}
                              className={cn(
                                "w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left",
                                !selected && "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                              )}
                              style={levelStyle}
                            >
                              {selected && <Check className="h-3 w-3 inline mr-1.5" />}
                              {level.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Location selector */}
                    {sel.sport_id && sel.level_id && locations.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Preferred location <span className="text-muted-foreground/60">(optional)</span>:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {locations.map((loc) => {
                            const selected = sel.location_id === loc.id;
                            const locStyle = selected && brandColor
                              ? {
                                  borderColor: `hsl(${brandColor})`,
                                  backgroundColor: `hsl(${brandColor} / 0.12)`,
                                  color: `hsl(${brandColor})`,
                                }
                              : {};

                            return (
                              <button
                                key={loc.id}
                                onClick={() => updateSelection(sel.rank, "location_id", selected ? "" : loc.id)}
                                className={cn(
                                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left",
                                  !selected && "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                                )}
                                style={locStyle}
                              >
                                {selected && <Check className="h-3 w-3 inline mr-1" />}
                                <span className="block text-xs">{loc.name}</span>
                                <span className="block text-[10px] opacity-60">{loc.location}</span>
                              </button>
                            );
                          })}
                        </div>
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
