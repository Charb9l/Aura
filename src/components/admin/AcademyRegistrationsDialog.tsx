import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { GraduationCap, ArrowLeft, Mail, Phone, MapPin, User, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Registration {
  id: string;
  club_id: string;
  club_name: string;
  location_id: string | null;
  location_name: string | null;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  experience: string | null;
  status: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  enrolled: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  declined: "bg-destructive/20 text-destructive border-destructive/30",
};

const AcademyRegistrationsDialog = ({ open, onOpenChange }: Props) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterAcademy, setFilterAcademy] = useState("all");

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("academy_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setRegistrations(data as unknown as Registration[]);
      setLoading(false);
    };
    fetchData();
  }, [open]);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("academy_registrations")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
      toast.success("Status updated");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    const { error } = await supabase.from("academy_registrations").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setRegistrations(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Registration deleted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {selected ? (
              <button onClick={() => setSelected(null)} className="hover:text-primary transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <GraduationCap className="h-5 w-5 text-primary" />
            )}
            {selected ? selected.full_name : "Academy Registrations"}
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : registrations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No registrations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Academy</TableHead>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map(r => (
                      <TableRow
                        key={r.id}
                        className="border-border cursor-pointer hover:bg-secondary/50"
                        onClick={() => setSelected(r)}
                      >
                        <TableCell className="text-foreground font-medium">{r.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.club_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(parseISO(r.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", statusColors[r.status] || statusColors.pending)}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)} disabled={saving}>
                <SelectTrigger className="w-36 h-9 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailRow icon={User} label="Full Name" value={selected.full_name} />
              <DetailRow icon={Mail} label="Email" value={selected.email} />
              <DetailRow icon={Phone} label="Phone" value={selected.phone} />
              <DetailRow icon={Calendar} label="Age" value={selected.age ? String(selected.age) : "—"} />
              <DetailRow icon={GraduationCap} label="Academy" value={selected.club_name} />
              <DetailRow icon={MapPin} label="Location" value={selected.location_name || "—"} />
            </div>

            {selected.experience && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Experience</p>
                <p className="text-foreground text-sm bg-secondary/50 rounded-lg p-3 whitespace-pre-wrap">
                  {selected.experience}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Submitted {format(parseISO(selected.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  </div>
);

export default AcademyRegistrationsDialog;
