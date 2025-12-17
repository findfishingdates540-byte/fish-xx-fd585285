import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import OnboardingSuccess from "./pages/OnboardingSuccess";
import About from "./pages/About";
import Dating from "./pages/Dating";
import Fishing from "./pages/Fishing";
import Safety from "./pages/Safety";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import { Discover, Messages, Likes, Spots, Catches, Buddies, Profile, ProfileEdit, Chat } from "./pages/app";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/onboarding/success" element={<OnboardingSuccess />} />
            <Route path="/about" element={<About />} />
            <Route path="/dating" element={<Dating />} />
            <Route path="/fishing" element={<Fishing />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            
            {/* Logged-in app routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/discover" replace />} />
              <Route path="discover" element={<Discover />} />
              <Route path="likes" element={<Likes />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:matchId" element={<Chat />} />
              <Route path="spots" element={<Spots />} />
              <Route path="catches" element={<Catches />} />
              <Route path="buddies" element={<Buddies />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<ProfileEdit />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
