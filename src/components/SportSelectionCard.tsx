import { Check, Trash2, MapPin, Clock, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

export interface Selection {
  rank: number;
  sport_id: string;
  level_id: string;
  playstyle: string;
  availability: { day: string; period: string }[];
  goals: string[];
  location_ids: string[];
  years_experience: number | null;
}

export interface PlaystyleOption {
  value: string;
  label: string;
}

export interface GoalOption {
  value: string;
  label: string;
}

export interface PeriodOption {
  value: string;
  label: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  sel: Selection;
  idx: number;
  offerings: Offering[];
  levels: Level[];
  locations: Location[];
  playstyles: PlaystyleOption[];
  goals: GoalOption[];
  periods: PeriodOption[];
  otherSports: string[];
  canRemove: boolean;
  onUpdate: (rank: number, field: keyof Selection, value: any) => void;
  onToggleLocation: (rank: number, locationId: string) => void;
  onToggleAvailability: (rank: number, day: string, period: string) => void;
  onToggleGoal: (rank: number, goal: string) => void;
  onRemove: (rank: number) => void;
}

const SportSelectionCard = ({
  sel, idx, offerings, levels, locations, playstyles, goals, periods, otherSports,
  canRemove, onUpdate, onToggleLocation, onToggleAvailability, onToggleGoal, onRemove,
}: Props) => {
  const brandColor = offerings.find((o) => o.id === sel.sport_id)?.brand_color || null;

  const cardStyle = brandColor
    ? {
        borderColor: `hsl(${brandColor})`,
        boxShadow: `0 0 15px hsl(${brandColor} / 0.25), inset 0 0 30px hsl(${brandColor} / 0.05)`,
      }
    : {};

  const chipStyle = (selected: boolean) =>
    selected && brandColor
      ? {
          borderColor: `hsl(${brandColor})`,
          backgroundColor: `hsl(${brandColor} / 0.15)`,
          color: `hsl(${brandColor})`,
        }
      : {};

  const hasAvail = (day: string, period: string) =>
    sel.availability.some((a) => a.day === day && a.period === period);

  return (
    <div
      className={cn(
        "rounded-xl border bg-secondary/30 p-4 space-y-4 transition-all duration-300",
        !brandColor && "border-border"
      )}
      style={cardStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          #{idx + 1} Sport {idx === 0 && <span className="text-xs text-muted-foreground font-normal">(required)</span>}
        </p>
        {canRemove && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRemove(sel.rank)}>
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
              onClick={() => !disabled && onUpdate(sel.rank, "sport_id", offering.id)}
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

      {sel.sport_id && (
        <>
          {/* Skill Level */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Skill Level:</p>
            <div className="flex gap-2">
              {levels.map((level) => {
                const selected = sel.level_id === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => onUpdate(sel.rank, "level_id", level.id)}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-2.5 text-sm font-bold transition-all text-center",
                      !selected && "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                    style={chipStyle(selected)}
                  >
                    {selected && <Check className="h-3 w-3 inline mr-1" />}
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playstyle */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Playstyle:</p>
            <div className="flex gap-2">
              {playstyles.map((ps) => {
                const selected = sel.playstyle === ps.value;
                return (
                  <button
                    key={ps.value}
                    onClick={() => onUpdate(sel.rank, "playstyle", ps.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-center",
                      !selected && "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                    style={chipStyle(selected)}
                  >
                    {selected && <Check className="h-3 w-3 inline mr-1" />}
                    {ps.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Availability for Matchmaking <span className="text-muted-foreground/60">(select multiple)</span>:
            </p>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {/* Header row */}
              <div />
              {periods.map((p) => (
                <div key={p.value} className="text-center text-muted-foreground/70 font-medium pb-1">
                  {p.label}
                </div>
              ))}
              {/* Day rows */}
              {DAYS.map((day) => (
                <>
                  <div key={`label-${day}`} className="flex items-center text-muted-foreground font-medium">
                    {day}
                  </div>
                  {periods.map((period) => {
                    const active = hasAvail(day, period.value);
                    return (
                      <button
                        key={`${day}-${period.value}`}
                        onClick={() => onToggleAvailability(sel.rank, day, period.value)}
                        className={cn(
                          "h-8 w-8 mx-auto rounded-full border transition-all font-medium flex items-center justify-center text-xs",
                          !active && "border-border text-muted-foreground/40 hover:border-muted-foreground/50"
                        )}
                        style={chipStyle(active)}
                      >
                        {active ? "✓" : ""}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" /> Goals <span className="text-muted-foreground/60">(select multiple)</span>:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((goal) => {
                const selected = sel.goals.includes(goal.value);
                return (
                  <button
                    key={goal.value}
                    onClick={() => onToggleGoal(sel.rank, goal.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left",
                      !selected && "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                    style={chipStyle(selected)}
                  >
                    {selected && <Check className="h-3 w-3 inline mr-1" />}
                    {goal.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top 3 Locations */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Top 3 locations <span className="text-muted-foreground/60">(used by Matchmaker to find nearby players)</span>:
            </p>
            <div className="space-y-2">
              {[0, 1, 2].map((slotIdx) => {
                const selectedId = sel.location_ids[slotIdx] || "";
                const alreadySelected = sel.location_ids.filter(Boolean);
                const availableLocations = locations.filter(
                  (l) => l.id === selectedId || !alreadySelected.includes(l.id)
                );
                return (
                  <div key={slotIdx} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">#{slotIdx + 1}</span>
                    <Select
                      value={selectedId}
                      onValueChange={(val) => {
                        const newIds = [...sel.location_ids];
                        // Pad array if needed
                        while (newIds.length <= slotIdx) newIds.push("");
                        newIds[slotIdx] = val;
                        onUpdate(sel.rank, "location_ids", newIds.filter(Boolean));
                      }}
                    >
                      <SelectTrigger
                        className={cn("h-9 text-sm border-border bg-secondary/50", selectedId && "border-border")}
                        style={selectedId ? chipStyle(true) : undefined}
                      >
                        <SelectValue placeholder="Select a location..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border z-50 max-h-60">
                        {availableLocations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedId && (
                      <button
                        onClick={() => {
                          const newIds = sel.location_ids.filter((_, i) => i !== slotIdx);
                          onUpdate(sel.rank, "location_ids", newIds);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Years of Experience */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Years of experience <span className="text-muted-foreground/60">(optional)</span>:</p>
            <Input
              type="number"
              min={0}
              max={50}
              placeholder="e.g. 3"
              value={sel.years_experience ?? ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                onUpdate(sel.rank, "years_experience", val);
              }}
              className="max-w-[120px] h-9 text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SportSelectionCard;
