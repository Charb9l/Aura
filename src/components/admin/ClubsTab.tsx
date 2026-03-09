import { useState, useEffect, useMemo } from "react"; // admin clubs
import { motion } from "framer-motion";
import { Building2, Pencil, Trash2, Upload, X, Image, GraduationCap, MapPin, Plus, Search, Eye, EyeOff, Handshake } from "lucide-react";
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
import { ClubRow, OfferingRow, ClubActivityPrice } from "./types";
import { useLocations } from "@/hooks/useLocations";
import AdminFinderInput from "./AdminFinderInput";

/** Map offering name to booking activity slug */
const offeringToSlug = (name: string): string | null => {
  const lower = name.toLowerCase();
  if (lower.includes("academy")) return null;
  if (lower.includes("basketball")) return "basketball";
  if (lower.includes("tennis")) return "tennis";
  if (lower.includes("pilates")) return "pilates";
  if (lower.includes("yoga") || lower.includes("aerial")) return "aerial-yoga";
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

interface ClubLocationRow { id: string; club_id: string; name: string; location: string; activity: string | null; }
interface ClubPictureRow { id: string; club_id: string; image_url: string; display_order: number; }
interface AcademyPictureRow { id: string; club_id: string; image_url: string; picture_type: string; display_order: number; }

const DropZone = ({ id, dragging, setDragging, onFiles, uploading, hint, multiple }: {
  id: string; dragging: boolean; setDragging: (v: boolean) => void; onFiles: (files: FileList | File[]) => void; uploading: boolean; hint: string; multiple?: boolean;
}) => (
  <div
    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
    onDragLeave={() => setDragging(false)}
    onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
    onClick={() => document.getElementById(id)?.click()}
    className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")}
  >
    <input id={id} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }} />
    <div className="flex flex-col items-center gap-2">
      <Upload className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : hint}</p>
      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 10MB each</p>
    </div>
  </div>
);

