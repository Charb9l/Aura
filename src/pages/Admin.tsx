import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { CalendarCheck, TrendingUp, ShieldCheck, LogIn, UserPlus, Pencil, DollarSign, Building2, Clock, User, Mail, Phone, MapPin, FileText, Trash2, CheckCircle, XCircle, Upload, X, Image, History, GraduationCap, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import AdminNavbar from "@/components/AdminNavbar";
import CustomerVisionTab from "@/components/CustomerVisionTab";
import AcademiesTab from "@/components/AcademiesTab";
import AdminMyPlayerTab from "@/components/AdminMyPlayerTab";
import ActivityColorPicker from "@/components/ActivityColorPicker";
import OfferingsTab from "@/components/OfferingsTab";
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
  let base = 0;
  if (b.activity === "basketball") {
    base = b.court_type === "full" ? 90 : 45;
  } else {
    base = ACTIVITY_PRICES[b.activity] || 0;
  }
  if (b.discount_type === "free") return 0;
  if (b.discount_type === "50%") return base * 0.5;
  return base;
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
  discount_type?: string | null;
  attendance_status?: string | null;
  created_by?: string | null;
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

const SettingsTab = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);

    if (profileErr) {
      toast.error("Failed to update profile: " + profileErr.message);
      setSaving(false);
      return;
    }

    if (email !== user.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        toast.error("Failed to update email: " + emailErr.message);
        setSaving(false);
        return;
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        setSaving(false);
        return;
      }
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) {
        toast.error("Failed to update password: " + passErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Account updated successfully");
  };

  if (activeSection === "colors") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-colors">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <ActivityColorPicker />
      </motion.div>
    );
  }

  if (activeSection === "account") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-account">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              My Account
            </CardTitle>
            <p className="text-sm text-muted-foreground">Edit your admin account details and credentials.</p>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <p className="text-muted-foreground text-sm py-6 text-center">Loading...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="acc-name">Full Name</Label>
                  <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="acc-email">Email</Label>
                  <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="acc-phone">Phone</Label>
                  <PhoneInput id="acc-phone" value={phone} onChange={setPhone} className="mt-1" />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Change Password</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="acc-pass">New Password</Label>
                      <Input id="acc-pass" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="acc-pass-confirm">Confirm New Password</Label>
                      <Input id="acc-pass-confirm" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Leave blank to keep your current password.</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-12 text-base font-semibold glow mt-2">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Configure your application settings.</p>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Setting</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-border cursor-pointer hover:bg-secondary/50" onClick={() => setActiveSection("account")}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    My Account
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">Edit your name, email, phone, and password</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="border-border cursor-pointer hover:bg-secondary/50" onClick={() => setActiveSection("colors")}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Activity Brand Colors
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">Set brand colors for each activity across the customer experience</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};



interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  has_academy: boolean;
  created_at: string;
}

// Opening hours for the calendar view
const OPEN_HOUR = 7;  // 7 AM
const CLOSE_HOUR = 22; // 10 PM
const timeSlots = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => {
  const h = OPEN_HOUR + i;
  const label = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`;
  return { hour: h, label };
});

interface AuditLogRow {
  id: string;
  booking_id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  full_name: string;
  email: string;
  phone: string;
  court_type: string | null;
  discount_type: string | null;
  user_id: string;
  deleted_by: string;
  deleted_at: string;
  created_at: string;
  created_by: string | null;
}

const ACTIVITY_OPTIONS = [
  { key: "basketball", label: "Basketball", name: "Basketball Court" },
  { key: "tennis", label: "Tennis", name: "Tennis Court" },
  { key: "pilates", label: "Pilates", name: "Pilates Studio" },
  { key: "aerial-yoga", label: "Aerial Yoga", name: "Aerial Yoga Studio" },
];

const HOUR_OPTIONS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => {
  const h = OPEN_HOUR + i;
  const label = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`;
  return { value: `${h}:00`, label };
});

