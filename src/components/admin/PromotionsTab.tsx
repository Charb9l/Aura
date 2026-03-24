import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Trophy, Medal, Award, Gift, Plus, Trash2, Check, X, Users, Star, Search, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import { UserWithEmail, ClubRow } from "./types";

interface LoyaltyLeaderEntry {
  user_id: string;
  full_name: string;
  email: string;
  totalPoints: number;
}

interface BadgeLeaderEntry {
  user_id: string;
  full_name: string;
  email: string;
  completedLevels: number;
  totalShowBookings: number;
}

interface PriceRule {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  active: boolean;
  created_at: string;
  clubs: string[];
  max_total_uses: number | null;
  uses_per_customer: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  creator_name?: string;
}

interface UserPromotion {
  id: string;
  user_id: string;
  discount_type: string;
  discount_value: number;
  remaining_uses: number;
  source: string;
  created_at: string;
  price_rule_id: string | null;
}

interface Props {
  allUsers: UserWithEmail[];
  clubs: ClubRow[];
  myClubId?: string | null;
}

const LEVEL_NAMES = ["Spark", "Flame", "Blaze", "Inferno", "Immortal"];

const PromotionsTab = ({ allUsers, clubs, myClubId }: Props) => {
  const { user: adminUser } = useAuth();
  const isMasterAdmin = !myClubId;
  const [subTab, setSubTab] = useState(isMasterAdmin ? "loyalty" : "rules");
  const [loyaltyLeaders, setLoyaltyLeaders] = useState<LoyaltyLeaderEntry[]>([]);
  const [badgeLeaders, setBadgeLeaders] = useState<BadgeLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([]);
  const [detailRule, setDetailRule] = useState<PriceRule | null>(null);

  // Promotion dialog
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promoSelectedUsers, setPromoSelectedUsers] = useState<Set<string>>(new Set());
  const [promoDiscountType, setPromoDiscountType] = useState("percentage");
  const [promoDiscountValue, setPromoDiscountValue] = useState("50");
  const [promoUses, setPromoUses] = useState("1");
  const [promoSaving, setPromoSaving] = useState(false);

  // Price rule dialog
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDiscountType, setRuleDiscountType] = useState("percentage");
  const [ruleDiscountValue, setRuleDiscountValue] = useState("50");
  const [ruleSelectedClubs, setRuleSelectedClubs] = useState<Set<string>>(new Set());
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleMaxTotalUses, setRuleMaxTotalUses] = useState("");
  const [ruleUsesPerCustomer, setRuleUsesPerCustomer] = useState("1");
  const [ruleStartDate, setRuleStartDate] = useState<Date | undefined>(undefined);
  const [ruleEndDate, setRuleEndDate] = useState<Date | undefined>(undefined);

  // Top N selector
  const [topN, setTopN] = useState("5");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [bookingsRes, badgeRes, rulesRes, ruleClubsRes, promosRes] = await Promise.all([
      supabase.from("bookings").select("user_id, activity, attendance_status"),
      supabase.from("badge_point_assignments").select("user_id, badge_level"),
      supabase.from("price_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("price_rule_clubs").select("*"),
      supabase.from("user_promotions").select("*").order("created_at", { ascending: false }),
    ]);

    // Loyalty leaderboard: count "show" bookings per user (as proxy for points across clubs)
    const showBookings = (bookingsRes.data || []).filter((b: any) => b.attendance_status === "show");
    const pointsMap: Record<string, number> = {};
    showBookings.forEach((b: any) => {
      pointsMap[b.user_id] = (pointsMap[b.user_id] || 0) + 1;
    });

    const loyaltyList: LoyaltyLeaderEntry[] = allUsers
      .filter(u => pointsMap[u.user_id])
      .map(u => ({
        user_id: u.user_id,
        full_name: u.full_name || u.email,
        email: u.email,
        totalPoints: pointsMap[u.user_id] || 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
    setLoyaltyLeaders(loyaltyList);

    // Badge leaderboard
    const badgeMap: Record<string, Set<number>> = {};
    (badgeRes.data || []).forEach((b: any) => {
      if (!badgeMap[b.user_id]) badgeMap[b.user_id] = new Set();
      badgeMap[b.user_id].add(b.badge_level);
    });

    // Also count show bookings for tracker context
    const badgeList: BadgeLeaderEntry[] = allUsers
      .filter(u => badgeMap[u.user_id] || pointsMap[u.user_id])
      .map(u => ({
        user_id: u.user_id,
        full_name: u.full_name || u.email,
        email: u.email,
        completedLevels: badgeMap[u.user_id]?.size || 0,
        totalShowBookings: pointsMap[u.user_id] || 0,
      }))
      .sort((a, b) => b.completedLevels - a.completedLevels || b.totalShowBookings - a.totalShowBookings);
    setBadgeLeaders(badgeList);

    // Price rules — resolve creator names for mega admin
    const ruleClubs = (ruleClubsRes.data || []) as any[];
    const rulesRaw = (rulesRes.data || []) as any[];
    const creatorIds = [...new Set(rulesRaw.map(r => r.created_by).filter(Boolean))] as string[];
    let creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", creatorIds);
      (profiles || []).forEach((p: any) => { creatorMap[p.user_id] = p.full_name || "Unknown"; });
    }
    const rules: PriceRule[] = rulesRaw.map(r => ({
      ...r,
      clubs: ruleClubs.filter(rc => rc.price_rule_id === r.id).map(rc => rc.club_id),
      creator_name: r.created_by ? creatorMap[r.created_by] || "Unknown" : null,
    }));
    setPriceRules(rules);
    setUserPromotions((promosRes.data || []) as UserPromotion[]);

    setLoading(false);
  };

  const displayN = parseInt(topN) || 5;
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUser = (userId: string) => {
    setPromoSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectTopN = (list: { user_id: string }[]) => {
    setPromoSelectedUsers(new Set(list.slice(0, displayN).map(u => u.user_id)));
  };

  const handleApplyPromotion = async () => {
    if (promoSelectedUsers.size === 0) { toast.error("Select at least one user"); return; }
    setPromoSaving(true);
    const inserts = Array.from(promoSelectedUsers).map(uid => ({
      user_id: uid,
      discount_type: promoDiscountType,
      discount_value: promoDiscountType === "free" ? 100 : Number(promoDiscountValue),
      remaining_uses: Number(promoUses) || 1,
      created_by: adminUser?.id,
      source: "manual",
    }));
    const { error } = await supabase.from("user_promotions").insert(inserts as any);
    setPromoSaving(false);
    if (error) { toast.error("Failed to apply promotions: " + error.message); return; }
    toast.success(`Promotion applied to ${promoSelectedUsers.size} user(s)`);
    setPromoDialogOpen(false);
    setPromoSelectedUsers(new Set());
    fetchAll();
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim()) { toast.error("Enter a rule name"); return; }
    setRuleSaving(true);
    const { data: rule, error } = await supabase.from("price_rules").insert({
      name: ruleName,
      discount_type: ruleDiscountType,
      discount_value: ruleDiscountType === "free" ? 100 : Number(ruleDiscountValue),
      max_total_uses: ruleMaxTotalUses.trim() ? Number(ruleMaxTotalUses) : null,
      uses_per_customer: Number(ruleUsesPerCustomer) || 1,
      start_date: ruleStartDate ? format(ruleStartDate, "yyyy-MM-dd") : null,
      end_date: ruleEndDate ? format(ruleEndDate, "yyyy-MM-dd") : null,
      created_by: adminUser?.id || null,
    } as any).select().single();
    if (error || !rule) { toast.error("Failed to create rule"); setRuleSaving(false); return; }
    // Add clubs — club admins auto-assign their own club
    const clubsToAssign = myClubId ? [myClubId] : Array.from(ruleSelectedClubs);
    if (clubsToAssign.length > 0) {
      await supabase.from("price_rule_clubs").insert(
        clubsToAssign.map(cid => ({ price_rule_id: (rule as any).id, club_id: cid })) as any
      );
    }
    setRuleSaving(false);
    toast.success("Price rule created");
    setRuleDialogOpen(false);
    setRuleName("");
    setRuleSelectedClubs(new Set());
    fetchAll();
  };

  const toggleRuleActive = async (ruleId: string, active: boolean) => {
    await supabase.from("price_rules").update({ active } as any).eq("id", ruleId);
    setPriceRules(prev => prev.map(r => r.id === ruleId ? { ...r, active } : r));
  };

  const deleteRule = async (ruleId: string) => {
    await supabase.from("price_rules").delete().eq("id", ruleId);
    setPriceRules(prev => prev.filter(r => r.id !== ruleId));
    toast.success("Rule deleted");
  };

  const toggleRuleClub = async (ruleId: string, clubId: string, currently: boolean) => {
    if (currently) {
      await supabase.from("price_rule_clubs").delete().eq("price_rule_id", ruleId).eq("club_id", clubId);
    } else {
      await supabase.from("price_rule_clubs").insert({ price_rule_id: ruleId, club_id: clubId } as any);
    }
    setPriceRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return { ...r, clubs: currently ? r.clubs.filter(c => c !== clubId) : [...r.clubs, clubId] };
    }));
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === "free") return "FREE";
    if (type === "percentage") return `${value}% OFF`;
    return `$${value} OFF`;
  };

  const getRuleStatus = (rule: PriceRule): { label: string; color: string } => {
    const today = new Date().toISOString().slice(0, 10);
    if (!rule.active) return { label: "Disabled", color: "bg-muted text-muted-foreground" };
    if (rule.end_date && rule.end_date < today) return { label: "Expired", color: "bg-destructive/15 text-destructive" };
    if (rule.start_date && rule.start_date > today) return { label: "Scheduled", color: "bg-amber-500/15 text-amber-500" };
    return { label: "Active", color: "bg-emerald-500/15 text-emerald-500" };
  };

  const activePromosForUser = (userId: string) => userPromotions.filter(p => p.user_id === userId && p.remaining_uses > 0);

  if (loading) return <p className="text-muted-foreground text-center py-10">Loading...</p>;

  const q = searchQuery.toLowerCase();
  const filteredLoyalty = q ? loyaltyLeaders.filter(e => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)) : loyaltyLeaders;
  const filteredBadge = q ? badgeLeaders.filter(e => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)) : badgeLeaders;
  const currentList = subTab === "loyalty" ? filteredLoyalty : filteredBadge;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="promotions">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-1">Promotions</h1>
          <p className="text-muted-foreground text-sm">Reward top customers and manage price rules.</p>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab} className="space-y-6">
        <TabsList className="bg-secondary/50">
          {isMasterAdmin && <TabsTrigger value="loyalty" className="gap-2"><Trophy className="h-4 w-4" /> Loyalty Leaderboard</TabsTrigger>}
          {isMasterAdmin && <TabsTrigger value="badges" className="gap-2"><Medal className="h-4 w-4" /> Tracker Leaderboard</TabsTrigger>}
          <TabsTrigger value="rules" className="gap-2"><Gift className="h-4 w-4" /> Price Rules</TabsTrigger>
        </TabsList>

        {/* Loyalty Leaderboard */}
        <TabsContent value="loyalty" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="h-8 pl-9 w-56 bg-secondary border-border text-sm" />
              </div>
              <Label className="text-sm text-muted-foreground">Show Top</Label>
              <Input type="number" value={topN} onChange={e => setTopN(e.target.value)} className="w-20 h-8" min={1} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => selectTopN(filteredLoyalty)}>
                Select Top {displayN}
              </Button>
              <Button size="sm" onClick={() => { if (promoSelectedUsers.size === 0) { toast.error("Select users first"); return; } setPromoDialogOpen(true); }} disabled={promoSelectedUsers.size === 0} className="gap-2">
                <Gift className="h-4 w-4" /> Apply Promotion ({promoSelectedUsers.size})
              </Button>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Show Bookings</TableHead>
                    <TableHead>Active Promos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoyalty.slice(0, displayN).map((entry, i) => (
                    <TableRow key={entry.user_id} className={cn(i < 3 && "bg-primary/5")}>
                      <TableCell>
                        <Checkbox checked={promoSelectedUsers.has(entry.user_id)} onCheckedChange={() => toggleUser(entry.user_id)} />
                      </TableCell>
                      <TableCell>
                        {i === 0 ? <Trophy className="h-5 w-5 text-amber-400" /> : i === 1 ? <Medal className="h-5 w-5 text-gray-400" /> : i === 2 ? <Award className="h-5 w-5 text-amber-600" /> : <span className="text-muted-foreground text-sm">{i + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{entry.full_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-lg text-foreground">{entry.totalPoints}</span>
                      </TableCell>
                      <TableCell>
                        {activePromosForUser(entry.user_id).map(p => (
                          <Badge key={p.id} className="mr-1 bg-primary/15 text-primary text-xs">
                            {formatDiscount(p.discount_type, p.discount_value)} × {p.remaining_uses}
                          </Badge>
                        ))}
                        {activePromosForUser(entry.user_id).length === 0 && <span className="text-muted-foreground text-xs">None</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {loyaltyLeaders.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No loyalty data yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badge Leaderboard */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="h-8 pl-9 w-56 bg-secondary border-border text-sm" />
              </div>
              <Label className="text-sm text-muted-foreground">Show Top</Label>
              <Input type="number" value={topN} onChange={e => setTopN(e.target.value)} className="w-20 h-8" min={1} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => selectTopN(filteredBadge)}>
                Select Top {displayN}
              </Button>
              <Button size="sm" onClick={() => { if (promoSelectedUsers.size === 0) { toast.error("Select users first"); return; } setPromoDialogOpen(true); }} disabled={promoSelectedUsers.size === 0} className="gap-2">
                <Gift className="h-4 w-4" /> Apply Promotion ({promoSelectedUsers.size})
              </Button>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Current Badge</TableHead>
                    <TableHead>Total Shows</TableHead>
                    <TableHead>Active Promos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBadge.slice(0, displayN).map((entry, i) => (
                    <TableRow key={entry.user_id} className={cn(i < 3 && "bg-primary/5")}>
                      <TableCell>
                        <Checkbox checked={promoSelectedUsers.has(entry.user_id)} onCheckedChange={() => toggleUser(entry.user_id)} />
                      </TableCell>
                      <TableCell>
                        {i === 0 ? <Trophy className="h-5 w-5 text-amber-400" /> : i === 1 ? <Medal className="h-5 w-5 text-gray-400" /> : i === 2 ? <Award className="h-5 w-5 text-amber-600" /> : <span className="text-muted-foreground text-sm">{i + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{entry.full_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(lvl => (
                            <Badge key={lvl} variant={entry.completedLevels >= lvl ? "default" : "secondary"} className={cn("text-xs", entry.completedLevels >= lvl && "bg-primary/20 text-primary border-primary/30")}>
                              {LEVEL_NAMES[lvl - 1]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><span className="font-medium text-foreground">{entry.totalShowBookings}</span></TableCell>
                      <TableCell>
                        {activePromosForUser(entry.user_id).map(p => (
                          <Badge key={p.id} className="mr-1 bg-primary/15 text-primary text-xs">
                            {formatDiscount(p.discount_type, p.discount_value)} × {p.remaining_uses}
                          </Badge>
                        ))}
                        {activePromosForUser(entry.user_id).length === 0 && <span className="text-muted-foreground text-xs">None</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {badgeLeaders.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No badge data yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Rules */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setRuleDialogOpen(true); setRuleName(""); setRuleDiscountType("percentage"); setRuleDiscountValue("50"); setRuleSelectedClubs(new Set(clubs.map(c => c.id))); setRuleMaxTotalUses(""); setRuleUsesPerCustomer("1"); setRuleStartDate(undefined); setRuleEndDate(undefined); }} className="gap-2">
              <Plus className="h-4 w-4" /> Create Price Rule
            </Button>
          </div>

          {priceRules.length === 0 ? (
            <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">No price rules created yet.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {priceRules.map(rule => (
                <Card key={rule.id} className={cn("bg-card border-border", !rule.active && "opacity-60", isMasterAdmin && "cursor-pointer")} onClick={() => isMasterAdmin && setDetailRule(rule)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-base font-heading">{rule.name}</CardTitle>
                        <Badge className={cn("text-xs", rule.discount_type === "free" ? "bg-emerald-500/15 text-emerald-500" : rule.discount_type === "percentage" ? "bg-amber-500/15 text-amber-500" : "bg-primary/15 text-primary")}>
                          {formatDiscount(rule.discount_type, rule.discount_value)}
                        </Badge>
                        {(() => { const s = getRuleStatus(rule); return <Badge className={cn("text-xs", s.color)}>{s.label}</Badge>; })()}
                        <span className="text-xs text-muted-foreground">
                          {rule.max_total_uses ? `${rule.max_total_uses} total uses` : "Unlimited users"} · {rule.uses_per_customer}× per customer
                        </span>
                        {(rule.start_date || rule.end_date) && (
                          <span className="text-xs text-muted-foreground">
                            {rule.start_date ? format(new Date(rule.start_date + "T00:00"), "MMM d, yyyy") : "—"} → {rule.end_date ? format(new Date(rule.end_date + "T00:00"), "MMM d, yyyy") : "No end"}
                          </span>
                        )}
                        {isMasterAdmin && rule.creator_name && (
                          <span className="text-xs text-muted-foreground italic">
                            Created by {rule.creator_name} on {format(new Date(rule.created_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Active</Label>
                          <Switch checked={rule.active} onCheckedChange={(v) => toggleRuleActive(rule.id, v)} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isMasterAdmin && (
                  <CardContent onClick={e => e.stopPropagation()}>
                    <Label className="text-xs text-muted-foreground mb-2 block">Participating Clubs</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
                          <Users className="h-3.5 w-3.5" />
                          {rule.clubs.length === clubs.length ? "All Clubs" : `${rule.clubs.length} of ${clubs.length} Clubs`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-3 bg-card border-border" align="start">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-muted-foreground">Participating Clubs</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-muted-foreground"
                            onClick={async () => {
                              const allSelected = rule.clubs.length === clubs.length;
                              if (allSelected) {
                                for (const cid of [...rule.clubs]) await toggleRuleClub(rule.id, cid, true);
                              } else {
                                for (const club of clubs) {
                                  if (!rule.clubs.includes(club.id)) await toggleRuleClub(rule.id, club.id, false);
                                }
                              }
                            }}
                          >
                            {rule.clubs.length === clubs.length ? "Untick All" : "Tick All"}
                          </Button>
                        </div>
                        <div className="space-y-1.5 max-h-52 overflow-y-auto">
                          {clubs.map(club => {
                            const participating = rule.clubs.includes(club.id);
                            return (
                              <label key={club.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors">
                                <Checkbox checked={participating} onCheckedChange={() => toggleRuleClub(rule.id, club.id, participating)} />
                                <span className="text-sm text-foreground">{club.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Apply Promotion Dialog */}
      <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Apply Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{promoSelectedUsers.size} user(s) selected</p>

            <div>
              <Label className="text-sm">Discount Type</Label>
              <Select value={promoDiscountType} onValueChange={setPromoDiscountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                  <SelectItem value="free">Free Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {promoDiscountType !== "free" && (
              <div>
                <Label className="text-sm">{promoDiscountType === "percentage" ? "Percentage (%)" : "Amount ($)"}</Label>
                <Input type="number" value={promoDiscountValue} onChange={e => setPromoDiscountValue(e.target.value)} min={1} max={promoDiscountType === "percentage" ? 100 : undefined} />
              </div>
            )}

            <div>
              <Label className="text-sm">Number of Bookings (uses)</Label>
              <Input type="number" value={promoUses} onChange={e => setPromoUses(e.target.value)} min={1} />
              <p className="text-xs text-muted-foreground mt-1">Discount applies to their next {promoUses} booking(s).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyPromotion} disabled={promoSaving}>
              {promoSaving ? "Applying..." : "Apply Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Price Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Create Price Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm">Rule Name</Label>
              <Input value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Summer Sale" />
            </div>
            <div>
              <Label className="text-sm">Discount Type</Label>
              <Select value={ruleDiscountType} onValueChange={setRuleDiscountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                  <SelectItem value="free">Free Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ruleDiscountType !== "free" && (
              <div>
                <Label className="text-sm">{ruleDiscountType === "percentage" ? "Percentage (%)" : "Amount ($)"}</Label>
                <Input type="number" value={ruleDiscountValue} onChange={e => setRuleDiscountValue(e.target.value)} min={1} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !ruleStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {ruleStartDate ? format(ruleStartDate, "MMM d, yyyy") : "Optional"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={ruleStartDate} onSelect={setRuleStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm mb-1 block">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !ruleEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {ruleEndDate ? format(ruleEndDate, "MMM d, yyyy") : "Optional"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={ruleEndDate} onSelect={setRuleEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label className="text-sm">Max Total Uses (customers)</Label>
              <Input type="number" value={ruleMaxTotalUses} onChange={e => setRuleMaxTotalUses(e.target.value)} placeholder="Leave empty for unlimited" min={1} />
              <p className="text-xs text-muted-foreground mt-1">First X customers to use this rule. Empty = unlimited.</p>
            </div>
            <div>
              <Label className="text-sm">Uses per Customer</Label>
              <Input type="number" value={ruleUsesPerCustomer} onChange={e => setRuleUsesPerCustomer(e.target.value)} min={1} />
              <p className="text-xs text-muted-foreground mt-1">How many times each customer can benefit from this rule.</p>
            </div>
            {isMasterAdmin && (
            <div>
              <Label className="text-sm mb-2 block">Participating Clubs</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9 text-sm">
                    <Users className="h-3.5 w-3.5" />
                    {ruleSelectedClubs.size === clubs.length ? "All Clubs" : `${ruleSelectedClubs.size} of ${clubs.length} Clubs`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-3 bg-card border-border" align="start">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Select Clubs</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2 text-muted-foreground"
                      onClick={() => {
                        if (ruleSelectedClubs.size === clubs.length) {
                          setRuleSelectedClubs(new Set());
                        } else {
                          setRuleSelectedClubs(new Set(clubs.map(c => c.id)));
                        }
                      }}
                    >
                      {ruleSelectedClubs.size === clubs.length ? "Untick All" : "Tick All"}
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {clubs.map(club => {
                      const selected = ruleSelectedClubs.has(club.id);
                      return (
                        <label key={club.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors">
                          <Checkbox checked={selected} onCheckedChange={() => {
                            setRuleSelectedClubs(prev => {
                              const next = new Set(prev);
                              if (next.has(club.id)) next.delete(club.id); else next.add(club.id);
                              return next;
                            });
                          }} />
                          <span className="text-sm text-foreground">{club.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRule} disabled={ruleSaving}>
              {ruleSaving ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Rule Detail Dialog (mega admin only) */}
      <Dialog open={!!detailRule} onOpenChange={(open) => { if (!open) setDetailRule(null); }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{detailRule?.name}</DialogTitle>
          </DialogHeader>
          {detailRule && (() => {
            const status = getRuleStatus(detailRule);
            const participatingClubs = clubs.filter(c => detailRule.clubs.includes(c.id));
            return (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Discount</p>
                    <p className="text-sm font-medium text-foreground">{formatDiscount(detailRule.discount_type, detailRule.discount_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge className={cn("text-xs", status.color)}>{status.label}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Max Total Uses</p>
                    <p className="text-sm text-foreground">{detailRule.max_total_uses ?? "Unlimited"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Uses per Customer</p>
                    <p className="text-sm text-foreground">{detailRule.uses_per_customer}×</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Activation Date</p>
                    <p className="text-sm text-foreground">{detailRule.start_date ? format(new Date(detailRule.start_date + "T00:00"), "MMM d, yyyy") : "Immediate"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Deactivation Date</p>
                    <p className="text-sm text-foreground">{detailRule.end_date ? format(new Date(detailRule.end_date + "T00:00"), "MMM d, yyyy") : "No end date"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created By</p>
                    <p className="text-sm text-foreground">{detailRule.creator_name || "System / Mega Admin"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created On</p>
                    <p className="text-sm text-foreground">{format(new Date(detailRule.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Participating Clubs ({participatingClubs.length})</p>
                  {participatingClubs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {participatingClubs.map(c => (
                        <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No clubs assigned</p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PromotionsTab;
