import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, UserPlus, AlertTriangle, BarChart3, XCircle, Download, MailOpen, Mail, ExternalLink, GraduationCap, Handshake, Tag, Send, Users, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import SendNotificationDialog from "@/components/admin/SendNotificationDialog";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  new_signup: { icon: UserPlus, color: "text-blue-400", label: "New Signup" },
  unmarked_booking: { icon: AlertTriangle, color: "text-amber-400", label: "Unmarked" },
  daily_report: { icon: BarChart3, color: "text-emerald-400", label: "Daily Report" },
  booking_cancelled: { icon: XCircle, color: "text-destructive", label: "Cancelled" },
  academy_registration: { icon: GraduationCap, color: "text-purple-400", label: "Academy" },
  partner_request: { icon: Handshake, color: "text-teal-400", label: "Partner" },
  price_rule_created: { icon: Tag, color: "text-amber-400", label: "Price Rule" },
};

interface Props {
  onUnreadCountChange?: (count: number) => void;
  onNavigate?: (tab: string, context?: { userId?: string; bookingDate?: string; openRegistrations?: boolean }) => void;
}

interface SentNotification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  target_user_id: string | null;
  created_at: string;
  target_name?: string;
}

const NotificationsTab = ({ onUnreadCountChange, onNavigate }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  // Sent notifications
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const isSentView = filterType === "sent";

  const updateUnreadCount = useCallback((items: Notification[]) => {
    onUnreadCountChange?.(items.filter(n => !n.is_read).length);
  }, [onUnreadCountChange]);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const items = (data as unknown as Notification[]) || [];
    setNotifications(items);
    setLoading(false);
    updateUnreadCount(items);
  }, [updateUnreadCount]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const fetchSentNotifications = useCallback(async () => {
    setSentLoading(true);
    const { data } = await supabase
      .from("customer_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!data) { setSentLoading(false); return; }
    const targetIds = [...new Set(data.filter(n => n.target_user_id).map(n => n.target_user_id!))];
    let nameMap = new Map<string, string>();
    if (targetIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", targetIds);
      if (profiles) profiles.forEach(p => { if (p.full_name) nameMap.set(p.user_id, p.full_name); });
    }
    setSentNotifications(data.map(n => ({
      ...n,
      target_name: n.target_user_id ? (nameMap.get(n.target_user_id) || "Unknown user") : undefined,
    })));
    setSentLoading(false);
  }, []);

  useEffect(() => {
    if (isSentView && sentNotifications.length === 0) fetchSentNotifications();
  }, [isSentView, fetchSentNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, (payload) => {
        const n = payload.new as Notification;
        setNotifications(prev => {
          const next = [n, ...prev];
          updateUnreadCount(next);
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [updateUnreadCount]);

  const filtered = useMemo(() => {
    if (filterType === "all") return notifications;
    if (filterType === "unread") return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(n => n.id)));
    }
  };

  const bulkSetReadStatus = async (isRead: boolean) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await supabase.from("admin_notifications").update({ is_read: isRead } as any).in("id", ids);
    setNotifications(prev => {
      const next = prev.map(n => ids.includes(n.id) ? { ...n, is_read: isRead } : n);
      updateUnreadCount(next);
      return next;
    });
    setSelected(new Set());
    toast.success(`${ids.length} notification${ids.length > 1 ? "s" : ""} marked as ${isRead ? "read" : "unread"}`);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await supabase.from("admin_notifications").delete().in("id", ids);
    setNotifications(prev => {
      const next = prev.filter(n => !ids.includes(n.id));
      updateUnreadCount(next);
      return next;
    });
    setSelected(new Set());
    toast.success(`${ids.length} notification${ids.length > 1 ? "s" : ""} deleted`);
  };

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true } as any).eq("id", id);
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      updateUnreadCount(next);
      return next;
    });
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("admin_notifications").update({ is_read: true } as any).in("id", unreadIds);
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, is_read: true }));
      updateUnreadCount(next);
      return next;
    });
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("admin_notifications").delete().eq("id", id);
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      updateUnreadCount(next);
      return next;
    });
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleDownloadCSV = (n: Notification) => {
    const csvData = n.metadata?.csv_data;
    if (!csvData) { toast.error("No report data attached"); return; }
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${format(new Date(n.created_at), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const hasSelection = selected.size > 0;
  const selectedHasUnread = hasSelection && notifications.some(n => selected.has(n.id) && !n.is_read);
  const selectedHasRead = hasSelection && notifications.some(n => selected.has(n.id) && n.is_read);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="notifications">
      <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Notifications</h1>
      <p className="text-muted-foreground mb-6">Stay updated on signups, bookings, and daily reports.</p>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setSelected(new Set()); }}>
          <SelectTrigger className="w-[180px] h-10 bg-secondary border-border">
            <SelectValue placeholder="All Notifications" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="new_signup">New Signups</SelectItem>
            <SelectItem value="unmarked_booking">Unmarked Bookings</SelectItem>
            <SelectItem value="daily_report">Daily Reports</SelectItem>
            <SelectItem value="booking_cancelled">Cancellations</SelectItem>
            <SelectItem value="price_rule_created">Price Rules</SelectItem>
          </SelectContent>
        </Select>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read ({unreadCount})
          </Button>
        )}
        <Button size="sm" className="gap-2 ml-auto" onClick={() => setSendDialogOpen(true)}>
          <Bell className="h-3.5 w-3.5" /> Send Notification
        </Button>
      </div>

      <SendNotificationDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} />

      {/* Bulk actions bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={filtered.length > 0 && selected.size === filtered.length}
              onCheckedChange={selectAll}
              className="border-muted-foreground"
            />
            <span className="text-xs text-muted-foreground">
              {hasSelection ? `${selected.size} selected` : "Select all"}
            </span>
          </div>
          {hasSelection && (
            <>
              {selectedHasUnread && (
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => bulkSetReadStatus(true)}>
                  <MailOpen className="h-3 w-3" /> Mark read
                </Button>
              )}
              {selectedHasRead && (
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => bulkSetReadStatus(false)}>
                  <Mail className="h-3 w-3" /> Mark unread
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive" onClick={bulkDelete}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">Loading notifications...</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Bell className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-w-4xl">
          {filtered.map(n => {
            const config = TYPE_CONFIG[n.type] || { icon: Bell, color: "text-muted-foreground", label: n.type };
            const Icon = config.icon;
            const isExpanded = expanded === n.id;
            const isSelected = selected.has(n.id);

            return (
              <Card
                key={n.id}
                className={cn(
                  "bg-card border-border transition-all cursor-pointer hover:border-primary/30",
                  !n.is_read && "border-l-2 border-l-primary",
                  isSelected && "ring-1 ring-primary/40"
                )}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  setExpanded(isExpanded ? null : n.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(n.id)}
                        className="border-muted-foreground"
                      />
                    </div>
                    <div className={cn("mt-0.5 shrink-0", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{config.label}</Badge>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(n.created_at), "MMM dd, yyyy · h:mm a")}</span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className={cn("text-sm font-medium", n.is_read ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2">
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {n.type === "new_signup" && n.metadata?.user_id && (
                              <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); onNavigate?.("users", { userId: n.metadata.user_id }); }}>
                                <ExternalLink className="h-3.5 w-3.5" /> View Profile
                              </Button>
                            )}
                            {(n.type === "booking_cancelled" || n.type === "unmarked_booking") && n.metadata?.booking_date && (
                              <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); onNavigate?.("bookings", { bookingDate: n.metadata.booking_date }); }}>
                                <ExternalLink className="h-3.5 w-3.5" /> View Bookings
                              </Button>
                            )}
                            {n.type === "daily_report" && n.metadata?.csv_data && (
                              <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); handleDownloadCSV(n); }}>
                                <Download className="h-3.5 w-3.5" /> Download CSV
                              </Button>
                            )}
                            {n.type === "academy_registration" && (
                              <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); onNavigate?.("clubs", { openRegistrations: true }); }}>
                                <ExternalLink className="h-3.5 w-3.5" /> View Registrations
                              </Button>
                            )}
                            {n.type === "partner_request" && (
                              <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); onNavigate?.("clubs"); }}>
                                <ExternalLink className="h-3.5 w-3.5" /> View Partners
                              </Button>
                            )}
                            {n.type === "price_rule_created" && (
                              <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); onNavigate?.("promotions"); }}>
                                <ExternalLink className="h-3.5 w-3.5" /> View Price Rules
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground active:text-destructive sm:hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default NotificationsTab;
