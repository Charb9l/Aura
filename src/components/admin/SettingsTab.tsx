import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Palette, Clock, Bell, Download, Info, Pencil, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PhoneInput from "@/components/PhoneInput";
import ActivityColorPicker from "@/components/ActivityColorPicker";
import { BookingRow, getBookingRevenue } from "./types";
import { format } from "date-fns";

interface Props {
  bookings?: BookingRow[];
}

const SettingsTab = ({ bookings = [] }: Props) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);

    if (profileErr) {
      toast.error("Failed to update profile: " + profileErr.message);
      setSaving(false);
      return;
    }

    if (email !== user.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        toast.error("Failed to update email: " + emailErr.message);
        setSaving(false);
        return;
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        setSaving(false);
        return;
      }
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) {
        toast.error("Failed to update password: " + passErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Account updated successfully");
  };

  const handleExportBookings = () => {
    if (bookings.length === 0) {
      toast.error("No bookings to export");
      return;
    }
    const headers = ["Date", "Time", "Activity", "Customer", "Email", "Phone", "Court Type", "Discount", "Attendance", "Revenue"];
    const rows = bookings.map(b => [
      b.booking_date,
      b.booking_time,
      b.activity_name,
      b.full_name,
      b.email,
      b.phone,
      b.court_type || "",
      b.discount_type || "",
      b.attendance_status || "",
      `$${getBookingRevenue(b)}`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bookings exported successfully");
  };

  // --- Section renders ---

  if (activeSection === "colors") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-colors">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <ActivityColorPicker />
      </motion.div>
    );
  }

  if (activeSection === "account") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-account">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              My Account
            </CardTitle>
            <p className="text-sm text-muted-foreground">Edit your admin account details and credentials.</p>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <p className="text-muted-foreground text-sm py-6 text-center">Loading...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="acc-name">Full Name</Label>
                  <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="acc-email">Email</Label>
                  <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="acc-phone">Phone</Label>
                  <PhoneInput id="acc-phone" value={phone} onChange={setPhone} className="mt-1" />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Change Password</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="acc-pass">New Password</Label>
                      <Input id="acc-pass" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="acc-pass-confirm">Confirm New Password</Label>
                      <Input id="acc-pass-confirm" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-secondary border-border mt-1" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Leave blank to keep your current password.</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-12 text-base font-semibold glow mt-2">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (activeSection === "hours") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-hours">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Operating Hours
            </CardTitle>
            <p className="text-sm text-muted-foreground">The booking calendar operates on the following schedule.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Opening Time</p>
                  <p className="text-xs text-muted-foreground">First available booking slot</p>
                </div>
                <span className="text-lg font-bold font-heading text-primary">7:00 AM</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Closing Time</p>
                  <p className="text-xs text-muted-foreground">Last available booking slot</p>
                </div>
                <span className="text-lg font-bold font-heading text-primary">10:00 PM</span>
              </div>
              <p className="text-xs text-muted-foreground">Operating hours determine the time range shown in the booking calendar. Contact support to modify.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (activeSection === "export") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-export">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Data Export
            </CardTitle>
            <p className="text-sm text-muted-foreground">Export your platform data for external use or backups.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">All Bookings</p>
                    <p className="text-xs text-muted-foreground">{bookings.length} records — CSV format</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleExportBookings} className="gap-2">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Exports include all booking records with customer details, activity, pricing, and attendance status.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (activeSection === "about") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-about">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="text-sm font-medium text-foreground">Elevate Wellness Hub</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admin Panel</span>
                <span className="text-sm font-medium text-foreground">v2.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Logged in as</span>
                <span className="text-sm font-medium text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium text-primary">Super Admin</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Elevate Wellness Hub is a multi-sport booking and wellness platform managing courts, studios, academies, and customer engagement across Lebanon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // --- Main settings list ---
  const settingsItems = [
    { id: "account", icon: User, label: "My Account", description: "Edit your name, email, phone, and password" },
    { id: "colors", icon: Palette, label: "Activity Brand Colors", description: "Set brand colors for each activity across the customer experience" },
    { id: "hours", icon: Clock, label: "Operating Hours", description: "View booking calendar hours of operation" },
    { id: "export", icon: Download, label: "Data Export", description: "Download booking data as CSV for reporting" },
    { id: "about", icon: Info, label: "About", description: "Platform information and version details" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings">
      <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Configure your application settings.</p>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="flex items-center gap-4 w-full px-6 py-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SettingsTab;
