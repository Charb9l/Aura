import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, startOfWeek, startOfMonth, endOfDay, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { CalendarCheck, TrendingUp, ShieldCheck, LogIn, UserPlus, Pencil, DollarSign, Building2, Clock, User, Mail, Phone, MapPin, FileText, Trash2, CheckCircle, XCircle, Upload, X, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
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
}

const BookingsCalendarTab = ({ bookings, clubs, isMasterAdmin, onDeleteBooking, onUpdateBooking, allUsers }: { bookings: BookingRow[]; clubs?: ClubRow[]; isMasterAdmin?: boolean; onDeleteBooking?: (id: string) => void; onUpdateBooking?: (id: string, updates: Partial<BookingRow>) => void; allUsers?: UserWithEmail[] }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [showLogs, setShowLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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
    const active = activeFiltered.map(b => ({ ...b, status_label: "active" as const, deleted_at: null as string | null, deleted_by: null as string | null }));
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
    </div>
  );
};

const ClubsTab = ({ isMasterAdmin }: { isMasterAdmin: boolean }) => {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClub, setEditClub] = useState<ClubRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("clubs").select("*").order("name");
      if (data) setClubs(data as unknown as ClubRow[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const openEdit = (club: ClubRow) => {
    setEditClub(club);
    setEditName(club.name);
    setEditDescription(club.description || "");
    setEditLogoFile(null);
    // Resolve logo preview
    if (club.logo_url && club.logo_url.startsWith("http")) {
      setEditLogoPreview(club.logo_url);
    } else if (club.logo_url && clubLogoMap[club.logo_url]) {
      setEditLogoPreview(clubLogoMap[club.logo_url]);
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
      .update({ name: editName, description: editDescription || null, logo_url: logoUrl })
      .eq("id", editClub.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update club: " + error.message);
    } else {
      toast.success("Club updated successfully");
      setClubs(prev => prev.map(c => c.id === editClub.id ? { ...c, name: editName, description: editDescription || null, logo_url: logoUrl } : c));
      setEditClub(null);
    }
  };

  const getLogoSrc = (club: ClubRow) => {
    if (club.logo_url && club.logo_url.startsWith("http")) return club.logo_url;
    if (club.logo_url && clubLogoMap[club.logo_url]) return clubLogoMap[club.logo_url];
    return null;
  };

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
                {isMasterAdmin && <TableHead className="w-20">Edit</TableHead>}
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
                        <Button variant="ghost" size="icon" onClick={() => openEdit(club)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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

              <Button onClick={handleSave} disabled={saving || !editName} className="w-full h-12 text-base font-semibold glow">
                {saving ? "Saving..." : "Save Changes"}
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
            {/* Registered Customers */}
            <h1 className="font-heading text-4xl font-bold text-foreground mb-8">Registered Customers</h1>
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
                    {allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id)).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers yet.</TableCell></TableRow>
                    ) : allUsers.filter(u => !adminUsers.some(a => a.user_id === u.user_id)).map((u) => (
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
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Club Admins</h2>
            <p className="text-muted-foreground mb-6">Administrators assigned to clubs.</p>
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

        {/* Bookings Calendar */}
        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="bookings">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Bookings</h1>
            <p className="text-muted-foreground mb-8">View daily bookings by time slot.</p>
            <BookingsCalendarTab bookings={myClubId ? filteredBookings : bookings} clubs={clubs} isMasterAdmin={!myClubId} onDeleteBooking={(id) => setBookings(prev => prev.filter(b => b.id !== id))} onUpdateBooking={(id, updates) => setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))} allUsers={allUsers} />
          </motion.div>
        )}

        {/* Clubs & Partners */}
        {activeTab === "clubs" && (
          <ClubsTab isMasterAdmin={!myClubId} />
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
