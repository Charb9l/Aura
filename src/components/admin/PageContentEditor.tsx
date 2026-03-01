import { useState, useEffect } from "react";
import { Pencil, Eye, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PictureRow {
  id: string;
  image_url: string;
  display_order: number;
  page_slug: string;
}

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

interface PageContentEditorProps {
  pageSlug: string;
  pageName: string;
  showPictures?: boolean;
}

const PageContentEditor = ({ pageSlug, pageName, showPictures = true }: PageContentEditorProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [saving, setSaving] = useState(false);

  const openEditor = async () => {
    const { data } = await supabase.from("page_content").select("content").eq("page_slug", pageSlug).single();
    const content = (data?.content as any) || {};
    setTitle(content.title || "");
    setSubtitle(content.subtitle || "");
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("page_content").select("content").eq("page_slug", pageSlug).single();
    const existingContent = (existing?.content as any) || {};
    const content = { ...existingContent, title, subtitle };
    const { error } = await supabase
      .from("page_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("page_slug", pageSlug);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Page updated successfully");
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openEditor} className="gap-2">
        <Pencil className="h-3.5 w-3.5" /> Edit Page Content
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Edit {pageName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Page Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="h-12 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Subtitle (text under the title)</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle text" className="h-12 bg-secondary border-border" />
            </div>
            {showPictures && (
              <div className="border-t border-border pt-6">
                <PagePicturesManager pageSlug={pageSlug} />
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-semibold glow">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PageContentEditor;
