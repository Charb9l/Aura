import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { motion } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";
import { Users, CalendarCheck, TrendingUp, Activity, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import AdminNavbar from "@/components/AdminNavbar";
import Navbar from "@/components/Navbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const ACTIVITY_PRICES: Record<string, number> = {
  tennis: 50,
  basketball: 40,
  "aerial-yoga": 35,
  pilates: 45,
};

const CHART_COLORS = [
  "hsl(262, 50%, 55%)",
  "hsl(212, 70%, 55%)",
  "hsl(100, 22%, 60%)",
  "hsl(30, 80%, 55%)",
];

interface BookingRow {
  id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

const AdminLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    }
    // After login, the component will re-render and useAdminRole will check the role
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-heading">Admin Access</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Enter your admin credentials to continue.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-secondary border-border mt-1"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold glow">
                  <LogIn className="h-4 w-4 mr-2" />
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const CreateAdminForm = () => {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("manage-admin", {
      body: { email: newEmail, password: newPassword, full_name: newName },
    });

    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create admin");
    } else {
      toast.success(`Admin account created for ${newEmail}`);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    }
  };

  return (
    <Card className="bg-card border-border max-w-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Create Admin Account
        </CardTitle>
        <p className="text-sm text-muted-foreground">Create a new account with admin privileges.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <Label htmlFor="new-name">Full Name</Label>
            <Input id="new-name" placeholder="John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" type="email" placeholder="admin@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="h-12 bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="new-password">Password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="h-12 bg-secondary border-border mt-1" />
          </div>
          <Button type="submit" disabled={creating} className="w-full h-12 text-base font-semibold glow">
            <UserPlus className="h-4 w-4 mr-2" />
            {creating ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      const [bRes, pRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      ]);
      if (bRes.data) setBookings(bRes.data);
      if (pRes.data) setProfiles(pRes.data);
      setLoadingData(false);
    };
    fetchData();
  }, []);

  if (loadingData) {
    return (
      <div className="min-h-screen">
        <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalUsers = profiles.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (ACTIVITY_PRICES[b.activity] || 0), 0);

  const categoryData = Object.entries(
    bookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.activity_name] = (acc[b.activity_name] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = startOfDay(subDays(new Date(), 13 - i));
    const dateStr = format(d, "yyyy-MM-dd");
    const count = bookings.filter(b => b.booking_date === dateStr).length;
    return { date: format(d, "MMM dd"), count };
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBookings = bookings.filter(b => b.booking_date === todayStr).length;

  return (
    <div className="min-h-screen">
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="container mx-auto px-6 pt-28 pb-16">

        {/* Dashboard / Overview */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="overview">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground mb-8">Overview of your business metrics.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Registered Users", value: totalUsers, icon: Users, color: "text-accent" },
                { label: "Total Bookings", value: totalBookings, icon: CalendarCheck, color: "text-primary" },
                { label: "Today's Bookings", value: todayBookings, icon: Activity, color: "text-brand-wellness" },
                { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-brand-tennis" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold font-heading text-foreground">{stat.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="users">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Users</h1>
            <p className="text-muted-foreground mb-8">All registered customers.</p>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users yet.</TableCell></TableRow>
                    ) : profiles.map((p) => (
                      <TableRow key={p.user_id}>
                        <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                        <TableCell>{p.phone || "—"}</TableCell>
                        <TableCell>{format(new Date(p.created_at), "PPP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admins */}
        {activeTab === "admins" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="admins">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Admins</h1>
            <p className="text-muted-foreground mb-8">Create and manage admin accounts.</p>
            <CreateAdminForm />
          </motion.div>
        )}

        {/* Reporting */}
        {activeTab === "reporting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reporting">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Reporting</h1>
            <p className="text-muted-foreground mb-8">Detailed booking analytics.</p>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-lg">Daily Bookings (Last 14 Days)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={last14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 18%)" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} />
                      <Bar dataKey="count" fill="hsl(262, 50%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-lg">Bookings by Category</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 18%)", borderRadius: 8, color: "hsl(0, 0%, 95%)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No bookings yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-lg">All Bookings</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No bookings yet.</TableCell></TableRow>
                    ) : bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.full_name}</TableCell>
                        <TableCell>{b.activity_name}</TableCell>
                        <TableCell>{b.booking_date}</TableCell>
                        <TableCell>{b.booking_time}</TableCell>
                        <TableCell>{b.phone}</TableCell>
                        <TableCell><Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground mb-8">Configure your application settings.</p>
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                Settings coming soon.
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Promotions */}
        {activeTab === "promotions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="promotions">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Promotions</h1>
            <p className="text-muted-foreground mb-8">Manage deals and promotional offers.</p>
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                Promotions coming soon.
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
};

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in, or logged in but not admin → show login form
  if (!user || !isAdmin) {
    // If logged in but not admin, show access denied
    if (user && !isAdmin) {
      return (
        <div className="min-h-screen">
          <Navbar />
          <div className="flex min-h-screen items-center justify-center px-6 pt-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">This account does not have admin privileges.</p>
            </motion.div>
          </div>
        </div>
      );
    }

    return <AdminLoginForm />;
  }

  return <AdminDashboard />;
};

export default AdminPage;
