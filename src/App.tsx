import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import BookPage from "./pages/Book";
import AcademyPage from "./pages/Academy";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import ProfilePage from "./pages/Profile";
import LoyaltyPage from "./pages/Loyalty";
import ClubsPage from "./pages/Clubs";
import AdminPage from "./pages/Admin";
import MatchmakerPage from "./pages/Matchmaker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/matchmaker" element={<MatchmakerPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
