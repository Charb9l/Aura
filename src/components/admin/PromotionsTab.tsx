import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Gift, Plus, Trash2, Check, X, Users, Star, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  clubs: string[]; // club IDs
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
}

const LEVEL_NAMES = ["Rookie", "Athlete", "Legend"];

const PromotionsTab = ({ allUsers, clubs }: Props) => {
  const { user: adminUser } = useAuth();
  const [subTab, setSubTab] = useState("loyalty");
  const [loyaltyLeaders, setLoyaltyLeaders] = useState<LoyaltyLeaderEntry[]>([]);
  const [badgeLeaders, setBadgeLeaders] = useState<BadgeLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([]);

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

    // Also count show bookings for AI tracker context
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

    // Price rules
    const ruleClubs = (ruleClubsRes.data || []) as any[];
    const rules: PriceRule[] = ((rulesRes.data || []) as any[]).map(r => ({
      ...r,
      clubs: ruleClubs.filter(rc => rc.price_rule_id === r.id).map(rc => rc.club_id),
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
    } as any).select().single();
    if (error || !rule) { toast.error("Failed to create rule"); setRuleSaving(false); return; }
    // Add clubs
    if (ruleSelectedClubs.size > 0) {
      await supabase.from("price_rule_clubs").insert(
        Array.from(ruleSelectedClubs).map(cid => ({ price_rule_id: (rule as any).id, club_id: cid })) as any
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

  const activePromosForUser = (userId: string) => userPromotions.filter(p => p.user_id === userId && p.remaining_uses > 0);

  if (loading) return <p className="text-muted-foreground text-center py-10">Loading...</p>;

  const currentList = subTab === "loyalty" ? loyaltyLeaders : badgeLeaders;

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
          <TabsTrigger value="loyalty" className="gap-2"><Trophy className="h-4 w-4" /> Loyalty Leaderboard</TabsTrigger>
          <TabsTrigger value="badges" className="gap-2"><Medal className="h-4 w-4" /> AI Tracker Leaderboard</TabsTrigger>
          <TabsTrigger value="rules" className="gap-2"><Gift className="h-4 w-4" /> Price Rules</TabsTrigger>
        </TabsList>

        {/* Loyalty Leaderboard */}
        <TabsContent value="loyalty" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Show Top</Label>
              <Input type="number" value={topN} onChange={e => setTopN(e.target.value)} className="w-20 h-8" min={1} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => selectTopN(loyaltyLeaders)}>
                Select Top {displayN}
              </Button>
              <Button size="sm" onClick={() => { if (promoSelectedUsers.size === 0) { toast.error("Select users first"); return; } setPromoDialogOpen(true); }} disabled={promoSelectedUsers.size === 0} className="gap-2">
                <Gift className="h-4 w-4" /> Apply Promotion ({promoSelectedUsers.size})
              </Button>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
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
                  {loyaltyLeaders.slice(0, displayN).map((entry, i) => (
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
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Show Top</Label>
              <Input type="number" value={topN} onChange={e => setTopN(e.target.value)} className="w-20 h-8" min={1} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => selectTopN(badgeLeaders)}>
                Select Top {displayN}
              </Button>
              <Button size="sm" onClick={() => { if (promoSelectedUsers.size === 0) { toast.error("Select users first"); return; } setPromoDialogOpen(true); }} disabled={promoSelectedUsers.size === 0} className="gap-2">
                <Gift className="h-4 w-4" /> Apply Promotion ({promoSelectedUsers.size})
              </Button>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Badge Levels</TableHead>
                    <TableHead>Total Shows</TableHead>
                    <TableHead>Active Promos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badgeLeaders.slice(0, displayN).map((entry, i) => (
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
            <Button onClick={() => { setRuleDialogOpen(true); setRuleName(""); setRuleDiscountType("percentage"); setRuleDiscountValue("50"); setRuleSelectedClubs(new Set(clubs.map(c => c.id))); }} className="gap-2">
              <Plus className="h-4 w-4" /> Create Price Rule
            </Button>
          </div>

          {priceRules.length === 0 ? (
            <Card className="bg-card border-border"><CardContent className="py-12 text-center text-muted-foreground">No price rules created yet.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {priceRules.map(rule => (
                <Card key={rule.id} className={cn("bg-card border-border", !rule.active && "opacity-60")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-heading">{rule.name}</CardTitle>
                        <Badge className={cn("text-xs", rule.discount_type === "free" ? "bg-emerald-500/15 text-emerald-500" : rule.discount_type === "percentage" ? "bg-amber-500/15 text-amber-500" : "bg-primary/15 text-primary")}>
                          {formatDiscount(rule.discount_type, rule.discount_value)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
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
                  <CardContent>
                    <Label className="text-xs text-muted-foreground mb-2 block">Participating Clubs</Label>
                    <div className="flex flex-wrap gap-2">
                      {clubs.map(club => {
                        const participating = rule.clubs.includes(club.id);
                        return (
                          <button
                            key={club.id}
                            onClick={() => toggleRuleClub(rule.id, club.id, participating)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                              participating ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-muted-foreground"
                            )}
                          >
                            {participating && <Check className="h-3 w-3 inline mr-1" />}
                            {club.name}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
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
            <div>
              <Label className="text-sm mb-2 block">Participating Clubs</Label>
              <div className="flex flex-wrap gap-2">
                {clubs.map(club => {
                  const selected = ruleSelectedClubs.has(club.id);
                  return (
                    <button
                      key={club.id}
                      onClick={() => {
                        setRuleSelectedClubs(prev => {
                          const next = new Set(prev);
                          if (next.has(club.id)) next.delete(club.id);
                          else next.add(club.id);
                          return next;
                        });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        selected ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"
                      )}
                    >
                      {selected && <Check className="h-3 w-3 inline mr-1" />}
                      {club.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRule} disabled={ruleSaving}>
              {ruleSaving ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PromotionsTab;
