import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Save, Shield, Award, Crown, Star, Zap, Target, Sun, Moon, Flame, TrendingUp, Sparkles, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { value: "star", label: "Star", icon: <Star className="h-4 w-4" /> },
  { value: "zap", label: "Zap", icon: <Zap className="h-4 w-4" /> },
  { value: "target", label: "Target", icon: <Target className="h-4 w-4" /> },
  { value: "sun", label: "Sun", icon: <Sun className="h-4 w-4" /> },
  { value: "moon", label: "Moon", icon: <Moon className="h-4 w-4" /> },
  { value: "flame", label: "Flame", icon: <Flame className="h-4 w-4" /> },
  { value: "trending-up", label: "TrendingUp", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "sparkles", label: "Sparkles", icon: <Sparkles className="h-4 w-4" /> },
  { value: "trophy", label: "Trophy", icon: <Trophy className="h-4 w-4" /> },
  { value: "clock", label: "Clock", icon: <Clock className="h-4 w-4" /> },
];

const LEVEL_ICON_OPTIONS = [
  { value: "shield", label: "Shield", icon: <Shield className="h-5 w-5" /> },
  { value: "award", label: "Award", icon: <Award className="h-5 w-5" /> },
  { value: "crown", label: "Crown", icon: <Crown className="h-5 w-5" /> },
  { value: "star", label: "Star", icon: <Star className="h-5 w-5" /> },
  { value: "trophy", label: "Trophy", icon: <Trophy className="h-5 w-5" /> },
];

const METRIC_OPTIONS = [
  { value: "sessions", label: "Total Sessions" },
  { value: "unique_activities", label: "Unique Activities" },
  { value: "morning_sessions", label: "Morning Sessions" },
  { value: "evening_sessions", label: "Evening Sessions" },
  { value: "afternoon_sessions", label: "Afternoon Sessions" },
  { value: "streak", label: "Week Streak" },
  { value: "wellness_score", label: "Wellness Score" },
];

interface BadgeConfig {
  id: string;
  icon: string;
  title: string;
  description: string;
  metric: string;
  target: number;
  use_gold?: boolean;
}

interface LevelConfig {
  name: string;
  icon: string;
  badges: BadgeConfig[];
}

