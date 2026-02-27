import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Upload, Trash2, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  has_academy: boolean;
}

interface AcademyPicture {
  id: string;
  club_id: string;
  image_url: string;
  picture_type: string;
  display_order: number;
}

const AcademiesTab = () => {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [pictures, setPictures] = useState<AcademyPicture[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClubId, setEditClubId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draggingBubble, setDraggingBubble] = useState(false);
  const [draggingCarousel, setDraggingCarousel] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, picsRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("academy_pictures").select("*").order("display_order"),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as ClubRow[]);
      if (picsRes.data) setPictures(picsRes.data as unknown as AcademyPicture[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Only clubs that have an "Academy" activity
  const academyClubs = useMemo(() => {
    return clubs.filter(c =>
      c.offerings.some(o => o.toLowerCase().includes("academy"))
    );
  }, [clubs]);

  const clubPictures = (clubId: string, type: string) =>
    pictures.filter(p => p.club_id === clubId && p.picture_type === type);

  const handleUpload = async (clubId: string, type: "bubble" | "carousel", files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!fileArr.length) { toast.error("Please upload image files"); return; }

    // For bubble, only allow 1 image
    if (type === "bubble") {
      const existing = clubPictures(clubId, "bubble");
      if (existing.length > 0) {
        toast.error("Remove the existing bubble image first before uploading a new one");
        return;
      }
      if (fileArr.length > 1) {
        toast.error("Only 1 bubble image allowed");
        return;
      }
    }

    setUploading(true);
    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10MB)`); continue; }
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${clubId}/${type}/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("academy-pictures").upload(filePath, file, { cacheControl: "3600" });
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }
      const { data: urlData } = supabase.storage.from("academy-pictures").getPublicUrl(filePath);
      const { data: newPic, error: dbError } = await supabase
        .from("academy_pictures")
        .insert({
          club_id: clubId,
          image_url: urlData.publicUrl,
          picture_type: type,
          display_order: pictures.filter(p => p.club_id === clubId && p.picture_type === type).length,
        } as any)
        .select()
        .single();
      if (dbError) { toast.error(`Save failed: ${dbError.message}`); continue; }
      if (newPic) setPictures(prev => [...prev, newPic as unknown as AcademyPicture]);
    }
    toast.success(`Picture(s) uploaded`);
    setUploading(false);
  };

  const handleDelete = async (pic: AcademyPicture) => {
    if (!confirm("Remove this picture?")) return;
    // Extract path from URL
    const urlParts = pic.image_url.split("/academy-pictures/");
    if (urlParts[1]) {
      const storagePath = urlParts[1].split("?")[0];
      await supabase.storage.from("academy-pictures").remove([storagePath]);
    }
    await supabase.from("academy_pictures").delete().eq("id", pic.id);
    setPictures(prev => prev.filter(p => p.id !== pic.id));
    toast.success("Picture removed");
  };

  const editClub = academyClubs.find(c => c.id === editClubId);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="academies">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Academies</h1>
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="academies">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Academies</h1>
        <p className="text-muted-foreground">Manage academy pictures for clubs that have the "Academy" activity.</p>
      </div>

      {academyClubs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No clubs with Academy activity yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Add the "Academy" activity to a club in the Clubs & Partners tab.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Academy Activity</TableHead>
                  <TableHead>Bubble Image</TableHead>
                  <TableHead>Gallery Images</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academyClubs.map(club => {
                  const bubblePics = clubPictures(club.id, "bubble");
                  const carouselPics = clubPictures(club.id, "carousel");
                  const academyOffering = club.offerings.find(o => o.toLowerCase().includes("academy")) || "";
                  return (
                    <TableRow key={club.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{club.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{academyOffering}</TableCell>
                      <TableCell>
                        {bubblePics.length > 0 ? (
                          <div className="h-10 w-16 rounded overflow-hidden bg-secondary">
                            <img src={bubblePics[0].image_url} alt="Bubble" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{carouselPics.length} image(s)</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setEditClubId(club.id)} className="gap-1.5">
                          <Image className="h-3.5 w-3.5" />
                          Pictures
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Picture Management Dialog */}
      <Dialog open={!!editClubId} onOpenChange={(o) => !o && setEditClubId(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {editClub?.name} — Academy Pictures
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-2">
            {/* Bubble Image (1 only) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                Bubble Image <span className="text-xs">(shown on the academy card — 1 image only)</span>
              </Label>
              {editClubId && clubPictures(editClubId, "bubble").length > 0 ? (
                <div className="flex gap-3">
                  {clubPictures(editClubId, "bubble").map(pic => (
                    <div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card w-40 aspect-video">
                      <img src={pic.image_url} alt="Bubble" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button onClick={() => handleDelete(pic)} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DropZone
                  id="bubble-drop"
                  dragging={draggingBubble}
                  setDragging={setDraggingBubble}
                  onFiles={(files) => editClubId && handleUpload(editClubId, "bubble", files)}
                  uploading={uploading}
                  hint="Drop 1 image for the academy card"
                />
              )}
            </div>

            {/* Carousel/Gallery Images */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                Gallery Images <span className="text-xs">(shown when customer clicks the academy — multiple allowed)</span>
              </Label>
              <DropZone
                id="carousel-drop"
                dragging={draggingCarousel}
                setDragging={setDraggingCarousel}
                onFiles={(files) => editClubId && handleUpload(editClubId, "carousel", files)}
                uploading={uploading}
                hint="Drop images for the academy gallery"
                multiple
              />
              {editClubId && clubPictures(editClubId, "carousel").length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {clubPictures(editClubId, "carousel").map(pic => (
                    <div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                      <img src={pic.image_url} alt="Gallery" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button onClick={() => handleDelete(pic)} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Reusable drop zone component
const DropZone = ({
  id, dragging, setDragging, onFiles, uploading, hint, multiple,
}: {
  id: string;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
  uploading: boolean;
  hint: string;
  multiple?: boolean;
}) => (
  <div
    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
    onDragLeave={() => setDragging(false)}
    onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
    onClick={() => document.getElementById(id)?.click()}
    className={cn(
      "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
      dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
    )}
  >
    <input
      id={id}
      type="file"
      accept="image/*"
      multiple={multiple}
      className="hidden"
      onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }}
    />
    <div className="flex flex-col items-center gap-2">
      <Upload className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : hint}</p>
      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 10MB each</p>
    </div>
  </div>
);

export default AcademiesTab;
