import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import AdminFinderInput from "./AdminFinderInput";

interface NudgeRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  sport_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

interface ProfileMap {
  [userId: string]: { full_name: string | null; email?: string };
}

interface SportMap {
  [sportId: string]: string;
}

const NudgesTab = () => {
  const [nudges, setNudges] = useState<NudgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [sports, setSports] = useState<SportMap>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [nudgeRes, profileRes, sportRes] = await Promise.all([
      supabase.from("nudges").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("offerings").select("id, name"),
    ]);

    if (nudgeRes.data) setNudges(nudgeRes.data as NudgeRow[]);

    if (profileRes.data) {
      const map: ProfileMap = {};
      profileRes.data.forEach((p) => { map[p.user_id] = { full_name: p.full_name }; });
      setProfiles(map);
    }

    if (sportRes.data) {
      const map: SportMap = {};
      sportRes.data.forEach((s) => { map[s.id] = s.name; });
      setSports(map);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getName = (userId: string) => profiles[userId]?.full_name || userId.slice(0, 8) + "…";

  const filtered = useMemo(() => {
    let list = nudges;
    if (statusFilter !== "all") list = list.filter((n) => n.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n) => {
        const sender = getName(n.sender_id).toLowerCase();
        const receiver = getName(n.receiver_id).toLowerCase();
        return sender.includes(q) || receiver.includes(q);
      });
    }
    return list;
  }, [nudges, statusFilter, search, profiles]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case "accepted":
        return <Badge className="text-xs bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive" className="text-xs">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="nudges">
      <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Nudges</h1>
      <p className="text-muted-foreground mb-6">View all nudge interactions between users.</p>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            All Nudges
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <AdminFinderInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name..."
              className="max-w-[200px]"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 bg-secondary border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-10">Loading nudges...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No nudges found.</p>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Responded At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium text-foreground">{getName(n.sender_id)}</TableCell>
                        <TableCell className="font-medium text-foreground">{getName(n.receiver_id)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{sports[n.sport_id] || "—"}</Badge>
                        </TableCell>
                        <TableCell>{statusBadge(n.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(n.created_at), "PPp")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {n.responded_at ? format(new Date(n.responded_at), "PPp") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {filtered.length} nudge{filtered.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NudgesTab;
