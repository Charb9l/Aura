import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";
import MobileBackButton from "@/components/MobileBackButton";

const CompleteProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save profile: " + error.message);
      setSaving(false);
      return;
    }

    // Also update user metadata so it's consistent
    await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    });

    setSaving(false);
    toast.success("Profile complete!");
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <MobileBackButton fallbackPath="/" />
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground">Complete Your Profile</h1>
            <p className="mt-2 text-muted-foreground">
              Just a few more details before you can start booking.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cp-name" className="text-muted-foreground">Full Name</Label>
              <Input
                id="cp-name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-phone" className="text-muted-foreground">Phone Number</Label>
              <PhoneInput
                id="cp-phone"
                value={phone}
                onChange={setPhone}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={saving || !fullName.trim() || !phone.trim()}
              className="w-full h-12 text-base font-bold rounded-xl glow"
            >
              {saving ? "Saving..." : "Continue"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteProfile;
