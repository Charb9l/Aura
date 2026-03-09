import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, Star, ArrowUp, ArrowDown, Upload } from "lucide-react";

interface ClubRow {
  id: string;
  name: string;
  logo_url: string | null;
}

interface FeaturedRow {
  id: string;
  club_id: string;
  featured_image_url: string;
  display_order: number;
  active: boolean;
  club_name: string;
}

const FeaturedClubsTab = () => {
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [fRes, cRes] = await Promise.all([
      supabase
        .from("featured_clubs")
        .select("*, clubs(name)")
        .order("display_order", { ascending: true }),
      supabase.from("clubs").select("id, name, logo_url").eq("published", true).order("name"),
    ]);
    if (fRes.data) {
      setFeatured(
        fRes.data.map((f: any) => ({
          id: f.id,
          club_id: f.club_id,
          featured_image_url: f.featured_image_url,
          display_order: f.display_order,
          active: f.active,
          club_name: f.clubs?.name || "",
        }))
      );
    }
    if (cRes.data) setClubs(cRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const availableClubs = clubs.filter((c) => !featured.some((f) => f.club_id === c.id));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!selectedClubId || !imageFile) {
      toast.error("Select a club and upload an image");
      return;
    }
    setSaving(true);
    const ext = imageFile.name.split(".").pop();
    const path = `${selectedClubId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("featured-images").upload(path, imageFile);
    if (upErr) {
      toast.error("Upload failed: " + upErr.message);
      setSaving(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("featured-images").getPublicUrl(path);
    const maxOrder = featured.reduce((max, f) => Math.max(max, f.display_order), -1);
    const { error: insertErr } = await supabase.from("featured_clubs").insert({
      club_id: selectedClubId,
      featured_image_url: urlData.publicUrl,
      display_order: maxOrder + 1,
      active: true,
    });
    if (insertErr) {
      toast.error("Failed to add: " + insertErr.message);
    } else {
      toast.success("Featured club added!");
      setAddOpen(false);
      setSelectedClubId("");
      setImageFile(null);
      setImagePreview(null);
      fetchData();
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from("featured_clubs").update({ active }).eq("id", id);
    setFeatured((prev) => prev.map((f) => (f.id === id ? { ...f, active } : f)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("featured_clubs").delete().eq("id", id);
    setFeatured((prev) => prev.filter((f) => f.id !== id));
    toast.success("Removed from featured");
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = featured.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= featured.length) return;

    const newList = [...featured];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    newList.forEach((f, i) => (f.display_order = i));
    setFeatured(newList);

    await Promise.all(
      newList.map((f, i) =>
        supabase.from("featured_clubs").update({ display_order: i }).eq("id", f.id)
      )
    );
  };

  const handleReplaceImage = async (id: string, clubId: string, file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${clubId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("featured-images").upload(path, file);
    if (upErr) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("featured-images").getPublicUrl(path);
    await supabase.from("featured_clubs").update({ featured_image_url: urlData.publicUrl }).eq("id", id);
    setFeatured((prev) =>
      prev.map((f) => (f.id === id ? { ...f, featured_image_url: urlData.publicUrl } : f))
    );
    toast.success("Image updated");
    setUploading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="featured-clubs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" /> Featured Clubs
          </h1>
          <p className="text-muted-foreground mt-1">
            Promote partner clubs across the platform — homepage, login page, and booking.
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          disabled={availableClubs.length === 0}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Club
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : featured.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Star className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No featured clubs yet. Add one to start promoting partners.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featured.map((f, idx) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => handleReorder(f.id, "up")}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === featured.length - 1}
                          onClick={() => handleReorder(f.id, "down")}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative group w-20 h-12 rounded border border-border overflow-hidden bg-secondary">
                        <img
                          src={f.featured_image_url}
                          alt={f.club_name}
                          className="w-full h-full object-contain"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="h-4 w-4 text-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleReplaceImage(f.id, f.club_id, file);
                            }}
                          />
                        </label>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{f.club_name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={f.active}
                        onCheckedChange={(val) => handleToggleActive(f.id, val)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(f.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add Featured Club Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Feature a Club</DialogTitle>
            <DialogDescription>Select a club and upload a promotional image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Club</Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <SelectValue placeholder="Choose a club..." />
                </SelectTrigger>
                <SelectContent>
                  {availableClubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Featured Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 mx-auto object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground/50">
                      PNG, JPG recommended — logos or promotional banners
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageSelect}
                />
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={saving || !selectedClubId || !imageFile}
              className="w-full h-12 gap-2"
            >
              {saving && <Spinner size="sm" />}
              {saving ? "Adding..." : "Add Featured Club"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FeaturedClubsTab;
