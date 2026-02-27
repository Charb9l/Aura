import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface HeroButton {
  to: string;
  label: string;
}

interface HomeContent {
  hero_subtitle: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_buttons: HeroButton[];
}

interface PictureRow {
  id: string;
  image_url: string;
  display_order: number;
  page_slug: string;
}

const PAGES = [
  { name: "Main Page", slug: "home", description: "Hero section, text, and action buttons" },
  { name: "What's Your Move?", slug: "whats-your-move", description: "Activity cards and filters section" },
  { name: "Book a Session", slug: "book", description: "Booking flow and activity selection" },
  { name: "Join Our Academies", slug: "academy", description: "Academy information and enrollment" },
  { name: "Clubs & Partners", slug: "clubs", description: "Club listings and partner info" },
];

// === Pictures Manager (reusable for any page) ===
const PagePicturesManager = ({ pageSlug }: { pageSlug: string }) => {
  const [pictures, setPictures] = useState<PictureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetchPictures();
  }, [pageSlug]);

  const fetchPictures = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hero_pictures")
      .select("*")
      .eq("page_slug", pageSlug)
      .order("display_order");
    setPictures((data as any[]) || []);
    setLoading(false);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArr.length === 0) { toast.error("Please upload image files"); return; }
    setUploading(true);

    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("hero-pictures")
        .upload(filePath, file, { cacheControl: "3600" });

      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }

      const { data: urlData } = supabase.storage.from("hero-pictures").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("hero_pictures").insert({
        image_url: urlData.publicUrl,
        display_order: pictures.length + fileArr.indexOf(file),
        page_slug: pageSlug,
      } as any);

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

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => document.getElementById(inputId)?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Uploading..." : "Drop images here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 10MB each</p>
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <p className="text-center text-muted-foreground py-4 text-sm">Loading pictures...</p>
      ) : pictures.length === 0 ? (
        <p className="text-center text-muted-foreground py-4 text-sm">No pictures yet for this page.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {pictures.map((pic) => (
            <div
              key={pic.id}
              className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video"
            >
              <img
                src={pic.image_url}
                alt="Page picture"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(pic); }}
                  className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all"
                >
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

// === Main Customer Vision Tab ===
const CustomerVisionTab = () => {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [saving, setSaving] = useState(false);

  // Home page editable fields
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroLine1, setHeroLine1] = useState("");
  const [heroLine2, setHeroLine2] = useState("");
  const [heroButtons, setHeroButtons] = useState<HeroButton[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_slug", "home")
        .single();
      if (data) {
        setHomeContent(data.content as unknown as HomeContent);
      }
    };
    fetchContent();
  }, []);

  const openHomeEditor = () => {
    if (homeContent) {
      setHeroSubtitle(homeContent.hero_subtitle);
      setHeroLine1(homeContent.hero_title_line1);
      setHeroLine2(homeContent.hero_title_line2);
      setHeroButtons([...homeContent.hero_buttons]);
    }
    setEditingPage("home");
  };

  const handleSaveHome = async () => {
    setSaving(true);
    const newContent: HomeContent = {
      hero_subtitle: heroSubtitle,
      hero_title_line1: heroLine1,
      hero_title_line2: heroLine2,
      hero_buttons: heroButtons.filter(b => b.label.trim() && b.to.trim()),
    };

    const { error } = await supabase
      .from("page_content")
      .update({ content: newContent as any, updated_at: new Date().toISOString() })
      .eq("page_slug", "home");

    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Home page updated successfully");
      setHomeContent(newContent);
      setEditingPage(null);
    }
  };

  const addButton = () => {
    setHeroButtons(prev => [...prev, { to: "/", label: "" }]);
  };

  const removeButton = (index: number) => {
    setHeroButtons(prev => prev.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: "to" | "label", value: string) => {
    setHeroButtons(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const openPageEditor = (slug: string) => {
    if (slug === "home") {
      openHomeEditor();
    } else {
      setEditingPage(slug);
    }
  };

  const currentPageName = PAGES.find(p => p.slug === editingPage)?.name || "";

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
                    <Button variant="ghost" size="icon" onClick={() => openPageEditor(page.slug)}>
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
              <Eye className="h-5 w-5 text-primary" />
              Edit Main Page
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Hero Subtitle */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hero Subtitle (small text above title)
              </Label>
              <Input
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g. Movement & Mindfulness"
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Hero Title Line 1 */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hero Title — Line 1
              </Label>
              <Input
                value={heroLine1}
                onChange={(e) => setHeroLine1(e.target.value)}
                placeholder="e.g. Your Journey."
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Hero Title Line 2 */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hero Title — Line 2 (gradient highlight)
              </Label>
              <Input
                value={heroLine2}
                onChange={(e) => setHeroLine2(e.target.value)}
                placeholder="e.g. Your Space."
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Action Buttons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-muted-foreground">Action Buttons</Label>
                <Button type="button" variant="outline" size="sm" onClick={addButton} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Button
                </Button>
              </div>

              <div className="space-y-3">
                {heroButtons.map((btn, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={btn.label}
                        onChange={(e) => updateButton(i, "label", e.target.value)}
                        placeholder="Button label (e.g. Book a Session)"
                        className="h-9 bg-background border-border text-sm"
                      />
                      <Input
                        value={btn.to}
                        onChange={(e) => updateButton(i, "to", e.target.value)}
                        placeholder="Link path (e.g. /book)"
                        className="h-9 bg-background border-border text-sm font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(i)}
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {heroButtons.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No buttons yet. Click "Add Button" to create one.</p>
                )}
              </div>
            </div>

            {/* Pictures for home page */}
            <div className="border-t border-border pt-6">
              <PagePicturesManager pageSlug="home" />
            </div>

            <Button
              onClick={handleSaveHome}
              disabled={saving}
              className="w-full h-12 text-base font-semibold glow"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generic Page Editor (for non-home pages — pictures only for now) */}
      <Dialog open={!!editingPage && editingPage !== "home"} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Edit {currentPageName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <p className="text-sm text-muted-foreground">
              Text and content editing for this page is coming soon. You can manage pictures below.
            </p>

            {/* Pictures for this page */}
            {editingPage && (
              <PagePicturesManager pageSlug={editingPage} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CustomerVisionTab;
