import { useState, useEffect } from "react";
import { Eye, Plus, Trash2, ArrowUp, ArrowDown, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────
interface FormField { key: string; label: string; type: string; required: boolean; }
interface CriterionItem { emoji: string; label: string; use_gold?: boolean; }
interface BadgeItem { label: string; use_gold?: boolean; }
interface PictureRow { id: string; image_url: string; display_order: number; page_slug: string; }

// ─── Pictures Manager ─────────────────────────────
export const PagePicturesManager = ({ pageSlug }: { pageSlug: string }) => {
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

// ─── Fields Editor ────────────────────────────────
export const FieldsEditor = ({ fields, onChange, label }: { fields: FormField[]; onChange: (f: FormField[]) => void; label: string }) => {
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
          <div key={i} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 shrink-0">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => { const arr = [...fields]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; onChange(arr); }}><ArrowUp className="h-3 w-3" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === fields.length - 1} onClick={() => { const arr = [...fields]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; onChange(arr); }}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <Label className="text-xs text-muted-foreground">Required</Label>
                <Switch checked={field.required} onCheckedChange={(v) => updateField(i, { required: v })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)} className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} placeholder="Field label" className="h-8 bg-background border-border text-xs" />
              <Select value={field.type} onValueChange={(v) => updateField(i, { type: v })}>
                <SelectTrigger className="h-8 bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No fields. Click "Add Field" to create one.</p>}
      </div>
    </div>
  );
};

// ─── Main PageCmsSection ──────────────────────────
interface PageCmsSectionProps {
  pageSlug: string;
  pageName: string;
  showPictures?: boolean;
  showFields?: boolean;
  fieldsLabel?: string;
  showMatchCriteria?: boolean;
  showHabitsBadges?: boolean;
  showMaxClubsGrid?: boolean;
}

