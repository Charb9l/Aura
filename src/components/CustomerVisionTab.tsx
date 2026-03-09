import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Pencil, Plus, Trash2, Upload, ArrowUp, ArrowDown, Package, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface HeroButton { to: string; label: string; glow?: boolean; }
interface FormField { key: string; label: string; type: string; required: boolean; }
interface NavItem { to: string; label: string; }

const DEFAULT_NAV_ORDER: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/habits", label: "AI Habit Tracker" },
  { to: "/matchmaker", label: "AI Matchmaker" },
  { to: "/book", label: "Book Now" },
  { to: "/academy", label: "Academies" },
  { to: "/clubs", label: "Clubs & Partners" },
  { to: "/loyalty", label: "Loyalty" },
];

interface HomeContent {
  hero_subtitle: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_buttons: HeroButton[];
  nav_order?: NavItem[];
  background_picture?: string;
  platform_name?: string;
}

interface PageContent {
  title?: string;
  subtitle?: string;
  fields?: FormField[];
}

interface PictureRow {
  id: string;
  image_url: string;
  display_order: number;
  page_slug: string;
}

interface OfferingRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

const PAGES = [
  { name: "Academies", slug: "academy", description: "Academy page title, subtitle, and pictures" },
  { name: "AI Habit Tracker", slug: "habits", description: "Habit tracker page title and subtitle" },
  { name: "AI Matchmaker", slug: "matchmaker", description: "Matchmaker page title, subtitle, and match criteria badges" },
  { name: "Book a Session", slug: "book", description: "Booking page title, subtitle, and detail fields" },
  { name: "Clubs & Partners", slug: "clubs", description: "Clubs page title, subtitle, and pictures" },
  { name: "Loyalty Program", slug: "loyalty", description: "Loyalty page main title and subtitle" },
  { name: "Main Page", slug: "home", description: "Hero section, text, action buttons, and activity section" },
];

