import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfileComplete } from "@/hooks/useProfileComplete";
import MobileTabBar from "@/components/MobileTabBar";
import Index from "./pages/Index";
import BookPage from "./pages/Book";
import AcademyPage from "./pages/Academy";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import ProfilePage from "./pages/Profile";
import LoyaltyPage from "./pages/Loyalty";
import ClubsPage from "./pages/Clubs";
import AdminPage from "./pages/Admin";
import AdminLoginPage from "./pages/AdminLogin";
import MatchmakerPage from "./pages/Matchmaker";
import HabitsPage from "./pages/Habits";
import CommunityPage from "./pages/Community";
import CompleteProfilePage from "./pages/CompleteProfile";
import BookingsPage from "./pages/Bookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Redirects authenticated users with incomplete profiles to /complete-profile */
const ProfileGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isComplete, loading } = useProfileComplete();
  const location = useLocation();

  // Don't guard these paths
  const exemptPaths = ["/complete-profile", "/auth", "/reset-password", "/admin", "/admin-login"];
  if (exemptPaths.some(p => location.pathname.startsWith(p))) return <>{children}</>;

  // If logged in and profile incomplete, redirect
  if (!loading && user && isComplete === false) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/matchmaker" element={<MatchmakerPage />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/academy" element={<AcademyPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/loyalty" element={<LoyaltyPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileTabBar />
          </ProfileGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
