import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { CalendarCheck, TrendingUp, ShieldCheck, LogIn, UserPlus, Pencil, DollarSign, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import AdminNavbar from "@/components/AdminNavbar";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const ACTIVITY_PRICES: Record<string, number> = {
  tennis: 15,
  "aerial-yoga": 20,
  pilates: 20,
};

const getBookingRevenue = (b: BookingRow): number => {
  if (b.activity === "basketball") {
    return b.court_type === "full" ? 90 : 45;
  }
  return ACTIVITY_PRICES[b.activity] || 0;
};

const ALL_CATEGORIES = [
  { key: "basketball", label: "Basketball" },
  { key: "pilates", label: "Pilates" },
  { key: "aerial-yoga", label: "Aerial Yoga" },
  { key: "tennis", label: "Tennis" },
];

const CHART_COLORS = [
  "hsl(262, 50%, 55%)",
  "hsl(212, 70%, 55%)",
  "hsl(100, 22%, 60%)",
  "hsl(30, 80%, 55%)",
];

interface BookingRow {
  id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  user_id: string;
  court_type?: string | null;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface UserWithEmail {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  club_id?: string | null;
}

const AdminLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    }
    // After login, the component will re-render and useAdminRole will check the role
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-heading">Admin Access</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Enter your admin credentials to continue.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-secondary border-border mt-1"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold glow">
                  <LogIn className="h-4 w-4 mr-2" />
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const CreateAdminForm = () => {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("manage-admin", {
      body: { email: newEmail, password: newPassword, full_name: newName },
    });

    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create admin");
    } else {
      toast.success(`Admin account created for ${newEmail}`);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    }
  };

  return (
    <Card className="bg-card border-border max-w-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Create Admin Account
        </CardTitle>
        <p className="text-sm text-muted-foreground">Create a new account with admin privileges.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <Label htmlFor="new-name">Full Name</Label>
            <Input id="new-name" placeholder="John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" type="email" placeholder="admin@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="h-12 bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="new-password">Password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="h-12 bg-secondary border-border mt-1" />
          </div>
          <Button type="submit" disabled={creating} className="w-full h-12 text-base font-semibold glow">
            <UserPlus className="h-4 w-4 mr-2" />
            {creating ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

import beirutLogo from "@/assets/beirut-logo.png";
import hardcourtLogo from "@/assets/hardcourt-logo.png";
import enformeLogo from "@/assets/enforme-logo.png";

const clubLogoMap: Record<string, string> = {
  "/beirut-logo.png": beirutLogo,
  "/hardcourt-logo.png": hardcourtLogo,
  "/enforme-logo.png": enformeLogo,
};

interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  created_at: string;
}

const ClubsTab = () => {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("clubs").select("*").order("name");
      if (data) setClubs(data as unknown as ClubRow[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="clubs">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Clubs & Partners</h1>
      <p className="text-muted-foreground mb-8">All signed clubs and partners on the platform.</p>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Offerings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : clubs.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No clubs yet.</TableCell></TableRow>
              ) : clubs.map((club) => (
                <TableRow key={club.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {club.logo_url && clubLogoMap[club.logo_url] && (
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                          <img src={clubLogoMap[club.logo_url]} alt={club.name} className="h-full w-full object-contain" />
                        </div>
                      )}
                      <span className="font-medium">{club.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs">{club.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {club.offerings.map((o) => (
                        <Badge key={o} variant="secondary" className="text-xs">{o}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};


const AdminDashboard = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithEmail[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit user state
  const [editUser, setEditUser] = useState<UserWithEmail | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Admin list & create state
  const [adminUsers, setAdminUsers] = useState<UserWithEmail[]>([]);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Admin edit state
  const [editAdmin, setEditAdmin] = useState<UserWithEmail | null>(null);
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminClubId, setEditAdminClubId] = useState<string>("");
  const [editAdminSaving, setEditAdminSaving] = useState(false);

  // Clubs & current admin's club
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [myClubId, setMyClubId] = useState<string | null>(null);

  // Map club_id to activity slugs for filtering
  const clubActivityMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    clubs.forEach(c => {
      const activities: string[] = [];
      c.offerings.forEach(o => {
        const lower = o.toLowerCase();
        if (lower.includes("basketball")) activities.push("basketball");
        if (lower.includes("tennis")) activities.push("tennis");
        if (lower.includes("pilates")) activities.push("pilates");
        if (lower.includes("yoga")) activities.push("aerial-yoga");
      });
      map[c.id] = activities;
    });
    return map;
  }, [clubs]);

  // Filter bookings by club assignment
  const filteredBookings = useMemo(() => {
    if (!myClubId) return bookings; // master admin sees all
    const allowed = clubActivityMap[myClubId] || [];
    return bookings.filter(b => allowed.includes(b.activity));
  }, [bookings, myClubId, clubActivityMap]);

  useEffect(() => {
    const fetchData = async () => {
      const [bRes, pRes, uRes, aRes, cRes, mcRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.functions.invoke("admin-users", { body: { action: "list" } }),
        supabase.functions.invoke("admin-users", { body: { action: "list-admins" } }),
        supabase.from("clubs").select("*").order("name"),
        supabase.functions.invoke("admin-users", { body: { action: "my-club" } }),
      ]);
      if (bRes.data) setBookings(bRes.data);
      if (pRes.data) setProfiles(pRes.data);
      if (uRes.data?.users) setAllUsers(uRes.data.users);
      if (aRes.data?.users) setAdminUsers(aRes.data.users);
      if (cRes.data) setClubs(cRes.data as unknown as ClubRow[]);
      if (mcRes.data?.club_id) setMyClubId(mcRes.data.club_id);
      setLoadingData(false);
    };
    fetchData();
  }, []);

  const openEditDialog = (u: UserWithEmail) => {
    setEditUser(u);
    setEditEmail(u.email);
    setEditPhone(u.phone || "");
    setEditPassword("");
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setEditSaving(true);

    const body: Record<string, string> = { user_id: editUser.user_id };
    if (editEmail !== editUser.email) body.email = editEmail;
    if (editPhone !== (editUser.phone || "")) body.phone = editPhone;
    if (editPassword) body.password = editPassword;

    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { ...body, action: "update" },
    });

    setEditSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Update failed");
    } else {
      toast.success("User updated successfully");
      // Update local state
      setAllUsers((prev) =>
        prev.map((u) =>
          u.user_id === editUser.user_id
            ? { ...u, email: editEmail || u.email, phone: editPhone }
            : u
        )
      );
      setEditUser(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    const { data, error } = await supabase.functions.invoke("manage-admin", {
      body: { email: newAdminEmail, password: newAdminPassword, full_name: newAdminName, phone: newAdminPhone },
    });
    setCreatingAdmin(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create admin");
    } else {
      toast.success(`Admin account created for ${newAdminEmail}`);
      setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminPhone("");
      setShowCreateAdmin(false);
      const { data: aRes } = await supabase.functions.invoke("admin-users", { body: { action: "list-admins" } });
      if (aRes?.users) setAdminUsers(aRes.users);
    }
  };

  const openEditAdmin = (u: UserWithEmail) => {
    setEditAdmin(u);
    setEditAdminEmail(u.email);
    setEditAdminPhone(u.phone || "");
    setEditAdminPassword("");
    setEditAdminClubId(u.club_id || "");
  };

  const handleSaveAdmin = async () => {
    if (!editAdmin) return;
    setEditAdminSaving(true);

    const body: Record<string, string | null> = { user_id: editAdmin.user_id, action: "update" };
    if (editAdminEmail !== editAdmin.email) body.email = editAdminEmail;
    if (editAdminPhone !== (editAdmin.phone || "")) body.phone = editAdminPhone;
    if (editAdminPassword) body.password = editAdminPassword;
    body.club_id = (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null;

    const { data, error } = await supabase.functions.invoke("admin-users", { body });

    setEditAdminSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Update failed");
    } else {
      toast.success("Admin updated successfully");
      setAdminUsers((prev) =>
        prev.map((u) =>
          u.user_id === editAdmin.user_id
            ? { ...u, email: editAdminEmail || u.email, phone: editAdminPhone, club_id: (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null }
            : u
        )
      );
      setEditAdmin(null);
    }
  };

  // Date range state for charts (must be before early returns)
  const [bookingRange, setBookingRange] = useState<string>("today");
  const [revenueRange, setRevenueRange] = useState<string>("today");
  const [bookingCustomDate, setBookingCustomDate] = useState<Date | undefined>(new Date());
  const [revenueCustomRange, setRevenueCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: subDays(new Date(), 6), to: new Date() });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dailyRevenue = filteredBookings.filter(b => b.booking_date === todayStr).reduce((sum, b) => sum + getBookingRevenue(b), 0);
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);

  const revenueByCategoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredBookings.forEach(b => {
      grouped[b.activity_name] = (grouped[b.activity_name] || 0) + getBookingRevenue(b);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredBookings]);

  const bookingChartData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    if (bookingRange === "today") { start = startOfDay(now); end = endOfDay(now); }
    else if (bookingRange === "weekly") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfDay(now); }
    else if (bookingRange === "monthly") { start = startOfMonth(now); end = endOfDay(now); }
    else if (bookingRange === "custom" && bookingCustomDate) { start = startOfDay(bookingCustomDate); end = endOfDay(bookingCustomDate); }
    else { start = startOfDay(now); end = endOfDay(now); }
    const filtered = filteredBookings.filter(b => {
      const d = parseISO(b.booking_date);
      return isWithinInterval(d, { start, end });
    });
    const grouped: Record<string, number> = {};
    filtered.forEach(b => { grouped[b.activity] = (grouped[b.activity] || 0) + 1; });
    return ALL_CATEGORIES.map(c => ({ name: c.label, value: grouped[c.key] || 0 }));
  }, [filteredBookings, bookingRange, bookingCustomDate]);

  const revenueByCategoryFiltered = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    if (revenueRange === "today") { start = startOfDay(now); end = endOfDay(now); }
    else if (revenueRange === "weekly") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfDay(now); }
    else if (revenueRange === "monthly") { start = startOfMonth(now); end = endOfDay(now); }
    else if (revenueRange === "custom" && bookingCustomDate) { start = startOfDay(bookingCustomDate); end = endOfDay(bookingCustomDate); }
    else if (revenueRange === "custom-range" && revenueCustomRange.from && revenueCustomRange.to) { start = startOfDay(revenueCustomRange.from); end = endOfDay(revenueCustomRange.to); }
    else { start = startOfDay(now); end = endOfDay(now); }
    const filtered = filteredBookings.filter(b => {
      const d = parseISO(b.booking_date);
      return isWithinInterval(d, { start, end });
    });
    const grouped: Record<string, number> = {};
    filtered.forEach(b => { grouped[b.activity] = (grouped[b.activity] || 0) + getBookingRevenue(b); });
    return ALL_CATEGORIES.map(c => ({ name: c.label, value: grouped[c.key] || 0 }));
  }, [bookings, revenueRange, bookingCustomDate, revenueCustomRange]);

  if (loadingData) {
    return (
      <div className="min-h-screen">
        <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} assignedClubId={myClubId} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const DateRangeFilter = ({ value, onChange, showCustomDate, customDate, onCustomDateChange, showCustomRange, customRange, onCustomRangeChange }: {
    value: string; onChange: (v: string) => void;
    showCustomDate?: boolean; customDate?: Date; onCustomDateChange?: (d: Date | undefined) => void;
    showCustomRange?: boolean; customRange?: { from?: Date; to?: Date }; onCustomRangeChange?: (r: { from?: Date; to?: Date }) => void;
  }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] h-9 bg-secondary border-border text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="weekly">This Week</SelectItem>
          <SelectItem value="monthly">This Month</SelectItem>
          {showCustomDate && <SelectItem value="custom">Custom Date</SelectItem>}
          {showCustomRange && <SelectItem value="custom-range">Custom Range</SelectItem>}
        </SelectContent>
      </Select>
      {showCustomDate && value === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 text-sm", !customDate && "text-muted-foreground")}>
              <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
              {customDate ? format(customDate, "MMM dd, yyyy") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={customDate} onSelect={onCustomDateChange} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      )}
      {showCustomRange && value === "custom-range" && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-sm", !customRange?.from && "text-muted-foreground")}>
                {customRange?.from ? format(customRange.from, "MMM dd") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customRange?.from} onSelect={(d) => onCustomRangeChange?.({ ...customRange, from: d })} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-sm", !customRange?.to && "text-muted-foreground")}>
                {customRange?.to ? format(customRange.to, "MMM dd") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customRange?.to} onSelect={(d) => onCustomRangeChange?.({ ...customRange, to: d })} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} assignedClubId={myClubId} />
      <div className="container mx-auto px-6 pt-28 pb-16">

        {/* Dashboard / Overview */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="overview">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground mb-8">Revenue overview and booking analytics.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                    <DollarSign className="h-5 w-5 text-brand-tennis" />
                  </CardHeader>
                  <CardContent><div className="text-3xl font-bold font-heading text-foreground">${dailyRevenue.toLocaleString()}</div></CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent><div className="text-3xl font-bold font-heading text-foreground">${totalRevenue.toLocaleString()}</div></CardContent>
                </Card>
              </motion.div>
            </div>

            <Card className="bg-card border-border mb-6">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Bookings by Category</CardTitle>
                <DateRangeFilter value={bookingRange} onChange={setBookingRange} showCustomDate customDate={bookingCustomDate} onCustomDateChange={setBookingCustomDate} />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                    <YAxis allowDecimals={false} domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} />
                    <Bar dataKey="value" name="Bookings" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
                      {bookingChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Revenue</CardTitle>
                <DateRangeFilter value={revenueRange} onChange={setRevenueRange} showCustomDate customDate={bookingCustomDate} onCustomDateChange={setBookingCustomDate} showCustomRange customRange={revenueCustomRange} onCustomRangeChange={(r) => setRevenueCustomRange({ from: r.from, to: r.to })} />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByCategoryFiltered}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                    <YAxis domain={[0, 1000]} ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]} tickFormatter={(v: number) => `$${v}`} tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} formatter={(v: number) => [`$${v}`, "Revenue"]} />
                    <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
                      {revenueByCategoryFiltered.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="users">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Users</h1>
            <p className="text-muted-foreground mb-8">All registered customers.</p>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="w-[80px]">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users yet.</TableCell></TableRow>
                    ) : allUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading">Edit User — {editUser?.full_name || editUser?.email}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <PhoneInput id="edit-phone" value={editPhone} onChange={setEditPhone} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="edit-password">New Password <span className="text-muted-foreground text-xs">(leave empty to keep current)</span></Label>
                    <Input id="edit-password" type="password" placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                  </div>
                  <Button onClick={handleSaveUser} disabled={editSaving} className="w-full h-12 text-base font-semibold glow">
                    {editSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {/* Admins */}
        {activeTab === "admins" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="admins">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Admins</h1>
                <p className="text-muted-foreground">Manage admin accounts.</p>
              </div>
              <Button onClick={() => setShowCreateAdmin(true)} className="h-11 px-5 font-semibold glow">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Assigned Club</TableHead>
                      <TableHead className="w-[80px]">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No admins yet.</TableCell></TableRow>
                    ) : adminUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell>
                          {u.club_id ? (
                            <Badge variant="secondary" className="text-xs">
                              {clubs.find(c => c.id === u.club_id)?.name || "Unknown"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">All Clubs (Master)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditAdmin(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Admin Dialog - Large */}
            <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
              <DialogContent className="bg-card border-border max-w-2xl w-[66vw] min-h-[50vh]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">Edit Admin — {editAdmin?.full_name || editAdmin?.email}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-admin-email">Email</Label>
                      <Input id="edit-admin-email" type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="edit-admin-phone">Phone</Label>
                      <PhoneInput id="edit-admin-phone" value={editAdminPhone} onChange={setEditAdminPhone} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-admin-password">New Password <span className="text-muted-foreground text-xs">(leave empty to keep current)</span></Label>
                    <Input id="edit-admin-password" type="password" placeholder="••••••••" value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label>Assigned Club</Label>
                    <Select value={editAdminClubId} onValueChange={setEditAdminClubId}>
                      <SelectTrigger className="h-12 bg-secondary border-border mt-1">
                        <SelectValue placeholder="All Clubs (Master Admin)" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border z-50">
                        <SelectItem value="none">All Clubs (Master Admin)</SelectItem>
                        {clubs.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1.5">Assigning a club restricts this admin's dashboard to that club's data only.</p>
                  </div>
                  <Button onClick={handleSaveAdmin} disabled={editAdminSaving} className="w-full h-12 text-base font-semibold glow mt-4">
                    {editAdminSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Admin Dialog */}
            <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading">Add Admin</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="new-name">Full Name</Label>
                    <Input id="new-name" placeholder="John Doe" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="h-12 bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="new-email">Email</Label>
                    <Input id="new-email" type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="h-12 bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Password</Label>
                    <Input id="new-password" type="password" placeholder="••••••••" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required minLength={6} className="h-12 bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="new-phone">Phone Number</Label>
                    <PhoneInput id="new-phone" value={newAdminPhone} onChange={setNewAdminPhone} className="mt-1" />
                  </div>
                  <Button type="submit" disabled={creatingAdmin} className="w-full h-12 text-base font-semibold glow">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {creatingAdmin ? "Creating..." : "Create Admin"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {/* Reporting */}
        {activeTab === "reporting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reporting">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Reporting</h1>
            <p className="text-muted-foreground mb-8">Detailed booking analytics.</p>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-lg">Revenue by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueByCategoryFiltered}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} formatter={(v: number) => [`$${v}`, "Revenue"]} />
                      <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                        {revenueByCategoryFiltered.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-lg">Bookings by Category</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  {bookingChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={bookingChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {bookingChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No bookings yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-lg">All Bookings</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No bookings yet.</TableCell></TableRow>
                    ) : filteredBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.full_name}</TableCell>
                        <TableCell>{b.activity_name}</TableCell>
                        <TableCell>{b.booking_date}</TableCell>
                        <TableCell>{b.booking_time}</TableCell>
                        <TableCell>{b.phone}</TableCell>
                        <TableCell><Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Clubs & Partners */}
        {activeTab === "clubs" && (
          <ClubsTab />
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground mb-8">Configure your application settings.</p>
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                Settings coming soon.
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Promotions */}
        {activeTab === "promotions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="promotions">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Promotions</h1>
            <p className="text-muted-foreground mb-8">Manage deals and promotional offers.</p>
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                Promotions coming soon.
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
};

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in, or logged in but not admin → show login form
  if (!user || !isAdmin) {
    // If logged in but not admin, show access denied
    if (user && !isAdmin) {
      return (
        <div className="min-h-screen">
          <Navbar />
          <div className="flex min-h-screen items-center justify-center px-6 pt-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">This account does not have admin privileges.</p>
            </motion.div>
          </div>
        </div>
      );
    }

    return <AdminLoginForm />;
  }

  return <AdminDashboard />;
};

export default AdminPage;
