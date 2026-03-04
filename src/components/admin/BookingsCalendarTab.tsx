import { useState, useMemo, useEffect } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { CalendarCheck, Clock, User, Mail, Phone, MapPin, FileText, Trash2, CheckCircle, XCircle, Search, GraduationCap, Eye, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { BookingRow, ClubRow, UserWithEmail, AuditLogRow, OPEN_HOUR, CLOSE_HOUR, ACTIVITY_OPTIONS } from "./types";
import AdminFinderInput from "./AdminFinderInput";

const timeSlots = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => {
  const h = OPEN_HOUR + i;
  const label = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`;
  return { hour: h, label };
});


interface Props {
  bookings: BookingRow[];
  clubs?: ClubRow[];
  isMasterAdmin?: boolean;
  onDeleteBooking?: (id: string) => void;
  onUpdateBooking?: (id: string, updates: Partial<BookingRow>) => void;
  onAddBooking?: (booking: BookingRow) => void;
  allUsers?: UserWithEmail[];
  initialDate?: string | null;
  onInitialDateHandled?: () => void;
}

const BookingsCalendarTab = ({ bookings, clubs, isMasterAdmin, onDeleteBooking, onUpdateBooking, onAddBooking, allUsers, initialDate, onInitialDateHandled }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate ? parseISO(initialDate) : new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [bookingPrice, setBookingPrice] = useState<{ price: number; label: string | null } | null>(null);
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [showLogs, setShowLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logActivityFilter, setLogActivityFilter] = useState<string>("all");
  const [logAcademyOnly, setLogAcademyOnly] = useState(false);

  // Fetch price when a booking is selected
  useEffect(() => {
    if (!selectedBooking) { setBookingPrice(null); return; }
    const fetchPrice = async () => {
      const slug = selectedBooking.activity;
      const courtType = selectedBooking.court_type;
      let query = supabase.from("club_activity_prices").select("price, price_label").eq("activity_slug", slug);
      if (courtType) {
        query = query.eq("price_label", courtType);
      }
      const { data } = await query.limit(1).maybeSingle();
      if (data) {
        setBookingPrice({ price: data.price, label: data.price_label });
      } else {
        // fallback: try without price_label filter
        const { data: fallback } = await supabase.from("club_activity_prices").select("price, price_label").eq("activity_slug", slug).limit(1).maybeSingle();
        setBookingPrice(fallback ? { price: fallback.price, label: fallback.price_label } : null);
      }
    };
    fetchPrice();
  }, [selectedBooking]);


  useEffect(() => {
    if (initialDate) {
      setSelectedDate(parseISO(initialDate));
      onInitialDateHandled?.();
    }
  }, [initialDate, onInitialDateHandled]);

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
      try { return isSameDay(parseISO(b.booking_date), selectedDate); } catch { return false; }
    });
    if (clubActivityFilter) filtered = filtered.filter(b => clubActivityFilter.includes(b.activity));
    return filtered;
  }, [bookings, selectedDate, clubActivityFilter]);

  const bookingsByHour = useMemo(() => {
    const map: Record<number, BookingRow[]> = {};
    dayBookings.forEach((b) => {
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

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase.from("booking_audit_log").select("*").order("deleted_at", { ascending: false });
    setAuditLogs((data as unknown as AuditLogRow[]) || []);
    setLogsLoading(false);
  };

  const filteredLogs = useMemo(() => {
    if (!clubActivityFilter) return auditLogs;
    return auditLogs.filter(l => clubActivityFilter.includes(l.activity));
  }, [auditLogs, clubActivityFilter]);

  const allLogsEntries = useMemo(() => {
    const activeFiltered = clubActivityFilter ? bookings.filter(b => clubActivityFilter.includes(b.activity)) : bookings;
    const active = activeFiltered.map(b => ({ ...b, status_label: (b.attendance_status === "show" ? "show" : b.attendance_status === "no_show" ? "no_show" : "pending") as "show" | "no_show" | "pending", deleted_at: null as string | null, deleted_by: null as string | null, created_by: b.created_by || null }));
    const deleted = filteredLogs.map(l => ({ ...l, id: l.booking_id, status: "deleted", status_label: "deleted" as const, user_id: l.user_id }));
    let combined = [...active, ...deleted].sort((a, b) => {
      const dateA = a.booking_date + a.booking_time;
      const dateB = b.booking_date + b.booking_time;
      return dateB.localeCompare(dateA);
    });
    // Apply search
    if (logSearch) {
      const q = logSearch.toLowerCase();
      combined = combined.filter(e => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.phone || "").toLowerCase().includes(q) || e.activity_name.toLowerCase().includes(q));
    }
    // Apply activity filter
    if (logActivityFilter !== "all") {
      combined = combined.filter(e => e.activity === logActivityFilter);
    }
    // Apply academy only filter
    if (logAcademyOnly && clubs) {
      const academyActivities = new Set<string>();
      clubs.filter(c => c.has_academy).forEach(c => {
        c.offerings.forEach(o => {
          const lower = o.toLowerCase();
          if (lower.includes("basketball")) academyActivities.add("basketball");
          if (lower.includes("tennis")) academyActivities.add("tennis");
          if (lower.includes("pilates")) academyActivities.add("pilates");
          if (lower.includes("yoga") || lower.includes("aerial")) academyActivities.add("aerial-yoga");
        });
      });
      combined = combined.filter(e => academyActivities.has(e.activity));
    }
    return combined;
  }, [bookings, filteredLogs, clubActivityFilter, logSearch, logActivityFilter, logAcademyOnly, clubs]);

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
                {clubs.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button variant={showLogs ? "default" : "outline"} size="sm" onClick={() => { setShowLogs(!showLogs); if (!showLogs && auditLogs.length === 0) fetchLogs(); }} className="gap-2">
          <FileText className="h-4 w-4" />
          {showLogs ? "Back to Calendar" : "Logs"}
        </Button>
      </div>

      {showLogs ? (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Booking Logs
            </CardTitle>
            <p className="text-sm text-muted-foreground">{allLogsEntries.length} total entries (active + deleted)</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <AdminFinderInput value={logSearch} onChange={setLogSearch} placeholder="Search by name, email, phone..." className="max-w-xs" suggestions={Array.from(new Set(bookings.map(b => b.full_name))).map(n => ({ label: n, sub: bookings.find(b => b.full_name === n)?.email }))} />
              <Select value={logActivityFilter} onValueChange={setLogActivityFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-secondary border-border text-sm"><SelectValue placeholder="All Activities" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All Activities</SelectItem>
                  {ACTIVITY_OPTIONS.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                <input type="checkbox" checked={logAcademyOnly} onChange={(e) => setLogAcademyOnly(e.target.checked)} className="rounded border-border" />
                Academy clubs only
              </label>
            </div>
            {logsLoading ? (
              <p className="text-muted-foreground text-center py-10">Loading logs...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
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
                        {entry.status_label !== "deleted" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedBooking(entry as unknown as BookingRow)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{entry.full_name}</p>
                          <p className="text-xs text-muted-foreground">{entry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{entry.activity_name}</Badge></TableCell>
                      <TableCell className="text-sm text-foreground">{entry.booking_date}</TableCell>
                      <TableCell className="text-sm text-foreground">{entry.booking_time}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {entry.created_by ? getAdminName(entry.created_by) : <span className="text-muted-foreground">Self</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.created_at ? format(new Date(entry.created_at), "PPp") : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.status_label === "show" ? (
                          <Badge className="text-xs bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Show</Badge>
                        ) : entry.status_label === "no_show" ? (
                          <Badge variant="destructive" className="text-xs">No Show</Badge>
                        ) : entry.status_label === "deleted" ? (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit opacity-60">
                            <Trash2 className="h-3 w-3" />
                            Deleted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Pending</Badge>
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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
            <Card className="bg-card border-border self-start">
              <CardContent className="p-4">
                <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} className={cn("p-3 pointer-events-auto")} />
              </CardContent>
            </Card>

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
                              {b.attendance_status === "show" && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">SHOW</Badge>}
                              {b.attendance_status === "no_show" && <Badge className="text-[10px] px-1.5 py-0 bg-destructive/20 text-destructive border-destructive/30">NO SHOW</Badge>}
                              {!b.attendance_status && b.discount_type === "50%" && <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">50% OFF</Badge>}
                              {!b.attendance_status && b.discount_type === "free" && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE</Badge>}
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
                      {selectedBooking.discount_type === "50%" && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">50% OFF</Badge>}
                      {selectedBooking.discount_type === "free" && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE</Badge>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={selectedBooking.status === "confirmed" ? "default" : "secondary"}>{selectedBooking.status}</Badge>
                  </div>
                  {selectedBooking.attendance_status && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Attendance</span>
                      {selectedBooking.attendance_status === "show" ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Show</Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 flex items-center gap-1"><XCircle className="h-3 w-3" /> No Show</Badge>
                      )}
                    </div>
                  )}
                  {onUpdateBooking && !selectedBooking.attendance_status && (
                    <div className="pt-4 border-t border-border flex gap-3">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={async () => {
                        const { error } = await supabase.from("bookings").update({ attendance_status: "show" }).eq("id", selectedBooking.id);
                        if (error) { toast.error("Failed to mark as show: " + error.message); }
                        else { toast.success(`${selectedBooking.full_name} marked as Show ✓`); onUpdateBooking(selectedBooking.id, { attendance_status: "show" }); setSelectedBooking(null); }
                      }}>
                        <CheckCircle className="h-4 w-4" /> Show
                      </Button>
                      <Button variant="destructive" className="flex-1 gap-2" onClick={async () => {
                        const { error: fnError } = await supabase.functions.invoke("no-show-email", { body: { booking_id: selectedBooking.id } });
                        if (fnError) { toast.error("Failed to mark no-show: " + fnError.message); }
                        else { toast.success(`${selectedBooking.full_name} marked as No Show. -1 loyalty penalty applied.`); onUpdateBooking(selectedBooking.id, { attendance_status: "no_show" }); setSelectedBooking(null); }
                      }}>
                        <XCircle className="h-4 w-4" /> No Show
                      </Button>
                    </div>
                  )}
                  {onDeleteBooking && (
                    <div className={cn("border-t border-border", selectedBooking.attendance_status ? "pt-4" : "pt-2")}>
                      <Button variant="destructive" className="w-full" onClick={async () => {
                        const { error } = await supabase.from("bookings").delete().eq("id", selectedBooking.id);
                        if (error) { toast.error("Failed to delete booking: " + error.message); }
                        else { toast.success("Booking deleted successfully"); onDeleteBooking(selectedBooking.id); setSelectedBooking(null); }
                      }}>
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

export default BookingsCalendarTab;
