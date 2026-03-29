import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Pencil, History, Eye, Trophy, Swords, MapPin, CalendarClock, Target, Star, UserPlus, Trash2, Clock, Check, Plus, Minus, Ban, CheckCircle } from "lucide-react";
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
import { findMatchingClubForBooking } from "@/lib/loyalty-club-match";

interface UsersTabProps {
  allUsers: UserWithEmail[];
  adminUsers: UserWithEmail[];
  clubs: ClubRow[];
  onUpdateUser: (userId: string, updates: Partial<UserWithEmail>) => void;
  onUpdateAdmin: (userId: string, updates: Partial<UserWithEmail>) => void;
  onDeleteAdmin: (userId: string) => void;
  onAdminCreated: () => void;
  isMasterAdmin: boolean;
  initialViewUserId?: string | null;
  onInitialViewHandled?: () => void;
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

const UsersTab = ({ allUsers, adminUsers, clubs, onUpdateUser, onUpdateAdmin, onDeleteAdmin, onAdminCreated, isMasterAdmin, initialViewUserId, onInitialViewHandled }: UsersTabProps) => {
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
  const [editAdminCode, setEditAdminCode] = useState("");
  const [editAdminSaving, setEditAdminSaving] = useState(false);

  // Create admin
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminClubId, setNewAdminClubId] = useState("none");
  const [newAdminCode, setNewAdminCode] = useState("");
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
  const [viewAdjustments, setViewAdjustments] = useState<Record<string, number>>({});
  const [adjustingSaving, setAdjustingSaving] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Lookup data for profile viewer
  const [offerings, setOfferings] = useState<any[]>([]);
  const [playerLevels, setPlayerLevels] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [allPlaystyles, setAllPlaystyles] = useState<any[]>([]);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [allPeriods, setAllPeriods] = useState<any[]>([]);

  // Edit badge state
  const [editingBadge, setEditingBadge] = useState<{ id: string; level: number } | null>(null);
  const [savingBadge, setSavingBadge] = useState(false);

