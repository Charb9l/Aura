import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCustomerNotifications, CustomerNotification } from "@/hooks/useCustomerNotifications";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CustomerNotificationsPanel = ({ open, onClose }: Props) => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useCustomerNotifications();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-sm border-l border-border bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-heading font-bold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={markAllAsRead}>
                    <CheckCheck className="h-3 w-3" /> Read all
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-6 text-center text-muted-foreground text-sm">Loading...</p>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const NotificationItem = ({ notification: n, onRead }: { notification: CustomerNotification; onRead: (id: string) => void }) => {
  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
  };

  return (
    <button onClick={handleClick} className={cn("w-full text-left p-4 transition-colors hover:bg-muted/30", !n.is_read && "bg-primary/5")}>
      <div className="flex items-start gap-2 mb-1">
        {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", n.is_read ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(n.created_at), "MMM dd · h:mm a")}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.body}</p>
      {n.image_url && (
        <img src={n.image_url} alt="" className="mt-2 rounded-lg w-full max-h-48 object-cover border border-border" />
      )}
    </button>
  );
};

export default CustomerNotificationsPanel;
