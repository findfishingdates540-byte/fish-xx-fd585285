import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/components/call";
import { AppLayout } from "@/components/layout";
import { DatingRoute, FishingRoute } from "@/components/layout/RouteGuard";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ForceLightTheme } from "@/components/layout/ForceLightTheme";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
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
import CommunityGuidelines from "./pages/CommunityGuidelines";
import CookiePolicy from "./pages/CookiePolicy";
import Accessibility from "./pages/Accessibility";
import NotFound from "./pages/NotFound";
import { Discover, Messages, Likes, Spots, Catches, Buddies, BuddyMessages, BuddyChat, BuddyTripInvite, Profile, ProfileEdit, Chat, Matches, Settings, Trips, TripPlanner, TripDetail, Feed, MyTickets, SocialProfile, UserFeed, CallHistory, IncomingCallScreen, Leaderboard } from "./pages/app";
import SpeciesLeaderboard from "./pages/app/SpeciesLeaderboard";
import SpeciesExplorer from "./pages/app/SpeciesExplorer";
import CatchDetail from "./pages/app/CatchDetail";
import Challenges from "./pages/app/Challenges";
import CreateChallenge from "./pages/app/CreateChallenge";
import Teams from "./pages/app/Teams";
import CreateTeam from "./pages/app/CreateTeam";
import TeamProfile from "./pages/app/TeamProfile";
import Followers from "./pages/app/Followers";
import Notifications from "./pages/app/Notifications";
import SpotDetail from "./pages/app/SpotDetail";
import AppIndex from "./pages/app/AppIndex";
import UserProfile from "./pages/app/UserProfile";
import DatingProfile from "./pages/app/DatingProfile";
import DatingSetup from "./pages/app/DatingSetup";
import PhotoChallenges from "./pages/app/PhotoChallenges";
import PhotoChallengeDetail from "./pages/app/PhotoChallengeDetail";
import CreatePhotoChallenge from "./pages/app/CreatePhotoChallenge"; // kept for potential future use
import Tournaments from "./pages/app/Tournaments";
import TournamentDetail from "./pages/app/TournamentDetail";
import CreateTournament from "./pages/app/CreateTournament";

import { AdminLayout } from "@/components/admin";
import { AdminDashboard, AdminUsers, AdminReports, AdminSpots, AdminMatches, AdminSettings, AdminCatches, AdminPosts, AdminComments, AdminTrips, AdminAuditLogs, AdminAds, AdminAdAnalytics, AdminVerifications, AdminSupportTickets } from "./pages/admin";
import AdminFishSpecies from "./pages/admin/AdminFishSpecies";
import AdminPhotoChallenges from "./pages/admin/AdminPhotoChallenges";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data stays fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      refetchOnReconnect: true, // Refetch when reconnecting to internet
      retry: 2, // Retry failed requests twice
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <AuthProvider>
        <CallProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public pages - force light theme */}
            <Route path="/" element={<ForceLightTheme><Index /></ForceLightTheme>} />
            <Route path="/auth" element={<ForceLightTheme><Auth /></ForceLightTheme>} />
            <Route path="/admin/login" element={<ForceLightTheme><AdminAuth /></ForceLightTheme>} />
            <Route path="/onboarding" element={<ForceLightTheme><Onboarding /></ForceLightTheme>} />
            <Route path="/onboarding/success" element={<ForceLightTheme><OnboardingSuccess /></ForceLightTheme>} />
            <Route path="/about" element={<ForceLightTheme><About /></ForceLightTheme>} />
            <Route path="/dating" element={<ForceLightTheme><Dating /></ForceLightTheme>} />
            <Route path="/fishing" element={<ForceLightTheme><Fishing /></ForceLightTheme>} />
            <Route path="/safety" element={<ForceLightTheme><Safety /></ForceLightTheme>} />
            <Route path="/privacy" element={<ForceLightTheme><Privacy /></ForceLightTheme>} />
            <Route path="/terms" element={<ForceLightTheme><Terms /></ForceLightTheme>} />
            <Route path="/contact" element={<ForceLightTheme><Contact /></ForceLightTheme>} />
            <Route path="/help" element={<ForceLightTheme><Help /></ForceLightTheme>} />
            <Route path="/pricing" element={<ForceLightTheme><Pricing /></ForceLightTheme>} />
            <Route path="/checkout" element={<ForceLightTheme><Checkout /></ForceLightTheme>} />
            <Route path="/payment-success" element={<ForceLightTheme><PaymentSuccess /></ForceLightTheme>} />
            <Route path="/guidelines" element={<ForceLightTheme><CommunityGuidelines /></ForceLightTheme>} />
            <Route path="/cookies" element={<ForceLightTheme><CookiePolicy /></ForceLightTheme>} />
            <Route path="/accessibility" element={<ForceLightTheme><Accessibility /></ForceLightTheme>} />
            
            {/* Logged-in app routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<AppIndex />} />
              
              {/* Dating-only routes */}
              <Route path="discover" element={<DatingRoute><Discover /></DatingRoute>} />
              <Route path="likes" element={<DatingRoute><Likes /></DatingRoute>} />
              <Route path="matches" element={<DatingRoute><Matches /></DatingRoute>} />
