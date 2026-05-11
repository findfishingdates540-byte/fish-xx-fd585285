import { lazy, Suspense } from "react";
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
// Public pages — all lazy loaded (keeps framer-motion out of the entry bundle)
const Index = lazy(() => import("./pages/Index"));
const CookieConsentBanner = lazy(() =>
  import("@/components/CookieConsentBanner").then(m => ({ default: m.CookieConsentBanner }))
);
const Auth = lazy(() => import("./pages/Auth"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const SpotEntry = lazy(() => import("./pages/SpotEntry"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingSuccess = lazy(() => import("./pages/OnboardingSuccess"));
const About = lazy(() => import("./pages/About"));
const Dating = lazy(() => import("./pages/Dating"));
const Fishing = lazy(() => import("./pages/Fishing"));
const Safety = lazy(() => import("./pages/Safety"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const Help = lazy(() => import("./pages/Help"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Stories = lazy(() => import("./pages/Stories"));
const PublicChallenges = lazy(() => import("./pages/Challenges"));

// App pages — lazy loaded
const Discover = lazy(() => import("./pages/app/Discover"));
const Messages = lazy(() => import("./pages/app/Messages"));
const Likes = lazy(() => import("./pages/app/Likes"));
const Spots = lazy(() => import("./pages/app/Spots"));
const Catches = lazy(() => import("./pages/app/Catches"));
const Buddies = lazy(() => import("./pages/app/Buddies"));
const BuddyMessages = lazy(() => import("./pages/app/BuddyMessages"));
const BuddyChat = lazy(() => import("./pages/app/BuddyChat"));
const BuddyTripInvite = lazy(() => import("./pages/app/BuddyTripInvite"));
const Profile = lazy(() => import("./pages/app/Profile"));
const ProfileEdit = lazy(() => import("./pages/app/ProfileEdit"));
const Chat = lazy(() => import("./pages/app/Chat"));
const Matches = lazy(() => import("./pages/app/Matches"));
const Settings = lazy(() => import("./pages/app/Settings"));
const Trips = lazy(() => import("./pages/app/Trips"));
const TripPlanner = lazy(() => import("./pages/app/TripPlanner"));
const TripDetail = lazy(() => import("./pages/app/TripDetail"));
const Feed = lazy(() => import("./pages/app/Feed"));
const MyTickets = lazy(() => import("./pages/app/MyTickets"));
const SocialProfile = lazy(() => import("./pages/app/SocialProfile"));
const UserFeed = lazy(() => import("./pages/app/UserFeed"));
const CallHistory = lazy(() => import("./pages/app/CallHistory"));
const IncomingCallScreen = lazy(() => import("./pages/app/IncomingCallScreen"));
const Leaderboard = lazy(() => import("./pages/app/Leaderboard"));
const SpeciesLeaderboard = lazy(() => import("./pages/app/SpeciesLeaderboard"));
const SpeciesExplorer = lazy(() => import("./pages/app/SpeciesExplorer"));
const AnglerTrophies = lazy(() => import("./pages/app/AnglerTrophies"));
const CatchDetail = lazy(() => import("./pages/app/CatchDetail"));
const Challenges = lazy(() => import("./pages/app/Challenges"));
const CreateChallenge = lazy(() => import("./pages/app/CreateChallenge"));
const Teams = lazy(() => import("./pages/app/Teams"));
const CreateTeam = lazy(() => import("./pages/app/CreateTeam"));
const TeamProfile = lazy(() => import("./pages/app/TeamProfile"));
const Followers = lazy(() => import("./pages/app/Followers"));
const Notifications = lazy(() => import("./pages/app/Notifications"));
const SpotDetail = lazy(() => import("./pages/app/SpotDetail"));
const AppIndex = lazy(() => import("./pages/app/AppIndex"));
const UserProfile = lazy(() => import("./pages/app/UserProfile"));
const DatingProfile = lazy(() => import("./pages/app/DatingProfile"));
const DatingSetup = lazy(() => import("./pages/app/DatingSetup"));
const PhotoChallenges = lazy(() => import("./pages/app/PhotoChallenges"));
const PhotoChallengeDetail = lazy(() => import("./pages/app/PhotoChallengeDetail"));
const Tournaments = lazy(() => import("./pages/app/Tournaments"));
const TournamentDetail = lazy(() => import("./pages/app/TournamentDetail"));
const CreateTournament = lazy(() => import("./pages/app/CreateTournament"));

// Admin — lazy loaded
const AdminLayout = lazy(() => import("@/components/admin").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSpots = lazy(() => import("./pages/admin/AdminSpots"));
const AdminMatches = lazy(() => import("./pages/admin/AdminMatches"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCatches = lazy(() => import("./pages/admin/AdminCatches"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments"));
const AdminTrips = lazy(() => import("./pages/admin/AdminTrips"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminAds = lazy(() => import("./pages/admin/AdminAds"));
const AdminAdAnalytics = lazy(() => import("./pages/admin/AdminAdAnalytics"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminSupportTickets = lazy(() => import("./pages/admin/AdminSupportTickets"));
const AdminFishSpecies = lazy(() => import("./pages/admin/AdminFishSpecies"));
const AdminPhotoChallenges = lazy(() => import("./pages/admin/AdminPhotoChallenges"));

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
          <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            {/* Public pages - force light theme */}
            <Route path="/" element={<ForceLightTheme><Index /></ForceLightTheme>} />
            <Route path="/auth" element={<ForceLightTheme><Auth /></ForceLightTheme>} />
            <Route path="/admin/login" element={<ForceLightTheme><AdminAuth /></ForceLightTheme>} />
            <Route path="/spot-entry" element={<ForceLightTheme><SpotEntry /></ForceLightTheme>} />
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
            <Route path="/stories" element={<ForceLightTheme><Stories /></ForceLightTheme>} />
            <Route path="/challenges" element={<ForceLightTheme><PublicChallenges /></ForceLightTheme>} />
            
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
              <Route path="trophies" element={<AnglerTrophies />} />
              <Route path="profile/:userId" element={<UserProfile />} />
              <Route path="dating-profile/:userId" element={<DatingProfile />} />
              <Route path="dating-setup" element={<DatingSetup />} />
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
          </Suspense>
          <Suspense fallback={null}>
            <CookieConsentBanner />
          </Suspense>
        </BrowserRouter>
        </TooltipProvider>
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
