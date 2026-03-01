import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Pencil, Trash2, Upload, X, Image, GraduationCap, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ClubRow, OfferingRow } from "./types";
import { useLocations } from "@/hooks/useLocations";

interface ClubLocationRow { id: string; club_id: string; name: string; location: string; }
interface ClubPictureRow { id: string; club_id: string; image_url: string; display_order: number; }

const ClubsTab = ({ isMasterAdmin }: { isMasterAdmin: boolean }) => {
  const { locations: locationsList } = useLocations();
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClub, setEditClub] = useState<ClubRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOfferings, setEditOfferings] = useState<string[]>([]);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showAddClub, setShowAddClub] = useState(false);
  const [addClubName, setAddClubName] = useState("");
  const [addClubDescription, setAddClubDescription] = useState("");
  const [addClubOfferings, setAddClubOfferings] = useState<string[]>([]);
  const [addClubLogoFile, setAddClubLogoFile] = useState<File | null>(null);
  const [addClubLogoPreview, setAddClubLogoPreview] = useState<string | null>(null);
  const [addClubSaving, setAddClubSaving] = useState(false);
  const [addClubDragging, setAddClubDragging] = useState(false);
  const [addClubHasAcademy, setAddClubHasAcademy] = useState(false);
  const [editHasAcademy, setEditHasAcademy] = useState(false);
  const [showAcademySportPicker, setShowAcademySportPicker] = useState(false);
  const [editShowAcademySportPicker, setEditShowAcademySportPicker] = useState(false);
  const [clubLocations, setClubLocations] = useState<ClubLocationRow[]>([]);
  const [addClubLocations, setAddClubLocations] = useState<{ name: string; location: string }[]>([]);
  const [editClubLocations, setEditClubLocations] = useState<ClubLocationRow[]>([]);
  const [editNewLocations, setEditNewLocations] = useState<{ name: string; location: string }[]>([]);
  const [picturesClub, setPicturesClub] = useState<ClubRow | null>(null);
  const [clubPictures, setClubPictures] = useState<ClubPictureRow[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [picturesUploading, setPicturesUploading] = useState(false);
  const [addClubPicFiles, setAddClubPicFiles] = useState<File[]>([]);
  const [addClubPicPreviews, setAddClubPicPreviews] = useState<string[]>([]);
  const [editClubPicFiles, setEditClubPicFiles] = useState<File[]>([]);
  const [editClubPicPreviews, setEditClubPicPreviews] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [showOfferingsDialog, setShowOfferingsDialog] = useState(false);
  const [offeringsDialogMode, setOfferingsDialogMode] = useState<"list" | "add" | "edit">("list");
  const showAddOffering = offeringsDialogMode === "add";
  const setShowAddOffering = (v: boolean) => { if (v) setOfferingsDialogMode("add"); else setOfferingsDialogMode("list"); };
  const [addOfferingName, setAddOfferingName] = useState("");
  const [addOfferingSlug, setAddOfferingSlug] = useState("");
  const [addOfferingLogoFile, setAddOfferingLogoFile] = useState<File | null>(null);
  const [addOfferingLogoPreview, setAddOfferingLogoPreview] = useState<string | null>(null);
  const [addOfferingSaving, setAddOfferingSaving] = useState(false);
  const [addOfferingDragging, setAddOfferingDragging] = useState(false);
  const [editOfferingId, setEditOfferingId] = useState<string | null>(null);
  const [editOfferingName, setEditOfferingName] = useState("");
  const [editOfferingSlug, setEditOfferingSlug] = useState("");
  const [editOfferingLogoFile, setEditOfferingLogoFile] = useState<File | null>(null);
  const [editOfferingLogoPreview, setEditOfferingLogoPreview] = useState<string | null>(null);
  const [editOfferingSaving, setEditOfferingSaving] = useState(false);
  const [editOfferingDragging, setEditOfferingDragging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, offeringsRes, locRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("offerings").select("*").order("name"),
        supabase.from("club_locations").select("*").order("name"),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as ClubRow[]);
      if (offeringsRes.data) setOfferings(offeringsRes.data as unknown as OfferingRow[]);
      if (locRes.data) setClubLocations(locRes.data as unknown as ClubLocationRow[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const openEdit = (club: ClubRow) => {
    setEditClub(club); setEditName(club.name); setEditDescription(club.description || "");
    setEditOfferings(club.offerings || []); setEditHasAcademy(club.has_academy || false);
    setEditShowAcademySportPicker(false);
    setEditClubLocations(clubLocations.filter(l => l.club_id === club.id));
    setEditNewLocations([]); setEditLogoFile(null);
    setEditLogoPreview(club.logo_url?.startsWith("http") ? club.logo_url : null);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setEditLogoFile(file); setEditLogoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); };

  const handleSave = async () => {
    if (!editClub) return;
    setSaving(true);
    let logoUrl = editClub.logo_url;
    if (editLogoFile) {
      const ext = editLogoFile.name.split(".").pop() || "png";
      const filePath = `${editClub.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-logos").upload(filePath, editLogoFile, { upsert: true, cacheControl: "0" });
      if (uploadError) { toast.error("Logo upload failed: " + uploadError.message); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("club-logos").getPublicUrl(filePath);
      logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    }
    const { error } = await supabase.from("clubs").update({ name: editName, description: editDescription || null, logo_url: logoUrl, offerings: editOfferings, has_academy: editHasAcademy }).eq("id", editClub.id);
    if (editNewLocations.length > 0) {
      const locsToInsert = editNewLocations.filter(l => l.name.trim() && l.location.trim()).map(l => ({ club_id: editClub.id, name: l.name.trim(), location: l.location.trim() }));
      if (locsToInsert.length > 0) { const { data: newLocs } = await supabase.from("club_locations").insert(locsToInsert).select(); if (newLocs) setClubLocations(prev => [...prev, ...(newLocs as unknown as ClubLocationRow[])]); }
    }
    const existingIds = editClubLocations.map(l => l.id);
    const originalIds = clubLocations.filter(l => l.club_id === editClub.id).map(l => l.id);
    const deletedIds = originalIds.filter(id => !existingIds.includes(id));
    if (deletedIds.length > 0) { await supabase.from("club_locations").delete().in("id", deletedIds); setClubLocations(prev => prev.filter(l => !deletedIds.includes(l.id))); }
    setSaving(false);
    if (error) { toast.error("Failed to update club: " + error.message); }
    else { toast.success("Club updated successfully"); setClubs(prev => prev.map(c => c.id === editClub.id ? { ...c, name: editName, description: editDescription || null, logo_url: logoUrl, offerings: editOfferings, has_academy: editHasAcademy } : c)); setEditClub(null); }
  };

  const getLogoSrc = (club: ClubRow) => club.logo_url?.startsWith("http") ? club.logo_url : null;

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to delete "${clubName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    if (error) toast.error("Failed to delete club: " + error.message);
    else { toast.success(`"${clubName}" deleted`); setClubs(prev => prev.filter(c => c.id !== clubId)); }
  };

  const handleAddClubFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAddClubLogoFile(file); setAddClubLogoPreview(URL.createObjectURL(file));
  };

  const uploadClubPictures = async (clubId: string, files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID(); const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${clubId}/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-pictures").upload(filePath, file, { cacheControl: "3600" });
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("club-pictures").getPublicUrl(filePath);
      await supabase.from("club_pictures").insert({ club_id: clubId, image_url: urlData.publicUrl, display_order: files.indexOf(file) } as any);
    }
  };

  const handleAddClub = async () => {
    if (!addClubName.trim()) { toast.error("Please enter a club name"); return; }
    setAddClubSaving(true);
    const { data: newClub, error: insertError } = await supabase.from("clubs").insert({ name: addClubName.trim(), description: addClubDescription.trim() || null, offerings: addClubOfferings, has_academy: addClubHasAcademy }).select().single();
    if (insertError || !newClub) { toast.error("Failed to add club: " + (insertError?.message || "Unknown error")); setAddClubSaving(false); return; }
    let logoUrl: string | null = null;
    if (addClubLogoFile) {
      const ext = addClubLogoFile.name.split(".").pop() || "png";
      const filePath = `${newClub.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-logos").upload(filePath, addClubLogoFile, { upsert: true, cacheControl: "0" });
      if (!uploadError) { const { data: urlData } = supabase.storage.from("club-logos").getPublicUrl(filePath); logoUrl = `${urlData.publicUrl}?t=${Date.now()}`; await supabase.from("clubs").update({ logo_url: logoUrl }).eq("id", newClub.id); }
    }
    if (addClubLocations.length > 0) {
      const locsToInsert = addClubLocations.filter(l => l.name.trim() && l.location.trim()).map(l => ({ club_id: (newClub as any).id, name: l.name.trim(), location: l.location.trim() }));
      if (locsToInsert.length > 0) { const { data: newLocs } = await supabase.from("club_locations").insert(locsToInsert).select(); if (newLocs) setClubLocations(prev => [...prev, ...(newLocs as unknown as ClubLocationRow[])]); }
    }
    if (addClubPicFiles.length > 0) await uploadClubPictures((newClub as any).id, addClubPicFiles);
    setAddClubSaving(false);
    toast.success(`Club "${addClubName.trim()}" added successfully`);
    setClubs(prev => [...prev, { ...newClub as unknown as ClubRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddClub(false); setAddClubName(""); setAddClubDescription(""); setAddClubOfferings([]); setAddClubHasAcademy(false);
    setAddClubLogoFile(null); setAddClubLogoPreview(null); setAddClubLocations([]); setShowAcademySportPicker(false);
    setAddClubPicFiles([]); setAddClubPicPreviews([]);
  };

  const openPictures = async (club: ClubRow) => {
    setPicturesClub(club); setPicturesLoading(true);
    const { data } = await supabase.from("club_pictures").select("*").eq("club_id", club.id).order("display_order");
    setClubPictures((data as unknown as ClubPictureRow[]) || []); setPicturesLoading(false);
  };

  const handlePictureUpload = async (files: FileList | File[]) => {
    if (!picturesClub) return;
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!fileArr.length) { toast.error("Please upload image files"); return; }
    setPicturesUploading(true);
    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10MB)`); continue; }
      const id = crypto.randomUUID(); const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${picturesClub.id}/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-pictures").upload(filePath, file, { cacheControl: "3600" });
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }
      const { data: urlData } = supabase.storage.from("club-pictures").getPublicUrl(filePath);
      await supabase.from("club_pictures").insert({ club_id: picturesClub.id, image_url: urlData.publicUrl, display_order: clubPictures.length + fileArr.indexOf(file) } as any);
    }
    toast.success(`${fileArr.length} picture(s) uploaded`);
    const { data } = await supabase.from("club_pictures").select("*").eq("club_id", picturesClub.id).order("display_order");
    setClubPictures((data as unknown as ClubPictureRow[]) || []); setPicturesUploading(false);
  };

  const handleDeletePicture = async (pic: ClubPictureRow) => {
    if (!confirm("Remove this picture?")) return;
    const urlParts = pic.image_url.split("/");
    const fileName = urlParts.slice(-2).join("/").split("?")[0];
    await supabase.storage.from("club-pictures").remove([fileName]);
    await supabase.from("club_pictures").delete().eq("id", pic.id);
    setClubPictures(prev => prev.filter(p => p.id !== pic.id)); toast.success("Picture removed");
  };

  const handleAddClubPicSelect = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    setAddClubPicFiles(prev => [...prev, ...fileArr]);
    setAddClubPicPreviews(prev => [...prev, ...fileArr.map(f => URL.createObjectURL(f))]);
  };

  const offeringNames = useMemo(() => offerings.map(o => o.name), [offerings]);

  const handleAddOfferingFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAddOfferingLogoFile(file); setAddOfferingLogoPreview(URL.createObjectURL(file));
  };

  const handleAddOffering = async () => {
    if (!addOfferingName.trim()) { toast.error("Please enter an activity name"); return; }
    const slug = addOfferingSlug.trim() || addOfferingName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setAddOfferingSaving(true);
    const { data: newOffering, error: insertError } = await supabase.from("offerings").insert({ name: addOfferingName.trim(), slug }).select().single();
    if (insertError || !newOffering) { toast.error("Failed to add activity: " + (insertError?.message || "Unknown error")); setAddOfferingSaving(false); return; }
    let logoUrl: string | null = null;
    if (addOfferingLogoFile) {
      const ext = addOfferingLogoFile.name.split(".").pop() || "png";
      const filePath = `${newOffering.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("offering-logos").upload(filePath, addOfferingLogoFile, { upsert: true, cacheControl: "0" });
      if (!uploadError) { const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath); logoUrl = `${urlData.publicUrl}?t=${Date.now()}`; await supabase.from("offerings").update({ logo_url: logoUrl }).eq("id", newOffering.id); }
    }
    setAddOfferingSaving(false); toast.success(`Activity "${addOfferingName.trim()}" added`);
    setOfferings(prev => [...prev, { ...newOffering as unknown as OfferingRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddOffering(false); setAddOfferingName(""); setAddOfferingSlug(""); setAddOfferingLogoFile(null); setAddOfferingLogoPreview(null);
  };

  const handleEditOfferingFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setEditOfferingLogoFile(file); setEditOfferingLogoPreview(URL.createObjectURL(file));
  };

  const handleEditOfferingSave = async () => {
    if (!editOfferingId || !editOfferingName.trim()) return;
    setEditOfferingSaving(true);
    const newSlug = editOfferingSlug.trim() || editOfferingName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let logoUrl: string | undefined;
    if (editOfferingLogoFile) {
      const ext = editOfferingLogoFile.name.split(".").pop() || "png";
      const filePath = `${editOfferingId}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("offering-logos").upload(filePath, editOfferingLogoFile, { upsert: true, cacheControl: "0" });
      if (uploadError) { toast.error("Image upload failed: " + uploadError.message); setEditOfferingSaving(false); return; }
      const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
      logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    }
    const updates: any = { name: editOfferingName.trim(), slug: newSlug };
    if (logoUrl) updates.logo_url = logoUrl;
    await supabase.from("offerings").update(updates).eq("id", editOfferingId);
    setOfferings(prev => prev.map(o => o.id === editOfferingId ? { ...o, name: editOfferingName.trim(), slug: newSlug, ...(logoUrl ? { logo_url: logoUrl } : {}) } : o));
    setEditOfferingSaving(false); toast.success("Activity updated"); setOfferingsDialogMode("list");
    setEditOfferingId(null); setEditOfferingLogoFile(null); setEditOfferingLogoPreview(null);
  };

  const openEditOffering = (offering: OfferingRow) => {
    setEditOfferingId(offering.id); setEditOfferingName(offering.name); setEditOfferingSlug(offering.slug);
    setEditOfferingLogoPreview(offering.logo_url || null); setEditOfferingLogoFile(null); setOfferingsDialogMode("edit");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="clubs">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Clubs & Partners</h1>
          <p className="text-muted-foreground">All signed clubs and partners on the platform.</p>
        </div>
        {isMasterAdmin && (
          <div className="flex gap-3">
            <Button onClick={() => setShowAddClub(true)} className="h-11 px-5 font-semibold glow gap-2">
              <Building2 className="h-4 w-4" /> Add Club
            </Button>
          </div>
        )}
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Activities</TableHead>
                {isMasterAdmin && <TableHead className="w-28">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={isMasterAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : clubs.length === 0 ? (
                <TableRow><TableCell colSpan={isMasterAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">No clubs yet.</TableCell></TableRow>
              ) : clubs.slice().sort((a, b) => a.name.localeCompare(b.name)).map((club) => {
                const logoSrc = getLogoSrc(club);
                return (
                  <TableRow key={club.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {logoSrc && <div className="h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0"><img src={logoSrc} alt={club.name} className="h-full w-full object-contain" /></div>}
                        <span className="font-medium">{club.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs">{club.description || "—"}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{club.offerings.map((o) => <Badge key={o} variant="secondary" className="text-xs">{o}</Badge>)}</div></TableCell>
                    {isMasterAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(club)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openPictures(club)} title="Pictures"><Image className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClub(club.id, club.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Club Dialog */}
      <Dialog open={!!editClub} onOpenChange={(o) => !o && setEditClub(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[67vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Edit Club</DialogTitle></DialogHeader>
          {editClub && (
            <div className="space-y-5 pt-2">
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-secondary border-border" /></div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Logo</Label>
                <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")} onClick={() => document.getElementById("club-logo-input")?.click()}>
                  <input id="club-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} />
                  {editLogoPreview ? (<div className="flex flex-col items-center gap-3"><div className="h-24 w-24 rounded-xl overflow-hidden bg-secondary"><img src={editLogoPreview} alt="Logo preview" className="h-full w-full object-contain" /></div><p className="text-xs text-muted-foreground">Click or drag to replace</p></div>) : (<div className="flex flex-col items-center gap-2 py-4"><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>)}
                </div>
              </div>
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="bg-secondary border-border min-h-[100px]" placeholder="Brief description..." /></div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activities</Label>
                <div className="flex flex-wrap gap-2 mb-3">{editOfferings.map((o) => (<Badge key={o} variant="secondary" className="text-xs flex items-center gap-1 pr-1">{o}<button type="button" onClick={() => { setEditOfferings(prev => prev.filter(x => x !== o)); if (o.toLowerCase().includes("academy")) { if (!editOfferings.filter(x => x !== o).some(x => x.toLowerCase().includes("academy"))) setEditHasAcademy(false); } }} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"><X className="h-3 w-3" /></button></Badge>))}</div>
                <Select value="" onValueChange={(v) => { if (v === "__academy__") { setEditShowAcademySportPicker(true); return; } if (v && !editOfferings.includes(v)) setEditOfferings(prev => [...prev, v]); }}>
                  <SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Select an activity..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">{offeringNames.filter(o => !editOfferings.includes(o)).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}<SelectItem value="__academy__" className="font-semibold text-primary"><span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academy</span></SelectItem></SelectContent>
                </Select>
                {editShowAcademySportPicker && (<div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2"><Label className="text-xs font-medium text-primary block">Choose Academy Sport</Label><div className="flex flex-wrap gap-2">{offeringNames.map(name => { const sportName = name.replace(/\s*(Court|Studio|Classes|Rental|\(Kids\))/gi, "").trim(); const academyLabel = `${sportName} Academy`; if (editOfferings.includes(academyLabel)) return null; return (<Button key={name} type="button" variant="outline" size="sm" onClick={() => { setEditOfferings(prev => [...prev, academyLabel]); setEditHasAcademy(true); setEditShowAcademySportPicker(false); }}>{sportName}</Button>); })}</div><Button type="button" variant="ghost" size="sm" onClick={() => setEditShowAcademySportPicker(false)} className="text-xs text-muted-foreground">Cancel</Button></div>)}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Locations</Label>
                {editClubLocations.map((loc) => (<div key={loc.id} className="flex gap-2 mb-2"><Input value={loc.name} disabled className="h-10 bg-secondary border-border opacity-70" /><Input value={loc.location} disabled className="h-10 bg-secondary border-border opacity-70" /><Button type="button" variant="ghost" size="icon" onClick={() => setEditClubLocations(prev => prev.filter(l => l.id !== loc.id))} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button></div>))}
                {editNewLocations.map((loc, i) => (<div key={`new-${i}`} className="flex gap-2 mb-2"><Input placeholder="Court/Location Name" value={loc.name} onChange={(e) => { const updated = [...editNewLocations]; updated[i].name = e.target.value; setEditNewLocations(updated); }} className="h-10 bg-secondary border-border" /><Select value={loc.location} onValueChange={(val) => { const updated = [...editNewLocations]; updated[i].location = val; setEditNewLocations(updated); }}><SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Select city" /></SelectTrigger><SelectContent className="bg-card border-border z-50 max-h-60">{locationsList.map(loc => (<SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent></Select><Button type="button" variant="ghost" size="icon" onClick={() => setEditNewLocations(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button></div>))}
                <Button type="button" variant="outline" size="sm" onClick={() => setEditNewLocations(prev => [...prev, { name: "", location: "" }])} className="gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> Add Location</Button>
              </div>
              <Button onClick={handleSave} disabled={saving || !editName || (editClubLocations.length === 0 && editNewLocations.filter(l => l.name.trim() && l.location.trim()).length === 0)} className="w-full h-12 text-base font-semibold glow">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Club Dialog */}
      <Dialog open={showAddClub} onOpenChange={setShowAddClub}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Add Club / Partner</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">
            <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Name</Label><Input value={addClubName} onChange={(e) => setAddClubName(e.target.value)} placeholder="Enter club name" className="h-12 bg-secondary border-border" /></div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Logo</Label>
              <div onDragOver={(e) => { e.preventDefault(); setAddClubDragging(true); }} onDragLeave={() => setAddClubDragging(false)} onDrop={(e) => { e.preventDefault(); setAddClubDragging(false); const file = e.dataTransfer.files[0]; if (file) handleAddClubFileSelect(file); }} className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", addClubDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")} onClick={() => document.getElementById("add-club-logo-input")?.click()}>
                <input id="add-club-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddClubFileSelect(file); }} />
                {addClubLogoPreview ? (<div className="flex flex-col items-center gap-3"><div className="h-24 w-24 rounded-xl overflow-hidden bg-secondary"><img src={addClubLogoPreview} alt="Logo preview" className="h-full w-full object-contain" /></div><p className="text-xs text-muted-foreground">Click or drag to replace</p></div>) : (<div className="flex flex-col items-center gap-2 py-4"><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Pictures</Label>
              <div className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer border-border hover:border-muted-foreground/50" onClick={() => document.getElementById("add-club-pics-input")?.click()}>
                <input id="add-club-pics-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleAddClubPicSelect(e.target.files); e.target.value = ""; }} />
                <div className="flex flex-col items-center gap-2"><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">Add pictures</p></div>
              </div>
              {addClubPicPreviews.length > 0 && (<div className="grid grid-cols-4 gap-2 mt-3">{addClubPicPreviews.map((preview, i) => (<div key={i} className="relative rounded-lg overflow-hidden border border-border aspect-video"><img src={preview} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => { setAddClubPicFiles(prev => prev.filter((_, j) => j !== i)); setAddClubPicPreviews(prev => prev.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground"><X className="h-3 w-3" /></button></div>))}</div>)}
            </div>
            <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label><Textarea value={addClubDescription} onChange={(e) => setAddClubDescription(e.target.value)} className="bg-secondary border-border min-h-[100px]" placeholder="Brief description..." /></div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activities</Label>
              <div className="flex flex-wrap gap-2 mb-3">{addClubOfferings.map((o) => (<Badge key={o} variant="secondary" className="text-xs flex items-center gap-1 pr-1">{o}<button type="button" onClick={() => { setAddClubOfferings(prev => prev.filter(x => x !== o)); if (o.toLowerCase().includes("academy")) { if (!addClubOfferings.filter(x => x !== o).some(x => x.toLowerCase().includes("academy"))) setAddClubHasAcademy(false); } }} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"><X className="h-3 w-3" /></button></Badge>))}</div>
              <Select value="" onValueChange={(v) => { if (v === "__academy__") { setShowAcademySportPicker(true); return; } if (v && !addClubOfferings.includes(v)) setAddClubOfferings(prev => [...prev, v]); }}>
                <SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Select an activity..." /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">{offeringNames.filter(o => !addClubOfferings.includes(o)).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}<SelectItem value="__academy__" className="font-semibold text-primary"><span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academy</span></SelectItem></SelectContent>
              </Select>
              {showAcademySportPicker && (<div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2"><Label className="text-xs font-medium text-primary block">Choose Academy Sport</Label><div className="flex flex-wrap gap-2">{offeringNames.map(name => { const sportName = name.replace(/\s*(Court|Studio|Classes|Rental|\(Kids\))/gi, "").trim(); const academyLabel = `${sportName} Academy`; if (addClubOfferings.includes(academyLabel)) return null; return (<Button key={name} type="button" variant="outline" size="sm" onClick={() => { setAddClubOfferings(prev => [...prev, academyLabel]); setAddClubHasAcademy(true); setShowAcademySportPicker(false); }}>{sportName}</Button>); })}</div><Button type="button" variant="ghost" size="sm" onClick={() => setShowAcademySportPicker(false)} className="text-xs text-muted-foreground">Cancel</Button></div>)}
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Locations</Label>
              {addClubLocations.map((loc, i) => (<div key={i} className="flex gap-2 mb-2"><Input placeholder="Court/Location Name" value={loc.name} onChange={(e) => { const updated = [...addClubLocations]; updated[i].name = e.target.value; setAddClubLocations(updated); }} className="h-10 bg-secondary border-border" /><Select value={loc.location} onValueChange={(val) => { const updated = [...addClubLocations]; updated[i].location = val; setAddClubLocations(updated); }}><SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Select city" /></SelectTrigger><SelectContent className="bg-card border-border z-50 max-h-60">{locationsList.map(loc => (<SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent></Select><Button type="button" variant="ghost" size="icon" onClick={() => setAddClubLocations(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button></div>))}
              <Button type="button" variant="outline" size="sm" onClick={() => setAddClubLocations(prev => [...prev, { name: "", location: "" }])} className="gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> Add Location</Button>
            </div>
            <Button onClick={handleAddClub} disabled={addClubSaving || !addClubName.trim() || addClubLocations.filter(l => l.name.trim() && l.location.trim()).length === 0} className="w-full h-12 text-base font-semibold glow"><Building2 className="h-4 w-4 mr-2" />{addClubSaving ? "Adding..." : "Add Club"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Club Pictures Dialog */}
      <Dialog open={!!picturesClub} onOpenChange={(o) => !o && setPicturesClub(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl flex items-center gap-2"><Image className="h-5 w-5 text-primary" /> Pictures — {picturesClub?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handlePictureUpload(e.dataTransfer.files); }} onClick={() => document.getElementById("club-pics-input")?.click()} className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer border-border hover:border-muted-foreground/50">
              <input id="club-pics-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handlePictureUpload(e.target.files); e.target.value = ""; }} />
              <div className="flex flex-col items-center gap-2"><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm font-medium text-foreground">{picturesUploading ? "Uploading..." : "Drop images here or click to browse"}</p></div>
            </div>
            {picturesLoading ? (<p className="text-center text-muted-foreground py-4 text-sm">Loading...</p>) : clubPictures.length === 0 ? (<p className="text-center text-muted-foreground py-4 text-sm">No pictures yet.</p>) : (<div className="grid grid-cols-3 gap-3">{clubPictures.map((pic) => (<div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video"><img src={pic.image_url} alt="Club" className="w-full h-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><button onClick={(e) => { e.stopPropagation(); handleDeletePicture(pic); }} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all"><Trash2 className="h-4 w-4" /></button></div></div>))}</div>)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Offerings Dialog */}
      <Dialog open={showOfferingsDialog} onOpenChange={(o) => { setShowOfferingsDialog(o); if (!o) setOfferingsDialogMode("list"); }}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl flex items-center gap-2"><Image className="h-5 w-5 text-primary" /> {offeringsDialogMode === "list" ? "Activities" : offeringsDialogMode === "add" ? "Add Activity" : "Edit Activity"}</DialogTitle></DialogHeader>

          {offeringsDialogMode === "edit" ? (
            <div className="space-y-5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setOfferingsDialogMode("list"); setEditOfferingId(null); setEditOfferingLogoFile(null); setEditOfferingLogoPreview(null); }} className="gap-1 -ml-2 mb-1">← Back to list</Button>
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Name</Label><Input value={editOfferingName} onChange={(e) => { setEditOfferingName(e.target.value); setEditOfferingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="e.g. Basketball Court" className="h-12 bg-secondary border-border" /></div>
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug</Label><Input value={editOfferingSlug} onChange={(e) => setEditOfferingSlug(e.target.value)} placeholder="e.g. basketball" className="h-12 bg-secondary border-border" /><p className="text-xs text-muted-foreground mt-1">Auto-generated from name.</p></div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Image</Label>
                <div onDragOver={(e) => { e.preventDefault(); setEditOfferingDragging(true); }} onDragLeave={() => setEditOfferingDragging(false)} onDrop={(e) => { e.preventDefault(); setEditOfferingDragging(false); const file = e.dataTransfer.files[0]; if (file) handleEditOfferingFileSelect(file); }} className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", editOfferingDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")} onClick={() => document.getElementById("edit-offering-logo-input")?.click()}>
                  <input id="edit-offering-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleEditOfferingFileSelect(file); }} />
                  {editOfferingLogoPreview ? (<div className="flex flex-col items-center gap-3"><div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary"><img src={editOfferingLogoPreview} alt="Activity preview" className="h-full w-full object-cover" /></div><p className="text-xs text-muted-foreground">Click or drag to replace</p></div>) : (<div className="flex flex-col items-center gap-2 py-4"><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>)}
                </div>
              </div>
              <Button onClick={handleEditOfferingSave} disabled={editOfferingSaving || !editOfferingName.trim()} className="w-full h-12 text-base font-semibold glow">{editOfferingSaving ? "Saving..." : "Save Changes"}</Button>
            </div>
          ) : offeringsDialogMode === "list" ? (
            <div className="space-y-4 pt-2">
              {offerings.length === 0 ? (<p className="text-center text-muted-foreground py-8">No activities yet.</p>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{offerings.map((o) => (<div key={o.id} onClick={() => openEditOffering(o)} className="flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4 cursor-pointer hover:border-primary/50 hover:bg-secondary transition-all"><div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">{o.logo_url ? <img src={o.logo_url} alt={o.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Image className="h-6 w-6" /></div>}</div><div className="flex-1 min-w-0"><p className="font-medium text-foreground">{o.name}</p><p className="text-xs text-muted-foreground">{o.slug}</p></div><Pencil className="h-4 w-4 text-muted-foreground shrink-0" /></div>))}</div>)}
              <Button onClick={() => setOfferingsDialogMode("add")} className="w-full h-12 text-base font-semibold glow gap-2"><Image className="h-4 w-4" /> Add Activity</Button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setOfferingsDialogMode("list")} className="gap-1 -ml-2 mb-1">← Back to list</Button>
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Name</Label><Input value={addOfferingName} onChange={(e) => { setAddOfferingName(e.target.value); setAddOfferingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="e.g. Basketball Court" className="h-12 bg-secondary border-border" /></div>
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug (URL-friendly ID)</Label><Input value={addOfferingSlug} onChange={(e) => setAddOfferingSlug(e.target.value)} placeholder="e.g. basketball" className="h-12 bg-secondary border-border" /><p className="text-xs text-muted-foreground mt-1">Auto-generated from name.</p></div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activity Image</Label>
                <div onDragOver={(e) => { e.preventDefault(); setAddOfferingDragging(true); }} onDragLeave={() => setAddOfferingDragging(false)} onDrop={(e) => { e.preventDefault(); setAddOfferingDragging(false); const file = e.dataTransfer.files[0]; if (file) handleAddOfferingFileSelect(file); }} className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", addOfferingDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")} onClick={() => document.getElementById("add-offering-logo-input")?.click()}>
                  <input id="add-offering-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddOfferingFileSelect(file); }} />
                  {addOfferingLogoPreview ? (<div className="flex flex-col items-center gap-3"><div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary"><img src={addOfferingLogoPreview} alt="Activity preview" className="h-full w-full object-cover" /></div><p className="text-xs text-muted-foreground">Click or drag to replace</p></div>) : (<div className="flex flex-col items-center gap-2 py-4"><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>)}
                </div>
              </div>
              <Button onClick={handleAddOffering} disabled={addOfferingSaving || !addOfferingName.trim()} className="w-full h-12 text-base font-semibold glow"><Image className="h-4 w-4 mr-2" />{addOfferingSaving ? "Adding..." : "Add Activity"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ClubsTab;
