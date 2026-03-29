import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { ShieldCheck, LogIn, KeyRound, ArrowRight } from "lucide-react";
import MobileBackButton from "@/components/MobileBackButton";
import { Spinner } from "@/components/ui/spinner";

const AdminLogin = () => {
  const [adminCode, setAdminCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminLoading) return;
    if (user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      toast.error("Admin code must be exactly 6 digits.");
      return;
    }
    setVerifyingCode(true);

    // Check if any admin role (mega or club) has this code
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, user_id")
      .eq("admin_code", trimmed)
      .eq("role", "admin")
      .maybeSingle();

    setVerifyingCode(false);
    if (error || !data) {
      toast.error("Invalid admin code.");
      return;
    }

    // Fetch the admin's name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", data.user_id)
      .maybeSingle();
    setAdminName(profile?.full_name || "");
    setCodeVerified(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Invalid credentials.");
      setSubmitting(false);
      return;
    }

    // Verify the user has an admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role, admin_code")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      toast.error("Access denied. This portal is for administrators only.");
      setSubmitting(false);
      return;
    }

    // If club admin, verify the code matches
    if (roleData.admin_code && roleData.admin_code !== adminCode.trim()) {
      await supabase.auth.signOut();
      toast.error("Access denied. Invalid admin code.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    navigate("/admin");
  };

  if (user && isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md mb-2">
        <MobileBackButton fallbackPath="/" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-[0.25em] text-primary uppercase">
                Admin Portal
              </p>
              <CardTitle className="text-2xl font-heading">
                {codeVerified ? "Welcome Back" : "Enter Admin Code"}
              </CardTitle>
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              {codeVerified
                ? "Sign in with your administrator credentials."
                : "Enter the code provided by your administrator to continue."}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {!codeVerified ? (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-code" className="text-muted-foreground">
                    Admin Code
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-code"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={adminCode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setAdminCode(v);
                      }}
                      required
                      className="h-12 bg-secondary border-border pl-10 tracking-[0.3em] text-center font-mono text-lg"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={verifyingCode}
                  className="w-full h-12 text-base font-semibold glow gap-2"
                >
                  {verifyingCode ? <Spinner size="sm" /> : <ArrowRight className="h-4 w-4" />}
                  {verifyingCode ? "Verifying..." : "Continue"}
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {adminName && (
                  <p className="text-center text-primary font-semibold text-base">
                    Hello, Admin {adminName} 👋
                  </p>
                )}
                <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-secondary border-border"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-base font-semibold glow gap-2"
                >
                  {submitting ? <Spinner size="sm" /> : <LogIn className="h-4 w-4" />}
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </motion.form>
            )}

            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                This is a restricted area. Only authorized administrators can access the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