// === Pictures Manager ===
const PagePicturesManager = ({ pageSlug }: { pageSlug: string }) => {
  const [pictures, setPictures] = useState<PictureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { fetchPictures(); }, [pageSlug]);

  const fetchPictures = async () => {
    setLoading(true);
    const { data } = await supabase.from("hero_pictures").select("*").eq("page_slug", pageSlug).order("display_order");
    setPictures((data as any[]) || []);
    setLoading(false);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!fileArr.length) { toast.error("Please upload image files"); return; }
    setUploading(true);
    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10MB)`); continue; }
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("hero-pictures").upload(filePath, file, { cacheControl: "3600" });
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }
      const { data: urlData } = supabase.storage.from("hero-pictures").getPublicUrl(filePath);
      const { error: dbError } = await supabase.from("hero_pictures").insert({ image_url: urlData.publicUrl, display_order: pictures.length + fileArr.indexOf(file), page_slug: pageSlug } as any);
      if (dbError) { toast.error(`Save failed: ${dbError.message}`); continue; }
    }
    toast.success(`${fileArr.length} picture(s) uploaded`);
    fetchPictures();
    setUploading(false);
  };

  const handleDelete = async (pic: PictureRow) => {
    if (!confirm("Remove this picture?")) return;
    const urlParts = pic.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1].split("?")[0];
    await supabase.storage.from("hero-pictures").remove([fileName]);
    await supabase.from("hero_pictures").delete().eq("id", pic.id);
    setPictures(prev => prev.filter(p => p.id !== pic.id));
    toast.success("Picture removed");
  };

  const inputId = `pics-input-${pageSlug}`;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-muted-foreground block">Page Pictures</Label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => document.getElementById(inputId)?.click()}
        className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")}
      >
        <input id={inputId} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Drop images here or click to browse"}</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 10MB each</p>
        </div>
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-4 text-sm">Loading pictures...</p>
      ) : pictures.length === 0 ? (
        <p className="text-center text-muted-foreground py-4 text-sm">No pictures yet for this page.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {pictures.map((pic) => (
            <div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
              <img src={pic.image_url} alt="Page picture" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(pic); }} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === Fields Editor (reusable for Book + Academy) ===
const FieldsEditor = ({ fields, onChange, label }: { fields: FormField[]; onChange: (f: FormField[]) => void; label: string }) => {
  const addField = () => onChange([...fields, { key: `field_${Date.now()}`, label: "", type: "text", required: true }]);
  const removeField = (i: number) => onChange(fields.filter((_, idx) => idx !== i));
  const updateField = (i: number, updates: Partial<FormField>) => onChange(fields.map((f, idx) => idx === i ? { ...f, ...updates } : f));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Field
        </Button>
      </div>
      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
            <div className="flex flex-col gap-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => { const arr = [...fields]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; onChange(arr); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === fields.length - 1} onClick={() => { const arr = [...fields]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; onChange(arr); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} placeholder="Field label (e.g. Full Name)" className="h-9 bg-background border-border text-sm" />
              <Select value={field.type} onValueChange={(v) => updateField(i, { type: v })}>
                <SelectTrigger className="h-9 bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Label className="text-xs text-muted-foreground">Required</Label>
              <Switch checked={field.required} onCheckedChange={(v) => updateField(i, { required: v })} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No fields. Click "Add Field" to create one.</p>}
      </div>
    </div>
  );
};

// === Activities Manager (embedded in Customer Vision) ===
const ActivitiesManager = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<"list" | "add" | "edit">("list");

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formLogoFile, setFormLogoFile] = useState<File | null>(null);
  const [formLogoPreview, setFormLogoPreview] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formDragging, setFormDragging] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchOfferings();
  }, [open]);

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

  const openAdd = () => {
    resetForm();
    setEditMode("add");
  };

  const openEdit = (o: OfferingRow) => {
    setEditId(o.id);
    setFormName(o.name);
    setFormSlug(o.slug);
    setFormLogoPreview(o.logo_url || null);
    setFormLogoFile(null);
    setEditMode("edit");
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Please enter an activity name"); return; }
    const slug = formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setFormSaving(true);

    if (editMode === "add") {
      const { data: newOffering, error } = await supabase
        .from("offerings").insert({ name: formName.trim(), slug }).select().single();
      if (error || !newOffering) {
        toast.error("Failed to add: " + (error?.message || "Unknown error"));
        setFormSaving(false);
        return;
      }
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
        if (uploadError) {
          toast.error("Image upload failed: " + uploadError.message);
          setFormSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }
      const updates: any = { name: formName.trim(), slug };
      if (logoUrl) updates.logo_url = logoUrl;
      await supabase.from("offerings").update(updates).eq("id", editId);
      setOfferings(prev => prev.map(o => o.id === editId ? { ...o, name: formName.trim(), slug, ...(logoUrl ? { logo_url: logoUrl } : {}) } : o));
      toast.success("Activity updated");
    }

    setFormSaving(false);
    resetForm();
    setEditMode("list");
  };

  const handleDelete = async (o: OfferingRow) => {
    if (!confirm(`Delete "${o.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("offerings").delete().eq("id", o.id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      setOfferings(prev => prev.filter(x => x.id !== o.id));
      toast.success(`"${o.name}" deleted`);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setEditMode("list");
      resetForm();
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {editMode === "add" ? "Add Activity" : editMode === "edit" ? "Edit Activity" : "Manage Activities"}
          </DialogTitle>
        </DialogHeader>

        {editMode === "list" ? (
          <div className="space-y-4 pt-2">
            <div className="flex justify-end">
              <Button onClick={openAdd} className="gap-2 glow">
                <Plus className="h-4 w-4" /> Add Activity
              </Button>
            </div>
            {loading ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
            ) : offerings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No activities yet. Click "Add Activity" to create one.</p>
            ) : (
              <div className="space-y-2">
                {offerings.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3 hover:border-primary/30 transition-all">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {o.logo_url ? (
                        <img src={o.logo_url} alt={o.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{o.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{o.slug}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(o)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 pt-2">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// === Main Tab ===
const CustomerVisionTab = ({ onNavigateTab }: { onNavigateTab?: (tab: string) => void }) => {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [allContent, setAllContent] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Editable state
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroLine1, setHeroLine1] = useState("");
  const [heroLine2, setHeroLine2] = useState("");
  const [heroButtons, setHeroButtons] = useState<HeroButton[]>([]);
  const [navOrder, setNavOrder] = useState<NavItem[]>(DEFAULT_NAV_ORDER);
  const [backgroundPicture, setBackgroundPicture] = useState(""); // kept for backward compat in save
  const [platformNameLine1, setPlatformNameLine1] = useState("");
  const [platformNameLine2, setPlatformNameLine2] = useState("");
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Generic page state
  const [pageTitle, setPageTitle] = useState("");
  const [pageSubtitle, setPageSubtitle] = useState("");
  const [pageFields, setPageFields] = useState<FormField[]>([]);
  const [matchCriteria, setMatchCriteria] = useState<{ emoji: string; label: string; use_gold?: boolean }[]>([]);
  const [habitsBadges, setHabitsBadges] = useState<{ label: string; use_gold?: boolean }[]>([]);
  const [maxClubsGrid, setMaxClubsGrid] = useState<number>(3);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from("page_content").select("*");
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((row: any) => { map[row.page_slug] = row.content; });
        setAllContent(map);
      }
    };
    fetchAll();
  }, []);

  const openEditor = (slug: string) => {
    const content = allContent[slug] || {};
    if (slug === "home") {
      setHeroSubtitle(content.hero_subtitle || "");
      setHeroLine1(content.hero_title_line1 || "");
      setHeroLine2(content.hero_title_line2 || "");
      setHeroButtons([...(content.hero_buttons || [])]);
      setNavOrder(content.nav_order?.length ? [...content.nav_order] : [...DEFAULT_NAV_ORDER]);
      setBackgroundPicture(content.background_picture || "");
      setPlatformNameLine1(content.platform_name_line1 || (content.platform_name ? content.platform_name.trim().split(/\s+/)[0] : ""));
      setPlatformNameLine2(content.platform_name_line2 || (content.platform_name ? content.platform_name.trim().split(/\s+/).slice(1).join(" ") : ""));
      setShowScrollIndicator(content.show_scroll_indicator ?? false);
    } else {
      setPageTitle(content.title || "");
      setPageSubtitle(content.subtitle || "");
      setPageFields([...(content.fields || [])]);
      setMatchCriteria([...(content.criteria || [])]);
      setHabitsBadges([...(content.feature_badges || [])]);
      setMaxClubsGrid(content.max_clubs_grid ?? 3);
    }
    setEditingPage(slug);
  };

  const saveContent = async (slug: string, content: any) => {
    setSaving(true);
    const { error } = await supabase
      .from("page_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("page_slug", slug);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Page updated successfully");
      setAllContent(prev => ({ ...prev, [slug]: content }));
      setEditingPage(null);
    }
  };

  const handleSaveHome = () => {
    saveContent("home", {
      hero_subtitle: heroSubtitle,
      hero_title_line1: heroLine1,
      hero_title_line2: heroLine2,
      hero_buttons: heroButtons.filter(b => b.label.trim() && b.to.trim()),
      nav_order: navOrder,
      background_picture: backgroundPicture,
      platform_name_line1: platformNameLine1,
      platform_name_line2: platformNameLine2,
      show_scroll_indicator: showScrollIndicator,
    });
  };

  const handleSavePage = (slug: string) => {
    const content: any = { title: pageTitle, subtitle: pageSubtitle };
    if (slug === "book" || slug === "academy") {
      content.fields = pageFields.filter(f => f.label.trim());
    }
    if (slug === "book") {
      content.max_clubs_grid = maxClubsGrid;
    }
    if (slug === "matchmaker") {
      content.criteria = matchCriteria.filter(c => c.label.trim());
    }
    if (slug === "habits") {
      content.feature_badges = habitsBadges.filter(b => b.label.trim());
    }
    saveContent(slug, content);
  };

  const addButton = () => setHeroButtons(prev => [...prev, { to: "/", label: "", glow: false }]);
  const removeButton = (i: number) => setHeroButtons(prev => prev.filter((_, idx) => idx !== i));
  const updateButton = (i: number, field: "to" | "label", value: string) => setHeroButtons(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  const toggleButtonGlow = (i: number) => setHeroButtons(prev => prev.map((b, idx) => idx === i ? { ...b, glow: !b.glow } : b));

  const currentPage = PAGES.find(p => p.slug === editingPage);
  const hasFields = editingPage === "book" || editingPage === "academy";
  const fieldsLabel = editingPage === "book" ? "Booking Detail Fields" : "Personal Information Fields";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="customer-vision">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Customer Vision</h1>
        <p className="text-muted-foreground">Control what your customers see. Edit pages, text, pictures, and content directly.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGES
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((page) => (
                  <TableRow key={page.slug}>
                    <TableCell className="font-medium">{page.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{page.description}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditor(page.slug)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Home Page Editor */}
      <Dialog open={editingPage === "home"} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Edit Main Page
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Platform Name (main line in navbar)</Label>
              <Input value={platformNameLine1} onChange={(e) => setPlatformNameLine1(e.target.value)} placeholder="e.g. ELEVATE" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Platform Subname (smaller text under the name)</Label>
              <Input value={platformNameLine2} onChange={(e) => setPlatformNameLine2(e.target.value)} placeholder="e.g. Wellness Hub" className="h-12 bg-secondary border-border" />
              <p className="text-xs text-muted-foreground mt-1">These appear as the brand in the top-left of the navbar, on both the customer and admin sides.</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Hero Subtitle (small text above title)</Label>
              <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="e.g. Movement & Mindfulness" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Hero Title — Line 1</Label>
              <Input value={heroLine1} onChange={(e) => setHeroLine1(e.target.value)} placeholder="e.g. Your Journey." className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Hero Title — Line 2 (gradient highlight)</Label>
              <Input value={heroLine2} onChange={(e) => setHeroLine2(e.target.value)} placeholder="e.g. Your Space." className="h-12 bg-secondary border-border" />
            </div>

            {/* Action Buttons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-muted-foreground">Action Buttons</Label>
                <Button type="button" variant="outline" size="sm" onClick={addButton} className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Button</Button>
              </div>
              <div className="space-y-3">
                {heroButtons.map((btn, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => { const arr = [...heroButtons]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setHeroButtons(arr); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === heroButtons.length - 1} onClick={() => { const arr = [...heroButtons]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setHeroButtons(arr); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input value={btn.label} onChange={(e) => updateButton(i, "label", e.target.value)} placeholder="Button label" className="h-9 bg-background border-border text-sm" />
                      <Input value={btn.to} onChange={(e) => updateButton(i, "to", e.target.value)} placeholder="Link path (e.g. /book)" className="h-9 bg-background border-border text-sm font-mono" />
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleButtonGlow(i)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all",
                          btn.glow
                            ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_hsl(43_96%_56%/0.35)]"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        )}
                      >
                        ✦ Glow
                      </button>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeButton(i)} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {heroButtons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No buttons yet.</p>}
              </div>
            </div>

            {/* Navigation Menu Order */}
            <div className="border-t border-border pt-6">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">Navigation Menu Order</Label>
              <div className="space-y-2">
                {navOrder.map((item, i) => (
                  <div key={item.to} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-secondary/50">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => { const arr = [...navOrder]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setNavOrder(arr); }}><ArrowUp className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === navOrder.length - 1} onClick={() => { const arr = [...navOrder]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setNavOrder(arr); }}><ArrowDown className="h-3 w-3" /></Button>
                    </div>
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        const arr = [...navOrder];
                        arr[i] = { ...arr[i], label: e.target.value };
                        setNavOrder(arr);
                      }}
                      className="flex-1 h-9 bg-background border-border text-sm"
                    />
                    <span className="text-xs text-muted-foreground font-mono shrink-0">{item.to}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Indicator Toggle */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-foreground block">Scroll Indicator</Label>
                  <p className="text-xs text-muted-foreground mt-1">Show the animated scroll line at the bottom of the hero section.</p>
                </div>
                <Switch checked={showScrollIndicator} onCheckedChange={setShowScrollIndicator} />
              </div>
            </div>


            <div className="border-t border-border pt-6">
              <h3 className="text-base font-heading font-semibold text-foreground mb-1">📷 Pictures</h3>
              <p className="text-xs text-muted-foreground mb-6">All image uploads for the main page are managed here.</p>

              <div className="space-y-2 mb-4">
                <Label className="text-sm font-medium text-foreground block">Hero Background</Label>
                <p className="text-xs text-muted-foreground">These pictures are displayed behind the hero text in a dynamic grid layout.</p>
              </div>
              <PagePicturesManager pageSlug="home" />

            </div>

            <Button onClick={handleSaveHome} disabled={saving} className="w-full h-12 text-base font-semibold glow">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generic Page Editor (book, academy, clubs, matchmaker, loyalty) */}
      <Dialog open={!!editingPage && editingPage !== "home"} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Edit {currentPage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Page Title</Label>
              <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="Page title" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Subtitle (text under the title)</Label>
              <Input value={pageSubtitle} onChange={(e) => setPageSubtitle(e.target.value)} placeholder="Subtitle text" className="h-12 bg-secondary border-border" />
            </div>

            {hasFields && (
              <div className="border-t border-border pt-6">
                <FieldsEditor fields={pageFields} onChange={setPageFields} label={fieldsLabel} />
              </div>
            )}

            {editingPage === "book" && (
              <div className="border-t border-border pt-6">
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Max clubs shown as cards</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxClubsGrid}
                  onChange={(e) => setMaxClubsGrid(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-12 bg-secondary border-border w-32"
                />
                <p className="text-xs text-muted-foreground mt-1.5">If more clubs are available for an activity, they'll appear as a dropdown instead of cards.</p>
              </div>
            )}

            {editingPage === "matchmaker" && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-muted-foreground">Match Criteria Badges</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMatchCriteria(prev => [...prev, { emoji: "✓", label: "" }])}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Criteria
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">These appear as styled pills below the subtitle on the matchmaker page.</p>
                <div className="space-y-3">
                  {matchCriteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => { const arr = [...matchCriteria]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setMatchCriteria(arr); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === matchCriteria.length - 1} onClick={() => { const arr = [...matchCriteria]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setMatchCriteria(arr); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Input
                        value={c.emoji}
                        onChange={(e) => setMatchCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, emoji: e.target.value } : cr))}
                        placeholder="✓"
                        className="h-9 w-16 bg-background border-border text-sm text-center"
                        maxLength={4}
                      />
                      <Input
                        value={c.label}
                        onChange={(e) => setMatchCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, label: e.target.value } : cr))}
                        placeholder="e.g. Skill Level"
                        className="h-9 flex-1 bg-background border-border text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setMatchCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, use_gold: !cr.use_gold } : cr))}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0",
                          c.use_gold
                            ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_hsl(43_96%_56%/0.35)]"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        )}
                      >
                        ✦ Gold
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setMatchCriteria(prev => prev.filter((_, idx) => idx !== i))}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {matchCriteria.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No criteria yet. Click "Add Criteria" to create one.</p>}
                </div>
              </div>
            )}

            {editingPage === "habits" && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-muted-foreground">Feature Badges</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHabitsBadges(prev => [...prev, { label: "", use_gold: false }])}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Badge
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">These appear as styled pills below the subtitle on the habit tracker page.</p>
                <div className="space-y-3">
                  {habitsBadges.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => { const arr = [...habitsBadges]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setHabitsBadges(arr); }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === habitsBadges.length - 1} onClick={() => { const arr = [...habitsBadges]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setHabitsBadges(arr); }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Input
                        value={b.label}
                        onChange={(e) => setHabitsBadges(prev => prev.map((br, idx) => idx === i ? { ...br, label: e.target.value } : br))}
                        placeholder="e.g. Streaks"
                        className="h-9 flex-1 bg-background border-border text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setHabitsBadges(prev => prev.map((br, idx) => idx === i ? { ...br, use_gold: !br.use_gold } : br))}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0",
                          b.use_gold
                            ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_hsl(43_96%_56%/0.35)]"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        )}
                      >
                        ✦ Gold
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHabitsBadges(prev => prev.filter((_, idx) => idx !== i))}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {habitsBadges.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No feature badges yet. Click "Add Badge" to create one. Defaults will be used if empty.</p>}
                </div>
              </div>
            )}

            {editingPage && !["loyalty", "habits", "matchmaker"].includes(editingPage) && (
              <div className="border-t border-border pt-6">
                <PagePicturesManager pageSlug={editingPage} />
              </div>
            )}

            <Button onClick={() => editingPage && handleSavePage(editingPage)} disabled={saving} className="w-full h-12 text-base font-semibold glow">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CustomerVisionTab;