// (ActivityLocationsEditor removed — locations are now per-club)
const ClubsTab = ({ isMasterAdmin }: { isMasterAdmin: boolean }) => {
  const { locations: locationsList } = useLocations();
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubSearch, setClubSearch] = useState("");
  const [academyOnly, setAcademyOnly] = useState(false);

  // Edit Club state
  const [editClub, setEditClub] = useState<ClubRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOfferings, setEditOfferings] = useState<string[]>([]);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editHasAcademy, setEditHasAcademy] = useState(false);
  const [editShowAcademySportPicker, setEditShowAcademySportPicker] = useState(false);
  // Club-level locations for edit
  const [editClubLocs, setEditClubLocs] = useState<{ id?: string; name: string; location: string }[]>([]);
  // Per-activity prices for edit: key = "slug" or "slug:half"/"slug:full"
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [allActivityPrices, setAllActivityPrices] = useState<ClubActivityPrice[]>([]);

  const [showAddClub, setShowAddClub] = useState(false);
  const [addClubName, setAddClubName] = useState("");
  const [addClubDescription, setAddClubDescription] = useState("");
  const [addClubOfferings, setAddClubOfferings] = useState<string[]>([]);
  const [addClubLogoFile, setAddClubLogoFile] = useState<File | null>(null);
  const [addClubLogoPreview, setAddClubLogoPreview] = useState<string | null>(null);
  const [addClubSaving, setAddClubSaving] = useState(false);
  const [addClubDragging, setAddClubDragging] = useState(false);
  const [addClubHasAcademy, setAddClubHasAcademy] = useState(false);
  const [showAcademySportPicker, setShowAcademySportPicker] = useState(false);
  // Club-level locations for add
  const [addClubLocs, setAddClubLocs] = useState<{ name: string; location: string }[]>([]);
  const [addClubPublished, setAddClubPublished] = useState(true);
  const [addPrices, setAddPrices] = useState<Record<string, string>>({});
  const [addClubPicFiles, setAddClubPicFiles] = useState<File[]>([]);
  const [addClubPicPreviews, setAddClubPicPreviews] = useState<string[]>([]);

  // Add Club — academy pictures
  const [addAcademyBubbleFile, setAddAcademyBubbleFile] = useState<File | null>(null);
  const [addAcademyBubblePreview, setAddAcademyBubblePreview] = useState<string | null>(null);
  const [addAcademyGalleryFiles, setAddAcademyGalleryFiles] = useState<File[]>([]);
  const [addAcademyGalleryPreviews, setAddAcademyGalleryPreviews] = useState<string[]>([]);
  const [addAcademyBubbleDragging, setAddAcademyBubbleDragging] = useState(false);
  const [addAcademyGalleryDragging, setAddAcademyGalleryDragging] = useState(false);

  // Shared state
  const [clubLocations, setClubLocations] = useState<ClubLocationRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);

  // Pictures Dialog state
  const [picturesClub, setPicturesClub] = useState<ClubRow | null>(null);
  const [clubPictures, setClubPictures] = useState<ClubPictureRow[]>([]);
  const [picAcademyBubble, setPicAcademyBubble] = useState<AcademyPictureRow | null>(null);
  const [picAcademyGallery, setPicAcademyGallery] = useState<AcademyPictureRow[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [picturesUploading, setPicturesUploading] = useState(false);
  const [academyPicUploading, setAcademyPicUploading] = useState(false);
  const [picBubbleDragging, setPicBubbleDragging] = useState(false);
  const [picGalleryDragging, setPicGalleryDragging] = useState(false);
  const [picLogoPreview, setPicLogoPreview] = useState<string | null>(null);
  const [picLogoFile, setPicLogoFile] = useState<File | null>(null);
  const [picLogoDragging, setPicLogoDragging] = useState(false);
  const [picLogoUploading, setPicLogoUploading] = useState(false);

  // Offerings Dialog state
  const [showOfferingsDialog, setShowOfferingsDialog] = useState(false);
  const [offeringsDialogMode, setOfferingsDialogMode] = useState<"list" | "add" | "edit">("list");
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
      const [clubsRes, offeringsRes, locRes, pricesRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("offerings").select("*").order("name"),
        supabase.from("club_locations").select("*").order("name"),
        supabase.from("club_activity_prices").select("*"),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as ClubRow[]);
      if (offeringsRes.data) setOfferings(offeringsRes.data as unknown as OfferingRow[]);
      if (locRes.data) setClubLocations(locRes.data as unknown as ClubLocationRow[]);
      if (pricesRes.data) setAllActivityPrices(pricesRes.data as unknown as ClubActivityPrice[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // ───── Edit Club ─────
  const openEdit = (club: ClubRow) => {
    setEditClub(club); setEditName(club.name); setEditDescription(club.description || "");
    setEditOfferings(club.offerings || []); setEditHasAcademy(club.has_academy || false);
    setEditShowAcademySportPicker(false);
    setEditLogoFile(null);
    setEditLogoPreview(club.logo_url?.startsWith("http") ? club.logo_url : null);
    // Build club-level locations from existing club_locations
    const locs = clubLocations.filter(l => l.club_id === club.id);
    // Deduplicate by name+location (legacy per-activity may have duplicates)
    const seen = new Set<string>();
    const uniqueLocs: { id?: string; name: string; location: string }[] = [];
    for (const l of locs) {
      const key = `${l.name}::${l.location}`;
      if (!seen.has(key)) { seen.add(key); uniqueLocs.push({ id: l.id, name: l.name, location: l.location }); }
    }
    setEditClubLocs(uniqueLocs);
    // Load prices for this club — key format: "slug" or "slug:label"
    const clubPrices = allActivityPrices.filter(p => p.club_id === club.id);
    const priceState: Record<string, string> = {};
    clubPrices.forEach(p => {
      const key = p.price_label ? `${p.activity_slug}:${p.price_label}` : p.activity_slug;
      priceState[key] = String(p.price);
    });
    setEditPrices(priceState);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setEditLogoFile(file); setEditLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!editClub) return;
    const validLocs = editClubLocs.filter(l => l.name.trim() && l.location.trim());
    if (validLocs.length === 0) { toast.error("Please add at least one location"); return; }

    setSaving(true);
    const { error } = await supabase.from("clubs").update({ name: editName, description: editDescription || null, logo_url: editClub.logo_url, offerings: editOfferings, has_academy: editHasAcademy }).eq("id", editClub.id);

    // Delete removed locations
    const existingIds = validLocs.filter(l => l.id).map(l => l.id!);
    const originalIds = clubLocations.filter(l => l.club_id === editClub.id).map(l => l.id);
    const deletedIds = originalIds.filter(id => !existingIds.includes(id));
    if (deletedIds.length > 0) {
      await supabase.from("club_locations").delete().in("id", deletedIds);
      setClubLocations(prev => prev.filter(l => !deletedIds.includes(l.id)));
    }

    // Insert new locations (no activity field)
    const newLocs = validLocs.filter(l => !l.id);
    if (newLocs.length > 0) {
      const locsToInsert = newLocs.map(l => ({ club_id: editClub.id, name: l.name.trim(), location: l.location.trim() }));
      const { data: insertedLocs } = await supabase.from("club_locations").insert(locsToInsert).select();
      if (insertedLocs) setClubLocations(prev => [...prev, ...(insertedLocs as unknown as ClubLocationRow[])]);
    }

    // Save prices — per activity (no location_id)
    await supabase.from("club_activity_prices").delete().eq("club_id", editClub.id);
    const priceRows = Object.entries(editPrices)
      .filter(([, val]) => val && Number(val) > 0)
      .map(([key, val]) => {
        const parts = key.split(":");
        const slug = parts[0];
        const label = parts[1] || null;
        return {
          club_id: editClub.id,
          activity_slug: slug,
          price: Number(val),
          price_label: label,
          location_id: null,
        };
      });
    if (priceRows.length > 0) {
      await supabase.from("club_activity_prices").insert(priceRows as any);
    }
    setAllActivityPrices(prev => [...prev.filter(p => p.club_id !== editClub.id), ...priceRows.map((r, i) => ({ ...r, id: `temp-${i}`, created_at: new Date().toISOString() }))] as ClubActivityPrice[]);

    setSaving(false);
    if (error) { toast.error("Failed to update club: " + error.message); }
    else { toast.success("Club updated successfully"); setClubs(prev => prev.map(c => c.id === editClub.id ? { ...c, name: editName, description: editDescription || null, logo_url: editClub.logo_url, offerings: editOfferings, has_academy: editHasAcademy } : c)); setEditClub(null); }
  };

  const getLogoSrc = (club: ClubRow) => club.logo_url?.startsWith("http") ? club.logo_url : null;

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to delete "${clubName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    if (error) toast.error("Failed to delete club: " + error.message);
    else { toast.success(`"${clubName}" deleted`); setClubs(prev => prev.filter(c => c.id !== clubId)); }
  };

  const handleTogglePublish = async (club: ClubRow) => {
    const newVal = !club.published;
    const { error } = await supabase.from("clubs").update({ published: newVal }).eq("id", club.id);
    if (error) { toast.error("Failed to update: " + error.message); return; }
    setClubs(prev => prev.map(c => c.id === club.id ? { ...c, published: newVal } : c));
    toast.success(`"${club.name}" ${newVal ? "published" : "unpublished"}`);
  };

  // ───── Add Club ─────
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

  const uploadAcademyPicture = async (clubId: string, file: File, type: "bubble" | "carousel", order: number): Promise<AcademyPictureRow | null> => {
    if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10MB)`); return null; }
    const id = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${clubId}/${type}/${id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("academy-pictures").upload(filePath, file, { cacheControl: "3600" });
    if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); return null; }
    const { data: urlData } = supabase.storage.from("academy-pictures").getPublicUrl(filePath);
    const { data: newPic, error: dbError } = await supabase
      .from("academy_pictures")
      .insert({ club_id: clubId, image_url: urlData.publicUrl, picture_type: type, display_order: order } as any)
      .select().single();
    if (dbError) { toast.error(`Save failed: ${dbError.message}`); return null; }
    return newPic as unknown as AcademyPictureRow;
  };

  const deleteAcademyPicture = async (pic: AcademyPictureRow) => {
    const urlParts = pic.image_url.split("/academy-pictures/");
    if (urlParts[1]) {
      const storagePath = urlParts[1].split("?")[0];
      await supabase.storage.from("academy-pictures").remove([storagePath]);
    }
    await supabase.from("academy_pictures").delete().eq("id", pic.id);
  };

  const handleAddClub = async () => {
    if (!addClubName.trim()) { toast.error("Please enter a club name"); return; }
    const validLocs = addClubLocs.filter(l => l.name.trim() && l.location.trim());
    if (addClubOfferings.length > 0 && validLocs.length === 0) {
      toast.error("Please add at least one location");
      return;
    }

    setAddClubSaving(true);
    const { data: newClub, error: insertError } = await supabase.from("clubs").insert({ name: addClubName.trim(), description: addClubDescription.trim() || null, offerings: addClubOfferings, has_academy: addClubHasAcademy, published: addClubPublished }).select().single();
    if (insertError || !newClub) { toast.error("Failed to add club: " + (insertError?.message || "Unknown error")); setAddClubSaving(false); return; }
    let logoUrl: string | null = null;
    if (addClubLogoFile) {
      const ext = addClubLogoFile.name.split(".").pop() || "png";
      const filePath = `${(newClub as any).id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-logos").upload(filePath, addClubLogoFile, { upsert: true, cacheControl: "0" });
      if (!uploadError) { const { data: urlData } = supabase.storage.from("club-logos").getPublicUrl(filePath); logoUrl = `${urlData.publicUrl}?t=${Date.now()}`; await supabase.from("clubs").update({ logo_url: logoUrl }).eq("id", (newClub as any).id); }
    }
    // Insert club locations (no activity field)
    if (validLocs.length > 0) {
      const locsToInsert = validLocs.map(l => ({ club_id: (newClub as any).id, name: l.name.trim(), location: l.location.trim() }));
      const { data: newLocs } = await supabase.from("club_locations").insert(locsToInsert).select();
      if (newLocs) setClubLocations(prev => [...prev, ...(newLocs as unknown as ClubLocationRow[])]);
    }
    if (addClubPicFiles.length > 0) await uploadClubPictures((newClub as any).id, addClubPicFiles);
    if (addClubHasAcademy) {
      const clubId = (newClub as any).id;
      if (addAcademyBubbleFile) await uploadAcademyPicture(clubId, addAcademyBubbleFile, "bubble", 0);
      for (let i = 0; i < addAcademyGalleryFiles.length; i++) {
        await uploadAcademyPicture(clubId, addAcademyGalleryFiles[i], "carousel", i);
      }
    }
    // Save activity prices (per activity, no location_id)
    const newClubId = (newClub as any).id;
    const priceRows = Object.entries(addPrices)
      .filter(([, val]) => val && Number(val) > 0)
      .map(([key, val]) => {
        const parts = key.split(":");
        const slug = parts[0];
        const label = parts[1] || null;
        return { club_id: newClubId, activity_slug: slug, price: Number(val), price_label: label, location_id: null };
      });
    if (priceRows.length > 0) {
      await supabase.from("club_activity_prices").insert(priceRows as any);
      setAllActivityPrices(prev => [...prev, ...priceRows.map((r, i) => ({ ...r, id: `temp-add-${i}`, created_at: new Date().toISOString() }))] as ClubActivityPrice[]);
    }
    setAddClubSaving(false);
    toast.success(`Club "${addClubName.trim()}" added successfully`);
    setClubs(prev => [...prev, { ...newClub as unknown as ClubRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddClub(false); setAddClubName(""); setAddClubDescription(""); setAddClubOfferings([]); setAddClubHasAcademy(false); setAddClubPublished(true);
    setAddClubLogoFile(null); setAddClubLogoPreview(null); setAddClubLocs([]); setShowAcademySportPicker(false);
    setAddClubPicFiles([]); setAddClubPicPreviews([]);
    setAddAcademyBubbleFile(null); setAddAcademyBubblePreview(null);
    setAddAcademyGalleryFiles([]); setAddAcademyGalleryPreviews([]);
    setAddPrices({});
  };

  const handleAddClubPicSelect = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    setAddClubPicFiles(prev => [...prev, ...fileArr]);
    setAddClubPicPreviews(prev => [...prev, ...fileArr.map(f => URL.createObjectURL(f))]);
  };

  // ───── Pictures Dialog ─────
  const openPictures = async (club: ClubRow) => {
    setPicturesClub(club); setPicturesLoading(true);
    setPicAcademyBubble(null); setPicAcademyGallery([]);
    setPicLogoPreview(club.logo_url?.startsWith("http") ? club.logo_url : null);
    setPicLogoFile(null);
    const clubPicsPromise = supabase.from("club_pictures").select("*").eq("club_id", club.id).order("display_order");
    const academyPicsPromise = club.has_academy
      ? supabase.from("academy_pictures").select("*").eq("club_id", club.id).order("display_order")
      : null;
    const [clubPicsRes, academyPicsRes] = await Promise.all([clubPicsPromise, academyPicsPromise]);
    setClubPictures((clubPicsRes.data as unknown as ClubPictureRow[]) || []);
    if (academyPicsRes?.data) {
      const pics = academyPicsRes.data as unknown as AcademyPictureRow[];
      setPicAcademyBubble(pics.find(p => p.picture_type === "bubble") || null);
      setPicAcademyGallery(pics.filter(p => p.picture_type === "carousel"));
    }
    setPicturesLoading(false);
  };

  const handlePicLogoUpload = async (files: FileList | File[]) => {
    if (!picturesClub) return;
    const file = Array.from(files).find(f => f.type.startsWith("image/"));
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setPicLogoUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const filePath = `${picturesClub.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("club-logos").upload(filePath, file, { upsert: true, cacheControl: "0" });
    if (uploadError) { toast.error("Logo upload failed: " + uploadError.message); setPicLogoUploading(false); return; }
    const { data: urlData } = supabase.storage.from("club-logos").getPublicUrl(filePath);
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("clubs").update({ logo_url: logoUrl }).eq("id", picturesClub.id);
    setPicLogoPreview(logoUrl);
    setClubs(prev => prev.map(c => c.id === picturesClub.id ? { ...c, logo_url: logoUrl } : c));
    setPicLogoUploading(false);
    toast.success("Logo updated");
  };

  const handleDeleteLogo = async () => {
    if (!picturesClub || !confirm("Remove the club logo?")) return;
    const logoUrl = picturesClub.logo_url;
    if (logoUrl) {
      const urlParts = logoUrl.split("/club-logos/");
      if (urlParts[1]) {
        const storagePath = urlParts[1].split("?")[0];
        await supabase.storage.from("club-logos").remove([storagePath]);
      }
    }
    await supabase.from("clubs").update({ logo_url: null }).eq("id", picturesClub.id);
    setPicLogoPreview(null);
    setClubs(prev => prev.map(c => c.id === picturesClub.id ? { ...c, logo_url: null } : c));
    toast.success("Logo removed");
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

  const handlePicAcademyBubbleUpload = async (files: FileList | File[]) => {
    if (!picturesClub) return;
    const file = Array.from(files).find(f => f.type.startsWith("image/"));
    if (!file) return;
    if (picAcademyBubble) { toast.error("Remove the existing bubble image first"); return; }
    setAcademyPicUploading(true);
    const newPic = await uploadAcademyPicture(picturesClub.id, file, "bubble", 0);
    if (newPic) { setPicAcademyBubble(newPic); toast.success("Bubble image uploaded"); }
    setAcademyPicUploading(false);
  };

  const handlePicAcademyGalleryUpload = async (files: FileList | File[]) => {
    if (!picturesClub) return;
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!fileArr.length) return;
    setAcademyPicUploading(true);
    for (let i = 0; i < fileArr.length; i++) {
      const newPic = await uploadAcademyPicture(picturesClub.id, fileArr[i], "carousel", picAcademyGallery.length + i);
      if (newPic) setPicAcademyGallery(prev => [...prev, newPic]);
    }
    toast.success(`${fileArr.length} gallery image(s) uploaded`);
    setAcademyPicUploading(false);
  };

  const handleDeleteAcademyPic = async (pic: AcademyPictureRow) => {
    if (!confirm("Remove this picture?")) return;
    await deleteAcademyPicture(pic);
    if (pic.picture_type === "bubble") setPicAcademyBubble(null);
    else setPicAcademyGallery(prev => prev.filter(p => p.id !== pic.id));
    toast.success("Picture removed");
  };

  // ───── Offerings ─────
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
    setOfferingsDialogMode("list"); setAddOfferingName(""); setAddOfferingSlug(""); setAddOfferingLogoFile(null); setAddOfferingLogoPreview(null);
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

  // ───── Academy pictures section for Add Club dialog ─────
  const renderAddAcademyPicturesSection = () => (
    <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold text-primary">Academy Pictures</Label>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
          Bubble Image <span className="text-xs opacity-70">(shown on the academy card — 1 image)</span>
        </Label>
        {addAcademyBubblePreview ? (
          <div className="group relative rounded-lg overflow-hidden border border-border bg-card w-40 aspect-video">
            <img src={addAcademyBubblePreview} alt="Bubble" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => { setAddAcademyBubbleFile(null); setAddAcademyBubblePreview(null); }} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ) : (
          <DropZone id="add-academy-bubble-drop" dragging={addAcademyBubbleDragging} setDragging={setAddAcademyBubbleDragging}
            onFiles={(files) => { const file = Array.from(files)[0]; if (file?.type.startsWith("image/")) { setAddAcademyBubbleFile(file); setAddAcademyBubblePreview(URL.createObjectURL(file)); } }}
            uploading={false} hint="Drop 1 image for the academy card" />
        )}
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
          Gallery Images <span className="text-xs opacity-70">(shown when customer clicks the academy)</span>
        </Label>
        <DropZone id="add-academy-gallery-drop" dragging={addAcademyGalleryDragging} setDragging={setAddAcademyGalleryDragging}
          onFiles={(files) => { const fileArr = Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024); setAddAcademyGalleryFiles(prev => [...prev, ...fileArr]); setAddAcademyGalleryPreviews(prev => [...prev, ...fileArr.map(f => URL.createObjectURL(f))]); }}
          uploading={false} hint="Drop images for the academy gallery" multiple />
        {addAcademyGalleryPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {addAcademyGalleryPreviews.map((preview, i) => (
              <div key={`new-${i}`} className="relative rounded-lg overflow-hidden border border-primary/30 bg-card aspect-video">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setAddAcademyGalleryFiles(prev => prev.filter((_, j) => j !== i)); setAddAcademyGalleryPreviews(prev => prev.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Helper: count total locations for add dialog
  const addTotalLocations = addClubLocs.filter(l => l.name.trim() && l.location.trim()).length;

  // ───── Render ─────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="clubs">
      <div className="flex items-center justify-between mb-4">
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
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <AdminFinderInput value={clubSearch} onChange={setClubSearch} placeholder="Search clubs..." className="max-w-xs" suggestions={clubs.map(c => ({ label: c.name, sub: c.has_academy ? "Academy" : undefined }))} />
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
          <input type="checkbox" checked={academyOnly} onChange={(e) => setAcademyOnly(e.target.checked)} className="rounded border-border" />
          Academy clubs only
        </label>
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
              ) : (() => {
                const q = clubSearch.toLowerCase();
                const filtered = clubs.filter(c => (!q || c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)) && (!academyOnly || c.has_academy)).sort((a, b) => a.name.localeCompare(b.name));
                return filtered.length === 0 ? (
                <TableRow><TableCell colSpan={isMasterAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">{clubSearch || academyOnly ? "No clubs match your filters." : "No clubs yet."}</TableCell></TableRow>
              ) : filtered.map((club) => {
                const logoSrc = getLogoSrc(club);
                return (
                  <TableRow key={club.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {logoSrc && <div className="h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0"><img src={logoSrc} alt={club.name} className="h-full w-full object-contain" /></div>}
                        <span className="font-medium">{club.name}</span>
                        {club.has_academy && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">Academy</Badge>}
                        {!club.published && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">Unpublished</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs">{club.description || "—"}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{club.offerings.map((o) => <Badge key={o} variant="secondary" className="text-xs">{o}</Badge>)}</div></TableCell>
                    {isMasterAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleTogglePublish(club)} title={club.published ? "Unpublish" : "Publish"} className={cn(!club.published && "text-destructive hover:text-destructive")}>{club.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(club)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openPictures(club)} title="Pictures"><Image className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClub(club.id, club.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              }); })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══ Edit Club Dialog ═══ */}
      <Dialog open={!!editClub} onOpenChange={(o) => !o && setEditClub(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Edit Club</DialogTitle></DialogHeader>
          {editClub && (
            <div className="space-y-5 pt-2">
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-secondary border-border" /></div>
              <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="bg-secondary border-border min-h-[100px]" placeholder="Brief description..." /></div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activities</Label>
                <div className="flex flex-wrap gap-2 mb-3">{editOfferings.map((o) => (<Badge key={o} variant="secondary" className="text-xs flex items-center gap-1 pr-1">{o}<button type="button" onClick={() => { setEditOfferings(prev => prev.filter(x => x !== o)); if (o.toLowerCase().includes("academy")) { if (!editOfferings.filter(x => x !== o).some(x => x.toLowerCase().includes("academy"))) setEditHasAcademy(false); } }} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"><X className="h-3 w-3" /></button></Badge>))}</div>
                <Select value="" onValueChange={(v) => { if (v === "__academy__") { setEditShowAcademySportPicker(true); return; } if (v && !editOfferings.includes(v)) { setEditOfferings(prev => [...prev, v]); } }}>
                  <SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Select an activity..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">{offeringNames.filter(o => !editOfferings.includes(o)).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}<SelectItem value="__academy__" className="font-semibold text-primary"><span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academy</span></SelectItem></SelectContent>
                </Select>
                {editShowAcademySportPicker && (<div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2"><Label className="text-xs font-medium text-primary block">Choose Academy Sport</Label><div className="flex flex-wrap gap-2">{offeringNames.map(name => { const sportName = name.replace(/\s*(Court|Studio|Classes|Rental|\(Kids\))/gi, "").trim(); const academyLabel = `${sportName} Academy`; if (editOfferings.includes(academyLabel)) return null; return (<Button key={name} type="button" variant="outline" size="sm" onClick={() => { setEditOfferings(prev => [...prev, academyLabel]); setEditHasAcademy(true); setEditShowAcademySportPicker(false); }}>{sportName}</Button>); })}</div><Button type="button" variant="ghost" size="sm" onClick={() => setEditShowAcademySportPicker(false)} className="text-xs text-muted-foreground">Cancel</Button></div>)}
              </div>

              {/* Club Locations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground block">Club Locations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditClubLocs(prev => [...prev, { name: "", location: "" }])} className="gap-1 text-xs h-7">
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                {editClubLocs.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No locations. Click "Add" to create one.</p>}
                {editClubLocs.map((loc, i) => (
                  <div key={loc.id || `new-${i}`} className="flex gap-2">
                    <Input placeholder="Location name" value={loc.name} onChange={(e) => setEditClubLocs(prev => { const u = [...prev]; u[i] = { ...u[i], name: e.target.value }; return u; })} className="h-9 bg-background border-border text-sm flex-1" disabled={!!loc.id} />
                    <Select value={loc.location} onValueChange={(val) => setEditClubLocs(prev => { const u = [...prev]; u[i] = { ...u[i], location: val }; return u; })}>
                      <SelectTrigger className="h-9 bg-background border-border text-sm w-[160px]" disabled={!!loc.id}><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent className="bg-card border-border z-50 max-h-60">{locationsList.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditClubLocs(prev => { const u = [...prev]; u.splice(i, 1); return u; })} className="shrink-0 text-destructive hover:text-destructive h-9 w-9"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>

              {/* ── Pricing per Activity ── */}
              {editOfferings.filter(o => offeringToSlug(o)).length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground block">Activity Pricing ($)</Label>
                  {editOfferings.map(activity => {
                    const slug = offeringToSlug(activity);
                    if (!slug) return null;
                    const isBasketball = slug === "basketball";
                    return (
                      <div key={`price-${activity}`} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                        <Label className="text-xs font-semibold">{activity}</Label>
                        {isBasketball ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Half Court</Label>
                              <Input type="number" min="0" step="0.01" placeholder="0.00" value={editPrices[`${slug}:half`] || ""} onChange={(e) => setEditPrices(prev => ({ ...prev, [`${slug}:half`]: e.target.value }))} className="h-8 bg-background border-border text-sm" />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Full Court</Label>
                              <Input type="number" min="0" step="0.01" placeholder="0.00" value={editPrices[`${slug}:full`] || ""} onChange={(e) => setEditPrices(prev => ({ ...prev, [`${slug}:full`]: e.target.value }))} className="h-8 bg-background border-border text-sm" />
                            </div>
                          </div>
                        ) : (
                          <Input type="number" min="0" step="0.01" placeholder="0.00" value={editPrices[slug] || ""} onChange={(e) => setEditPrices(prev => ({ ...prev, [slug]: e.target.value }))} className="h-8 bg-background border-border text-sm max-w-[180px]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Button onClick={handleSave} disabled={saving || !editName} className="w-full h-12 text-base font-semibold glow">{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Add Club Dialog — Order: Name, Description, Activities + Locations, THEN Pictures ═══ */}
      <Dialog open={showAddClub} onOpenChange={setShowAddClub}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Add Club / Partner</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Published checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={addClubPublished} onChange={(e) => setAddClubPublished(e.target.checked)} className="rounded border-border h-4 w-4" />
              <span className="text-sm font-medium text-foreground">Published</span>
              <span className="text-xs text-muted-foreground">(visible to customers)</span>
            </label>
            {/* 1. Name */}
            <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Name</Label><Input value={addClubName} onChange={(e) => setAddClubName(e.target.value)} placeholder="Enter club name" className="h-12 bg-secondary border-border" /></div>

            {/* 2. Description */}
            <div><Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label><Textarea value={addClubDescription} onChange={(e) => setAddClubDescription(e.target.value)} className="bg-secondary border-border min-h-[100px]" placeholder="Brief description..." /></div>

            {/* 3. Activities */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Activities</Label>
              <div className="flex flex-wrap gap-2 mb-3">{addClubOfferings.map((o) => (<Badge key={o} variant="secondary" className="text-xs flex items-center gap-1 pr-1">{o}<button type="button" onClick={() => { setAddClubOfferings(prev => prev.filter(x => x !== o)); if (o.toLowerCase().includes("academy")) { if (!addClubOfferings.filter(x => x !== o).some(x => x.toLowerCase().includes("academy"))) { setAddClubHasAcademy(false); } } }} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"><X className="h-3 w-3" /></button></Badge>))}</div>
              <Select value="" onValueChange={(v) => { if (v === "__academy__") { setShowAcademySportPicker(true); return; } if (v && !addClubOfferings.includes(v)) { setAddClubOfferings(prev => [...prev, v]); } }}>
                <SelectTrigger className="h-10 bg-secondary border-border"><SelectValue placeholder="Select an activity..." /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">{offeringNames.filter(o => !addClubOfferings.includes(o)).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}<SelectItem value="__academy__" className="font-semibold text-primary"><span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academy</span></SelectItem></SelectContent>
              </Select>
              {showAcademySportPicker && (<div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2"><Label className="text-xs font-medium text-primary block">Choose Academy Sport</Label><div className="flex flex-wrap gap-2">{offeringNames.map(name => { const sportName = name.replace(/\s*(Court|Studio|Classes|Rental|\(Kids\))/gi, "").trim(); const academyLabel = `${sportName} Academy`; if (addClubOfferings.includes(academyLabel)) return null; return (<Button key={name} type="button" variant="outline" size="sm" onClick={() => { setAddClubOfferings(prev => [...prev, academyLabel]); setAddClubHasAcademy(true); setShowAcademySportPicker(false); }}>{sportName}</Button>); })}</div><Button type="button" variant="ghost" size="sm" onClick={() => setShowAcademySportPicker(false)} className="text-xs text-muted-foreground">Cancel</Button></div>)}
            </div>

            {/* 4. Club Locations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground block">Club Locations</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setAddClubLocs(prev => [...prev, { name: "", location: "" }])} className="gap-1 text-xs h-7">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {addClubLocs.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No locations. Click "Add" to create one.</p>}
              {addClubLocs.map((loc, i) => (
                <div key={`add-loc-${i}`} className="flex gap-2">
                  <Input placeholder="Location name" value={loc.name} onChange={(e) => setAddClubLocs(prev => { const u = [...prev]; u[i] = { ...u[i], name: e.target.value }; return u; })} className="h-9 bg-background border-border text-sm flex-1" />
                  <Select value={loc.location} onValueChange={(val) => setAddClubLocs(prev => { const u = [...prev]; u[i] = { ...u[i], location: val }; return u; })}>
                    <SelectTrigger className="h-9 bg-background border-border text-sm w-[160px]"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="bg-card border-border z-50 max-h-60">{locationsList.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setAddClubLocs(prev => { const u = [...prev]; u.splice(i, 1); return u; })} className="shrink-0 text-destructive hover:text-destructive h-9 w-9"><X className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>

            {/* Pricing per Activity */}
            {addClubOfferings.filter(o => offeringToSlug(o)).length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground block">Activity Pricing ($)</Label>
                {addClubOfferings.map(activity => {
                  const slug = offeringToSlug(activity);
                  if (!slug) return null;
                  const isBasketball = slug === "basketball";
                  return (
                    <div key={`add-price-${activity}`} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                      <Label className="text-xs font-semibold">{activity}</Label>
                      {isBasketball ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Half Court</Label>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" value={addPrices[`${slug}:half`] || ""} onChange={(e) => setAddPrices(prev => ({ ...prev, [`${slug}:half`]: e.target.value }))} className="h-8 bg-background border-border text-sm" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Full Court</Label>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" value={addPrices[`${slug}:full`] || ""} onChange={(e) => setAddPrices(prev => ({ ...prev, [`${slug}:full`]: e.target.value }))} className="h-8 bg-background border-border text-sm" />
                          </div>
                        </div>
                      ) : (
                        <Input type="number" min="0" step="0.01" placeholder="0.00" value={addPrices[slug] || ""} onChange={(e) => setAddPrices(prev => ({ ...prev, [slug]: e.target.value }))} className="h-8 bg-background border-border text-sm max-w-[180px]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. Pictures section — LAST */}
            <div className="border-t border-border pt-5 space-y-5">
              <Label className="text-sm font-medium text-muted-foreground block">Pictures</Label>

              {/* Club Logo */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Club Logo</Label>
                <div onDragOver={(e) => { e.preventDefault(); setAddClubDragging(true); }} onDragLeave={() => setAddClubDragging(false)} onDrop={(e) => { e.preventDefault(); setAddClubDragging(false); const file = e.dataTransfer.files[0]; if (file) handleAddClubFileSelect(file); }} className={cn("relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer", addClubDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")} onClick={() => document.getElementById("add-club-logo-input")?.click()}>
                  <input id="add-club-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddClubFileSelect(file); }} />
                  {addClubLogoPreview ? (<div className="flex flex-col items-center gap-3"><div className="h-24 w-24 rounded-xl overflow-hidden bg-secondary"><img src={addClubLogoPreview} alt="Logo preview" className="h-full w-full object-contain" /></div><p className="text-xs text-muted-foreground">Click or drag to replace</p></div>) : (<div className="flex flex-col items-center gap-2 py-4"><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>)}
                </div>
              </div>

              {/* Club Pictures */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Club Pictures</Label>
                <div className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer border-border hover:border-muted-foreground/50" onClick={() => document.getElementById("add-club-pics-input")?.click()}>
                  <input id="add-club-pics-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleAddClubPicSelect(e.target.files); e.target.value = ""; }} />
                  <div className="flex flex-col items-center gap-2"><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">Add pictures</p></div>
                </div>
                {addClubPicPreviews.length > 0 && (<div className="grid grid-cols-4 gap-2 mt-3">{addClubPicPreviews.map((preview, i) => (<div key={i} className="relative rounded-lg overflow-hidden border border-border aspect-video"><img src={preview} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => { setAddClubPicFiles(prev => prev.filter((_, j) => j !== i)); setAddClubPicPreviews(prev => prev.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground"><X className="h-3 w-3" /></button></div>))}</div>)}
              </div>

              {/* Academy Pictures (if academy activity selected) */}
              {addClubHasAcademy && renderAddAcademyPicturesSection()}
            </div>

            <Button onClick={handleAddClub} disabled={addClubSaving || !addClubName.trim()} className="w-full h-12 text-base font-semibold glow"><Building2 className="h-4 w-4 mr-2" />{addClubSaving ? "Adding..." : "Add Club"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Pictures Dialog (Club + Academy) ═══ */}
      <Dialog open={!!picturesClub} onOpenChange={(o) => !o && setPicturesClub(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl flex items-center gap-2"><Image className="h-5 w-5 text-primary" /> Pictures — {picturesClub?.name}</DialogTitle></DialogHeader>

          {picturesLoading ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
          ) : (
            <div className="space-y-8 pt-2">
              {/* Club Logo */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Club Logo
                </Label>
                {picLogoPreview ? (
                  <div className="group relative rounded-xl overflow-hidden border border-border bg-card w-28 h-28">
                    <img src={picLogoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button onClick={() => document.getElementById("pic-logo-input")?.click()} className="rounded-full bg-secondary p-2 text-foreground shadow-lg hover:bg-secondary/80"><Pencil className="h-4 w-4" /></button>
                      <button onClick={handleDeleteLogo} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <input id="pic-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) handlePicLogoUpload(e.target.files); e.target.value = ""; }} />
                  </div>
                ) : (
                  <DropZone id="pic-logo-drop" dragging={picLogoDragging} setDragging={setPicLogoDragging}
                    onFiles={handlePicLogoUpload} uploading={picLogoUploading} hint="Drop or click to upload club logo" />
                )}
              </div>

              {/* Club Images */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Club Images
                  <span className="text-xs font-normal text-muted-foreground ml-1">(shown when customers click on this club)</span>
                </Label>
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handlePictureUpload(e.dataTransfer.files); }} onClick={() => document.getElementById("club-pics-input")?.click()} className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer border-border hover:border-muted-foreground/50">
                  <input id="club-pics-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handlePictureUpload(e.target.files); e.target.value = ""; }} />
                  <div className="flex flex-col items-center gap-2"><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm font-medium text-foreground">{picturesUploading ? "Uploading..." : "Drop images here or click to browse"}</p><p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 10MB each</p></div>
                </div>
                {clubPictures.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">No club pictures yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {clubPictures.map((pic) => (
                      <div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                        <img src={pic.image_url} alt="Club" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePicture(pic); }} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Academy Images */}
              {picturesClub?.has_academy && (
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold text-primary">Academy Pictures</Label>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Bubble Image <span className="text-xs opacity-70">(shown on the academy card — 1 image)</span>
                    </Label>
                    {picAcademyBubble ? (
                      <div className="group relative rounded-lg overflow-hidden border border-border bg-card w-40 aspect-video">
                        <img src={picAcademyBubble.image_url} alt="Bubble" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button onClick={() => handleDeleteAcademyPic(picAcademyBubble)} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <DropZone id="pic-academy-bubble-drop" dragging={picBubbleDragging} setDragging={setPicBubbleDragging}
                        onFiles={handlePicAcademyBubbleUpload} uploading={academyPicUploading} hint="Drop 1 image for the academy card" />
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Gallery Images <span className="text-xs opacity-70">(shown when customer clicks the academy + carousel strip)</span>
                    </Label>
                    <DropZone id="pic-academy-gallery-drop" dragging={picGalleryDragging} setDragging={setPicGalleryDragging}
                      onFiles={handlePicAcademyGalleryUpload} uploading={academyPicUploading} hint="Drop images for the academy gallery" multiple />
                    {picAcademyGallery.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {picAcademyGallery.map(pic => (
                          <div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                            <img src={pic.image_url} alt="Gallery" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button onClick={() => handleDeleteAcademyPic(pic)} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Offerings Dialog ═══ */}
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