const PageCmsSection = ({
  pageSlug, pageName, showPictures, showFields, fieldsLabel = "Detail Fields",
  showMatchCriteria, showHabitsBadges, showMaxClubsGrid,
}: PageCmsSectionProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [content, setContent] = useState<Record<string, any>>({});

  // State
  const [pageTitle, setPageTitle] = useState("");
  const [pageSubtitle, setPageSubtitle] = useState("");
  const [pageFields, setPageFields] = useState<FormField[]>([]);
  const [matchCriteria, setMatchCriteria] = useState<CriterionItem[]>([]);
  const [habitsBadges, setHabitsBadges] = useState<BadgeItem[]>([]);
  const [maxClubsGrid, setMaxClubsGrid] = useState(3);

  useEffect(() => {
    if (!open || loaded) return;
    const load = async () => {
      const { data } = await supabase.from("page_content").select("content").eq("page_slug", pageSlug).single();
      const c = (data?.content as Record<string, any>) || {};
      setContent(c);
      setPageTitle(c.title || "");
      setPageSubtitle(c.subtitle || "");
      setPageFields([...(c.fields || [])]);
      setMatchCriteria([...(c.criteria || [])]);
      setHabitsBadges([...(c.feature_badges || [])]);
      setMaxClubsGrid(c.max_clubs_grid ?? 3);
      setLoaded(true);
    };
    load();
  }, [open, loaded, pageSlug]);

  const handleSave = async () => {
    setSaving(true);
    const updated: any = { ...content, title: pageTitle, subtitle: pageSubtitle };
    if (showFields) updated.fields = pageFields.filter(f => f.label.trim());
    if (showMaxClubsGrid) updated.max_clubs_grid = maxClubsGrid;
    if (showMatchCriteria) updated.criteria = matchCriteria.filter(c => c.label.trim());
    if (showHabitsBadges) updated.feature_badges = habitsBadges.filter(b => b.label.trim());

    const { data: existing } = await supabase.from("page_content").select("id").eq("page_slug", pageSlug).single();
    if (existing) {
      const { error } = await supabase.from("page_content").update({ content: updated as any, updated_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) toast.error("Failed to save: " + error.message);
      else { toast.success("Page content saved"); setContent(updated); }
    } else {
      const { error } = await supabase.from("page_content").insert({ page_slug: pageSlug, content: updated as any });
      if (error) toast.error("Failed to save: " + error.message);
      else { toast.success("Page content saved"); setContent(updated); }
    }
    setSaving(false);
  };

  return (
    <Card className="bg-card border-border mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <Eye className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Customer Vision — {pageName}</p>
          <p className="text-xs text-muted-foreground">Edit page title, subtitle, and content shown to customers.</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <CardContent className="border-t border-border pt-6 space-y-6">
          {!loaded ? (
            <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Page Title</Label>
                <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="Page title" className="h-9 bg-secondary border-border text-sm" />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Subtitle</Label>
                <Input value={pageSubtitle} onChange={(e) => setPageSubtitle(e.target.value)} placeholder="Subtitle text" className="h-9 bg-secondary border-border text-sm" />
              </div>

              {showFields && (
                <div className="border-t border-border pt-6">
                  <FieldsEditor fields={pageFields} onChange={setPageFields} label={fieldsLabel} />
                </div>
              )}

              {showMaxClubsGrid && (
                <div className="border-t border-border pt-6">
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Max clubs shown as cards</Label>
                  <Input type="number" min={1} max={20} value={maxClubsGrid} onChange={(e) => setMaxClubsGrid(Math.max(1, parseInt(e.target.value) || 1))} className="h-9 bg-secondary border-border w-32 text-sm" />
                  <p className="text-xs text-muted-foreground mt-1.5">If more clubs are available, they'll appear as a dropdown.</p>
                </div>
              )}

              {showMatchCriteria && (
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-muted-foreground">Match Criteria Badges</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMatchCriteria(prev => [...prev, { emoji: "✓", label: "" }])} className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add Criteria
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">These appear as styled pills below the subtitle.</p>
                  <div className="space-y-3">
                    {matchCriteria.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => { const arr = [...matchCriteria]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setMatchCriteria(arr); }}><ArrowUp className="h-3 w-3" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === matchCriteria.length - 1} onClick={() => { const arr = [...matchCriteria]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setMatchCriteria(arr); }}><ArrowDown className="h-3 w-3" /></Button>
                          <button type="button" onClick={() => setMatchCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, use_gold: !cr.use_gold } : cr))}
                            className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all shrink-0 ml-auto", c.use_gold ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_hsl(43_96%_56%/0.35)]" : "border-border text-muted-foreground hover:border-muted-foreground/50")}>
                            ✦ Gold
                          </button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setMatchCriteria(prev => prev.filter((_, idx) => idx !== i))} className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="flex gap-2">
                          <Input value={c.emoji} onChange={(e) => setMatchCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, emoji: e.target.value } : cr))} placeholder="✓" className="h-8 w-12 bg-background border-border text-xs text-center" maxLength={4} />
                          <Input value={c.label} onChange={(e) => setMatchCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, label: e.target.value } : cr))} placeholder="e.g. Skill Level" className="h-8 flex-1 bg-background border-border text-xs" />
                        </div>
                      </div>
                    ))}
                    {matchCriteria.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No criteria yet.</p>}
                  </div>
                </div>
              )}

              {showHabitsBadges && (
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-muted-foreground">Feature Badges</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setHabitsBadges(prev => [...prev, { label: "", use_gold: false }])} className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add Badge
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">These appear as styled pills below the subtitle.</p>
                  <div className="space-y-3">
                    {habitsBadges.map((b, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => { const arr = [...habitsBadges]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setHabitsBadges(arr); }}><ArrowUp className="h-3 w-3" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={i === habitsBadges.length - 1} onClick={() => { const arr = [...habitsBadges]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setHabitsBadges(arr); }}><ArrowDown className="h-3 w-3" /></Button>
                          <button type="button" onClick={() => setHabitsBadges(prev => prev.map((br, idx) => idx === i ? { ...br, use_gold: !br.use_gold } : br))}
                            className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all shrink-0 ml-auto", b.use_gold ? "border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_hsl(43_96%_56%/0.35)]" : "border-border text-muted-foreground hover:border-muted-foreground/50")}>
                            ✦ Gold
                          </button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setHabitsBadges(prev => prev.filter((_, idx) => idx !== i))} className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <Input value={b.label} onChange={(e) => setHabitsBadges(prev => prev.map((br, idx) => idx === i ? { ...br, label: e.target.value } : br))} placeholder="e.g. Streaks" className="h-8 bg-background border-border text-xs" />
                      </div>
                    ))}
                    {habitsBadges.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No feature badges yet.</p>}
                  </div>
                </div>
              )}

              {showPictures && (
                <div className="border-t border-border pt-6">
                  <PagePicturesManager pageSlug={pageSlug} />
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full h-10 text-sm font-semibold glow">
                {saving ? "Saving..." : "Save Page Content"}
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PageCmsSection;
