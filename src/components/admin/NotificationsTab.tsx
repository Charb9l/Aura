import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, UserPlus, AlertTriangle, BarChart3, XCircle, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
};

interface Props {
  onUnreadCountChange?: (count: number) => void;
}

const NotificationsTab = ({ onUnreadCountChange }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const items = (data as unknown as Notification[]) || [];
    setNotifications(items);
    setLoading(false);
    onUnreadCountChange?.(items.filter(n => !n.is_read).length);
  }, [onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, (payload) => {
        const n = payload.new as Notification;
        setNotifications(prev => {
          const next = [n, ...prev];
          onUnreadCountChange?.(next.filter(x => !x.is_read).length);
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [onUnreadCountChange]);

  const filtered = useMemo(() => {
    if (filterType === "all") return notifications;
    if (filterType === "unread") return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true } as any).eq("id", id);
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      onUnreadCountChange?.(next.filter(x => !x.is_read).length);
      return next;
    });
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("admin_notifications").update({ is_read: true } as any).in("id", unreadIds);
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, is_read: true }));
      onUnreadCountChange?.(0);
      return next;
    });
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("admin_notifications").delete().eq("id", id);
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      onUnreadCountChange?.(next.filter(x => !x.is_read).length);
      return next;
    });
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="notifications">
      <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Notifications</h1>
      <p className="text-muted-foreground mb-6">Stay updated on signups, bookings, and daily reports.</p>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
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
          </SelectContent>
        </Select>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

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

            return (
              <Card
                key={n.id}
                className={cn(
                  "bg-card border-border transition-all cursor-pointer hover:border-primary/30",
                  !n.is_read && "border-l-2 border-l-primary"
                )}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  setExpanded(isExpanded ? null : n.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 shrink-0", config.color)}>
                      <Icon className="h-4.5 w-4.5" />
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
                          {n.type === "daily_report" && n.metadata?.csv_data && (
                            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={(e) => { e.stopPropagation(); handleDownloadCSV(n); }}>
                              <Download className="h-3.5 w-3.5" />
                              Download CSV
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
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
