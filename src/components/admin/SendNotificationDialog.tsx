import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ImagePlus, X, Search, Users, User, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserOption {
  user_id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SendNotificationDialog = ({ open, onOpenChange }: Props) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // User targeting
  const [sendToAll, setSendToAll] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");

  // Fetch users when dialog opens and targeting is specific
  useEffect(() => {
    if (!open) return;
    if (users.length > 0) return;
    setLoadingUsers(true);
    const fetchUsers = async () => {
      // Get profiles joined with auth email via user_id
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .order("full_name", { ascending: true });

      if (!profiles) { setLoadingUsers(false); return; }

      // We need emails - fetch from admin-users edge function
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) { setLoadingUsers(false); return; }

      const { data: adminData } = await supabase.functions.invoke("admin-users", {
        body: { action: "list" },
      });

      const emailMap = new Map<string, string>();
      if (adminData?.users) {
        for (const u of adminData.users) {
          emailMap.set(u.id, u.email);
        }
      }

      // Filter to only non-admin users (customers)
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = new Set((adminRoles || []).map(r => r.user_id));

      const userOptions: UserOption[] = profiles
        .filter(p => !adminIds.has(p.user_id))
        .map(p => ({
          user_id: p.user_id,
          full_name: p.full_name,
          email: emailMap.get(p.user_id) || "",
        }));

      setUsers(userOptions);
      setLoadingUsers(false);
    };
    fetchUsers();
  }, [open]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      u =>
        (u.full_name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map(u => u.user_id);
    const allSelected = allFilteredIds.every(id => selectedUserIds.has(id));
    if (allSelected) {
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and text are required"); return; }
    if (!sendToAll && selectedUserIds.size === 0) { toast.error("Select at least one user"); return; }
    setSending(true);

    let image_url: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("notification-images")
        .upload(path, imageFile);
      if (uploadErr) { toast.error("Image upload failed"); setSending(false); return; }
      const { data: urlData } = supabase.storage.from("notification-images").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    if (sendToAll) {
      // Broadcast: target_user_id = null
      const { error } = await supabase.from("customer_notifications").insert({
        title: title.trim(),
        body: body.trim(),
        image_url,
      } as any);
      if (error) { toast.error("Failed to send: " + error.message); setSending(false); return; }
      toast.success("Notification sent to all customers!");
    } else {
      // Individual notifications for each selected user
      const rows = Array.from(selectedUserIds).map(userId => ({
        title: title.trim(),
        body: body.trim(),
        image_url,
        target_user_id: userId,
      }));
      const { error } = await supabase.from("customer_notifications").insert(rows as any);
      if (error) { toast.error("Failed to send: " + error.message); setSending(false); return; }
      toast.success(`Notification sent to ${selectedUserIds.size} user${selectedUserIds.size > 1 ? "s" : ""}!`);
    }

    setSending(false);
    setTitle("");
    setBody("");
    clearImage();
    setSendToAll(true);
    setSelectedUserIds(new Set());
    setUserSearch("");
    onOpenChange(false);
  };

  const resetOnClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedUserIds(new Set());
      setUserSearch("");
      setSendToAll(true);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={resetOnClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Send Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Audience selector */}
          <div>
            <Label className="mb-2 block">Send to</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sendToAll ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => { setSendToAll(true); setSelectedUserIds(new Set()); }}
              >
                <Users className="h-3.5 w-3.5" /> All Users
              </Button>
              <Button
                type="button"
                variant={!sendToAll ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setSendToAll(false)}
              >
                <User className="h-3.5 w-3.5" /> Specific Users
              </Button>
            </div>
          </div>

          {/* User picker */}
          {!sendToAll && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="h-9 bg-secondary border-border pl-9 text-sm"
                />
              </div>

              {/* Selected badges */}
              {selectedUserIds.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedUserIds).map(id => {
                    const u = users.find(u => u.user_id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs cursor-pointer hover:bg-destructive/10"
                        onClick={() => toggleUser(id)}
                      >
                        {u?.full_name || u?.email || "User"}
                        <X className="h-3 w-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* User list */}
              <ScrollArea className="h-[180px] rounded-lg border border-border bg-secondary/50">
                {loadingUsers ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
                    {userSearch ? "No users found" : "No registered customers"}
                  </div>
                ) : (
                  <div className="p-1">
                    {/* Select all toggle */}
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent/50 transition-colors text-primary font-medium"
                    >
                      <Checkbox
                        checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.user_id))}
                        className="border-primary"
                        tabIndex={-1}
                      />
                      Select all{userSearch ? " filtered" : ""} ({filteredUsers.length})
                    </button>
                    {filteredUsers.map(u => {
                      const isSelected = selectedUserIds.has(u.user_id);
                      return (
                        <button
                          key={u.user_id}
                          type="button"
                          onClick={() => toggleUser(u.user_id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left",
                            isSelected ? "bg-primary/10" : "hover:bg-accent/50"
                          )}
                        >
                          <Checkbox checked={isSelected} tabIndex={-1} className="border-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          <div>
            <Label htmlFor="notif-title">Title</Label>
            <Input id="notif-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New class available!" className="mt-1.5 bg-secondary border-border" />
          </div>
          <div>
            <Label htmlFor="notif-body">Message</Label>
            <Textarea id="notif-body" value={body} onChange={e => setBody(e.target.value)} placeholder="Write your notification message..." rows={3} className="mt-1.5 bg-secondary border-border" />
          </div>
          <div>
            <Label>Image (optional)</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative mt-1.5 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 bg-background/80 hover:bg-background" onClick={clearImage}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="mt-1.5 gap-2 w-full" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> Add Image
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => resetOnClose(false)}>Cancel</Button>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim() || (!sendToAll && selectedUserIds.size === 0)}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {sending
              ? "Sending..."
              : sendToAll
                ? "Send to All"
                : `Send to ${selectedUserIds.size} User${selectedUserIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendNotificationDialog;