const DEFAULT_LEVELS: LevelConfig[] = [
  {
    name: "Level 1 — Rookie", icon: "shield",
    badges: [
      { id: "l1_1", icon: "star", title: "First Step", description: "Complete your first session", metric: "sessions", target: 1 },
      { id: "l1_2", icon: "zap", title: "Getting Started", description: "Complete 3 sessions", metric: "sessions", target: 3 },
      { id: "l1_3", icon: "target", title: "Explorer", description: "Try 2 different activities", metric: "unique_activities", target: 2 },
      { id: "l1_4", icon: "sun", title: "Early Bird", description: "Complete 3 morning sessions", metric: "morning_sessions", target: 3 },
      { id: "l1_5", icon: "moon", title: "Night Owl", description: "Complete 3 evening sessions", metric: "evening_sessions", target: 3 },
      { id: "l1_6", icon: "flame", title: "On Fire", description: "2-week streak", metric: "streak", target: 2 },
      { id: "l1_7", icon: "trending-up", title: "Committed", description: "Complete 5 sessions", metric: "sessions", target: 5 },
      { id: "l1_8", icon: "sparkles", title: "Warming Up", description: "Reach Wellness Score 30", metric: "wellness_score", target: 30 },
    ],
  },
  {
    name: "Level 2 — Athlete", icon: "award",
    badges: [
      { id: "l2_1", icon: "star", title: "Regular", description: "Complete 10 sessions", metric: "sessions", target: 10 },
      { id: "l2_2", icon: "target", title: "Adventurer", description: "Try 3 different activities", metric: "unique_activities", target: 3 },
      { id: "l2_3", icon: "flame", title: "Iron Will", description: "4-week streak", metric: "streak", target: 4 },
      { id: "l2_4", icon: "sun", title: "Dawn Warrior", description: "Complete 5 morning sessions", metric: "morning_sessions", target: 5 },
      { id: "l2_5", icon: "moon", title: "Moonlight Athlete", description: "Complete 5 evening sessions", metric: "evening_sessions", target: 5 },
      { id: "l2_6", icon: "trophy", title: "Dedicated", description: "Complete 20 sessions", metric: "sessions", target: 20 },
      { id: "l2_7", icon: "trending-up", title: "Afternoon Pro", description: "Complete 5 afternoon sessions", metric: "afternoon_sessions", target: 5 },
      { id: "l2_8", icon: "sparkles", title: "Rising Star", description: "Reach Wellness Score 60", metric: "wellness_score", target: 60 },
    ],
  },
  {
    name: "Level 3 — Legend", icon: "crown",
    badges: [
      { id: "l3_1", icon: "star", title: "Veteran", description: "Complete 50 sessions", metric: "sessions", target: 50 },
      { id: "l3_2", icon: "target", title: "All-Rounder", description: "Try 5 different activities", metric: "unique_activities", target: 5 },
      { id: "l3_3", icon: "flame", title: "Unstoppable", description: "8-week streak", metric: "streak", target: 8 },
      { id: "l3_4", icon: "sun", title: "Sunrise Legend", description: "10 morning sessions", metric: "morning_sessions", target: 10 },
      { id: "l3_5", icon: "moon", title: "Night Legend", description: "10 evening sessions", metric: "evening_sessions", target: 10 },
      { id: "l3_6", icon: "trophy", title: "Centurion", description: "Complete 100 sessions", metric: "sessions", target: 100 },
      { id: "l3_7", icon: "zap", title: "Relentless", description: "12-week streak", metric: "streak", target: 12 },
      { id: "l3_8", icon: "sparkles", title: "Transcendent", description: "Reach Wellness Score 100", metric: "wellness_score", target: 100 },
    ],
  },
];

const getIconComponent = (iconName: string, size = "h-4 w-4") => {
  const map: Record<string, React.ReactNode> = {
    star: <Star className={size} />, zap: <Zap className={size} />, target: <Target className={size} />,
    sun: <Sun className={size} />, moon: <Moon className={size} />, flame: <Flame className={size} />,
    "trending-up": <TrendingUp className={size} />, sparkles: <Sparkles className={size} />,
    trophy: <Trophy className={size} />, clock: <Clock className={size} />,
    shield: <Shield className={size} />, award: <Award className={size} />, crown: <Crown className={size} />,
  };
  return map[iconName] || <Star className={size} />;
};

const LEVEL_COLORS = [
  { text: "text-primary", border: "border-primary/40 bg-primary/5" },
  { text: "text-accent", border: "border-accent/40 bg-accent/5" },
  { text: "text-amber-400", border: "border-amber-400/40 bg-amber-400/5" },
  { text: "text-emerald-400", border: "border-emerald-400/40 bg-emerald-400/5" },
  { text: "text-rose-400", border: "border-rose-400/40 bg-rose-400/5" },
];

