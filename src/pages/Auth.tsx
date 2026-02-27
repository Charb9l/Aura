import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import PhoneInput from "@/components/PhoneInput";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Don't redirect while we're checking the admin role
    if (checkingRole) return;
    if (user) navigate("/");
  }, [user, navigate, checkingRole]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the confirmation link!");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCheckingRole(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setCheckingRole(false);
      toast.error("Invalid email or password.");
      return;
    }

    // Check if user is an admin — block customer login for admins
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleData) {
      await supabase.auth.signOut();
      setLoading(false);
      setCheckingRole(false);
      toast.error("Invalid email or password.");
      return;
    }

    setCheckingRole(false);
    setLoading(false);
    navigate("/");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the reset link!");
      setIsForgot(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Forgot Password Dialog — 2/3 screen */}
      <Dialog open={isForgot} onOpenChange={setIsForgot}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleForgotPassword} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-muted-foreground">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-secondary border-border"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl glow">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex min-h-screen items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isLogin ? "Sign in to book your sessions" : "Sign up to start booking"}
            </p>
          </div>

          <form
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="space-y-5"
          >
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="h-12 bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-muted-foreground">Phone Number</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={setPhone}
                    required={!isLogin}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-bold rounded-xl glow"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
