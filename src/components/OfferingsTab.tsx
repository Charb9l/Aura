import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Image, Upload, Pencil, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const OfferingsTab = () => {
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");

  // Add offering state
  const [addName, setAddName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addLogoFile, setAddLogoFile] = useState<File | null>(null);
  const [addLogoPreview, setAddLogoPreview] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addDragging, setAddDragging] = useState(false);

  // Edit offering state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editDragging, setEditDragging] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("offerings").select("*").order("name");
      if (data) setOfferings(data as unknown as OfferingRow[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleAddFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAddLogoFile(file);
    setAddLogoPreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!addName.trim()) { toast.error("Please enter an activity name"); return; }
    const slug = addSlug.trim() || addName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setAddSaving(true);

    const { data: newOffering, error } = await supabase
      .from("offerings").insert({ name: addName.trim(), slug }).select().single();

    if (error || !newOffering) {
      toast.error("Failed to add offering: " + (error?.message || "Unknown error"));
      setAddSaving(false);
      return;
    }

    let logoUrl: string | null = null;
    if (addLogoFile) {
      const ext = addLogoFile.name.split(".").pop() || "png";
      const filePath = `${newOffering.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("offering-logos").upload(filePath, addLogoFile, { upsert: true, cacheControl: "0" });

      if (uploadError) {
        toast.error("Activity created but image upload failed: " + uploadError.message);
      } else {
        const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.from("offerings").update({ logo_url: logoUrl }).eq("id", newOffering.id);
      }
    }

    setAddSaving(false);
    toast.success(`Activity "${addName.trim()}" added`);
    setOfferings(prev => [...prev, { ...newOffering as unknown as OfferingRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
    setMode("list");
    setAddName(""); setAddSlug(""); setAddLogoFile(null); setAddLogoPreview(null);
  };

  const handleEditFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setEditLogoFile(file);
    setEditLogoPreview(URL.createObjectURL(file));
  };

  const openEdit = (o: OfferingRow) => {
    setEditId(o.id);
    setEditName(o.name);
    setEditSlug(o.slug);
    setEditLogoPreview(o.logo_url || null);
    setEditLogoFile(null);
    setMode("edit");
  };

  const handleEditSave = async () => {
    if (!editId || !editName.trim()) return;
    setEditSaving(true);

    const newSlug = editSlug.trim() || editName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let logoUrl: string | undefined;

    if (editLogoFile) {
      const ext = editLogoFile.name.split(".").pop() || "png";
      const filePath = `${editId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("offering-logos").upload(filePath, editLogoFile, { upsert: true, cacheControl: "0" });

      if (uploadError) {
        toast.error("Image upload failed: " + uploadError.message);
        setEditSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
      logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    }

    const updates: any = { name: editName.trim(), slug: newSlug };
    if (logoUrl) updates.logo_url = logoUrl;

    await supabase.from("offerings").update(updates).eq("id", editId);

    setOfferings(prev => prev.map(o => o.id === editId ? { ...o, name: editName.trim(), slug: newSlug, ...(logoUrl ? { logo_url: logoUrl } : {}) } : o));
    setEditSaving(false);
    toast.success("Activity updated");
    setMode("list");
    setEditId(null); setEditLogoFile(null); setEditLogoPreview(null);
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="offerings">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Activities</h1>
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="offerings">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Activities</h1>
          <p className="text-muted-foreground">Manage activities available on the platform.</p>
        </div>
        {mode === "list" && (
          <Button onClick={() => setMode("add")} className="h-11 px-5 font-semibold glow gap-2">
            <Package className="h-4 w-4" />
            Add Activity
          </Button>
        )}
      </div>

      {mode === "edit" ? (
        <Card className="bg-card border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Edit Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button variant="ghost" size="sm" onClick={() => { setMode("list"); setEditId(null); setEditLogoFile(null); setEditLogoPreview(null); }} className="gap-1 -ml-2 mb-1">
              ← Back to list
            </Button>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Name</Label>
              <Input value={editName} onChange={(e) => { setEditName(e.target.value); setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="e.g. Basketball Court" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug</Label>
              <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} placeholder="e.g. basketball" className="h-12 bg-secondary border-border" />
              <p className="text-xs text-muted-foreground mt-1">Auto-generated from name. Used internally.</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Image</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setEditDragging(true); }}
                onDragLeave={() => setEditDragging(false)}
                onDrop={(e) => { e.preventDefault(); setEditDragging(false); const file = e.dataTransfer.files[0]; if (file) handleEditFileSelect(file); }}
                className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", editDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")}
                onClick={() => document.getElementById("edit-offering-logo-input")?.click()}
              >
                <input id="edit-offering-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleEditFileSelect(file); }} />
                {editLogoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary"><img src={editLogoPreview} alt="Preview" className="h-full w-full object-cover" /></div>
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
            <Button onClick={handleEditSave} disabled={editSaving || !editName.trim()} className="w-full h-12 text-base font-semibold glow">
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      ) : mode === "add" ? (
        <Card className="bg-card border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Add Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="gap-1 -ml-2 mb-1">
              ← Back to list
            </Button>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Name</Label>
              <Input value={addName} onChange={(e) => { setAddName(e.target.value); setAddSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="e.g. Basketball Court" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug (URL-friendly ID)</Label>
              <Input value={addSlug} onChange={(e) => setAddSlug(e.target.value)} placeholder="e.g. basketball" className="h-12 bg-secondary border-border" />
              <p className="text-xs text-muted-foreground mt-1">Used internally for booking routing. Auto-generated from name.</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Image</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setAddDragging(true); }}
                onDragLeave={() => setAddDragging(false)}
                onDrop={(e) => { e.preventDefault(); setAddDragging(false); const file = e.dataTransfer.files[0]; if (file) handleAddFileSelect(file); }}
                className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", addDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")}
                onClick={() => document.getElementById("add-offering-logo-input")?.click()}
              >
                <input id="add-offering-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddFileSelect(file); }} />
                {addLogoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary"><img src={addLogoPreview} alt="Preview" className="h-full w-full object-cover" /></div>
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
            <Button onClick={handleAdd} disabled={addSaving || !addName.trim()} className="w-full h-12 text-base font-semibold glow gap-2">
              <Package className="h-4 w-4" />
              {addSaving ? "Adding..." : "Add Activity"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* LIST VIEW */
        offerings.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-lg">No activities yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Activity" to create your first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offerings.map((o) => (
              <div key={o.id} onClick={() => openEdit(o)} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-all">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {o.logo_url ? (
                    <img src={o.logo_url} alt={o.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Image className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{o.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{o.slug}</p>
                </div>
                <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
};

export default OfferingsTab;