const HabitsTab = () => {
  const [levels, setLevels] = useState<LevelConfig[]>(DEFAULT_LEVELS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("page_content").select("content").eq("page_slug", "habits").single();
      if (data?.content && typeof data.content === "object") {
        const c = data.content as Record<string, unknown>;
        if (Array.isArray(c.badge_levels) && c.badge_levels.length > 0) {
          setLevels(c.badge_levels as LevelConfig[]);
        }
      }
      setLoaded(true);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Merge with existing content
    const { data: existing } = await supabase.from("page_content").select("id, content").eq("page_slug", "habits").single();
    const merged = { ...(existing?.content as Record<string, unknown> || {}), badge_levels: levels };

    if (existing) {
      const { error } = await supabase.from("page_content").update({ content: merged as any }).eq("id", existing.id);
      if (error) toast.error("Failed to save"); else toast.success("Badge levels saved!");
    } else {
      const { error } = await supabase.from("page_content").insert({ page_slug: "habits", content: merged as any });
      if (error) toast.error("Failed to save"); else toast.success("Badge levels saved!");
    }
    setSaving(false);
  };

  const updateLevel = (li: number, field: keyof LevelConfig, value: string) => {
    setLevels(prev => prev.map((l, i) => i === li ? { ...l, [field]: value } : l));
  };

  const updateBadge = (li: number, bi: number, field: keyof BadgeConfig, value: string | number) => {
    setLevels(prev => prev.map((l, i) => i === li ? {
      ...l,
      badges: l.badges.map((b, j) => j === bi ? { ...b, [field]: value } : b),
    } : l));
  };

  const addBadge = (li: number) => {
    setLevels(prev => prev.map((l, i) => i === li ? {
      ...l,
      badges: [...l.badges, { id: `new_${Date.now()}`, icon: "star", title: "New Badge", description: "", metric: "sessions", target: 1 }],
    } : l));
  };

  const removeBadge = (li: number, bi: number) => {
    setLevels(prev => prev.map((l, i) => i === li ? {
      ...l,
      badges: l.badges.filter((_, j) => j !== bi),
    } : l));
  };

  const addLevel = () => {
    const colorIdx = levels.length % LEVEL_COLORS.length;
    setLevels(prev => [...prev, {
      name: `Level ${prev.length + 1}`,
      icon: "shield",
      badges: [{ id: `new_${Date.now()}`, icon: "star", title: "New Badge", description: "", metric: "sessions", target: 1 }],
    }]);
  };

  const removeLevel = (li: number) => {
    if (levels.length <= 1) { toast.error("Must have at least one level"); return; }
    setLevels(prev => prev.filter((_, i) => i !== li));
  };

  if (!loaded) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="habits">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Habit Tracker</h1>
          <p className="text-muted-foreground">Manage badge levels, requirements, and page content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Levels"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {levels.map((level, li) => {
          const colors = LEVEL_COLORS[li % LEVEL_COLORS.length];
          return (
            <Card key={li} className={cn("border-border overflow-hidden", colors.border)}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border", colors.border, colors.text)}>
                    {getIconComponent(level.icon, "h-5 w-5")}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Level Name</Label>
                      <Input value={level.name} onChange={e => updateLevel(li, "name", e.target.value)} className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Level Icon</Label>
                      <Select value={level.icon} onValueChange={v => updateLevel(li, "icon", v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVEL_ICON_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">{opt.icon} {opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLevel(li)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Badges ({level.badges.length})
                </div>
                {level.badges.map((badge, bi) => (
                  <div key={badge.id} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
                    <div className="pt-5 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Icon</Label>
                        <Select value={badge.icon} onValueChange={v => updateBadge(li, bi, "icon", v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">{opt.icon} {opt.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Title</Label>
                        <Input value={badge.title} onChange={e => updateBadge(li, bi, "title", e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Description</Label>
                        <Input value={badge.description} onChange={e => updateBadge(li, bi, "description", e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Metric</Label>
                        <Select value={badge.metric} onValueChange={v => updateBadge(li, bi, "metric", v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {METRIC_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Target</Label>
                        <Input type="number" min={1} value={badge.target} onChange={e => updateBadge(li, bi, "target", parseInt(e.target.value) || 1)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateBadge(li, bi, "use_gold", !badge.use_gold)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 mt-4",
                        badge.use_gold
                          ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_hsl(43_96%_56%/0.35)]"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50"
                      )}
                    >
                      ✦ Gold
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => removeBadge(li, bi)} className="text-destructive hover:text-destructive h-8 w-8 mt-4">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addBadge(li)} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Badge
                </Button>
              </CardContent>
            </Card>
          );
        })}

        <Button variant="outline" onClick={addLevel} className="gap-2 w-full">
          <Plus className="h-4 w-4" /> Add Level
        </Button>
      </div>
    </motion.div>
  );
};

export default HabitsTab;
