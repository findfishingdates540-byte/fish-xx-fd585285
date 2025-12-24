import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout";
import { DatingRoute, FishingRoute } from "@/components/layout/RouteGuard";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
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
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import { Discover, Messages, Likes, Spots, AddSpot, Catches, Buddies, BuddyMessages, BuddyChat, BuddyTripInvite, Profile, ProfileEdit, Chat, Matches, Settings, Trips, TripPlanner, TripDetail, ComboDashboard, Feed } from "./pages/app";
import Notifications from "./pages/app/Notifications";
import SpotDetail from "./pages/app/SpotDetail";
import AppIndex from "./pages/app/AppIndex";
import UserProfile from "./pages/app/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
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
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Logged-in app routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<AppIndex />} />
              
              {/* Dating-only routes */}
              <Route path="discover" element={<DatingRoute><Discover /></DatingRoute>} />
              <Route path="likes" element={<DatingRoute><Likes /></DatingRoute>} />
              <Route path="matches" element={<DatingRoute><Matches /></DatingRoute>} />
              <Route path="messages" element={<DatingRoute><Messages /></DatingRoute>} />
              <Route path="messages/:matchId" element={<DatingRoute><Chat /></DatingRoute>} />
              
              {/* Fishing-only routes */}
              <Route path="feed" element={<FishingRoute><Feed /></FishingRoute>} />
              <Route path="spots" element={<FishingRoute><Spots /></FishingRoute>} />
              <Route path="spots/new" element={<FishingRoute><AddSpot /></FishingRoute>} />
              <Route path="spots/:id" element={<FishingRoute><SpotDetail /></FishingRoute>} />
              <Route path="catches" element={<FishingRoute><Catches /></FishingRoute>} />
              <Route path="buddies" element={<FishingRoute><Buddies /></FishingRoute>} />
              <Route path="buddy-messages" element={<FishingRoute><BuddyMessages /></FishingRoute>} />
              <Route path="buddy-chat/:buddyId" element={<FishingRoute><BuddyChat /></FishingRoute>} />
              <Route path="buddy-trip/:buddyId/:spotId" element={<FishingRoute><BuddyTripInvite /></FishingRoute>} />
              <Route path="trips" element={<FishingRoute><Trips /></FishingRoute>} />
              <Route path="trips/new" element={<FishingRoute><TripPlanner /></FishingRoute>} />
              <Route path="trips/:id" element={<FishingRoute><TripDetail /></FishingRoute>} />
              <Route path="trips/:id/edit" element={<FishingRoute><TripPlanner /></FishingRoute>} />
              
              {/* Combo mode dashboard */}
              <Route path="dashboard" element={<ComboDashboard />} />
              
              {/* Shared routes (all account types) */}
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<ProfileEdit />} />
              <Route path="profile/:userId" element={<UserProfile />} />
              <Route path="settings" element={<Settings />} />
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
