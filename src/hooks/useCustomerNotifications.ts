import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerNotification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

export const useCustomerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return; }

    const [notifRes, readsRes] = await Promise.all([
      supabase.from("customer_notifications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("customer_notification_reads").select("notification_id").eq("user_id", user.id),
    ]);

    const readIds = new Set((readsRes.data || []).map((r: any) => r.notification_id));
    const items: CustomerNotification[] = ((notifRes.data || []) as any[]).map(n => ({
      ...n,
      is_read: readIds.has(n.id),
    }));

    setNotifications(items);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime for new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("customer-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_notifications" }, (payload) => {
        const n = payload.new as any;
        setNotifications(prev => [{ ...n, is_read: false }, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    await supabase.from("customer_notification_reads").insert({ notification_id: notificationId, user_id: user.id } as any);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    const rows = unread.map(n => ({ notification_id: n.id, user_id: user.id }));
    await supabase.from("customer_notification_reads").insert(rows as any);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user, notifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
};

// Lightweight hook just for unread count (used in Navbar)
export const useCustomerNotificationCount = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetch = async () => {
      const [notifRes, readsRes] = await Promise.all([
        supabase.from("customer_notifications").select("id"),
        supabase.from("customer_notification_reads").select("notification_id").eq("user_id", user.id),
      ]);
      const readIds = new Set((readsRes.data || []).map((r: any) => r.notification_id));
      const total = (notifRes.data || []).filter((n: any) => !readIds.has(n.id)).length;
      setUnreadCount(total);
    };
    fetch();

    const channel = supabase
      .channel("customer-notif-count")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_notifications" }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return unreadCount;
};