  // Edit selection state
  const [editingSelection, setEditingSelection] = useState<string | null>(null);
  const [editSelData, setEditSelData] = useState<PlayerSelection | null>(null);
  const [savingSelection, setSavingSelection] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      const [oRes, lRes, locRes, psRes, gRes, pRes] = await Promise.all([
        supabase.from("offerings").select("id, name, slug, brand_color"),
        supabase.from("player_levels").select("id, label, display_order").order("display_order"),
        supabase.from("locations").select("id, name").order("name"),
        supabase.from("playstyles").select("label, value").order("display_order"),
        supabase.from("goals").select("label, value").order("display_order"),
        supabase.from("availability_periods").select("label, value").order("display_order"),
      ]);
      if (oRes.data) setOfferings(oRes.data);
      if (lRes.data) setPlayerLevels(lRes.data);
      if (locRes.data) setAllLocations(locRes.data);
      if (psRes.data) setAllPlaystyles(psRes.data);
      if (gRes.data) setAllGoals(gRes.data);
      if (pRes.data) setAllPeriods(pRes.data);
    };
    fetchLookups();
  }, []);

  // Auto-open profile viewer from notification
  useEffect(() => {
    if (initialViewUserId && allUsers.length > 0) {
      // Check if this user is an admin — if so, switch to admin sub-tab instead of opening customer profile
      const isAdmin = adminUsers.some(a => a.user_id === initialViewUserId);
      if (isAdmin) {
        setSubTab("admins");
        toast.info("This user is a club admin, not a customer.");
      } else {
        const user = allUsers.find(u => u.user_id === initialViewUserId);
        if (user) {
          openProfileViewer(user);
        }
      }
      onInitialViewHandled?.();
    }
  }, [initialViewUserId, allUsers, adminUsers]);

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
    setEditAdmin(u); setEditAdminName(u.full_name || ""); setEditAdminEmail(u.email); setEditAdminPhone(u.phone || ""); setEditAdminPassword(""); setEditAdminClubId(u.club_id || ""); setEditAdminCode(u.admin_code || "");
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
    body.admin_code = (editAdminClubId && editAdminClubId !== "none" && editAdminCode) ? editAdminCode : null;
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    setEditAdminSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Update failed"); }
    else { toast.success("Admin updated"); onUpdateAdmin(editAdmin.user_id, { full_name: editAdminName, email: editAdminEmail, phone: editAdminPhone, club_id: (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null, admin_code: (editAdminClubId && editAdminClubId !== "none") ? editAdminCode : null }); setEditAdmin(null); }
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
    const { data, error } = await supabase.functions.invoke("manage-admin", { body: { email: newAdminEmail, password: newAdminPassword, full_name: newAdminName, phone: newAdminPhone, club_id: (newAdminClubId && newAdminClubId !== "none") ? newAdminClubId : null, admin_code: (newAdminClubId && newAdminClubId !== "none") ? newAdminCode : null } });
    setCreatingAdmin(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed"); }
    else { toast.success(`Admin created for ${newAdminEmail}`); setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminPhone(""); setNewAdminClubId("none"); setNewAdminCode(""); setShowCreateAdmin(false); onAdminCreated(); }
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
    const [profileRes, selectionsRes, badgesRes, bookingsRes, adjustmentsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", u.user_id).maybeSingle(),
      supabase.from("player_selections").select("*").eq("user_id", u.user_id).order("rank"),
      supabase.from("badge_point_assignments").select("*").eq("user_id", u.user_id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("activity, activity_name, attendance_status, created_at").eq("user_id", u.user_id).in("attendance_status", ["show", "no_show"]),
      supabase.from("loyalty_point_adjustments").select("club_id, points").eq("user_id", u.user_id),
    ]);
    setViewProfile(profileRes.data);
    setViewSelections((selectionsRes.data || []) as unknown as PlayerSelection[]);
    setViewBadges((badgesRes.data || []) as unknown as BadgeAssignment[]);

    // Sum manual adjustments per club
    const adjMap: Record<string, number> = {};
    ((adjustmentsRes.data || []) as { club_id: string; points: number }[]).forEach(a => {
      adjMap[a.club_id] = (adjMap[a.club_id] || 0) + a.points;
    });
    setViewAdjustments(adjMap);

    // Calculate loyalty points per club from bookings
    // Each booking is attributed to exactly ONE club (first alphabetically if multiple match)
    const bookings = (bookingsRes.data || []) as { activity: string; activity_name: string; attendance_status: string }[];
    const pointsByClub = new Map<string, { shows: number; noShows: number }>();

    for (const b of bookings) {
      const club = findMatchingClubForBooking(clubs, {
        activity: b.activity,
        activity_name: b.activity_name,
      });

      if (!club) continue;

      const existing = pointsByClub.get(club.id) || { shows: 0, noShows: 0 };
      if (b.attendance_status === "show") existing.shows++;
      else if (b.attendance_status === "no_show") existing.noShows++;
      pointsByClub.set(club.id, existing);
    }

    const loyaltyArr = Array.from(pointsByClub.entries()).map(([clubId, pts]) => ({
      clubId,
      clubName: clubs.find(c => c.id === clubId)?.name || "Unknown",
      shows: pts.shows,
      noShows: pts.noShows,
      total: pts.shows - pts.noShows,
    })).sort((a, b) => b.total - a.total);
    setViewLoyalty(loyaltyArr);
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

  const handleAdjustLoyalty = async (clubId: string, delta: number) => {
    if (!viewUser) return;
    setAdjustingSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("loyalty_point_adjustments").insert({
      user_id: viewUser.user_id,
      club_id: clubId,
      points: delta,
      reason: delta > 0 ? "Manual add by admin" : "Manual deduction by admin",
      adjusted_by: user?.id,
    } as any);
    setAdjustingSaving(false);
    if (error) { toast.error("Failed to adjust points"); return; }
    setViewAdjustments(prev => ({ ...prev, [clubId]: (prev[clubId] || 0) + delta }));
    toast.success(`${delta > 0 ? "Added" : "Removed"} 1 loyalty point`);
  };

  const handleSaveSelection = async (selId: string) => {
    if (!editSelData) return;
    setSavingSelection(true);
    const updates: any = {
      level_id: editSelData.level_id,
      playstyle: editSelData.playstyle || null,
      years_experience: editSelData.years_experience,
      goals: editSelData.goals,
      location_ids: editSelData.location_ids,
      availability: editSelData.availability,
      sport_id: editSelData.sport_id,
    };
    const { error } = await supabase.from("player_selections").update(updates).eq("id", selId);
    setSavingSelection(false);
    if (error) { toast.error("Failed to update"); return; }
    setViewSelections(prev => prev.map(s => s.id === selId ? { ...s, ...updates } : s));
    setEditingSelection(null);
    setEditSelData(null);
    toast.success("MyPlayer updated");
  };

  const getOfferingName = (id: string) => offerings.find(o => o.id === id)?.name || "Unknown";
  const getOfferingColor = (id: string) => offerings.find(o => o.id === id)?.brand_color || null;
  const getLevelLabel = (id: string) => playerLevels.find(l => l.id === id)?.label || "—";
  const getLocationName = (id: string) => {
    const loc = allLocations.find(l => l.id === id);
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
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const q = userSearch.toLowerCase();
                    const filtered = customers.filter(u => !q || (u.full_name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").toLowerCase().includes(q)).sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""));
                    return filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{userSearch ? "No customers match." : "No customers yet."}</TableCell></TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.user_id} className={u.suspended ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{u.email}</TableCell>
                        <TableCell className="hidden sm:table-cell">{u.phone || "—"}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={u.suspended ? "Suspended — click to activate" : "Active — click to suspend"}
                            onClick={async () => {
                              const newVal = !u.suspended;
                              const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "toggle-suspend", user_id: u.user_id, suspended: newVal } });
                              if (error || data?.error) { toast.error("Failed to update status"); return; }
                              onUpdateUser(u.user_id, { suspended: newVal });
                              toast.success(newVal ? `${u.full_name || u.email} suspended` : `${u.full_name || u.email} activated`);
                            }}
                          >
                            {u.suspended ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                          </Button>
                        </TableCell>
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
            <div><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div><Label>Email</Label><Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div><Label>Phone</Label><PhoneInput value={editPhone} onChange={setEditPhone} className="mt-1" /></div>
            <div><Label>New Password <span className="text-xs text-muted-foreground">(leave empty to keep)</span></Label><Input type="password" placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <Button onClick={handleSaveUser} disabled={editSaving} className="w-full h-10 text-sm font-semibold glow">{editSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-[66vw]">
          <DialogHeader><DialogTitle className="font-heading text-xl">Edit Admin — {editAdmin?.full_name || editAdmin?.email}</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-4">
            <div><Label>Full Name</Label><Input value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Email</Label><Input type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
              <div><Label>Phone</Label><PhoneInput value={editAdminPhone} onChange={setEditAdminPhone} className="mt-1" /></div>
            </div>
            <div><Label>New Password <span className="text-xs text-muted-foreground">(leave empty to keep)</span></Label><Input type="password" placeholder="••••••••" value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div><Label>Assigned Club</Label><Select value={editAdminClubId} onValueChange={setEditAdminClubId}><SelectTrigger className="h-9 bg-secondary border-border mt-1 text-sm"><SelectValue placeholder="All Clubs (Master Admin)" /></SelectTrigger><SelectContent className="bg-card border-border z-50"><SelectItem value="none">All Clubs (Master Admin)</SelectItem>{clubs.sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            {editAdminClubId && editAdminClubId !== "none" && (
              <div>
                <Label>Admin Code <span className="text-xs text-muted-foreground">(6-digit numeric)</span></Label>
                <Input
                  value={editAdminCode}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setEditAdminCode(v); }}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  className="h-9 bg-secondary border-border mt-1 text-sm font-mono tracking-widest"
                />
                {editAdminCode && editAdminCode.length !== 6 && (
                  <p className="text-[11px] text-destructive mt-1">Must be exactly 6 digits</p>
                )}
              </div>
            )}
            <Button onClick={handleSaveAdmin} disabled={editAdminSaving || (editAdminClubId && editAdminClubId !== "none" && editAdminCode.length !== 6)} className="w-full h-10 text-sm font-semibold glow">{editAdminSaving ? "Saving..." : "Save Changes"}</Button>
            <Button variant="destructive" onClick={handleDeleteAdmin} disabled={editAdminSaving} className="w-full h-10 text-sm font-semibold"><Trash2 className="h-4 w-4 mr-2" /> Delete Admin</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-heading">Add Admin</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
            <div><Label>Full Name</Label><Input placeholder="John Doe" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div><Label>Password</Label><Input type="password" placeholder="••••••••" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required minLength={6} className="h-9 bg-secondary border-border mt-1 text-sm" /></div>
            <div><Label>Phone</Label><PhoneInput value={newAdminPhone} onChange={setNewAdminPhone} className="mt-1" /></div>
            <div><Label>Assign Club</Label><Select value={newAdminClubId} onValueChange={setNewAdminClubId}><SelectTrigger className="h-9 bg-secondary border-border mt-1 text-sm"><SelectValue placeholder="All Clubs (Master Admin)" /></SelectTrigger><SelectContent className="bg-card border-border z-50"><SelectItem value="none">All Clubs (Master Admin)</SelectItem>{clubs.sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            {newAdminClubId && newAdminClubId !== "none" && (
              <div>
                <Label>Admin Code <span className="text-xs text-muted-foreground">(6-digit numeric)</span></Label>
                <Input
                  value={newAdminCode}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setNewAdminCode(v); }}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  required
                  className="h-9 bg-secondary border-border mt-1 text-sm font-mono tracking-widest"
                />
                {newAdminCode && newAdminCode.length !== 6 && (
                  <p className="text-[11px] text-destructive mt-1">Must be exactly 6 digits</p>
                )}
              </div>
            )}
            <Button type="submit" disabled={creatingAdmin || (newAdminClubId !== "none" && newAdminCode.length !== 6)} className="w-full h-10 text-sm font-semibold glow"><UserPlus className="h-4 w-4 mr-2" />{creatingAdmin ? "Creating..." : "Create Admin"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Former Users Dialog */}
      <Dialog open={formerDialogOpen} onOpenChange={setFormerDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-[66vw] min-h-[50vh]">
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
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-[66vw] max-h-[85vh] overflow-y-auto">
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
                {(() => {
                  // Show ALL clubs, not just ones with bookings
                  const allClubLoyalty = clubs.map(club => {
                    const existing = viewLoyalty.find(l => l.clubId === club.id);
                    const adj = viewAdjustments[club.id] || 0;
                    const base = existing || { clubId: club.id, clubName: club.name, shows: 0, noShows: 0, total: 0 };
                    return { ...base, adjustment: adj, effectiveTotal: base.total + adj };
                  });

                  return (
                    <div className="space-y-3">
                      {/* Booking-based loyalty points */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Points from Attendance</p>
                        {allClubLoyalty.map(lp => (
                          <div key={lp.clubId} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{lp.clubName}</p>
                              <p className="text-xs text-muted-foreground">
                                {lp.shows} show{lp.shows !== 1 ? "s" : ""} · {lp.noShows} no-show{lp.noShows !== 1 ? "s" : ""}
                                {lp.adjustment !== 0 && (
                                  <span className={cn("ml-1", lp.adjustment > 0 ? "text-primary" : "text-destructive")}>
                                    · {lp.adjustment > 0 ? "+" : ""}{lp.adjustment} manual
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={adjustingSaving || lp.effectiveTotal <= 0}
                                onClick={() => handleAdjustLoyalty(lp.clubId, -1)}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <div className="flex gap-0.5">
                                {Array.from({ length: 10 }, (_, i) => (
                                  <div key={i} className={cn(
                                    "h-3 w-3 rounded-full",
                                    i < Math.max(0, lp.effectiveTotal) ? "bg-primary" : "bg-border",
                                    i === 4 && "ring-1 ring-primary/40",
                                    i === 9 && "ring-1 ring-primary/40"
                                  )} />
                                ))}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                disabled={adjustingSaving}
                                onClick={() => handleAdjustLoyalty(lp.clubId, 1)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <span className={cn(
                              "text-sm font-bold tabular-nums min-w-[2rem] text-right",
                              lp.effectiveTotal > 0 ? "text-primary" : lp.effectiveTotal < 0 ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {lp.effectiveTotal}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Badge reward assignments */}
                      {viewBadges.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Badge Reward Points</p>
                          {viewBadges.map(badge => {
                            const club = clubs.find(c => c.id === badge.club_id);
                            const isEditing = editingBadge?.id === badge.id;
                            return (
                              <div key={badge.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{club?.name || "Unknown Club"}</p>
                                  <p className="text-xs text-muted-foreground">Badge Points: {badge.badge_level} / 10</p>
                                </div>
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
                  );
                })()}
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
                      const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
                                setEditSelData({ ...sel });
                              }}><Pencil className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>

                          {isEditing && editSelData ? (
                            <div className="space-y-4">
                              {/* Sport */}
                              <div>
                                <Label className="text-xs text-muted-foreground">Sport</Label>
                                <Select value={editSelData.sport_id} onValueChange={(v) => setEditSelData({ ...editSelData, sport_id: v })}>
                                  <SelectTrigger className="h-9 bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>{offerings.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              {/* Level */}
                              <div>
                                <Label className="text-xs text-muted-foreground">Level</Label>
                                <Select value={editSelData.level_id} onValueChange={(v) => setEditSelData({ ...editSelData, level_id: v })}>
                                  <SelectTrigger className="h-9 bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>{playerLevels.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              {/* Playstyle */}
                              <div>
                                <Label className="text-xs text-muted-foreground">Playstyle</Label>
                                <Select value={editSelData.playstyle || ""} onValueChange={(v) => setEditSelData({ ...editSelData, playstyle: v })}>
                                  <SelectTrigger className="h-9 bg-secondary border-border mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                                  <SelectContent>
                                    {allPlaystyles.map(ps => <SelectItem key={ps.value} value={ps.value}>{ps.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Years Experience */}
                              <div>
                                <Label className="text-xs text-muted-foreground">Years Experience</Label>
                                <Input type="number" value={editSelData.years_experience ?? ""} onChange={(e) => setEditSelData({ ...editSelData, years_experience: e.target.value ? parseInt(e.target.value) : null })} className="h-9 bg-secondary border-border mt-1 max-w-[120px]" placeholder="e.g. 3" />
                              </div>
                              {/* Goals */}
                              <div>
                                <Label className="text-xs text-muted-foreground">Goals</Label>
                                <div className="grid grid-cols-2 gap-1.5 mt-1">
                                  {allGoals.map(g => {
                                    const active = editSelData.goals.includes(g.value);
                                    return (
                                      <button key={g.value} onClick={() => setEditSelData({ ...editSelData, goals: active ? editSelData.goals.filter(x => x !== g.value) : [...editSelData.goals, g.value] })} className={cn("rounded-md border px-2 py-1.5 text-xs font-medium transition-all text-left", active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/50")}>
                                        {active && <Check className="h-3 w-3 inline mr-1" />}{g.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              {/* Availability */}
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Availability</Label>
                                <div className="grid grid-cols-4 gap-1 text-xs mt-1">
                                  <div />
                                  {allPeriods.map(p => <div key={p.value} className="text-center text-muted-foreground/70 font-medium pb-1">{p.label}</div>)}
                                  {DAYS.map(day => (
                                    <>
                                      <div key={`label-${day}`} className="flex items-center text-muted-foreground font-medium">{day}</div>
                                      {allPeriods.map(period => {
                                        const active = editSelData.availability.some((a: any) => a.day === day && a.period === period.value);
                                        return (
                                          <button key={`${day}-${period.value}`} onClick={() => {
                                            const newAvail = active
                                              ? editSelData.availability.filter((a: any) => !(a.day === day && a.period === period.value))
                                              : [...editSelData.availability, { day, period: period.value }];
                                            setEditSelData({ ...editSelData, availability: newAvail });
                                          }} className={cn("rounded-md border py-1.5 transition-all font-medium", active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground/40 hover:border-muted-foreground/50")}>
                                            {active ? "✓" : "–"}
                                          </button>
                                        );
                                      })}
                                    </>
                                  ))}
                                </div>
                              </div>
                              {/* Top 3 Locations */}
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Top 3 Locations</Label>
                                <div className="space-y-1.5 mt-1">
                                  {[0, 1, 2].map(slotIdx => {
                                    const selectedId = editSelData.location_ids[slotIdx] || "";
                                    const availLocs = allLocations.filter(l => l.id === selectedId || !editSelData.location_ids.includes(l.id));
                                    return (
                                      <div key={slotIdx} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">#{slotIdx + 1}</span>
                                        <Select value={selectedId} onValueChange={(val) => {
                                          const newIds = [...editSelData.location_ids];
                                          while (newIds.length <= slotIdx) newIds.push("");
                                          newIds[slotIdx] = val;
                                          setEditSelData({ ...editSelData, location_ids: newIds.filter(Boolean) });
                                        }}>
                                          <SelectTrigger className="h-9 text-sm bg-secondary border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                                          <SelectContent className="bg-card border-border z-50 max-h-60">{availLocs.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {selectedId && (
                                          <button onClick={() => setEditSelData({ ...editSelData, location_ids: editSelData.location_ids.filter((_, i) => i !== slotIdx) })} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">✕</button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" disabled={savingSelection} onClick={() => handleSaveSelection(sel.id)} className="glow">{savingSelection ? "Saving..." : "Save All"}</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingSelection(null); setEditSelData(null); }}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Star className="h-3.5 w-3.5" /> Level: {getLevelLabel(sel.level_id)}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Swords className="h-3.5 w-3.5" /> Playstyle: {sel.playstyle ? sel.playstyle.replace("_", " ") : "—"}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <CalendarClock className="h-3.5 w-3.5" /> Experience: {sel.years_experience != null ? `${sel.years_experience} yrs` : "—"}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                <Target className="h-3.5 w-3.5" /> Goals: {sel.goals.length > 0 ? sel.goals.join(", ") : "—"}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                <Clock className="h-3.5 w-3.5" /> Availability: {sel.availability.length > 0 ? `${sel.availability.length} slot${sel.availability.length !== 1 ? "s" : ""}` : "—"}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                <MapPin className="h-3.5 w-3.5" /> Locations: {sel.location_ids.length > 0 ? sel.location_ids.map(id => getLocationName(id)).join(", ") : "—"}
                              </div>
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
