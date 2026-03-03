import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Pencil, MapPin, Plus, Trash2, Check, X, Eye } from "lucide-react";
import CustomerVisionTab from "@/components/CustomerVisionTab";
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

import { useLocations, LocationRow } from "@/hooks/useLocations";

const SettingsTab = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user } = useAuth();
  const { locations, refetch: refetchLocations } = useLocations();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Locations management state
  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

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


  // --- Section renders ---


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








  if (activeSection === "locations") {
    const handleAddLocation = async () => {
      if (!newLocationName.trim()) return;
      setSavingLocation(true);
      const { error } = await supabase.from("locations").insert({ name: newLocationName.trim() });
      if (error) {
        toast.error(error.message.includes("duplicate") ? "Location already exists" : error.message);
      } else {
        toast.success("Location added");
        setNewLocationName("");
        refetchLocations();
      }
      setSavingLocation(false);
    };

    const handleUpdateLocation = async () => {
      if (!editingLocationId || !editingLocationName.trim()) return;
      setSavingLocation(true);
      const { error } = await supabase.from("locations").update({ name: editingLocationName.trim() }).eq("id", editingLocationId);
      if (error) {
        toast.error(error.message.includes("duplicate") ? "Location already exists" : error.message);
      } else {
        toast.success("Location updated");
        setEditingLocationId(null);
        refetchLocations();
      }
      setSavingLocation(false);
    };

    const handleDeleteLocation = async (id: string, name: string) => {
      if (!confirm(`Delete "${name}"? Existing club locations using this city won't be affected.`)) return;
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Location deleted");
        refetchLocations();
      }
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-locations">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Manage Locations
            </CardTitle>
            <p className="text-sm text-muted-foreground">Add, edit, or remove cities/areas available for club locations.</p>
          </CardHeader>
          <CardContent>
            {/* Add new location */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="New city / area name..."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
                className="h-10 bg-secondary border-border"
              />
              <Button onClick={handleAddLocation} disabled={savingLocation || !newLocationName.trim()} size="sm" className="h-10 px-4 gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            {/* Location list */}
            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 group">
                  {editingLocationId === loc.id ? (
                    <>
                      <Input
                        value={editingLocationName}
                        onChange={(e) => setEditingLocationName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateLocation()}
                        className="h-8 bg-secondary border-border text-sm flex-1"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleUpdateLocation} disabled={savingLocation}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingLocationId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-foreground flex-1">{loc.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setEditingLocationId(loc.id); setEditingLocationName(loc.name); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteLocation(loc.id, loc.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4">{locations.length} locations in the master list. These appear as options when assigning club venues.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (activeSection === "customer-vision") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="settings-cv">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => setActiveSection(null)}>
          ← Back to Settings
        </Button>
        <CustomerVisionTab />
      </motion.div>
    );
  }

  // --- Main settings list ---
  const settingsItems = [
    { id: "customer-vision", icon: Eye, label: "Customer Vision", description: "Manage landing page content, branding, and page settings" },
    { id: "account", icon: User, label: "My Account", description: "Edit your name, email, phone, and password" },
    { id: "locations", icon: MapPin, label: "Locations", description: "Manage the master list of cities and areas for club venues" },
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
