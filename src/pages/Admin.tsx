import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { CalendarCheck, TrendingUp, ShieldCheck, LogIn, UserPlus, Pencil, DollarSign, Building2, User, History, Trash2 } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import AdminNavbar from "@/components/AdminNavbar";
import CustomerVisionTab from "@/components/CustomerVisionTab";
import MatchmakerTab from "@/components/admin/MatchmakerTab";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";

// Extracted admin modules
import { BookingRow, ProfileRow, UserWithEmail, ClubRow, getBookingRevenue, ALL_CATEGORIES, CHART_COLORS } from "@/components/admin/types";
import BookingsCalendarTab from "@/components/admin/BookingsCalendarTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ClubsTab from "@/components/admin/ClubsTab";
import ReportsTab from "@/components/admin/ReportsTab";
import HabitsTab from "@/components/admin/HabitsTab";
import ActivitiesTab from "@/components/admin/ActivitiesTab";

// ─── Main Admin Dashboard ──────────────────────────────────────
const AdminDashboard = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithEmail[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [editUser, setEditUser] = useState<UserWithEmail | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [adminUsers, setAdminUsers] = useState<UserWithEmail[]>([]);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminClubId, setNewAdminClubId] = useState<string>("none");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [editAdmin, setEditAdmin] = useState<UserWithEmail | null>(null);
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminClubId, setEditAdminClubId] = useState<string>("");
  const [editAdminSaving, setEditAdminSaving] = useState(false);

  const [formerDialogOpen, setFormerDialogOpen] = useState(false);
  const [formerDialogType, setFormerDialogType] = useState<"customer" | "admin">("customer");
  const [formerTab, setFormerTab] = useState<"current" | "former">("current");
  const [formerUsers, setFormerUsers] = useState<any[]>([]);
  const [formerLoading, setFormerLoading] = useState(false);

  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [myClubId, setMyClubId] = useState<string | null>(null);

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

  const filteredBookings = useMemo(() => {
    if (!myClubId) return bookings;
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

  const openEditDialog = (u: UserWithEmail) => { setEditUser(u); setEditName(u.full_name || ""); setEditEmail(u.email); setEditPhone(u.phone || ""); setEditPassword(""); };

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
    else { toast.success("User updated successfully"); setAllUsers(prev => prev.map(u => u.user_id === editUser.user_id ? { ...u, full_name: editName || u.full_name, email: editEmail || u.email, phone: editPhone } : u)); setEditUser(null); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    const { data, error } = await supabase.functions.invoke("manage-admin", { body: { email: newAdminEmail, password: newAdminPassword, full_name: newAdminName, phone: newAdminPhone, club_id: (newAdminClubId && newAdminClubId !== "none") ? newAdminClubId : null } });
    setCreatingAdmin(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed to create admin"); }
    else { toast.success(`Admin account created for ${newAdminEmail}`); setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminPhone(""); setNewAdminClubId("none"); setShowCreateAdmin(false); const { data: aRes } = await supabase.functions.invoke("admin-users", { body: { action: "list-admins" } }); if (aRes?.users) setAdminUsers(aRes.users); }
  };

  const openEditAdmin = (u: UserWithEmail) => { setEditAdmin(u); setEditAdminName(u.full_name || ""); setEditAdminEmail(u.email); setEditAdminPhone(u.phone || ""); setEditAdminPassword(""); setEditAdminClubId(u.club_id || ""); };

  const openFormerDialog = async (type: "customer" | "admin") => {
    setFormerDialogType(type); setFormerTab("current"); setFormerDialogOpen(true); setFormerLoading(true);
    const { data } = await supabase.functions.invoke("admin-users", { body: { action: "list-former", user_type: type } });
    setFormerUsers(data?.former_users || []); setFormerLoading(false);
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
    else { toast.success("Admin updated successfully"); setAdminUsers(prev => prev.map(u => u.user_id === editAdmin.user_id ? { ...u, full_name: editAdminName || u.full_name, email: editAdminEmail || u.email, phone: editAdminPhone, club_id: (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null } : u)); setEditAdmin(null); }
  };

  const handleDeleteAdmin = async () => {
    if (!editAdmin) return;
    if (!confirm(`Are you sure you want to permanently delete ${editAdmin.full_name || editAdmin.email}?`)) return;
    setEditAdminSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "delete-admin", user_id: editAdmin.user_id } });
    setEditAdminSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Delete failed"); }
    else { toast.success("Admin deleted successfully"); setAdminUsers(prev => prev.filter(u => u.user_id !== editAdmin.user_id)); setAllUsers(prev => prev.filter(u => u.user_id !== editAdmin.user_id)); setEditAdmin(null); }
  };

  // Dashboard chart state
  const [bookingRange, setBookingRange] = useState<string>("today");
  const [revenueRange, setRevenueRange] = useState<string>("today");
  const [bookingCustomDate, setBookingCustomDate] = useState<Date | undefined>(new Date());
  const [revenueCustomRange, setRevenueCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: subDays(new Date(), 6), to: new Date() });
  const [bookingFilterType, setBookingFilterType] = useState<string>("all");
  const [bookingFilterValue, setBookingFilterValue] = useState<string>("all");
  const [revenueFilterType, setRevenueFilterType] = useState<string>("all");
  const [revenueFilterValue, setRevenueFilterValue] = useState<string>("all");

  useEffect(() => { setBookingFilterValue("all"); }, [bookingFilterType]);
  useEffect(() => { setRevenueFilterValue("all"); }, [revenueFilterType]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dailyRevenue = filteredBookings.filter(b => b.booking_date === todayStr).reduce((sum, b) => sum + getBookingRevenue(b), 0);
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + getBookingRevenue(b), 0);

  const applyDashboardFilter = (list: BookingRow[], filterType: string, filterValue: string) => {
    if (filterType === "all" || filterValue === "all") return list;
    if (filterType === "activity") return list.filter(b => b.activity === filterValue);
    if (filterType === "club") { const clubActivities = clubActivityMap[filterValue] || []; return list.filter(b => clubActivities.includes(b.activity)); }
    return list;
  };

  const bookingChartData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    if (bookingRange === "today") { start = startOfDay(now); end = endOfDay(now); }
    else if (bookingRange === "weekly") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfDay(now); }
    else if (bookingRange === "monthly") { start = startOfMonth(now); end = endOfDay(now); }
    else if (bookingRange === "custom" && bookingCustomDate) { start = startOfDay(bookingCustomDate); end = endOfDay(bookingCustomDate); }
    else { start = startOfDay(now); end = endOfDay(now); }
    let filtered = filteredBookings.filter(b => { const d = parseISO(b.booking_date); return isWithinInterval(d, { start, end }); });
    filtered = applyDashboardFilter(filtered, bookingFilterType, bookingFilterValue);
    return [{ name: "Bookings", value: filtered.length }];
  }, [filteredBookings, bookingRange, bookingCustomDate, bookingFilterType, bookingFilterValue, clubActivityMap]);

  const revenueByCategoryFiltered = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    if (revenueRange === "today") { start = startOfDay(now); end = endOfDay(now); }
    else if (revenueRange === "weekly") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfDay(now); }
    else if (revenueRange === "monthly") { start = startOfMonth(now); end = endOfDay(now); }
    else if (revenueRange === "custom" && bookingCustomDate) { start = startOfDay(bookingCustomDate); end = endOfDay(bookingCustomDate); }
    else if (revenueRange === "custom-range" && revenueCustomRange.from && revenueCustomRange.to) { start = startOfDay(revenueCustomRange.from); end = endOfDay(revenueCustomRange.to); }
    else { start = startOfDay(now); end = endOfDay(now); }
    let filtered = filteredBookings.filter(b => { const d = parseISO(b.booking_date); return isWithinInterval(d, { start, end }); });
    filtered = applyDashboardFilter(filtered, revenueFilterType, revenueFilterValue);
    const total = filtered.reduce((sum, b) => sum + getBookingRevenue(b), 0);
    return [{ name: "Revenue", value: total }];
  }, [filteredBookings, revenueRange, bookingCustomDate, revenueCustomRange, revenueFilterType, revenueFilterValue, clubActivityMap]);

  if (loadingData) {
    return (
      <div className="min-h-screen flex">
        <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} assignedClubId={myClubId} />
        <div className="flex-1 md:ml-60 mt-14 md:mt-0 flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>
      </div>
    );
  }

  const DateRangeFilter = ({ value, onChange, showCustomDate, customDate, onCustomDateChange, showCustomRange, customRange, onCustomRangeChange }: {
    value: string; onChange: (v: string) => void;
    showCustomDate?: boolean; customDate?: Date; onCustomDateChange?: (d: Date | undefined) => void;
    showCustomRange?: boolean; customRange?: { from?: Date; to?: Date }; onCustomRangeChange?: (r: { from?: Date; to?: Date }) => void;
  }) => {
    const [customDateOpen, setCustomDateOpen] = useState(false);
    const [fromOpen, setFromOpen] = useState(false);
    const [toOpen, setToOpen] = useState(false);
    const handleRangeChange = (v: string) => { onChange(v); if (v === "custom") { onCustomDateChange?.(undefined); setTimeout(() => setCustomDateOpen(true), 100); } };
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={value} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-[140px] h-9 bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="weekly">This Week</SelectItem><SelectItem value="monthly">This Month</SelectItem>{showCustomDate && <SelectItem value="custom">Custom Date</SelectItem>}{showCustomRange && <SelectItem value="custom-range">Custom Range</SelectItem>}</SelectContent>
        </Select>
        {showCustomDate && value === "custom" && (
          <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("h-9 text-sm", !customDate && "text-muted-foreground")}><CalendarCheck className="h-3.5 w-3.5 mr-1.5" />{customDate ? format(customDate, "MMM dd, yyyy") : "Pick date"}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customDate} onSelect={(d) => { onCustomDateChange?.(d); setCustomDateOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} /></PopoverContent>
          </Popover>
        )}
        {showCustomRange && value === "custom-range" && (
          <div className="flex items-center gap-1.5">
            <Popover open={fromOpen} onOpenChange={setFromOpen}><PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("h-9 text-sm", !customRange?.from && "text-muted-foreground")}>{customRange?.from ? format(customRange.from, "MMM dd") : "From"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customRange?.from} onSelect={(d) => { onCustomRangeChange?.({ ...customRange, from: d }); setFromOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover>
            <span className="text-muted-foreground text-xs">→</span>
            <Popover open={toOpen} onOpenChange={setToOpen}><PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("h-9 text-sm", !customRange?.to && "text-muted-foreground")}>{customRange?.to ? format(customRange.to, "MMM dd") : "To"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customRange?.to} onSelect={(d) => { onCustomRangeChange?.({ ...customRange, to: d }); setToOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} assignedClubId={myClubId} />
      <div className="flex-1 md:ml-60 px-4 md:px-10 pt-[72px] md:pt-8 pb-16">

        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="overview">
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground mb-8">Revenue overview and booking analytics.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <Card className="bg-card border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle><DollarSign className="h-5 w-5 text-brand-tennis" /></CardHeader><CardContent><div className="text-3xl font-bold font-heading text-foreground">${dailyRevenue.toLocaleString()}</div></CardContent></Card>
              <Card className="bg-card border-border"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle><TrendingUp className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold font-heading text-foreground">${totalRevenue.toLocaleString()}</div></CardContent></Card>
            </div>
            <Card className="bg-card border-border mb-6">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Bookings</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={bookingFilterType} onValueChange={setBookingFilterType}><SelectTrigger className="w-[120px] h-9 bg-secondary border-border text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="activity">Activity</SelectItem><SelectItem value="club">Club</SelectItem></SelectContent></Select>
                  {bookingFilterType === "activity" && <Select value={bookingFilterValue} onValueChange={setBookingFilterValue}><SelectTrigger className="w-[150px] h-9 bg-secondary border-border text-sm"><SelectValue placeholder="All Activities" /></SelectTrigger><SelectContent><SelectItem value="all">All Activities</SelectItem>{ALL_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent></Select>}
                  {bookingFilterType === "club" && <Select value={bookingFilterValue} onValueChange={setBookingFilterValue}><SelectTrigger className="w-[180px] h-9 bg-secondary border-border text-sm"><SelectValue placeholder="All Clubs" /></SelectTrigger><SelectContent><SelectItem value="all">All Clubs</SelectItem>{clubs.sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>}
                  <DateRangeFilter value={bookingRange} onChange={setBookingRange} showCustomDate customDate={bookingCustomDate} onCustomDateChange={setBookingCustomDate} />
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto"><ResponsiveContainer width="100%" height={250}><BarChart data={bookingChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" /><XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} /><Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} /><Bar dataKey="value" name="Bookings" radius={[4, 4, 0, 0]} animationDuration={800} fill={CHART_COLORS[0]} /></BarChart></ResponsiveContainer></CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Revenue</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={revenueFilterType} onValueChange={setRevenueFilterType}><SelectTrigger className="w-[120px] h-9 bg-secondary border-border text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="activity">Activity</SelectItem><SelectItem value="club">Club</SelectItem></SelectContent></Select>
                  {revenueFilterType === "activity" && <Select value={revenueFilterValue} onValueChange={setRevenueFilterValue}><SelectTrigger className="w-[150px] h-9 bg-secondary border-border text-sm"><SelectValue placeholder="All Activities" /></SelectTrigger><SelectContent><SelectItem value="all">All Activities</SelectItem>{ALL_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent></Select>}
                  {revenueFilterType === "club" && <Select value={revenueFilterValue} onValueChange={setRevenueFilterValue}><SelectTrigger className="w-[180px] h-9 bg-secondary border-border text-sm"><SelectValue placeholder="All Clubs" /></SelectTrigger><SelectContent><SelectItem value="all">All Clubs</SelectItem>{clubs.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>}
                  <DateRangeFilter value={revenueRange} onChange={setRevenueRange} showCustomDate customDate={bookingCustomDate} onCustomDateChange={setBookingCustomDate} showCustomRange customRange={revenueCustomRange} onCustomRangeChange={(r) => setRevenueCustomRange({ from: r.from, to: r.to })} />
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto"><ResponsiveContainer width="100%" height={250}><BarChart data={revenueByCategoryFiltered}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" /><XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} /><YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} /><Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} formatter={(v: number) => [`$${v}`, "Revenue"]} /><Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]} animationDuration={800} fill={CHART_COLORS[1]} /></BarChart></ResponsiveContainer></CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="users">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground">Registered Customers</h1>
              <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => openFormerDialog("customer")}><History className="h-4 w-4" /> Current & Former</Button>
            </div>
            <Card className="bg-card border-border mb-10"><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="w-[80px]">Edit</TableHead></TableRow></TableHeader><TableBody>{allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id)).sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers yet.</TableCell></TableRow>) : allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id)).sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map(u => (<TableRow key={u.user_id}><TableCell className="font-medium">{u.full_name || "—"}</TableCell><TableCell className="text-xs sm:text-sm">{u.email}</TableCell><TableCell className="hidden sm:table-cell">{u.phone || "—"}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"><div><h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-2">Club Admins</h2><p className="text-muted-foreground text-sm">Administrators assigned to clubs.</p></div><Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => openFormerDialog("admin")}><History className="h-4 w-4" /> Current & Former</Button></div>
            <Card className="bg-card border-border"><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Assigned Club</TableHead><TableHead className="w-[80px]">Edit</TableHead></TableRow></TableHeader><TableBody>{adminUsers.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No club admins yet.</TableCell></TableRow>) : adminUsers.slice().sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map(u => (<TableRow key={u.user_id}><TableCell className="font-medium">{u.full_name || "—"}</TableCell><TableCell className="text-xs sm:text-sm">{u.email}</TableCell><TableCell className="hidden sm:table-cell">{u.phone || "—"}</TableCell><TableCell className="hidden md:table-cell">{u.club_id ? clubs.find(c => c.id === u.club_id)?.name || "—" : <Badge className="bg-primary/10 text-primary">Super Admin</Badge>}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => openEditAdmin(u)}><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>

            {/* Edit User Dialog */}
            <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
              <DialogContent className="bg-card border-border"><DialogHeader><DialogTitle className="font-heading">Edit User — {editUser?.full_name || editUser?.email}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label htmlFor="edit-name">Full Name</Label><Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
                  <div><Label htmlFor="edit-email">Email</Label><Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
                  <div><Label htmlFor="edit-phone">Phone</Label><PhoneInput id="edit-phone" value={editPhone} onChange={setEditPhone} className="mt-1" /></div>
                  <div><Label htmlFor="edit-password">New Password <span className="text-muted-foreground text-xs">(leave empty to keep current)</span></Label><Input id="edit-password" type="password" placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
                  <Button onClick={handleSaveUser} disabled={editSaving} className="w-full h-12 text-base font-semibold glow">{editSaving ? "Saving..." : "Save Changes"}</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Admin Dialog */}
            <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
              <DialogContent className="bg-card border-border max-w-2xl w-[66vw] min-h-[50vh]"><DialogHeader><DialogTitle className="font-heading text-xl">Edit Admin — {editAdmin?.full_name || editAdmin?.email}</DialogTitle></DialogHeader>
                <div className="space-y-5 pt-4">
                  <div><Label htmlFor="edit-admin-name">Full Name</Label><Input id="edit-admin-name" value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
                  <div className="grid md:grid-cols-2 gap-4"><div><Label htmlFor="edit-admin-email">Email</Label><Input id="edit-admin-email" type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div><div><Label htmlFor="edit-admin-phone">Phone</Label><PhoneInput id="edit-admin-phone" value={editAdminPhone} onChange={setEditAdminPhone} className="mt-1" /></div></div>
                  <div><Label htmlFor="edit-admin-password">New Password <span className="text-muted-foreground text-xs">(leave empty to keep current)</span></Label><Input id="edit-admin-password" type="password" placeholder="••••••••" value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" /></div>
                  <div><Label>Assigned Club</Label><Select value={editAdminClubId} onValueChange={setEditAdminClubId}><SelectTrigger className="h-12 bg-secondary border-border mt-1"><SelectValue placeholder="All Clubs (Master Admin)" /></SelectTrigger><SelectContent className="bg-card border-border z-50"><SelectItem value="none">All Clubs (Master Admin)</SelectItem>{clubs.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground mt-1.5">Assigning a club restricts this admin's dashboard to that club's data only.</p></div>
                  <Button onClick={handleSaveAdmin} disabled={editAdminSaving} className="w-full h-12 text-base font-semibold glow mt-4">{editAdminSaving ? "Saving..." : "Save Changes"}</Button>
                  <Button variant="destructive" onClick={handleDeleteAdmin} disabled={editAdminSaving} className="w-full h-12 text-base font-semibold mt-2"><Trash2 className="h-4 w-4 mr-2" /> Delete Admin</Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {activeTab === "admins" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="admins">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8"><div><h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Admins</h1><p className="text-muted-foreground text-sm">Manage admin accounts.</p></div><Button onClick={() => setShowCreateAdmin(true)} className="h-11 px-5 font-semibold glow self-start"><UserPlus className="h-4 w-4 mr-2" /> Add Admin</Button></div>
            <Card className="bg-card border-border"><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Assigned Club</TableHead><TableHead className="w-[80px]">Edit</TableHead></TableRow></TableHeader><TableBody>{adminUsers.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No admins yet.</TableCell></TableRow>) : adminUsers.slice().sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map(u => (<TableRow key={u.user_id}><TableCell className="font-medium">{u.full_name || "—"}</TableCell><TableCell className="text-xs sm:text-sm">{u.email}</TableCell><TableCell className="hidden sm:table-cell">{u.phone || "—"}</TableCell><TableCell className="hidden md:table-cell">{u.club_id ? <Badge variant="secondary" className="text-xs">{clubs.find(c => c.id === u.club_id)?.name || "Unknown"}</Badge> : <span className="text-xs text-muted-foreground">All Clubs (Master)</span>}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => openEditAdmin(u)}><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
            <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
              <DialogContent className="bg-card border-border"><DialogHeader><DialogTitle className="font-heading">Add Admin</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
                  <div><Label htmlFor="new-name">Full Name</Label><Input id="new-name" placeholder="John Doe" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required className="h-12 bg-secondary border-border mt-1" /></div>
                  <div><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="h-12 bg-secondary border-border mt-1" /></div>
                  <div><Label htmlFor="new-password">Password</Label><Input id="new-password" type="password" placeholder="••••••••" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required minLength={6} className="h-12 bg-secondary border-border mt-1" /></div>
                  <div><Label htmlFor="new-phone">Phone Number</Label><PhoneInput id="new-phone" value={newAdminPhone} onChange={setNewAdminPhone} className="mt-1" /></div>
                  <div><Label>Assign Club</Label><Select value={newAdminClubId} onValueChange={setNewAdminClubId}><SelectTrigger className="h-12 bg-secondary border-border mt-1"><SelectValue placeholder="All Clubs (Master Admin)" /></SelectTrigger><SelectContent className="bg-card border-border z-50"><SelectItem value="none">All Clubs (Master Admin)</SelectItem>{clubs.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground mt-1.5">Leave as "All Clubs" for a master admin.</p></div>
                  <Button type="submit" disabled={creatingAdmin} className="w-full h-12 text-base font-semibold glow"><UserPlus className="h-4 w-4 mr-2" />{creatingAdmin ? "Creating..." : "Create Admin"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="bookings">
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Bookings</h1>
            <p className="text-muted-foreground mb-8">View daily bookings by time slot.</p>
            <BookingsCalendarTab bookings={myClubId ? filteredBookings : bookings} clubs={clubs} isMasterAdmin={!myClubId} onDeleteBooking={(id) => setBookings(prev => prev.filter(b => b.id !== id))} onUpdateBooking={(id, updates) => setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))} onAddBooking={(b) => setBookings(prev => [b, ...prev])} allUsers={allUsers} />
          </motion.div>
        )}

        {activeTab === "clubs" && <ClubsTab isMasterAdmin={!myClubId} />}
        {activeTab === "academies" && <AcademiesTab />}
        {activeTab === "customer-vision" && <CustomerVisionTab onNavigateTab={setActiveTab} />}
        {activeTab === "matchmaker" && <MatchmakerTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "reports" && <ReportsTab />}

        {activeTab === "habits" && <HabitsTab />}
        {activeTab === "activities" && <ActivitiesTab />}

        {activeTab === "promotions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="promotions">
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Promotions</h1>
            <p className="text-muted-foreground mb-8">Manage deals and promotional offers.</p>
            <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">Promotions coming soon.</CardContent></Card>
          </motion.div>
        )}

        {/* Current & Former Dialog */}
        <Dialog open={formerDialogOpen} onOpenChange={setFormerDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl w-[66vw] min-h-[50vh]">
            <DialogHeader><DialogTitle className="font-heading text-xl">{formerDialogType === "customer" ? "Customers" : "Club Admins"}</DialogTitle></DialogHeader>
            <div className="flex gap-2 mb-4">
              <Button variant={formerTab === "current" ? "default" : "outline"} size="sm" onClick={() => setFormerTab("current")}>Current</Button>
              <Button variant={formerTab === "former" ? "default" : "outline"} size="sm" onClick={() => { setFormerTab("former"); if (formerUsers.length === 0 && !formerLoading) openFormerDialog(formerDialogType); }}>Former</Button>
            </div>
            {formerTab === "current" ? (
              <div className="max-h-[60vh] overflow-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>{formerDialogType === "admin" && <TableHead>Club</TableHead>}</TableRow></TableHeader><TableBody>{(formerDialogType === "customer" ? allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id)) : adminUsers).slice().sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map(u => (<TableRow key={u.user_id}><TableCell className="font-medium">{u.full_name || "—"}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.phone || "—"}</TableCell>{formerDialogType === "admin" && <TableCell>{u.club_id ? clubs.find(c => c.id === u.club_id)?.name || "—" : <Badge className="bg-primary/10 text-primary">Super Admin</Badge>}</TableCell>}</TableRow>))}</TableBody></Table></div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                {formerLoading ? <p className="text-muted-foreground text-center py-10">Loading...</p> : formerUsers.length === 0 ? <p className="text-muted-foreground text-center py-10">No former {formerDialogType === "customer" ? "customers" : "admins"} yet.</p> : (
                  <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>{formerDialogType === "admin" && <TableHead>Club</TableHead>}{formerDialogType === "admin" && <TableHead>Stint</TableHead>}<TableHead>Reason</TableHead></TableRow></TableHeader><TableBody>{formerUsers.slice().sort((a: any, b: any) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "")).map((fu: any) => (<TableRow key={fu.id}><TableCell className="font-medium">{fu.full_name || "—"}</TableCell><TableCell>{fu.email}</TableCell><TableCell>{fu.phone || "—"}</TableCell>{formerDialogType === "admin" && <TableCell>{fu.club_name || "Super Admin"}</TableCell>}{formerDialogType === "admin" && <TableCell className="text-sm text-muted-foreground">{fu.started_at ? format(new Date(fu.started_at), "MMM dd, yyyy") : "—"} → {format(new Date(fu.ended_at), "MMM dd, yyyy")}</TableCell>}<TableCell><Badge variant={fu.reason === "deleted" ? "destructive" : "secondary"} className="text-xs capitalize">{fu.reason}</Badge></TableCell></TableRow>))}</TableBody></Table>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

// ─── Page wrapper ──────────────────────────────────────────────
const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/admin-login", { replace: true });
    }
  }, [user, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) return (<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>);

  if (!user) return null; // Will redirect

  if (!isAdmin) return (<div className="min-h-screen"><Navbar /><div className="flex min-h-screen items-center justify-center px-6 pt-20"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center"><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><h2 className="font-heading text-2xl font-bold text-foreground mb-2">Access Denied</h2><p className="text-muted-foreground">This account does not have admin privileges.</p></motion.div></div></div>);

  return <AdminDashboard />;
};

export default AdminPage;
