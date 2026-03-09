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
import { ShieldCheck, LogIn } from "lucide-react";
import MobileBackButton from "@/components/MobileBackButton";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const navigate = useNavigate();

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (adminLoading) return;
    if (user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, adminLoading, navigate]);

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
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      // Not an admin — sign them out immediately
      await supabase.auth.signOut();
      toast.error("Access denied. This portal is for administrators only.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    navigate("/admin");
  };

  // Don't show form if already authenticated as admin (will redirect)
  if (user && isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
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
                Welcome Back
              </CardTitle>
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in with your administrator credentials.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
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
                <LogIn className="h-4 w-4" />
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

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
