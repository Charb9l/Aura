import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import MobileBackButton from "@/components/MobileBackButton";

const EXPIRY_MINUTES = 5;

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkExpiry = (session: any) => {
      if (!session) return;
      // Check token issued-at time
      const iat = session.access_token
        ? JSON.parse(atob(session.access_token.split(".")[1])).iat
        : null;
      if (iat) {
        const elapsed = Date.now() / 1000 - iat;
        if (elapsed > EXPIRY_MINUTES * 60) {
          setIsExpired(true);
          return;
        }
      }
      setIsRecovery(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        checkExpiry(session);
      }
    });

    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      // Session will be set by onAuthStateChange above
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) checkExpiry(session);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/");
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h1 className="font-heading text-3xl font-bold text-foreground">Link Expired</h1>
            <p className="text-muted-foreground">This password reset link has expired (valid for {EXPIRY_MINUTES} minutes).</p>
            <Button onClick={() => navigate("/auth")} className="glow">Back to Login</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-6 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Loading...</h1>
            <p className="text-muted-foreground">Verifying your reset link.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground">Set New Password</h1>
            <p className="mt-2 text-muted-foreground">Enter your new password below.</p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-secondary border-border"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl glow">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
