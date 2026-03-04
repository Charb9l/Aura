import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Gamepad2, Flame, Target, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, X } from "lucide-react";

// ─── MyPlayer Config types ────────────────────────────────────
interface ConfigItem {
  id: string;
  label: string;
  value?: string;
  display_order: number;
}

interface LocationItem {
  id: string;
  name: string;
}

// ─── Reusable CRUD list ───────────────────────────────────────
const ConfigList = ({
  title, icon, items, tableName, hasValue, onRefresh,
}: {
  title: string; icon: React.ReactNode; items: ConfigItem[];
  tableName: string; hasValue: boolean; onRefresh: () => void;
}) => {
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");

  const autoValue = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const order = items.length > 0 ? Math.max(...items.map(i => i.display_order)) + 1 : 0;
    const row: any = { label: newLabel.trim(), display_order: order };
    if (hasValue) row.value = newValue.trim() || autoValue(newLabel);
    const { error } = await supabase.from(tableName as any).insert(row);
    if (error) { toast.error(error.message); return; }
    toast.success(`Added "${newLabel.trim()}"`);
    setNewLabel(""); setNewValue("");
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    onRefresh();
  };

  const handleSaveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    const updates: any = { label: editLabel.trim() };
    if (hasValue) updates.value = editValue.trim() || autoValue(editLabel);
    const { error } = await supabase.from(tableName as any).update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingId(null);
    onRefresh();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
            {editingId === item.id ? (
              <>
                <div className="flex-1 flex gap-2">
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8 bg-background" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(item.id)} placeholder="Label" />
                  {hasValue && <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 bg-background w-36 font-mono text-xs" placeholder="value" onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(item.id)} />}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(item.id)}><Check className="h-4 w-4 text-primary" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                {hasValue && item.value && <span className="text-xs text-muted-foreground font-mono">{item.value}</span>}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(item.id); setEditLabel(item.label); setEditValue(item.value || ""); }}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Input placeholder="New label..." value={newLabel} onChange={(e) => { setNewLabel(e.target.value); if (hasValue) setNewValue(autoValue(e.target.value)); }} className="h-10 bg-secondary border-border" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          {hasValue && <Input placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="h-10 bg-secondary border-border w-36 font-mono text-xs" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />}
          <Button onClick={handleAdd} disabled={!newLabel.trim()} className="gap-1.5 shrink-0"><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Match Criteria Editor ────────────────────────────────────
const MatchCriteriaEditor = () => {
  const [content, setContent] = useState<any>({});
  const [criteria, setCriteria] = useState<{ emoji: string; label: string }[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchContent = async () => {
    const { data } = await supabase.from("page_content").select("content").eq("page_slug", "matchmaker").single();
    const c = (data?.content as any) || {};
    setContent(c);
    setTitle(c.title || "");
    setSubtitle(c.subtitle || "");
    setCriteria(c.criteria || []);
  };

  useEffect(() => { fetchContent(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const updated = { ...content, title, subtitle, criteria: criteria.filter(c => c.label.trim()) };
    const { error } = await supabase.from("page_content").update({ content: updated, updated_at: new Date().toISOString() }).eq("page_slug", "matchmaker");
    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { toast.success("Matchmaker page updated"); setContent(updated); setOpen(false); }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => { fetchContent(); setOpen(true); }}>
        <Eye className="h-4 w-4" /> Edit Page Content
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Edit AI Matchmaker Page
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Page Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Subtitle</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle text" className="h-12 bg-secondary border-border" />
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-muted-foreground">Match Criteria Badges</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setCriteria(prev => [...prev, { emoji: "✓", label: "" }])} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Criteria
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">These appear as styled pills below the subtitle on the matchmaker page.</p>
              <div className="space-y-3">
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => { const arr = [...criteria]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setCriteria(arr); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === criteria.length - 1} onClick={() => { const arr = [...criteria]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setCriteria(arr); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Input value={c.emoji} onChange={(e) => setCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, emoji: e.target.value } : cr))} placeholder="✓" className="h-9 w-16 bg-background border-border text-sm text-center" maxLength={4} />
                    <Input value={c.label} onChange={(e) => setCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, label: e.target.value } : cr))} placeholder="e.g. Skill Level" className="h-9 flex-1 bg-background border-border text-sm" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setCriteria(prev => prev.filter((_, idx) => idx !== i))} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {criteria.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No criteria yet.</p>}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-semibold glow">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Main Matchmaker Tab ──────────────────────────────────────
const MatchmakerTab = () => {
  const [levels, setLevels] = useState<ConfigItem[]>([]);
  const [playstyles, setPlaystyles] = useState<ConfigItem[]>([]);
  const [goals, setGoals] = useState<ConfigItem[]>([]);
  const [periods, setPeriods] = useState<ConfigItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  const fetchAll = async () => {
    const [levelsRes, playstylesRes, goalsRes, periodsRes, locsRes] = await Promise.all([
      supabase.from("player_levels").select("*").order("display_order"),
      supabase.from("playstyles").select("*").order("display_order"),
      supabase.from("goals").select("*").order("display_order"),
      supabase.from("availability_periods").select("*").order("display_order"),
      supabase.from("locations").select("*").order("name"),
    ]);
    setLevels((levelsRes.data as any[]) || []);
    setPlaystyles((playstylesRes.data as any[]) || []);
    setGoals((goalsRes.data as any[]) || []);
    setPeriods((periodsRes.data as any[]) || []);
    setLocations((locsRes.data as any[]) || []);
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="matchmaker">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-4xl font-bold text-foreground">AI Matchmaker</h1>
        <MatchCriteriaEditor />
      </div>
      <p className="text-muted-foreground mb-8">
        Configure the matchmaker page content and player profile options.
      </p>

      <h2 className="font-heading text-2xl font-bold text-foreground mb-4">MyPlayer Config</h2>
      <p className="text-muted-foreground mb-6">
        Options customers see when building their player profile.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <ConfigList title="Skill Levels" icon={<Gamepad2 className="h-5 w-5 text-primary" />} items={levels} tableName="player_levels" hasValue={false} onRefresh={fetchAll} />
        <ConfigList title="Playstyles" icon={<Flame className="h-5 w-5 text-primary" />} items={playstyles} tableName="playstyles" hasValue={true} onRefresh={fetchAll} />
        <ConfigList title="Goals" icon={<Target className="h-5 w-5 text-primary" />} items={goals} tableName="goals" hasValue={true} onRefresh={fetchAll} />
        <ConfigList title="Availability Periods" icon={<Clock className="h-5 w-5 text-primary" />} items={periods} tableName="availability_periods" hasValue={true} onRefresh={fetchAll} />

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Locations
              <span className="text-xs text-muted-foreground font-normal ml-2">Managed in Settings → Locations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No locations configured yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {locations.map(loc => (
                  <span key={loc.id} className="px-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-sm font-medium text-foreground">{loc.name}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default MatchmakerTab;
