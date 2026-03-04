import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil, History, Eye, Trophy, Swords, MapPin, CalendarClock, Target, Star, UserPlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/PhoneInput";
import AdminFinderInput from "./AdminFinderInput";
import { UserWithEmail, ClubRow } from "./types";
import { format } from "date-fns";

interface UsersTabProps {
  allUsers: UserWithEmail[];
  adminUsers: UserWithEmail[];
  clubs: ClubRow[];
  onUpdateUser: (userId: string, updates: Partial<UserWithEmail>) => void;
  onUpdateAdmin: (userId: string, updates: Partial<UserWithEmail>) => void;
  onDeleteAdmin: (userId: string) => void;
  onAdminCreated: () => void;
  isMasterAdmin: boolean;
}

interface PlayerSelection {
  id: string;
  sport_id: string;
  level_id: string;
  location_ids: string[];
  playstyle: string | null;
  goals: string[];
  years_experience: number | null;
  availability: any[];
  rank: number;
}

interface BadgeAssignment {
  id: string;
  club_id: string;
  badge_level: number;
  created_at: string;
}

const UsersTab = ({ allUsers, adminUsers, clubs, onUpdateUser, onUpdateAdmin, onDeleteAdmin, onAdminCreated, isMasterAdmin }: UsersTabProps) => {
  const [subTab, setSubTab] = useState<"customers" | "admins">("customers");
  const [userSearch, setUserSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  // Edit customer dialog
  const [editUser, setEditUser] = useState<UserWithEmail | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Edit admin dialog
  const [editAdmin, setEditAdmin] = useState<UserWithEmail | null>(null);
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminClubId, setEditAdminClubId] = useState("");
  const [editAdminSaving, setEditAdminSaving] = useState(false);

  // Create admin
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminClubId, setNewAdminClubId] = useState("none");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Former dialog
  const [formerDialogOpen, setFormerDialogOpen] = useState(false);
  const [formerDialogType, setFormerDialogType] = useState<"customer" | "admin">("customer");
  const [formerTab, setFormerTab] = useState<"current" | "former">("current");
  const [formerUsers, setFormerUsers] = useState<any[]>([]);
  const [formerLoading, setFormerLoading] = useState(false);

  // Profile viewer
  const [viewUser, setViewUser] = useState<UserWithEmail | null>(null);
  const [viewProfile, setViewProfile] = useState<any>(null);
  const [viewSelections, setViewSelections] = useState<PlayerSelection[]>([]);
  const [viewBadges, setViewBadges] = useState<BadgeAssignment[]>([]);
  const [viewLoyalty, setViewLoyalty] = useState<{ clubId: string; clubName: string; shows: number; noShows: number; total: number }[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Lookup data for profile viewer
  const [offerings, setOfferings] = useState<any[]>([]);
  const [playerLevels, setPlayerLevels] = useState<any[]>([]);
  const [clubLocations, setClubLocations] = useState<any[]>([]);

  // Edit badge state
  const [editingBadge, setEditingBadge] = useState<{ id: string; level: number } | null>(null);
  const [savingBadge, setSavingBadge] = useState(false);

  // Edit selection state
  const [editingSelection, setEditingSelection] = useState<string | null>(null);
  const [editSelLevel, setEditSelLevel] = useState("");
  const [editSelPlaystyle, setEditSelPlaystyle] = useState("");
  const [editSelExperience, setEditSelExperience] = useState("");
  const [savingSelection, setSavingSelection] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      const [oRes, lRes, clRes] = await Promise.all([
        supabase.from("offerings").select("id, name, slug, brand_color"),
        supabase.from("player_levels").select("id, label, display_order").order("display_order"),
        supabase.from("club_locations").select("id, name, location, club_id"),
      ]);
      if (oRes.data) setOfferings(oRes.data);
      if (lRes.data) setPlayerLevels(lRes.data);
      if (clRes.data) setClubLocations(clRes.data);
    };
    fetchLookups();
  }, []);

  const customers = allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id));

  const openEditDialog = (u: UserWithEmail) => {
    setEditUser(u); setEditName(u.full_name || ""); setEditEmail(u.email); setEditPhone(u.phone || ""); setEditPassword("");
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setEditSaving(true);
    const body: Record<string, string> = { user_id: editUser.user_id };
    if (editName !== (editUser.full_name || "")) body.full_name = editName;
    if (editEmail !== editUser.email) body.email = editEmail;
    if (editPhone !== (editUser.phone || "")) body.phone = editPhone;
    if (editPassword) body.password = editPassword;
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { ...body, action: "update" } });
    setEditSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Update failed"); }
    else { toast.success("User updated"); onUpdateUser(editUser.user_id, { full_name: editName, email: editEmail, phone: editPhone }); setEditUser(null); }
  };

  const openEditAdmin = (u: UserWithEmail) => {
    setEditAdmin(u); setEditAdminName(u.full_name || ""); setEditAdminEmail(u.email); setEditAdminPhone(u.phone || ""); setEditAdminPassword(""); setEditAdminClubId(u.club_id || "");
  };

  const handleSaveAdmin = async () => {
    if (!editAdmin) return;
    setEditAdminSaving(true);
    const body: Record<string, string | null> = { user_id: editAdmin.user_id, action: "update", user_type: "admin" };
    if (editAdminName !== (editAdmin.full_name || "")) body.full_name = editAdminName;
    if (editAdminEmail !== editAdmin.email) body.email = editAdminEmail;
    if (editAdminPhone !== (editAdmin.phone || "")) body.phone = editAdminPhone;
    if (editAdminPassword) body.password = editAdminPassword;
    body.club_id = (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null;
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    setEditAdminSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Update failed"); }
    else { toast.success("Admin updated"); onUpdateAdmin(editAdmin.user_id, { full_name: editAdminName, email: editAdminEmail, phone: editAdminPhone, club_id: (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null }); setEditAdmin(null); }
  };

  const handleDeleteAdmin = async () => {
    if (!editAdmin) return;
    if (!confirm(`Permanently delete ${editAdmin.full_name || editAdmin.email}?`)) return;
    setEditAdminSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "delete-admin", user_id: editAdmin.user_id } });
    setEditAdminSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Delete failed"); }
    else { toast.success("Admin deleted"); onDeleteAdmin(editAdmin.user_id); setEditAdmin(null); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    const { data, error } = await supabase.functions.invoke("manage-admin", { body: { email: newAdminEmail, password: newAdminPassword, full_name: newAdminName, phone: newAdminPhone, club_id: (newAdminClubId && newAdminClubId !== "none") ? newAdminClubId : null } });
    setCreatingAdmin(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed"); }
    else { toast.success(`Admin created for ${newAdminEmail}`); setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminPhone(""); setNewAdminClubId("none"); setShowCreateAdmin(false); onAdminCreated(); }
  };

  const openFormerDialog = async (type: "customer" | "admin") => {
    setFormerDialogType(type); setFormerTab("current"); setFormerDialogOpen(true); setFormerLoading(true);
    const { data } = await supabase.functions.invoke("admin-users", { body: { action: "list-former", user_type: type } });
    setFormerUsers(data?.former_users || []); setFormerLoading(false);
  };

  // Profile viewer
  const openProfileViewer = async (u: UserWithEmail) => {
    setViewUser(u);
    setViewLoading(true);
    const [profileRes, selectionsRes, badgesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", u.user_id).maybeSingle(),
      supabase.from("player_selections").select("*").eq("user_id", u.user_id).order("rank"),
      supabase.from("badge_point_assignments").select("*").eq("user_id", u.user_id).order("created_at", { ascending: false }),
    ]);
    setViewProfile(profileRes.data);
    setViewSelections((selectionsRes.data || []) as unknown as PlayerSelection[]);
    setViewBadges((badgesRes.data || []) as unknown as BadgeAssignment[]);
    setViewLoading(false);
  };

  const handleSaveBadge = async (badgeId: string, newLevel: number) => {
    setSavingBadge(true);
    const { error } = await supabase.from("badge_point_assignments").update({ badge_level: newLevel }).eq("id", badgeId);
    setSavingBadge(false);
    if (error) { toast.error("Failed to update badge"); return; }
    setViewBadges(prev => prev.map(b => b.id === badgeId ? { ...b, badge_level: newLevel } : b));
    setEditingBadge(null);
    toast.success("Badge updated");
  };

  const handleSaveSelection = async (selId: string) => {
    setSavingSelection(true);
    const updates: any = {};
    if (editSelLevel) updates.level_id = editSelLevel;
    if (editSelPlaystyle) updates.playstyle = editSelPlaystyle;
    if (editSelExperience !== "") updates.years_experience = parseInt(editSelExperience) || null;
    const { error } = await supabase.from("player_selections").update(updates).eq("id", selId);
    setSavingSelection(false);
    if (error) { toast.error("Failed to update"); return; }
    setViewSelections(prev => prev.map(s => s.id === selId ? { ...s, ...updates } : s));
    setEditingSelection(null);
    toast.success("MyPlayer updated");
  };

  const getOfferingName = (id: string) => offerings.find(o => o.id === id)?.name || "Unknown";
  const getOfferingColor = (id: string) => offerings.find(o => o.id === id)?.brand_color || null;
  const getLevelLabel = (id: string) => playerLevels.find(l => l.id === id)?.label || "—";
  const getLocationName = (id: string) => {
    const loc = clubLocations.find(l => l.id === id);
    return loc ? loc.name : "—";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="users">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground">Users</h1>
      </div>
      <p className="text-muted-foreground mb-6">Manage customers and club administrators.</p>

      {/* Sub-tab toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={subTab === "customers" ? "default" : "outline"}
          size="sm"
          onClick={() => setSubTab("customers")}
          className="gap-2"
        >
          Registered Customers
          <Badge variant="secondary" className="text-xs ml-1">{customers.length}</Badge>
        </Button>
        <Button
          variant={subTab === "admins" ? "default" : "outline"}
          size="sm"
          onClick={() => setSubTab("admins")}
          className="gap-2"
        >
          Club Admins
          <Badge variant="secondary" className="text-xs ml-1">{adminUsers.length}</Badge>
        </Button>
      </div>

      {subTab === "customers" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <AdminFinderInput value={userSearch} onChange={setUserSearch} placeholder="Search by name, email, or phone..." className="max-w-sm" suggestions={customers.map(u => ({ label: u.full_name || u.email, sub: u.email }))} />
            <Button variant="outline" size="sm" className="gap-2 shrink-0 ml-3" onClick={() => openFormerDialog("customer")}><History className="h-4 w-4" /> Current & Former</Button>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const q = userSearch.toLowerCase();
                    const filtered = customers.filter(u => !q || (u.full_name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").toLowerCase().includes(q)).sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""));
                    return filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{userSearch ? "No customers match." : "No customers yet."}</TableCell></TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{u.email}</TableCell>
                        <TableCell className="hidden sm:table-cell">{u.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openProfileViewer(u)} title="View Profile"><Eye className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {subTab === "admins" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <AdminFinderInput value={adminSearch} onChange={setAdminSearch} placeholder="Search admins..." className="max-w-sm" suggestions={adminUsers.map(u => ({ label: u.full_name || u.email, sub: u.email }))} />
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openFormerDialog("admin")}><History className="h-4 w-4" /> Current & Former</Button>
              <Button size="sm" className="gap-2 glow" onClick={() => setShowCreateAdmin(true)}><UserPlus className="h-4 w-4" /> Add Admin</Button>
            </div>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Assigned Club</TableHead>
                    <TableHead className="w-[80px]">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const q = adminSearch.toLowerCase();
                    const filtered = adminUsers.filter(u => !q || (u.full_name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").toLowerCase().includes(q)).sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""));
                    return filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{adminSearch ? "No admins match." : "No admins yet."}</TableCell></TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{u.email}</TableCell>
                        <TableCell className="hidden sm:table-cell">{u.phone || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {u.club_id ? <Badge variant="secondary" className="text-xs">{clubs.find(c => c.id === u.club_id)?.name || "Unknown"}</Badge> : <span className="text-xs text-muted-foreground">All Clubs (Master)</span>}
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => openEditAdmin(u)}><Pencil className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-heading">Edit Customer — {editUser?.full_name || editUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
            <div><Label>Phone</Label><PhoneInput value={editPhone} onChange={setEditPhone} className="mt-1" /></div>
            <div><Label>New Password <span className="text-xs text-muted-foreground">(leave empty to keep)</span></Label><Input type="password" placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
            <Button onClick={handleSaveUser} disabled={editSaving} className="w-full h-12 text-base font-semibold glow">{editSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw]">
          <DialogHeader><DialogTitle className="font-heading text-xl">Edit Admin — {editAdmin?.full_name || editAdmin?.email}</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-4">
            <div><Label>Full Name</Label><Input value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Email</Label><Input type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
              <div><Label>Phone</Label><PhoneInput value={editAdminPhone} onChange={setEditAdminPhone} className="mt-1" /></div>
            </div>
            <div><Label>New Password <span className="text-xs text-muted-foreground">(leave empty to keep)</span></Label><Input type="password" placeholder="••••••••" value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
            <div><Label>Assigned Club</Label><Select value={editAdminClubId} onValueChange={setEditAdminClubId}><SelectTrigger className="h-12 bg-secondary border-border mt-1"><SelectValue placeholder="All Clubs (Master Admin)" /></SelectTrigger><SelectContent className="bg-card border-border z-50"><SelectItem value="none">All Clubs (Master Admin)</SelectItem>{clubs.sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={handleSaveAdmin} disabled={editAdminSaving} className="w-full h-12 text-base font-semibold glow">{editAdminSaving ? "Saving..." : "Save Changes"}</Button>
            <Button variant="destructive" onClick={handleDeleteAdmin} disabled={editAdminSaving} className="w-full h-12 text-base font-semibold"><Trash2 className="h-4 w-4 mr-2" /> Delete Admin</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-heading">Add Admin</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
            <div><Label>Full Name</Label><Input placeholder="John Doe" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="h-12 bg-secondary border-border mt-1" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="h-12 bg-secondary border-border mt-1" /></div>
            <div><Label>Password</Label><Input type="password" placeholder="••••••••" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required minLength={6} className="h-12 bg-secondary border-border mt-1" /></div>
            <div><Label>Phone</Label><PhoneInput value={newAdminPhone} onChange={setNewAdminPhone} className="mt-1" /></div>
            <div><Label>Assign Club</Label><Select value={newAdminClubId} onValueChange={setNewAdminClubId}><SelectTrigger className="h-12 bg-secondary border-border mt-1"><SelectValue placeholder="All Clubs (Master Admin)" /></SelectTrigger><SelectContent className="bg-card border-border z-50"><SelectItem value="none">All Clubs (Master Admin)</SelectItem>{clubs.sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <Button type="submit" disabled={creatingAdmin} className="w-full h-12 text-base font-semibold glow"><UserPlus className="h-4 w-4 mr-2" />{creatingAdmin ? "Creating..." : "Create Admin"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Former Users Dialog */}
      <Dialog open={formerDialogOpen} onOpenChange={setFormerDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] min-h-[50vh]">
          <DialogHeader><DialogTitle className="font-heading text-xl">{formerDialogType === "customer" ? "Customers" : "Club Admins"}</DialogTitle></DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button variant={formerTab === "current" ? "default" : "outline"} size="sm" onClick={() => setFormerTab("current")}>Current</Button>
            <Button variant={formerTab === "former" ? "default" : "outline"} size="sm" onClick={() => { setFormerTab("former"); if (formerUsers.length === 0 && !formerLoading) openFormerDialog(formerDialogType); }}>Former</Button>
          </div>
          {formerTab === "current" ? (
            <div className="max-h-[60vh] overflow-auto">
              <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>{formerDialogType === "admin" && <TableHead>Club</TableHead>}</TableRow></TableHeader>
                <TableBody>{(formerDialogType === "customer" ? customers : adminUsers).sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map(u => (<TableRow key={u.user_id}><TableCell className="font-medium">{u.full_name || "—"}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.phone || "—"}</TableCell>{formerDialogType === "admin" && <TableCell>{u.club_id ? clubs.find(c => c.id === u.club_id)?.name || "—" : <Badge className="bg-primary/10 text-primary">Super Admin</Badge>}</TableCell>}</TableRow>))}</TableBody>
              </Table>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              {formerLoading ? <p className="text-muted-foreground text-center py-10">Loading...</p> : formerUsers.length === 0 ? <p className="text-muted-foreground text-center py-10">No former {formerDialogType === "customer" ? "customers" : "admins"} yet.</p> : (
                <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>{formerDialogType === "admin" && <TableHead>Club</TableHead>}{formerDialogType === "admin" && <TableHead>Stint</TableHead>}<TableHead>Reason</TableHead></TableRow></TableHeader>
                  <TableBody>{formerUsers.sort((a: any, b: any) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map((fu: any) => (<TableRow key={fu.id}><TableCell className="font-medium">{fu.full_name || "—"}</TableCell><TableCell>{fu.email}</TableCell><TableCell>{fu.phone || "—"}</TableCell>{formerDialogType === "admin" && <TableCell>{fu.club_name || "Super Admin"}</TableCell>}{formerDialogType === "admin" && <TableCell className="text-sm text-muted-foreground">{fu.started_at ? format(new Date(fu.started_at), "MMM dd, yyyy") : "—"} → {format(new Date(fu.ended_at), "MMM dd, yyyy")}</TableCell>}<TableCell><Badge variant={fu.reason === "deleted" ? "destructive" : "secondary"} className="text-xs capitalize">{fu.reason}</Badge></TableCell></TableRow>))}</TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Viewer Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              {viewUser?.full_name || viewUser?.email}
            </DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <p className="text-muted-foreground text-center py-10">Loading profile...</p>
          ) : (
            <div className="space-y-8 pt-2">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {viewProfile?.avatar_url ? (
                  <img src={viewProfile.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-border">
                    {(viewUser?.full_name || viewUser?.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground text-lg">{viewUser?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{viewUser?.email}</p>
                  <p className="text-sm text-muted-foreground">{viewUser?.phone || "No phone"}</p>
                </div>
              </div>

              {/* Loyalty Badges */}
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Loyalty Program
                </h3>
                {viewBadges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No loyalty records yet.</p>
                ) : (
                  <div className="space-y-2">
                    {viewBadges.map(badge => {
                      const club = clubs.find(c => c.id === badge.club_id);
                      const isEditing = editingBadge?.id === badge.id;
                      return (
                        <div key={badge.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{club?.name || "Unknown Club"}</p>
                            <p className="text-xs text-muted-foreground">Points: {badge.badge_level} / 10</p>
                          </div>
                          {/* Visual tracker */}
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div key={i} className={cn("h-3 w-3 rounded-full", i < badge.badge_level ? "bg-primary" : "bg-border")} />
                            ))}
                          </div>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={editingBadge.level}
                                onChange={(e) => setEditingBadge({ ...editingBadge, level: parseInt(e.target.value) || 0 })}
                                className="h-8 w-16 bg-secondary border-border text-sm text-center"
                              />
                              <Button size="sm" variant="default" disabled={savingBadge} onClick={() => handleSaveBadge(badge.id, editingBadge.level)} className="h-8 px-3">Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingBadge(null)} className="h-8 px-2">✕</Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingBadge({ id: badge.id, level: badge.badge_level })}><Pencil className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MyPlayer Builds */}
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" /> MyPlayer Builds
                </h3>
                {viewSelections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sport profiles yet.</p>
                ) : (
                  <div className="space-y-3">
                    {viewSelections.map(sel => {
                      const color = getOfferingColor(sel.sport_id);
                      const isEditing = editingSelection === sel.id;
                      return (
                        <div
                          key={sel.id}
                          className="rounded-lg border p-4"
                          style={{
                            borderColor: color ? `hsl(${color} / 0.3)` : undefined,
                            backgroundColor: color ? `hsl(${color} / 0.05)` : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium" style={{ color: color ? `hsl(${color})` : undefined }}>
                              {getOfferingName(sel.sport_id)}
                            </p>
                            {!isEditing && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingSelection(sel.id);
                                setEditSelLevel(sel.level_id);
                                setEditSelPlaystyle(sel.playstyle || "");
                                setEditSelExperience(sel.years_experience?.toString() || "");
                              }}><Pencil className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Level</Label>
                                <Select value={editSelLevel} onValueChange={setEditSelLevel}>
                                  <SelectTrigger className="h-9 bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>{playerLevels.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Playstyle</Label>
                                <Select value={editSelPlaystyle} onValueChange={setEditSelPlaystyle}>
                                  <SelectTrigger className="h-9 bg-secondary border-border mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="competitive">Competitive</SelectItem>
                                    <SelectItem value="very_competitive">Very Competitive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Years Experience</Label>
                                <Input type="number" value={editSelExperience} onChange={(e) => setEditSelExperience(e.target.value)} className="h-9 bg-secondary border-border mt-1" placeholder="e.g. 3" />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" disabled={savingSelection} onClick={() => handleSaveSelection(sel.id)} className="glow">{savingSelection ? "Saving..." : "Save"}</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingSelection(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Star className="h-3.5 w-3.5" /> {getLevelLabel(sel.level_id)}
                              </div>
                              {sel.playstyle && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Swords className="h-3.5 w-3.5" /> {sel.playstyle.replace("_", " ")}
                                </div>
                              )}
                              {sel.years_experience != null && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <CalendarClock className="h-3.5 w-3.5" /> {sel.years_experience} yrs
                                </div>
                              )}
                              {sel.goals.length > 0 && (
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                  <Target className="h-3.5 w-3.5" /> {sel.goals.join(", ")}
                                </div>
                              )}
                              {sel.location_ids.length > 0 && (
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                  <MapPin className="h-3.5 w-3.5" /> {sel.location_ids.map(id => getLocationName(id)).join(", ")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UsersTab;
