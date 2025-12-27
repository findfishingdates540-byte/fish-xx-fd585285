import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PageLoader } from "@/components/ui/page-loader";

// Eagerly load the landing page for fastest initial load
import Index from "./pages/Index";

// Lazy load all other pages
const Auth = lazy(() => import("./pages/Auth"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load app layout and components
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));
const DatingRoute = lazy(() => import("@/components/layout/RouteGuard").then(m => ({ default: m.DatingRoute })));
const FishingRoute = lazy(() => import("@/components/layout/RouteGuard").then(m => ({ default: m.FishingRoute })));

// Lazy load app pages
const Discover = lazy(() => import("./pages/app/Discover"));
const Messages = lazy(() => import("./pages/app/Messages"));
const Likes = lazy(() => import("./pages/app/Likes"));
const Spots = lazy(() => import("./pages/app/Spots"));
const AddSpot = lazy(() => import("./pages/app/AddSpot"));
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
const ComboDashboard = lazy(() => import("./pages/app/ComboDashboard"));
const Feed = lazy(() => import("./pages/app/Feed"));
const Notifications = lazy(() => import("./pages/app/Notifications"));
const SpotDetail = lazy(() => import("./pages/app/SpotDetail"));
const AppIndex = lazy(() => import("./pages/app/AppIndex"));
const UserProfile = lazy(() => import("./pages/app/UserProfile"));

// Lazy load admin
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSpots = lazy(() => import("./pages/admin/AdminSpots"));
const AdminMatches = lazy(() => import("./pages/admin/AdminMatches"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCatches = lazy(() => import("./pages/admin/AdminCatches"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminTrips = lazy(() => import("./pages/admin/AdminTrips"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminAds = lazy(() => import("./pages/admin/AdminAds"));
const AdminAdAnalytics = lazy(() => import("./pages/admin/AdminAdAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/login" element={<AdminAuth />} />
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
                <Route path="discover" element={<Suspense fallback={<PageLoader />}><DatingRoute><Discover /></DatingRoute></Suspense>} />
                <Route path="likes" element={<Suspense fallback={<PageLoader />}><DatingRoute><Likes /></DatingRoute></Suspense>} />
                <Route path="matches" element={<Suspense fallback={<PageLoader />}><DatingRoute><Matches /></DatingRoute></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<PageLoader />}><DatingRoute><Messages /></DatingRoute></Suspense>}>
                  <Route path=":matchId" element={<Chat />} />
                </Route>
                
                {/* Fishing-only routes */}
                <Route path="feed" element={<Suspense fallback={<PageLoader />}><FishingRoute><Feed /></FishingRoute></Suspense>} />
                <Route path="spots" element={<Suspense fallback={<PageLoader />}><FishingRoute><Spots /></FishingRoute></Suspense>} />
                <Route path="spots/new" element={<Suspense fallback={<PageLoader />}><FishingRoute><AddSpot /></FishingRoute></Suspense>} />
                <Route path="spots/:id" element={<Suspense fallback={<PageLoader />}><FishingRoute><SpotDetail /></FishingRoute></Suspense>} />
                <Route path="catches" element={<Suspense fallback={<PageLoader />}><FishingRoute><Catches /></FishingRoute></Suspense>} />
                <Route path="buddies" element={<Suspense fallback={<PageLoader />}><FishingRoute><Buddies /></FishingRoute></Suspense>} />
                <Route path="buddy-messages" element={<Suspense fallback={<PageLoader />}><FishingRoute><BuddyMessages /></FishingRoute></Suspense>}>
                  <Route path=":buddyId" element={<BuddyChat />} />
                </Route>
                <Route path="buddy-chat/:buddyId" element={<Suspense fallback={<PageLoader />}><FishingRoute><BuddyChat /></FishingRoute></Suspense>} />
                <Route path="buddy-trip/:buddyId/:spotId" element={<Suspense fallback={<PageLoader />}><FishingRoute><BuddyTripInvite /></FishingRoute></Suspense>} />
                <Route path="trips" element={<Suspense fallback={<PageLoader />}><FishingRoute><Trips /></FishingRoute></Suspense>} />
                <Route path="trips/new" element={<Suspense fallback={<PageLoader />}><FishingRoute><TripPlanner /></FishingRoute></Suspense>} />
                <Route path="trips/:id" element={<Suspense fallback={<PageLoader />}><FishingRoute><TripDetail /></FishingRoute></Suspense>} />
                <Route path="trips/:id/edit" element={<Suspense fallback={<PageLoader />}><FishingRoute><TripPlanner /></FishingRoute></Suspense>} />
                
                {/* Combo mode dashboard */}
                <Route path="dashboard" element={<ComboDashboard />} />
                
                {/* Shared routes (all account types) */}
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="profile/:userId" element={<UserProfile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="spots" element={<AdminSpots />} />
                <Route path="catches" element={<AdminCatches />} />
                <Route path="posts" element={<AdminPosts />} />
                <Route path="trips" element={<AdminTrips />} />
                <Route path="matches" element={<AdminMatches />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="ads" element={<AdminAds />} />
                <Route path="ad-analytics" element={<AdminAdAnalytics />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
