import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Handshake, ArrowLeft, Mail, Phone, MapPin, Building2, User, FileText, MessageSquare, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PartnerRequest {
  id: string;
  club_name: string;
  club_location: string;
  contact_role: string;
  contact_name: string;
  email: string;
  phone: string;
  description: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  reviewed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  declined: "bg-destructive/20 text-destructive border-destructive/30",
};

const PartnerRequestsDialog = ({ open, onOpenChange }: Props) => {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartnerRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("partner_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      setRequests((data || []) as unknown as PartnerRequest[]);
      setLoading(false);
    };
    fetch();
  }, [open]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("partner_requests" as any)
      .update({ status: newStatus } as any)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success("Status updated");
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("partner_requests" as any)
      .update({ admin_notes: adminNotes } as any)
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save notes");
    } else {
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, admin_notes: adminNotes } : r));
      setSelected(prev => prev ? { ...prev, admin_notes: adminNotes } : null);
      toast.success("Notes saved");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this partner request?")) return;
    const { error } = await supabase.from("partner_requests" as any).delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Request deleted");
    }
  };

  const openDetail = (req: PartnerRequest) => {
    setSelected(req);
    setAdminNotes(req.admin_notes || "");
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto">
        {selected ? (
          // ── Detail View ──
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogHeader className="flex-1">
                <DialogTitle className="font-heading text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selected.club_name}
                </DialogTitle>
              </DialogHeader>
              <Badge className={cn("text-xs", statusColors[selected.status] || statusColors.pending)}>
                {selected.status}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Club Details</h4>
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{selected.club_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-foreground">{selected.club_location}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Contact Info</h4>
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{selected.contact_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selected.contact_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <a href={`mailto:${selected.email}`} className="text-foreground hover:text-primary transition-colors">{selected.email}</a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-foreground">{selected.phone}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Description
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selected.description}</p>
            </div>

            {/* Message */}
            {selected.message && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Additional Message
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}

            {/* Status + Admin Notes */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Admin Actions</h4>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={selected.status} onValueChange={(v) => handleStatusChange(selected.id, v)}>
                  <SelectTrigger className="w-40 h-9 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-1.5">Internal Notes</span>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this request..."
                  rows={2}
                  maxLength={500}
                  className="bg-secondary border-border resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={saving || adminNotes === (selected.admin_notes || "")}
                  className="mt-2"
                >
                  Save Notes
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Submitted on {format(parseISO(selected.created_at), "PPP 'at' p")}
            </p>
          </div>
        ) : (
          // ── List View ──
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Partner Requests
                {pendingCount > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs ml-2">
                    {pendingCount} pending
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No partner requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => openDetail(req)}
                    >
                      <TableCell className="font-medium">{req.club_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{req.contact_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{req.contact_role}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{req.club_location}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]", statusColors[req.status] || statusColors.pending)}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(parseISO(req.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartnerRequestsDialog;
