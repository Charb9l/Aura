import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Trash2, MapPin, Plus } from "lucide-react";
import PageContentEditor from "./admin/PageContentEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocations } from "@/hooks/useLocations";

interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  has_academy: boolean;
}

interface ClubLocation {
  id: string;
  club_id: string;
  name: string;
  location: string;
}

const AcademiesTab = () => {
  const { locations: locationsList } = useLocations();
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [locations, setLocations] = useState<ClubLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [locClubId, setLocClubId] = useState<string | null>(null);

  // Add location state
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [addingLoc, setAddingLoc] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clubsRes, locsRes] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("club_locations").select("*").order("name"),
      ]);
      if (clubsRes.data) setClubs(clubsRes.data as unknown as ClubRow[]);
      if (locsRes.data) setLocations(locsRes.data as unknown as ClubLocation[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const academyClubs = useMemo(() => {
    return clubs.filter(c =>
      c.offerings.some(o => o.toLowerCase().includes("academy"))
    );
  }, [clubs]);

  const clubLocations = (clubId: string) =>
    locations.filter(l => l.club_id === clubId);

  const handleAddLocation = async () => {
    if (!locClubId || !newLocName.trim() || !newLocAddress.trim()) {
      toast.error("Please fill in both name and location");
      return;
    }
    setAddingLoc(true);
    const { data, error } = await supabase
      .from("club_locations")
      .insert({ club_id: locClubId, name: newLocName.trim(), location: newLocAddress.trim() })
      .select()
      .single();
    setAddingLoc(false);
    if (error) {
      toast.error("Failed to add location: " + error.message);
    } else if (data) {
      setLocations(prev => [...prev, data as unknown as ClubLocation]);
      setNewLocName("");
      setNewLocAddress("");
      toast.success("Location added");
    }
  };

  const handleDeleteLocation = async (loc: ClubLocation) => {
    if (!confirm(`Remove "${loc.name}"?`)) return;
    await supabase.from("club_locations").delete().eq("id", loc.id);
    setLocations(prev => prev.filter(l => l.id !== loc.id));
    toast.success("Location removed");
  };

  const locClub = academyClubs.find(c => c.id === locClubId);

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Academies</h1>
          <p className="text-muted-foreground">Manage academy locations for clubs with the "Academy" activity. Pictures are managed in the Clubs & Partners tab.</p>
        </div>
        <PageContentEditor pageSlug="academy" pageName="Academies" />
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
                  <TableHead>Locations</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academyClubs.map(club => {
                  const locs = clubLocations(club.id);
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
                        <span className="text-sm text-muted-foreground">{locs.length} location(s)</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => { setLocClubId(club.id); setNewLocName(""); setNewLocAddress(""); }} className="gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Locations
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

      {/* Locations Management Dialog */}
      <Dialog open={!!locClubId} onOpenChange={(o) => !o && setLocClubId(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {locClub?.name} — Locations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {locClubId && clubLocations(locClubId).length > 0 ? (
              <div className="space-y-2">
                {clubLocations(locClubId).map(loc => (
                  <div key={loc.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground text-sm">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.location}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(loc)} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No locations yet for this academy.</p>
            )}

            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">Add New Location</Label>
              <div className="space-y-3">
                <Input value={newLocName} onChange={(e) => setNewLocName(e.target.value)} placeholder="Location name (e.g. Main Campus)" className="h-11 bg-secondary border-border" />
                <Select value={newLocAddress} onValueChange={setNewLocAddress}>
                  <SelectTrigger className="h-11 bg-secondary border-border">
                    <SelectValue placeholder="Select city / area" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50 max-h-60">
                    {locationsList.map(loc => (
                      <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddLocation} disabled={addingLoc || !newLocName.trim() || !newLocAddress.trim()} className="w-full h-11 gap-2">
                  <Plus className="h-4 w-4" />
                  {addingLoc ? "Adding..." : "Add Location"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AcademiesTab;
