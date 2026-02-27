import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
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

interface HeroButton { to: string; label: string; }
interface FormField { key: string; label: string; type: string; required: boolean; }

interface HomeContent {
  hero_subtitle: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_buttons: HeroButton[];
  section_title: string;
  section_subtitle: string;
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

const PAGES = [
  { name: "Main Page", slug: "home", description: "Hero section, text, action buttons, and activity section" },
  { name: "Book a Session", slug: "book", description: "Booking page title, subtitle, and detail fields" },
  { name: "Join Our Academies", slug: "academy", description: "Academy page title, subtitle, and form fields" },
  { name: "Clubs & Partners", slug: "clubs", description: "Clubs page title and subtitle" },
  { name: "Loyalty Program", slug: "loyalty", description: "Loyalty page main title and subtitle" },
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
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionSubtitle, setSectionSubtitle] = useState("");

  // Generic page state
  const [pageTitle, setPageTitle] = useState("");
  const [pageSubtitle, setPageSubtitle] = useState("");
  const [pageFields, setPageFields] = useState<FormField[]>([]);

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
    // Academy edit redirects to the Academies tab
    if (slug === "academy" && onNavigateTab) {
      onNavigateTab("academies");
      return;
    }
    const content = allContent[slug] || {};
    if (slug === "home") {
      setHeroSubtitle(content.hero_subtitle || "");
      setHeroLine1(content.hero_title_line1 || "");
      setHeroLine2(content.hero_title_line2 || "");
      setHeroButtons([...(content.hero_buttons || [])]);
      setSectionTitle(content.section_title || "What's Your Move?");
      setSectionSubtitle(content.section_subtitle || "Choose your activity and book in seconds.");
    } else {
      setPageTitle(content.title || "");
      setPageSubtitle(content.subtitle || "");
      setPageFields([...(content.fields || [])]);
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
      section_title: sectionTitle,
      section_subtitle: sectionSubtitle,
    });
  };

  const handleSavePage = (slug: string) => {
    const content: any = { title: pageTitle, subtitle: pageSubtitle };
    if (slug === "book" || slug === "academy") {
      content.fields = pageFields.filter(f => f.label.trim());
    }
    saveContent(slug, content);
  };

  const addButton = () => setHeroButtons(prev => [...prev, { to: "/", label: "" }]);
  const removeButton = (i: number) => setHeroButtons(prev => prev.filter((_, idx) => idx !== i));
  const updateButton = (i: number, field: "to" | "label", value: string) => setHeroButtons(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));

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
              {PAGES.map((page) => (
                <TableRow key={page.slug}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{page.description}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEditor(page.slug)}>
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
                    <div className="flex-1 space-y-2">
                      <Input value={btn.label} onChange={(e) => updateButton(i, "label", e.target.value)} placeholder="Button label" className="h-9 bg-background border-border text-sm" />
                      <Input value={btn.to} onChange={(e) => updateButton(i, "to", e.target.value)} placeholder="Link path (e.g. /book)" className="h-9 bg-background border-border text-sm font-mono" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeButton(i)} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {heroButtons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No buttons yet.</p>}
              </div>
            </div>

            {/* "What's Your Move?" section */}
            <div className="border-t border-border pt-6">
              <Label className="text-sm font-medium text-muted-foreground mb-4 block">"What's Your Move?" Section</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Section Title</Label>
                  <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="e.g. What's Your Move?" className="h-12 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Section Subtitle</Label>
                  <Input value={sectionSubtitle} onChange={(e) => setSectionSubtitle(e.target.value)} placeholder="e.g. Choose your activity and book in seconds." className="h-12 bg-secondary border-border" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <PagePicturesManager pageSlug="home" />
            </div>

            <Button onClick={handleSaveHome} disabled={saving} className="w-full h-12 text-base font-semibold glow">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generic Page Editor (book, academy, clubs) */}
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

            {editingPage && editingPage !== "clubs" && editingPage !== "loyalty" && (
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