<Route path="messages" element={<DatingRoute><Messages /></DatingRoute>}>
                <Route path=":matchId" element={<Chat />} />
              </Route>
              
              {/* Fishing-only routes */}
              <Route path="spots" element={<FishingRoute><Spots /></FishingRoute>} />
              <Route path="spots/new" element={<FishingRoute><Navigate to="/app/spots" replace /></FishingRoute>} />
              <Route path="spots/:id" element={<FishingRoute><SpotDetail /></FishingRoute>} />
              <Route path="catches" element={<FishingRoute><Catches /></FishingRoute>} />
              <Route path="catches/:catchId" element={<FishingRoute><CatchDetail /></FishingRoute>} />
              <Route path="leaderboard" element={<FishingRoute><Leaderboard /></FishingRoute>} />
              <Route path="leaderboard/species/:speciesId" element={<FishingRoute><SpeciesLeaderboard /></FishingRoute>} />
              <Route path="species" element={<FishingRoute><SpeciesExplorer /></FishingRoute>} />
              <Route path="challenges" element={<FishingRoute><Challenges /></FishingRoute>} />
              <Route path="photo-challenges" element={<FishingRoute><PhotoChallenges /></FishingRoute>} />
              <Route path="photo-challenges/new" element={<FishingRoute><Navigate to="/app/photo-challenges" replace /></FishingRoute>} />
              <Route path="photo-challenges/:id" element={<FishingRoute><PhotoChallengeDetail /></FishingRoute>} />
              <Route path="challenges/new" element={<FishingRoute><CreateChallenge /></FishingRoute>} />
              <Route path="teams" element={<FishingRoute><Teams /></FishingRoute>} />
              <Route path="teams/new" element={<FishingRoute><CreateTeam /></FishingRoute>} />
              <Route path="teams/:teamId" element={<FishingRoute><TeamProfile /></FishingRoute>} />
              <Route path="tournaments" element={<FishingRoute><Tournaments /></FishingRoute>} />
              <Route path="tournaments/new" element={<FishingRoute><CreateTournament /></FishingRoute>} />
              <Route path="tournaments/:id" element={<FishingRoute><TournamentDetail /></FishingRoute>} />
              <Route path="buddies" element={<FishingRoute><Buddies /></FishingRoute>} />
              <Route path="buddy-messages" element={<FishingRoute><BuddyMessages /></FishingRoute>}>
                <Route path=":buddyId" element={<BuddyChat />} />
              </Route>
              <Route path="buddy-chat/:buddyId" element={<FishingRoute><BuddyChat /></FishingRoute>} />
              <Route path="buddy-trip/:buddyId/:spotId" element={<FishingRoute><BuddyTripInvite /></FishingRoute>} />
              <Route path="trips" element={<FishingRoute><Trips /></FishingRoute>} />
              <Route path="trips/new" element={<FishingRoute><TripPlanner /></FishingRoute>} />
              <Route path="trips/:id" element={<FishingRoute><TripDetail /></FishingRoute>} />
              <Route path="trips/:id/edit" element={<FishingRoute><TripPlanner /></FishingRoute>} />
              
              
              {/* Shared routes (all account types) */}
              
              {/* Shared routes (all account types) */}
              <Route path="feed" element={<Feed />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="my-tickets" element={<MyTickets />} />
              <Route path="call-history" element={<CallHistory />} />
              <Route path="calls/:callId" element={<IncomingCallScreen />} />
              <Route path="u/:userId" element={<SocialProfile />} />
              <Route path="u/:userId/followers" element={<Followers />} />
              <Route path="u/:userId/posts" element={<UserFeed />} />
              <Route path="u/:userId/posts/:postId" element={<UserFeed />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<ProfileEdit />} />
              <Route path="profile/:userId" element={<UserProfile />} />
              <Route path="dating-profile/:userId" element={<DatingProfile />} />
              <Route path="user/:userId" element={<Navigate to="/app/u/:userId" replace />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="spots" element={<AdminSpots />} />
              <Route path="fish-species" element={<AdminFishSpecies />} />
              <Route path="catches" element={<AdminCatches />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="matches" element={<AdminMatches />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="ads" element={<AdminAds />} />
              <Route path="ad-analytics" element={<AdminAdAnalytics />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="support" element={<AdminSupportTickets />} />
              <Route path="photo-challenges" element={<AdminPhotoChallenges />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<ForceLightTheme><NotFound /></ForceLightTheme>} />
          </Routes>
          <CookieConsentBanner />
        </BrowserRouter>
        </TooltipProvider>
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
