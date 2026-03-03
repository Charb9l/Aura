import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, Package, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface OfferingRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

const ActivitiesTab = () => {
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<"list" | "add" | "edit">("list");
  const [activitySearch, setActivitySearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formLogoFile, setFormLogoFile] = useState<File | null>(null);
  const [formLogoPreview, setFormLogoPreview] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formDragging, setFormDragging] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { fetchOfferings(); }, []);

  const fetchOfferings = async () => {
    setLoading(true);
    const { data } = await supabase.from("offerings").select("*").order("name");
    if (data) setOfferings(data as unknown as OfferingRow[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormName(""); setFormSlug(""); setFormLogoFile(null); setFormLogoPreview(null); setEditId(null);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setFormLogoFile(file);
    setFormLogoPreview(URL.createObjectURL(file));
  };

  const openAdd = () => { resetForm(); setEditMode("add"); };

  const openEdit = (o: OfferingRow) => {
    setEditId(o.id); setFormName(o.name); setFormSlug(o.slug);
    setFormLogoPreview(o.logo_url || null); setFormLogoFile(null); setEditMode("edit");
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Please enter an activity name"); return; }
    const slug = formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setFormSaving(true);

    if (editMode === "add") {
      const { data: newOffering, error } = await supabase.from("offerings").insert({ name: formName.trim(), slug }).select().single();
      if (error || !newOffering) { toast.error("Failed to add: " + (error?.message || "Unknown error")); setFormSaving(false); return; }
      let logoUrl: string | null = null;
      if (formLogoFile) {
        const ext = formLogoFile.name.split(".").pop() || "png";
        const filePath = `${newOffering.id}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("offering-logos").upload(filePath, formLogoFile, { upsert: true, cacheControl: "0" });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
          logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          await supabase.from("offerings").update({ logo_url: logoUrl }).eq("id", newOffering.id);
        }
      }
      setOfferings(prev => [...prev, { ...newOffering as unknown as OfferingRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Activity "${formName.trim()}" added`);
    } else if (editMode === "edit" && editId) {
      let logoUrl: string | undefined;
      if (formLogoFile) {
        const ext = formLogoFile.name.split(".").pop() || "png";
        const filePath = `${editId}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("offering-logos").upload(filePath, formLogoFile, { upsert: true, cacheControl: "0" });
        if (uploadError) { toast.error("Image upload failed: " + uploadError.message); setFormSaving(false); return; }
        const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }
      const updates: any = { name: formName.trim(), slug };
      if (logoUrl) updates.logo_url = logoUrl;
      await supabase.from("offerings").update(updates).eq("id", editId);
      setOfferings(prev => prev.map(o => o.id === editId ? { ...o, name: formName.trim(), slug, ...(logoUrl ? { logo_url: logoUrl } : {}) } : o));
      toast.success("Activity updated");
    }

    setFormSaving(false); resetForm(); setEditMode("list");
  };

  const handleDelete = async (o: OfferingRow) => {
    if (!confirm(`Delete "${o.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("offerings").delete().eq("id", o.id);
    if (error) { toast.error("Failed to delete: " + error.message); }
    else { setOfferings(prev => prev.filter(x => x.id !== o.id)); toast.success(`"${o.name}" deleted`); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="activities">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-4xl font-bold text-foreground">Activities</h1>
        {editMode === "list" && (
          <Button onClick={openAdd} className="gap-2 glow"><Plus className="h-4 w-4" /> Add Activity</Button>
        )}
      </div>
      <p className="text-muted-foreground mb-8">Add, edit, or remove activities and their images.</p>

      {editMode !== "list" ? (
        <Card className="bg-card border-border max-w-2xl">
          <CardContent className="space-y-5 pt-6">
            <Button variant="ghost" size="sm" onClick={() => { setEditMode("list"); resetForm(); }} className="gap-1 -ml-2 mb-1">
              ← Back to list
            </Button>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Name</Label>
              <Input value={formName} onChange={(e) => { setFormName(e.target.value); setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="e.g. Basketball Court" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug</Label>
              <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="e.g. basketball" className="h-12 bg-secondary border-border" />
              <p className="text-xs text-muted-foreground mt-1">Auto-generated from name. Used internally.</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Image</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setFormDragging(true); }}
                onDragLeave={() => setFormDragging(false)}
                onDrop={(e) => { e.preventDefault(); setFormDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); }}
                className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", formDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")}
                onClick={() => document.getElementById("activity-logo-input")?.click()}
              >
                <input id="activity-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} />
                {formLogoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary"><img src={formLogoPreview} alt="Preview" className="h-full w-full object-cover" /></div>
                    <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleSave} disabled={formSaving || !formName.trim()} className="w-full h-12 text-base font-semibold glow">
              {formSaving ? "Saving..." : editMode === "add" ? "Add Activity" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
      ) : (
        <>
          <Input placeholder="Search activities..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} className="h-10 bg-secondary border-border mb-4 max-w-xs" />
          {(() => {
            const q = activitySearch.toLowerCase();
            const filtered = offerings.filter(o => !q || o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q));
            return filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">{activitySearch ? "No activities match your search." : "No activities yet. Click \"Add Activity\" to create one."}</p>
            ) : (
        <div className="space-y-2 max-w-2xl">
          {filtered.map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-all">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                {o.logo_url ? (
                  <img src={o.logo_url} alt={o.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{o.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{o.slug}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(o)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ActivitiesTab;
