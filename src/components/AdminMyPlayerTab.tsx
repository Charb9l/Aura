import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Gamepad2, Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

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

const AdminMyPlayerTab = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [newSport, setNewSport] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [editingSport, setEditingSport] = useState<string | null>(null);
  const [editSportName, setEditSportName] = useState("");
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editLevelLabel, setEditLevelLabel] = useState("");

  const fetchData = async () => {
    const [s, l] = await Promise.all([
      supabase.from("player_sports").select("*").order("display_order"),
      supabase.from("player_levels").select("*").order("display_order"),
    ]);
    setSports((s.data as Sport[]) || []);
    setLevels((l.data as Level[]) || []);
  };

  useEffect(() => { fetchData(); }, []);

  const addSport = async () => {
    if (!newSport.trim()) return;
    const order = sports.length > 0 ? Math.max(...sports.map(s => s.display_order)) + 1 : 0;
    const { error } = await supabase.from("player_sports").insert({ name: newSport.trim(), display_order: order });
    if (error) { toast.error(error.message); return; }
    toast.success(`Added "${newSport.trim()}"`);
    setNewSport("");
    fetchData();
  };

  const deleteSport = async (id: string) => {
    const { error } = await supabase.from("player_sports").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Sport deleted");
    fetchData();
  };

  const saveSportEdit = async (id: string) => {
    if (!editSportName.trim()) return;
    const { error } = await supabase.from("player_sports").update({ name: editSportName.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingSport(null);
    fetchData();
  };

  const addLevel = async () => {
    if (!newLevel.trim()) return;
    const order = levels.length > 0 ? Math.max(...levels.map(l => l.display_order)) + 1 : 0;
    const { error } = await supabase.from("player_levels").insert({ label: newLevel.trim(), display_order: order });
    if (error) { toast.error(error.message); return; }
    toast.success(`Added level "${newLevel.trim()}"`);
    setNewLevel("");
    fetchData();
  };

  const deleteLevel = async (id: string) => {
    const { error } = await supabase.from("player_levels").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Level deleted");
    fetchData();
  };

  const saveLevelEdit = async (id: string) => {
    if (!editLevelLabel.trim()) return;
    const { error } = await supabase.from("player_levels").update({ label: editLevelLabel.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingLevel(null);
    fetchData();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="myplayer">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-2">MyPlayer Config</h1>
      <p className="text-muted-foreground mb-8">Manage the sports and skill levels customers can pick from.</p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sports */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Sports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sports.map((sport) => (
              <div key={sport.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                {editingSport === sport.id ? (
                  <>
                    <Input
                      value={editSportName}
                      onChange={(e) => setEditSportName(e.target.value)}
                      className="h-8 flex-1 bg-background"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveSportEdit(sport.id)}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveSportEdit(sport.id)}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSport(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-foreground">{sport.name}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingSport(sport.id); setEditSportName(sport.name); }}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteSport(sport.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="New sport name..."
                value={newSport}
                onChange={(e) => setNewSport(e.target.value)}
                className="h-10 bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && addSport()}
              />
              <Button onClick={addSport} disabled={!newSport.trim()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Levels */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Skill Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {levels.map((level) => (
              <div key={level.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                {editingLevel === level.id ? (
                  <>
                    <Input
                      value={editLevelLabel}
                      onChange={(e) => setEditLevelLabel(e.target.value)}
                      className="h-8 flex-1 bg-background"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveLevelEdit(level.id)}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveLevelEdit(level.id)}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingLevel(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-foreground">{level.label}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingLevel(level.id); setEditLevelLabel(level.label); }}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteLevel(level.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="New level label..."
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="h-10 bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && addLevel()}
              />
              <Button onClick={addLevel} disabled={!newLevel.trim()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminMyPlayerTab;