const BookingsCalendarTab = ({ bookings, clubs, isMasterAdmin, onDeleteBooking, onUpdateBooking, onAddBooking, allUsers }: { bookings: BookingRow[]; clubs?: ClubRow[]; isMasterAdmin?: boolean; onDeleteBooking?: (id: string) => void; onUpdateBooking?: (id: string, updates: Partial<BookingRow>) => void; onAddBooking?: (booking: BookingRow) => void; allUsers?: UserWithEmail[] }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [showLogs, setShowLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Add booking state
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [addActivity, setAddActivity] = useState("");
  const [addDate, setAddDate] = useState<Date | undefined>(undefined);
  const [addTime, setAddTime] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addCourtType, setAddCourtType] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  // Build club activity map for filtering
  const clubActivityFilter = useMemo(() => {
    if (!isMasterAdmin || clubFilter === "all" || !clubs) return null;
    const club = clubs.find(c => c.id === clubFilter);
    if (!club) return null;
    const activities: string[] = [];
    club.offerings.forEach(o => {
      const lower = o.toLowerCase();
      if (lower.includes("basketball")) activities.push("basketball");
      if (lower.includes("tennis")) activities.push("tennis");
      if (lower.includes("pilates")) activities.push("pilates");
      if (lower.includes("yoga") || lower.includes("aerial")) activities.push("aerial-yoga");
    });
    return activities;
  }, [clubFilter, clubs, isMasterAdmin]);

  const dayBookings = useMemo(() => {
    let filtered = bookings.filter((b) => {
      try {
        return isSameDay(parseISO(b.booking_date), selectedDate);
      } catch { return false; }
    });
    if (clubActivityFilter) {
      filtered = filtered.filter(b => clubActivityFilter.includes(b.activity));
    }
    return filtered;
  }, [bookings, selectedDate, clubActivityFilter]);

  // Group bookings by hour
  const bookingsByHour = useMemo(() => {
    const map: Record<number, BookingRow[]> = {};
    dayBookings.forEach((b) => {
      // Parse booking_time like "10:00", "14:30", "3:00 PM" etc
      let hour = 0;
      const time = b.booking_time || "";
      const pmMatch = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (pmMatch) {
        hour = parseInt(pmMatch[1]);
        const ampm = pmMatch[3].toUpperCase();
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
      } else {
        const simple = time.match(/(\d{1,2}):?(\d{2})?/);
        if (simple) hour = parseInt(simple[1]);
      }
      if (!map[hour]) map[hour] = [];
      map[hour].push(b);
    });
    return map;
  }, [dayBookings]);

  // Fetch audit logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("booking_audit_log")
      .select("*")
      .order("deleted_at", { ascending: false });
    setAuditLogs((data as unknown as AuditLogRow[]) || []);
    setLogsLoading(false);
  };

  const filteredLogs = useMemo(() => {
    if (!clubActivityFilter) return auditLogs;
    return auditLogs.filter(l => clubActivityFilter.includes(l.activity));
  }, [auditLogs, clubActivityFilter]);

  // Combine active bookings + deleted logs for the full log view
  const allLogsEntries = useMemo(() => {
    const activeFiltered = clubActivityFilter ? bookings.filter(b => clubActivityFilter.includes(b.activity)) : bookings;
    const active = activeFiltered.map(b => ({ ...b, status_label: "active" as const, deleted_at: null as string | null, deleted_by: null as string | null, created_by: b.created_by || null }));
    const deleted = filteredLogs.map(l => ({ ...l, id: l.booking_id, status: "deleted", status_label: "deleted" as const, user_id: l.user_id }));
    return [...active, ...deleted].sort((a, b) => {
      const dateA = a.booking_date + a.booking_time;
      const dateB = b.booking_date + b.booking_time;
      return dateB.localeCompare(dateA);
    });
  }, [bookings, filteredLogs, clubActivityFilter]);

  const getAdminName = (uid: string | null) => {
    if (!uid || !allUsers) return "Unknown";
    const user = allUsers.find(u => u.user_id === uid);
    return user?.full_name || user?.email || "Unknown";
  };

  const handleAddBooking = async () => {
    if (!addActivity || !addDate || !addTime || !addName || !addEmail || !addPhone) {
      toast.error("Please fill in all fields");
      return;
    }
    setAddSaving(true);

    const activityOption = ACTIVITY_OPTIONS.find(a => a.key === addActivity);
    const { data: { user } } = await supabase.auth.getUser();

    const newBooking: any = {
      activity: addActivity,
      activity_name: activityOption?.name || addActivity,
      booking_date: format(addDate, "yyyy-MM-dd"),
      booking_time: addTime,
      full_name: addName,
      email: addEmail,
      phone: addPhone,
      user_id: user?.id,
      created_by: user?.id,
      status: "confirmed",
    };
    if (addActivity === "basketball" && addCourtType) {
      newBooking.court_type = addCourtType;
    }

    const { data, error } = await supabase.from("bookings").insert(newBooking).select().single();
    setAddSaving(false);

    if (error) {
      toast.error("Failed to add booking: " + error.message);
    } else {
      toast.success(`Booking added for ${addName}`);
      onAddBooking?.(data as unknown as BookingRow);
      setShowAddBooking(false);
      setAddActivity(""); setAddDate(undefined); setAddTime("");
      setAddName(""); setAddEmail(""); setAddPhone(""); setAddCourtType("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex items-center gap-4 flex-wrap">
        {isMasterAdmin && clubs && clubs.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Filter by club:</span>
            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="w-64 h-10 bg-secondary border-border">
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All Clubs &amp; Partners</SelectItem>
                {clubs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button
          variant={showLogs ? "default" : "outline"}
          size="sm"
          onClick={() => { setShowLogs(!showLogs); if (!showLogs && auditLogs.length === 0) fetchLogs(); }}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {showLogs ? "Back to Calendar" : "Logs"}
        </Button>
        <Button
          size="sm"
          onClick={() => setShowAddBooking(true)}
          className="gap-2 ml-auto"
        >
          <CalendarCheck className="h-4 w-4" />
          Add Booking
        </Button>
      </div>

      {showLogs ? (
        /* === LOGS VIEW === */
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Booking Logs
            </CardTitle>
            <p className="text-sm text-muted-foreground">{allLogsEntries.length} total entries (active + deleted)</p>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <p className="text-muted-foreground text-center py-10">Loading logs...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Deleted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLogsEntries.map((entry, i) => (
                    <TableRow key={`${entry.id}-${entry.status_label}-${i}`} className={entry.status_label === "deleted" ? "opacity-60" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{entry.full_name}</p>
                          <p className="text-xs text-muted-foreground">{entry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{entry.activity_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{entry.booking_date}</TableCell>
                      <TableCell className="text-sm text-foreground">{entry.booking_time}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {entry.created_by ? getAdminName(entry.created_by) : <span className="text-muted-foreground">Self</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.created_at ? format(new Date(entry.created_at), "PPp") : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.status_label === "active" ? (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit">
                            <Trash2 className="h-3 w-3" />
                            Deleted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {entry.deleted_by ? getAdminName(entry.deleted_by) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.deleted_at ? format(new Date(entry.deleted_at), "PPp") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* === CALENDAR VIEW === */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
            {/* Date picker */}
            <Card className="bg-card border-border self-start">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </CardContent>
            </Card>

            {/* Hourly schedule */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""} this day</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {timeSlots.map((slot) => {
                    const slotBookings = bookingsByHour[slot.hour] || [];
                    return (
                      <div key={slot.hour} className="flex min-h-[56px]">
                        <div className="w-24 shrink-0 flex items-start justify-end pr-4 py-3 border-r border-border">
                          <span className="text-xs font-medium text-muted-foreground">{slot.label}</span>
                        </div>
                        <div className="flex-1 py-2 px-3 flex flex-wrap gap-2">
                          {slotBookings.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => setSelectedBooking(b)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer",
                                b.attendance_status === "show" ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30"
                                  : b.attendance_status === "no_show" ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                                  : b.discount_type ? "bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
                                  : "bg-primary/10 text-primary"
                              )}
                            >
                              {b.attendance_status === "show" && <CheckCircle className="h-3.5 w-3.5" />}
                              {b.attendance_status === "no_show" && <XCircle className="h-3.5 w-3.5" />}
                              {!b.attendance_status && <User className="h-3.5 w-3.5" />}
                              <span>{b.full_name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{b.activity_name}</Badge>
                              {b.attendance_status === "show" && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">SHOW</Badge>
                              )}
                              {b.attendance_status === "no_show" && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-destructive/20 text-destructive border-destructive/30">NO SHOW</Badge>
                              )}
                              {!b.attendance_status && b.discount_type === "50%" && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">50% OFF</Badge>
                              )}
                              {!b.attendance_status && b.discount_type === "free" && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE</Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking detail dialog */}
          <Dialog open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Booking Details</DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{selectedBooking.full_name}</p>
                      <p className="text-xs text-muted-foreground">Customer</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedBooking.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedBooking.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedBooking.booking_date} at {selectedBooking.booking_time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedBooking.activity_name}{selectedBooking.court_type ? ` — ${selectedBooking.court_type}` : ""}</span>
                    </div>
                  </div>
                  {selectedBooking.discount_type && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Loyalty Discount</span>
                      {selectedBooking.discount_type === "50%" && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">50% OFF</Badge>
                      )}
                      {selectedBooking.discount_type === "free" && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={selectedBooking.status === "confirmed" ? "default" : "secondary"}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                  {selectedBooking.attendance_status && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Attendance</span>
                      {selectedBooking.attendance_status === "show" ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Show
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> No Show
                        </Badge>
                      )}
                    </div>
                  )}
                  {/* Show / No Show / Delete actions */}
                  {onUpdateBooking && !selectedBooking.attendance_status && (
                    <div className="pt-4 border-t border-border flex gap-3">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        onClick={async () => {
                          const { error } = await supabase.from("bookings").update({ attendance_status: "show" }).eq("id", selectedBooking.id);
                          if (error) {
                            toast.error("Failed to mark as show: " + error.message);
                          } else {
                            toast.success(`${selectedBooking.full_name} marked as Show ✓`);
                            onUpdateBooking(selectedBooking.id, { attendance_status: "show" });
                            setSelectedBooking(null);
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4" /> Show
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={async () => {
                          // Call the no-show edge function
                          const { error: fnError } = await supabase.functions.invoke("no-show-email", {
                            body: { booking_id: selectedBooking.id },
                          });
                          if (fnError) {
                            toast.error("Failed to mark no-show: " + fnError.message);
                          } else {
                            toast.success(`${selectedBooking.full_name} marked as No Show. -1 loyalty penalty applied.`);
                            onUpdateBooking(selectedBooking.id, { attendance_status: "no_show" });
                            setSelectedBooking(null);
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4" /> No Show
                      </Button>
                    </div>
                  )}
                  {onDeleteBooking && (
                    <div className={cn("border-t border-border", selectedBooking.attendance_status ? "pt-4" : "pt-2")}>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={async () => {
                          const { error } = await supabase.from("bookings").delete().eq("id", selectedBooking.id);
                          if (error) {
                            toast.error("Failed to delete booking: " + error.message);
                          } else {
                            toast.success("Booking deleted successfully");
                            onDeleteBooking(selectedBooking.id);
                            setSelectedBooking(null);
                          }
                        }}
                      >
                        Delete Booking
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Add Booking Dialog */}
      <Dialog open={showAddBooking} onOpenChange={setShowAddBooking}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Activity</Label>
              <Select value={addActivity} onValueChange={(v) => { setAddActivity(v); setAddCourtType(""); }}>
                <SelectTrigger className="h-12 bg-secondary border-border mt-1">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {ACTIVITY_OPTIONS.map(a => (
                    <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addActivity === "basketball" && (
              <div>
                <Label>Court Type</Label>
                <Select value={addCourtType} onValueChange={setAddCourtType}>
                  <SelectTrigger className="h-12 bg-secondary border-border mt-1">
                    <SelectValue placeholder="Select court type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="half">Half Court</SelectItem>
                    <SelectItem value="full">Full Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full h-12 mt-1 justify-start text-left font-normal", !addDate && "text-muted-foreground")}>
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      {addDate ? format(addDate, "MMM dd, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={addDate} onSelect={setAddDate} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Time</Label>
                <Select value={addTime} onValueChange={setAddTime}>
                  <SelectTrigger className="h-12 bg-secondary border-border mt-1">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    {HOUR_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Customer Name</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Full name" className="h-12 bg-secondary border-border mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@example.com" className="h-12 bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label>Phone</Label>
                <PhoneInput value={addPhone} onChange={setAddPhone} className="mt-1" />
              </div>
            </div>
            <Button onClick={handleAddBooking} disabled={addSaving} className="w-full h-12 text-base font-semibold glow">
              <CalendarCheck className="h-4 w-4 mr-2" />
              {addSaving ? "Adding..." : "Add Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface OfferingRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

const PicturesTab = () => {
  const [pictures, setPictures] = useState<{ id: string; image_url: string; display_order: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetchPictures();
  }, []);

  const fetchPictures = async () => {
    const { data } = await supabase.from("hero_pictures").select("*").order("display_order");
    setPictures((data as any[]) || []);
    setLoading(false);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArr.length === 0) { toast.error("Please upload image files"); return; }
    setUploading(true);

    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("hero-pictures")
        .upload(filePath, file, { cacheControl: "3600" });

      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }

      const { data: urlData } = supabase.storage.from("hero-pictures").getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from("hero_pictures").insert({
        image_url: imageUrl,
        display_order: pictures.length + fileArr.indexOf(file),
      } as any);

      if (dbError) { toast.error(`Save failed: ${dbError.message}`); continue; }
    }

    toast.success(`${fileArr.length} picture(s) uploaded`);
    fetchPictures();
    setUploading(false);
  };

  const handleDelete = async (pic: { id: string; image_url: string }) => {
    if (!confirm("Remove this picture from the hero background?")) return;
    // Extract filename from URL
    const urlParts = pic.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1].split("?")[0];
    await supabase.storage.from("hero-pictures").remove([fileName]);
    await supabase.from("hero_pictures").delete().eq("id", pic.id);
    setPictures(prev => prev.filter(p => p.id !== pic.id));
    toast.success("Picture removed");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="pictures">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Pictures</h1>
      <p className="text-muted-foreground mb-8">Manage hero background images for the landing page.</p>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => document.getElementById("hero-pics-input")?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer mb-10",
          dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-muted-foreground/50"
        )}
      >
        <input
          id="hero-pics-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {uploading ? "Uploading..." : "Drop images here or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">PNG, JPG, WEBP — up to 10MB each. Multiple files supported.</p>
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading pictures...</p>
      ) : pictures.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">No hero pictures yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Upload images above — they'll appear as the landing page background.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {pictures.map((pic) => (
            <motion.div
              key={pic.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative break-inside-avoid rounded-xl overflow-hidden border border-border bg-card"
            >
              <img
                src={pic.image_url}
                alt="Hero background"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(pic); }}
                  className="rounded-full bg-destructive p-3 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const ClubsTab = ({ isMasterAdmin }: { isMasterAdmin: boolean }) => {
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

  // Add club state
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

  // Academy sport picker state
  const [showAcademySportPicker, setShowAcademySportPicker] = useState(false);
  const [editShowAcademySportPicker, setEditShowAcademySportPicker] = useState(false);

  // Club locations state
  interface ClubLocationRow { id: string; club_id: string; name: string; location: string; }
  const [clubLocations, setClubLocations] = useState<ClubLocationRow[]>([]);
  const [addClubLocations, setAddClubLocations] = useState<{ name: string; location: string }[]>([]);
  const [editClubLocations, setEditClubLocations] = useState<ClubLocationRow[]>([]);
  const [editNewLocations, setEditNewLocations] = useState<{ name: string; location: string }[]>([]);

  // Club pictures state
  interface ClubPictureRow { id: string; club_id: string; image_url: string; display_order: number; }
  const [picturesClub, setPicturesClub] = useState<ClubRow | null>(null);
  const [clubPictures, setClubPictures] = useState<ClubPictureRow[]>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [picturesUploading, setPicturesUploading] = useState(false);

  // Add club pictures state
  const [addClubPicFiles, setAddClubPicFiles] = useState<File[]>([]);
  const [addClubPicPreviews, setAddClubPicPreviews] = useState<string[]>([]);

  // Edit club pictures state
  const [editClubPicFiles, setEditClubPicFiles] = useState<File[]>([]);
  const [editClubPicPreviews, setEditClubPicPreviews] = useState<string[]>([]);

  // Offerings management state
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

   // Edit offering state
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
    setEditClub(club);
    setEditName(club.name);
    setEditDescription(club.description || "");
    setEditOfferings(club.offerings || []);
    setEditHasAcademy(club.has_academy || false);
    setEditShowAcademySportPicker(false);
    setEditClubLocations(clubLocations.filter(l => l.club_id === club.id));
    setEditNewLocations([]);
    setEditLogoFile(null);
    if (club.logo_url && club.logo_url.startsWith("http")) {
      setEditLogoPreview(club.logo_url);
    } else {
      setEditLogoPreview(null);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setEditLogoFile(file);
    setEditLogoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSave = async () => {
    if (!editClub) return;
    setSaving(true);

    let logoUrl = editClub.logo_url;

    // Upload new logo if selected
    if (editLogoFile) {
      const ext = editLogoFile.name.split(".").pop() || "png";
      const filePath = `${editClub.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("club-logos")
        .upload(filePath, editLogoFile, { upsert: true, cacheControl: "0" });

      if (uploadError) {
        toast.error("Logo upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("club-logos")
        .getPublicUrl(filePath);

      // Add cache-busting timestamp so browsers fetch the new image
      logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    }

    const { error } = await supabase
      .from("clubs")
      .update({ name: editName, description: editDescription || null, logo_url: logoUrl, offerings: editOfferings, has_academy: editHasAcademy })
      .eq("id", editClub.id);

    // Save new locations
    if (editNewLocations.length > 0) {
      const locsToInsert = editNewLocations.filter(l => l.name.trim() && l.location.trim()).map(l => ({ club_id: editClub.id, name: l.name.trim(), location: l.location.trim() }));
      if (locsToInsert.length > 0) {
        const { data: newLocs } = await supabase.from("club_locations").insert(locsToInsert).select();
        if (newLocs) setClubLocations(prev => [...prev, ...(newLocs as unknown as ClubLocationRow[])]);
      }
    }

    // Delete removed locations
    const existingIds = editClubLocations.map(l => l.id);
    const originalIds = clubLocations.filter(l => l.club_id === editClub.id).map(l => l.id);
    const deletedIds = originalIds.filter(id => !existingIds.includes(id));
    if (deletedIds.length > 0) {
      await supabase.from("club_locations").delete().in("id", deletedIds);
      setClubLocations(prev => prev.filter(l => !deletedIds.includes(l.id)));
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to update club: " + error.message);
    } else {
      toast.success("Club updated successfully");
      setClubs(prev => prev.map(c => c.id === editClub.id ? { ...c, name: editName, description: editDescription || null, logo_url: logoUrl, offerings: editOfferings, has_academy: editHasAcademy } : c));
      setEditClub(null);
    }
  };

  const getLogoSrc = (club: ClubRow) => {
    if (club.logo_url && club.logo_url.startsWith("http")) return club.logo_url;
    return null;
  };

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to delete "${clubName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    if (error) {
      toast.error("Failed to delete club: " + error.message);
    } else {
      toast.success(`"${clubName}" deleted`);
      setClubs(prev => prev.filter(c => c.id !== clubId));
    }
  };

  const handleAddClubFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAddClubLogoFile(file);
    setAddClubLogoPreview(URL.createObjectURL(file));
  };

  const handleAddClub = async () => {
    if (!addClubName.trim()) { toast.error("Please enter a club name"); return; }
    setAddClubSaving(true);

    // Insert the club first
    const { data: newClub, error: insertError } = await supabase
      .from("clubs")
      .insert({ name: addClubName.trim(), description: addClubDescription.trim() || null, offerings: addClubOfferings, has_academy: addClubHasAcademy })
      .select()
      .single();

    if (insertError || !newClub) {
      toast.error("Failed to add club: " + (insertError?.message || "Unknown error"));
      setAddClubSaving(false);
      return;
    }

    // Upload logo if provided
    let logoUrl: string | null = null;
    if (addClubLogoFile) {
      const ext = addClubLogoFile.name.split(".").pop() || "png";
      const filePath = `${newClub.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("club-logos")
        .upload(filePath, addClubLogoFile, { upsert: true, cacheControl: "0" });

      if (uploadError) {
        toast.error("Club created but logo upload failed: " + uploadError.message);
      } else {
        const { data: urlData } = supabase.storage.from("club-logos").getPublicUrl(filePath);
        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.from("clubs").update({ logo_url: logoUrl }).eq("id", newClub.id);
      }
    }

    // Save locations
    if (addClubLocations.length > 0) {
      const locsToInsert = addClubLocations.filter(l => l.name.trim() && l.location.trim()).map(l => ({ club_id: (newClub as any).id, name: l.name.trim(), location: l.location.trim() }));
      if (locsToInsert.length > 0) {
        const { data: newLocs } = await supabase.from("club_locations").insert(locsToInsert).select();
        if (newLocs) setClubLocations(prev => [...prev, ...(newLocs as unknown as ClubLocationRow[])]);
      }
    }

    // Upload club pictures if provided
    if (addClubPicFiles.length > 0) {
      await uploadClubPictures((newClub as any).id, addClubPicFiles);
    }

    setAddClubSaving(false);
    toast.success(`Club "${addClubName.trim()}" added successfully`);
    setClubs(prev => [...prev, { ...newClub as unknown as ClubRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddClub(false);
    setAddClubName(""); setAddClubDescription(""); setAddClubOfferings([]); setAddClubHasAcademy(false);
    setAddClubLogoFile(null); setAddClubLogoPreview(null); setAddClubLocations([]); setShowAcademySportPicker(false);
    setAddClubPicFiles([]); setAddClubPicPreviews([]);
  };

  // === Club Pictures Management ===
  const openPictures = async (club: ClubRow) => {
    setPicturesClub(club);
    setPicturesLoading(true);
    const { data } = await supabase.from("club_pictures").select("*").eq("club_id", club.id).order("display_order");
    setClubPictures((data as unknown as ClubPictureRow[]) || []);
    setPicturesLoading(false);
  };

  const handlePictureUpload = async (files: FileList | File[]) => {
    if (!picturesClub) return;
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!fileArr.length) { toast.error("Please upload image files"); return; }
    setPicturesUploading(true);
    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large (max 10MB)`); continue; }
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${picturesClub.id}/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-pictures").upload(filePath, file, { cacheControl: "3600" });
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); continue; }
      const { data: urlData } = supabase.storage.from("club-pictures").getPublicUrl(filePath);
      const { error: dbError } = await supabase.from("club_pictures").insert({ club_id: picturesClub.id, image_url: urlData.publicUrl, display_order: clubPictures.length + fileArr.indexOf(file) } as any);
      if (dbError) { toast.error(`Save failed: ${dbError.message}`); continue; }
    }
    toast.success(`${fileArr.length} picture(s) uploaded`);
    const { data } = await supabase.from("club_pictures").select("*").eq("club_id", picturesClub.id).order("display_order");
    setClubPictures((data as unknown as ClubPictureRow[]) || []);
    setPicturesUploading(false);
  };

  const handleDeletePicture = async (pic: ClubPictureRow) => {
    if (!confirm("Remove this picture?")) return;
    const urlParts = pic.image_url.split("/");
    const fileName = urlParts.slice(-2).join("/").split("?")[0];
    await supabase.storage.from("club-pictures").remove([fileName]);
    await supabase.from("club_pictures").delete().eq("id", pic.id);
    setClubPictures(prev => prev.filter(p => p.id !== pic.id));
    toast.success("Picture removed");
  };

  const handleAddClubPicSelect = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    setAddClubPicFiles(prev => [...prev, ...fileArr]);
    setAddClubPicPreviews(prev => [...prev, ...fileArr.map(f => URL.createObjectURL(f))]);
  };

  const uploadClubPictures = async (clubId: string, files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${clubId}/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-pictures").upload(filePath, file, { cacheControl: "3600" });
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("club-pictures").getPublicUrl(filePath);
      await supabase.from("club_pictures").insert({ club_id: clubId, image_url: urlData.publicUrl, display_order: files.indexOf(file) } as any);
    }
  };

  // Get offering names from DB for dropdowns
  const offeringNames = useMemo(() => offerings.map(o => o.name), [offerings]);

  const handleAddOfferingFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAddOfferingLogoFile(file);
    setAddOfferingLogoPreview(URL.createObjectURL(file));
  };

  const handleAddOffering = async () => {
    if (!addOfferingName.trim()) { toast.error("Please enter an offering name"); return; }
    const slug = addOfferingSlug.trim() || addOfferingName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setAddOfferingSaving(true);

    const { data: newOffering, error: insertError } = await supabase
      .from("offerings")
      .insert({ name: addOfferingName.trim(), slug })
      .select()
      .single();

    if (insertError || !newOffering) {
      toast.error("Failed to add offering: " + (insertError?.message || "Unknown error"));
      setAddOfferingSaving(false);
      return;
    }

    let logoUrl: string | null = null;
    if (addOfferingLogoFile) {
      const ext = addOfferingLogoFile.name.split(".").pop() || "png";
      const filePath = `${newOffering.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("offering-logos")
        .upload(filePath, addOfferingLogoFile, { upsert: true, cacheControl: "0" });

      if (uploadError) {
        toast.error("Offering created but image upload failed: " + uploadError.message);
      } else {
        const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.from("offerings").update({ logo_url: logoUrl }).eq("id", newOffering.id);
      }
    }

    setAddOfferingSaving(false);
    toast.success(`Offering "${addOfferingName.trim()}" added`);
    setOfferings(prev => [...prev, { ...newOffering as unknown as OfferingRow, logo_url: logoUrl }].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddOffering(false);
    setAddOfferingName(""); setAddOfferingSlug(""); setAddOfferingLogoFile(null); setAddOfferingLogoPreview(null);
  };

  const handleEditOfferingFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setEditOfferingLogoFile(file);
    setEditOfferingLogoPreview(URL.createObjectURL(file));
  };

   const handleEditOfferingSave = async () => {
     if (!editOfferingId || !editOfferingName.trim()) return;
     setEditOfferingSaving(true);

     const newSlug = editOfferingSlug.trim() || editOfferingName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
     let logoUrl: string | undefined;

     if (editOfferingLogoFile) {
       const ext = editOfferingLogoFile.name.split(".").pop() || "png";
       const filePath = `${editOfferingId}.${ext}`;
       const { error: uploadError } = await supabase.storage
         .from("offering-logos")
         .upload(filePath, editOfferingLogoFile, { upsert: true, cacheControl: "0" });

       if (uploadError) {
         toast.error("Image upload failed: " + uploadError.message);
         setEditOfferingSaving(false);
         return;
       }

       const { data: urlData } = supabase.storage.from("offering-logos").getPublicUrl(filePath);
       logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
     }

     const updates: any = { name: editOfferingName.trim(), slug: newSlug };
     if (logoUrl) updates.logo_url = logoUrl;

     await supabase.from("offerings").update(updates).eq("id", editOfferingId);

     setOfferings(prev => prev.map(o => o.id === editOfferingId ? { ...o, name: editOfferingName.trim(), slug: newSlug, ...(logoUrl ? { logo_url: logoUrl } : {}) } : o));
     setEditOfferingSaving(false);
     toast.success("Offering updated");
     setOfferingsDialogMode("list");
     setEditOfferingId(null); setEditOfferingLogoFile(null); setEditOfferingLogoPreview(null);
   };

   const openEditOffering = (offering: OfferingRow) => {
     setEditOfferingId(offering.id);
     setEditOfferingName(offering.name);
     setEditOfferingSlug(offering.slug);
     setEditOfferingLogoPreview(offering.logo_url || null);
     setEditOfferingLogoFile(null);
     setOfferingsDialogMode("edit");
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
              <Building2 className="h-4 w-4" />
              Add Club
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
                <TableHead>Offerings</TableHead>
                {isMasterAdmin && <TableHead className="w-28">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={isMasterAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : clubs.length === 0 ? (
                <TableRow><TableCell colSpan={isMasterAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">No clubs yet.</TableCell></TableRow>
              ) : clubs.map((club) => {
                const logoSrc = getLogoSrc(club);
                return (
                  <TableRow key={club.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {logoSrc && (
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <img src={logoSrc} alt={club.name} className="h-full w-full object-contain" />
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
                    {isMasterAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(club)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openPictures(club)} title="Pictures">
                            <Image className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClub(club.id, club.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Edit Club
            </DialogTitle>
          </DialogHeader>
          {editClub && (
            <div className="space-y-5 pt-2">
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-secondary border-border" />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Logo</Label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                    dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                  )}
                  onClick={() => document.getElementById("club-logo-input")?.click()}
                >
                  <input
                    id="club-logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  {editLogoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-24 w-24 rounded-xl overflow-hidden bg-secondary">
                        <img src={editLogoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                      </div>
                      <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-secondary border-border min-h-[100px]"
                  placeholder="Brief description of the club..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Offerings</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editOfferings.map((o) => (
                    <Badge key={o} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                      {o}
                      <button type="button" onClick={() => { setEditOfferings(prev => prev.filter(x => x !== o)); if (o.toLowerCase().includes("academy")) { const hasOtherAcademy = editOfferings.filter(x => x !== o).some(x => x.toLowerCase().includes("academy")); if (!hasOtherAcademy) setEditHasAcademy(false); } }} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select value="" onValueChange={(v) => {
                    if (v === "__academy__") {
                      setEditShowAcademySportPicker(true);
                      return;
                    }
                    if (v && !editOfferings.includes(v)) setEditOfferings(prev => [...prev, v]);
                  }}>
                    <SelectTrigger className="h-10 bg-secondary border-border">
                      <SelectValue placeholder="Select an offering..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      {offeringNames.filter(o => !editOfferings.includes(o)).map(o => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                      <SelectItem value="__academy__" className="font-semibold text-primary">
                        <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academy</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Academy sport picker */}
                {editShowAcademySportPicker && (
                  <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                    <Label className="text-xs font-medium text-primary block">Choose Academy Sport</Label>
                    <div className="flex flex-wrap gap-2">
                      {offeringNames.map(name => {
                        const sportName = name.replace(/\s*(Court|Studio|Classes|Rental|\(Kids\))/gi, "").trim();
                        const academyLabel = `${sportName} Academy`;
                        if (editOfferings.includes(academyLabel)) return null;
                        return (
                          <Button key={name} type="button" variant="outline" size="sm" onClick={() => {
                            setEditOfferings(prev => [...prev, academyLabel]);
                            setEditHasAcademy(true);
                            setEditShowAcademySportPicker(false);
                          }}>
                            {sportName}
                          </Button>
                        );
                      })}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditShowAcademySportPicker(false)} className="text-xs text-muted-foreground">Cancel</Button>
                  </div>
                )}
              </div>

            {/* Club Locations */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Locations</Label>
                  {editClubLocations.map((loc) => (
                    <div key={loc.id} className="flex gap-2 mb-2">
                      <Input value={loc.name} disabled className="h-10 bg-secondary border-border opacity-70" />
                      <Input value={loc.location} disabled className="h-10 bg-secondary border-border opacity-70" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setEditClubLocations(prev => prev.filter(l => l.id !== loc.id))} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  {editNewLocations.map((loc, i) => (
                    <div key={`new-${i}`} className="flex gap-2 mb-2">
                      <Input placeholder="Court/Location Name" value={loc.name} onChange={(e) => { const updated = [...editNewLocations]; updated[i].name = e.target.value; setEditNewLocations(updated); }} className="h-10 bg-secondary border-border" />
                      <Input placeholder="Address/Area" value={loc.location} onChange={(e) => { const updated = [...editNewLocations]; updated[i].location = e.target.value; setEditNewLocations(updated); }} className="h-10 bg-secondary border-border" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setEditNewLocations(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditNewLocations(prev => [...prev, { name: "", location: "" }])} className="gap-1.5 text-xs">
                    <MapPin className="h-3.5 w-3.5" /> Add Location
                  </Button>
              </div>

              <Button onClick={handleSave} disabled={saving || !editName || (editClubLocations.length === 0 && editNewLocations.filter(l => l.name.trim() && l.location.trim()).length === 0)} className="w-full h-12 text-base font-semibold glow">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Club Dialog */}
      <Dialog open={showAddClub} onOpenChange={setShowAddClub}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add Club / Partner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Name</Label>
              <Input value={addClubName} onChange={(e) => setAddClubName(e.target.value)} placeholder="Enter club name" className="h-12 bg-secondary border-border" />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Logo</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setAddClubDragging(true); }}
                onDragLeave={() => setAddClubDragging(false)}
                onDrop={(e) => { e.preventDefault(); setAddClubDragging(false); const file = e.dataTransfer.files[0]; if (file) handleAddClubFileSelect(file); }}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                  addClubDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                )}
                onClick={() => document.getElementById("add-club-logo-input")?.click()}
              >
                <input
                  id="add-club-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddClubFileSelect(file); }}
                />
                {addClubLogoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-24 w-24 rounded-xl overflow-hidden bg-secondary">
                      <img src={addClubLogoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    </div>
                    <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Club Pictures</Label>
              <div
                className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer border-border hover:border-muted-foreground/50"
                onClick={() => document.getElementById("add-club-pics-input")?.click()}
              >
                <input id="add-club-pics-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleAddClubPicSelect(e.target.files); e.target.value = ""; }} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add pictures that show when customers click this club</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
                </div>
              </div>
              {addClubPicPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {addClubPicPreviews.map((preview, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-border aspect-video">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setAddClubPicFiles(prev => prev.filter((_, j) => j !== i)); setAddClubPicPreviews(prev => prev.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label>
              <Textarea
                value={addClubDescription}
                onChange={(e) => setAddClubDescription(e.target.value)}
                className="bg-secondary border-border min-h-[100px]"
                placeholder="Brief description of the club..."
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Offerings</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {addClubOfferings.map((o) => (
                  <Badge key={o} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                    {o}
                    <button type="button" onClick={() => { setAddClubOfferings(prev => prev.filter(x => x !== o)); if (o.toLowerCase().includes("academy")) { const hasOtherAcademy = addClubOfferings.filter(x => x !== o).some(x => x.toLowerCase().includes("academy")); if (!hasOtherAcademy) setAddClubHasAcademy(false); } }} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value="" onValueChange={(v) => {
                  if (v === "__academy__") {
                    setShowAcademySportPicker(true);
                    return;
                  }
                  if (v && !addClubOfferings.includes(v)) setAddClubOfferings(prev => [...prev, v]);
                }}>
                  <SelectTrigger className="h-10 bg-secondary border-border">
                    <SelectValue placeholder="Select an offering..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    {offeringNames.filter(o => !addClubOfferings.includes(o)).map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                    <SelectItem value="__academy__" className="font-semibold text-primary">
                      <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Academy</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Academy sport picker */}
              {showAcademySportPicker && (
                <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                  <Label className="text-xs font-medium text-primary block">Choose Academy Sport</Label>
                  <div className="flex flex-wrap gap-2">
                    {offeringNames.map(name => {
                      const sportName = name.replace(/\s*(Court|Studio|Classes|Rental|\(Kids\))/gi, "").trim();
                      const academyLabel = `${sportName} Academy`;
                      if (addClubOfferings.includes(academyLabel)) return null;
                      return (
                        <Button key={name} type="button" variant="outline" size="sm" onClick={() => {
                          setAddClubOfferings(prev => [...prev, academyLabel]);
                          setAddClubHasAcademy(true);
                          setShowAcademySportPicker(false);
                        }}>
                          {sportName}
                        </Button>
                      );
                    })}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAcademySportPicker(false)} className="text-xs text-muted-foreground">Cancel</Button>
                </div>
              )}
            </div>

            {/* Club Locations */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Locations</Label>
                {addClubLocations.map((loc, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input placeholder="Court/Location Name" value={loc.name} onChange={(e) => { const updated = [...addClubLocations]; updated[i].name = e.target.value; setAddClubLocations(updated); }} className="h-10 bg-secondary border-border" />
                    <Input placeholder="Address/Area" value={loc.location} onChange={(e) => { const updated = [...addClubLocations]; updated[i].location = e.target.value; setAddClubLocations(updated); }} className="h-10 bg-secondary border-border" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setAddClubLocations(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setAddClubLocations(prev => [...prev, { name: "", location: "" }])} className="gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Add Location
                </Button>
              </div>

            <Button onClick={handleAddClub} disabled={addClubSaving || !addClubName.trim() || addClubLocations.filter(l => l.name.trim() && l.location.trim()).length === 0} className="w-full h-12 text-base font-semibold glow">
              <Building2 className="h-4 w-4 mr-2" />
              {addClubSaving ? "Adding..." : "Add Club"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Club Pictures Dialog */}
      <Dialog open={!!picturesClub} onOpenChange={(o) => !o && setPicturesClub(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" /> Pictures — {picturesClub?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); handlePictureUpload(e.dataTransfer.files); }}
              onClick={() => document.getElementById("club-pics-input")?.click()}
              className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer border-border hover:border-muted-foreground/50"
            >
              <input id="club-pics-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handlePictureUpload(e.target.files); e.target.value = ""; }} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{picturesUploading ? "Uploading..." : "Drop images here or click to browse"}</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 10MB each</p>
              </div>
            </div>
            {picturesLoading ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Loading...</p>
            ) : clubPictures.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">No pictures yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {clubPictures.map((pic) => (
                  <div key={pic.id} className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                    <img src={pic.image_url} alt="Club" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePicture(pic); }} className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Offerings Dialog */}
      <Dialog open={showOfferingsDialog} onOpenChange={(o) => { setShowOfferingsDialog(o); if (!o) setOfferingsDialogMode("list"); }}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              {offeringsDialogMode === "list" ? "Offerings" : offeringsDialogMode === "add" ? "Add Offering" : "Edit Offering"}
            </DialogTitle>
          </DialogHeader>

          {offeringsDialogMode === "edit" ? (
             <div className="space-y-5 pt-2">
               <Button variant="ghost" size="sm" onClick={() => { setOfferingsDialogMode("list"); setEditOfferingId(null); setEditOfferingLogoFile(null); setEditOfferingLogoPreview(null); }} className="gap-1 -ml-2 mb-1">
                 ← Back to list
               </Button>
               <div>
                 <Label className="text-sm font-medium text-muted-foreground mb-2 block">Offering Name</Label>
                 <Input
                   value={editOfferingName}
                   onChange={(e) => {
                     setEditOfferingName(e.target.value);
                     setEditOfferingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                   }}
                   placeholder="e.g. Basketball Court"
                   className="h-12 bg-secondary border-border"
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug</Label>
                 <Input
                   value={editOfferingSlug}
                   onChange={(e) => setEditOfferingSlug(e.target.value)}
                   placeholder="e.g. basketball"
                   className="h-12 bg-secondary border-border"
                 />
                 <p className="text-xs text-muted-foreground mt-1">Auto-generated from name. Used internally.</p>
               </div>
               <div>
                 <Label className="text-sm font-medium text-muted-foreground mb-2 block">Offering Image</Label>
                 <div
                   onDragOver={(e) => { e.preventDefault(); setEditOfferingDragging(true); }}
                   onDragLeave={() => setEditOfferingDragging(false)}
                   onDrop={(e) => { e.preventDefault(); setEditOfferingDragging(false); const file = e.dataTransfer.files[0]; if (file) handleEditOfferingFileSelect(file); }}
                   className={cn(
                     "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                     editOfferingDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                   )}
                   onClick={() => document.getElementById("edit-offering-logo-input")?.click()}
                 >
                   <input
                     id="edit-offering-logo-input"
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={(e) => { const file = e.target.files?.[0]; if (file) handleEditOfferingFileSelect(file); }}
                   />
                   {editOfferingLogoPreview ? (
                     <div className="flex flex-col items-center gap-3">
                       <div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary">
                         <img src={editOfferingLogoPreview} alt="Offering preview" className="h-full w-full object-cover" />
                       </div>
                       <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2 py-4">
                       <Upload className="h-8 w-8 text-muted-foreground" />
                       <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                       <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                     </div>
                   )}
                 </div>
               </div>
               <Button onClick={handleEditOfferingSave} disabled={editOfferingSaving || !editOfferingName.trim()} className="w-full h-12 text-base font-semibold glow">
                 {editOfferingSaving ? "Saving..." : "Save Changes"}
               </Button>
             </div>
          ) : offeringsDialogMode === "list" ? (
            <div className="space-y-4 pt-2">
              {offerings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No offerings yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {offerings.map((o) => (
                    <div key={o.id} onClick={() => openEditOffering(o)} className="flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4 cursor-pointer hover:border-primary/50 hover:bg-secondary transition-all">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {o.logo_url ? (
                          <img src={o.logo_url} alt={o.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Image className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.slug}</p>
                      </div>
                      <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setOfferingsDialogMode("add")} className="w-full h-12 text-base font-semibold glow gap-2">
                <Image className="h-4 w-4" />
                Add Offering
              </Button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setOfferingsDialogMode("list")} className="gap-1 -ml-2 mb-1">
                ← Back to list
              </Button>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Offering Name</Label>
                <Input
                  value={addOfferingName}
                  onChange={(e) => {
                    setAddOfferingName(e.target.value);
                    setAddOfferingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }}
                  placeholder="e.g. Basketball Court"
                  className="h-12 bg-secondary border-border"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Slug (URL-friendly ID)</Label>
                <Input
                  value={addOfferingSlug}
                  onChange={(e) => setAddOfferingSlug(e.target.value)}
                  placeholder="e.g. basketball"
                  className="h-12 bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Used internally for booking routing. Auto-generated from name.</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Offering Image</Label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setAddOfferingDragging(true); }}
                  onDragLeave={() => setAddOfferingDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setAddOfferingDragging(false); const file = e.dataTransfer.files[0]; if (file) handleAddOfferingFileSelect(file); }}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                    addOfferingDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                  )}
                  onClick={() => document.getElementById("add-offering-logo-input")?.click()}
                >
                  <input
                    id="add-offering-logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddOfferingFileSelect(file); }}
                  />
                  {addOfferingLogoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-32 w-32 rounded-xl overflow-hidden bg-secondary">
                        <img src={addOfferingLogoPreview} alt="Offering preview" className="h-full w-full object-cover" />
                      </div>
                      <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground">This image will appear on the booking page</p>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleAddOffering} disabled={addOfferingSaving || !addOfferingName.trim()} className="w-full h-12 text-base font-semibold glow">
                <Image className="h-4 w-4 mr-2" />
                {addOfferingSaving ? "Adding..." : "Add Offering"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  const [newAdminClubId, setNewAdminClubId] = useState<string>("none");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Admin edit state
  const [editAdmin, setEditAdmin] = useState<UserWithEmail | null>(null);
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminClubId, setEditAdminClubId] = useState<string>("");
  const [editAdminSaving, setEditAdminSaving] = useState(false);

  // Former users state
  const [formerDialogOpen, setFormerDialogOpen] = useState(false);
  const [formerDialogType, setFormerDialogType] = useState<"customer" | "admin">("customer");
  const [formerTab, setFormerTab] = useState<"current" | "former">("current");
  const [formerUsers, setFormerUsers] = useState<any[]>([]);
  const [formerLoading, setFormerLoading] = useState(false);

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
      body: { email: newAdminEmail, password: newAdminPassword, full_name: newAdminName, phone: newAdminPhone, club_id: (newAdminClubId && newAdminClubId !== "none") ? newAdminClubId : null },
    });
    setCreatingAdmin(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create admin");
    } else {
      toast.success(`Admin account created for ${newAdminEmail}`);
      setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminPhone(""); setNewAdminClubId("none");
      setShowCreateAdmin(false);
      const { data: aRes } = await supabase.functions.invoke("admin-users", { body: { action: "list-admins" } });
      if (aRes?.users) setAdminUsers(aRes.users);
    }
  };

  const openEditAdmin = (u: UserWithEmail) => {
    setEditAdmin(u);
    setEditAdminName(u.full_name || "");
    setEditAdminEmail(u.email);
    setEditAdminPhone(u.phone || "");
    setEditAdminPassword("");
    setEditAdminClubId(u.club_id || "");
  };

  const openFormerDialog = async (type: "customer" | "admin") => {
    setFormerDialogType(type);
    setFormerTab("current");
    setFormerDialogOpen(true);
    setFormerLoading(true);
    const { data } = await supabase.functions.invoke("admin-users", {
      body: { action: "list-former", user_type: type },
    });
    setFormerUsers(data?.former_users || []);
    setFormerLoading(false);
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
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Update failed");
    } else {
      toast.success("Admin updated successfully");
      setAdminUsers((prev) =>
        prev.map((u) =>
          u.user_id === editAdmin.user_id
            ? { ...u, full_name: editAdminName || u.full_name, email: editAdminEmail || u.email, phone: editAdminPhone, club_id: (editAdminClubId && editAdminClubId !== "none") ? editAdminClubId : null }
            : u
        )
      );
      setEditAdmin(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!editAdmin) return;
    if (!confirm(`Are you sure you want to permanently delete ${editAdmin.full_name || editAdmin.email}? This cannot be undone.`)) return;
    setEditAdminSaving(true);

    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete-admin", user_id: editAdmin.user_id },
    });

    setEditAdminSaving(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Delete failed");
    } else {
      toast.success("Admin deleted successfully");
      setAdminUsers((prev) => prev.filter((u) => u.user_id !== editAdmin.user_id));
      setAllUsers((prev) => prev.filter((u) => u.user_id !== editAdmin.user_id));
      setEditAdmin(null);
    }
  };

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
      <div className="min-h-screen flex">
        <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} assignedClubId={myClubId} />
        <div className="flex-1 ml-56 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
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

    const handleRangeChange = (v: string) => {
      onChange(v);
      if (v === "custom") {
        // Clear the date so user must pick one, then open the popover
        onCustomDateChange?.(undefined);
        setTimeout(() => setCustomDateOpen(true), 100);
      }
    };

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={value} onValueChange={handleRangeChange}>
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
          <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-sm", !customDate && "text-muted-foreground")}>
                <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
                {customDate ? format(customDate, "MMM dd, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customDate} onSelect={(d) => { onCustomDateChange?.(d); setCustomDateOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        )}
        {showCustomRange && value === "custom-range" && (
          <div className="flex items-center gap-1.5">
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 text-sm", !customRange?.from && "text-muted-foreground")}>
                  {customRange?.from ? format(customRange.from, "MMM dd") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customRange?.from} onSelect={(d) => { onCustomRangeChange?.({ ...customRange, from: d }); setFromOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-xs">→</span>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 text-sm", !customRange?.to && "text-muted-foreground")}>
                  {customRange?.to ? format(customRange.to, "MMM dd") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customRange?.to} onSelect={(d) => { onCustomRangeChange?.({ ...customRange, to: d }); setToOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} assignedClubId={myClubId} />
      <div className="flex-1 ml-56 px-8 pt-10 pb-16">

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
            {/* Registered Customers */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-heading text-4xl font-bold text-foreground">Registered Customers</h1>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openFormerDialog("customer")}>
                <History className="h-4 w-4" />
                Current & Former
              </Button>
            </div>
            <Card className="bg-card border-border mb-10">
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
                    {allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id)).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers yet.</TableCell></TableRow>
                    ) : allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id)).map((u) => (
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

            {/* Club Admins */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Club Admins</h2>
                <p className="text-muted-foreground">Administrators assigned to clubs.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openFormerDialog("admin")}>
                <History className="h-4 w-4" />
                Current & Former
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
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No club admins yet.</TableCell></TableRow>
                    ) : adminUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell>
                          {u.club_id
                            ? clubs.find(c => c.id === u.club_id)?.name || "—"
                            : <Badge className="bg-primary/10 text-primary">Super Admin</Badge>
                          }
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

            {/* Edit Admin Dialog - Large */}
            <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
              <DialogContent className="bg-card border-border max-w-2xl w-[66vw] min-h-[50vh]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">Edit Admin — {editAdmin?.full_name || editAdmin?.email}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div>
                    <Label htmlFor="edit-admin-name">Full Name</Label>
                    <Input id="edit-admin-name" value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                  </div>
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
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAdmin}
                    disabled={editAdminSaving}
                    className="w-full h-12 text-base font-semibold mt-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Admin
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
                  <div>
                    <Label>Assign Club</Label>
                    <Select value={newAdminClubId} onValueChange={setNewAdminClubId}>
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
                    <p className="text-xs text-muted-foreground mt-1.5">Leave as "All Clubs" for a master admin.</p>
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

        {/* Bookings Calendar */}
        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="bookings">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Bookings</h1>
            <p className="text-muted-foreground mb-8">View daily bookings by time slot.</p>
            <BookingsCalendarTab bookings={myClubId ? filteredBookings : bookings} clubs={clubs} isMasterAdmin={!myClubId} onDeleteBooking={(id) => setBookings(prev => prev.filter(b => b.id !== id))} onUpdateBooking={(id, updates) => setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))} onAddBooking={(b) => setBookings(prev => [b, ...prev])} allUsers={allUsers} />
          </motion.div>
        )}

        {/* Clubs & Partners (accessible via Customer Vision) */}
        {activeTab === "clubs" && (
          <ClubsTab isMasterAdmin={!myClubId} />
        )}


        {/* Academies */}
        {activeTab === "academies" && (
          <AcademiesTab />
        )}

        {/* Customer Vision */}
        {activeTab === "customer-vision" && (
          <CustomerVisionTab onNavigateTab={setActiveTab} />
        )}

        {/* Pictures tab removed - now managed within Customer Vision */}

        {/* MyPlayer Config */}
        {activeTab === "myplayer" && (
          <AdminMyPlayerTab />
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <SettingsTab />
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

        {/* Current & Former Dialog */}
        <Dialog open={formerDialogOpen} onOpenChange={setFormerDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl w-[66vw] min-h-[50vh]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {formerDialogType === "customer" ? "Customers" : "Club Admins"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mb-4">
              <Button
                variant={formerTab === "current" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormerTab("current")}
              >
                Current
              </Button>
              <Button
                variant={formerTab === "former" ? "default" : "outline"}
                size="sm"
                onClick={() => { setFormerTab("former"); if (formerUsers.length === 0 && !formerLoading) openFormerDialog(formerDialogType); }}
              >
                Former
              </Button>
            </div>

            {formerTab === "current" ? (
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      {formerDialogType === "admin" && <TableHead>Club</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(formerDialogType === "customer"
                      ? allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id && a.club_id))
                      : adminUsers
                    ).map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        {formerDialogType === "admin" && (
                          <TableCell>
                            {u.club_id
                              ? clubs.find(c => c.id === u.club_id)?.name || "—"
                              : <Badge className="bg-primary/10 text-primary">Super Admin</Badge>
                            }
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                {formerLoading ? (
                  <p className="text-muted-foreground text-center py-10">Loading...</p>
                ) : formerUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10">No former {formerDialogType === "customer" ? "customers" : "admins"} yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        {formerDialogType === "admin" && <TableHead>Club</TableHead>}
                        {formerDialogType === "admin" && <TableHead>Stint</TableHead>}
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formerUsers.map((fu: any) => (
                        <TableRow key={fu.id}>
                          <TableCell className="font-medium">{fu.full_name || "—"}</TableCell>
                          <TableCell>{fu.email}</TableCell>
                          <TableCell>{fu.phone || "—"}</TableCell>
                          {formerDialogType === "admin" && (
                            <TableCell>{fu.club_name || "Super Admin"}</TableCell>
                          )}
                          {formerDialogType === "admin" && (
                            <TableCell className="text-sm text-muted-foreground">
                              {fu.started_at ? format(new Date(fu.started_at), "MMM dd, yyyy") : "—"} → {format(new Date(fu.ended_at), "MMM dd, yyyy")}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge variant={fu.reason === "deleted" ? "destructive" : "secondary"} className="text-xs capitalize">
                              {fu.reason}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

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
