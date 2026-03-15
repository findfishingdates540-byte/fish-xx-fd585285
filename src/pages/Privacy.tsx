import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Fish, 
  Search, 
  Info, 
  Database, 
  BarChart3, 
  Share2, 
  Shield, 
  Mail,
  User,
  MapPin,
  Image,
  Activity,
  CheckCircle,
  ChevronDown,
  Calendar,
  Clock,
  Cookie,
  Globe,
  Baby,
  FileText,
  CreditCard,
  Heart,
  Anchor,
  Users,
  MessageSquare,
  Bell,
  Lock
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PublicHeader, PublicFooter } from '@/components/layout';

const sections = [
  { id: 'introduction', label: 'Introduction', icon: Info },
  { id: 'data-collection', label: 'Data Collection', icon: Database },
  { id: 'data-usage', label: 'Data Usage', icon: BarChart3 },
  { id: 'data-retention', label: 'Data Retention', icon: Clock },
  { id: 'sharing', label: 'Sharing & Disclosures', icon: Share2 },
  { id: 'rights', label: 'Your Rights', icon: Shield },
  { id: 'cookies', label: 'Cookies & Tracking', icon: Cookie },
  { id: 'children', label: "Children's Privacy", icon: Baby },
  { id: 'international', label: 'International Transfers', icon: Globe },
  { id: 'updates', label: 'Policy Updates', icon: FileText },
  { id: 'contact', label: 'Contact Us', icon: Mail },
];

const Privacy = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Banner */}
      <div className="pt-32 pb-8 px-6 bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground text-sm font-medium mb-2">
                <Fish className="h-4 w-4" />
                <span>Legal Center</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
              <p className="text-muted-foreground max-w-lg">
                Transparency about how we handle your data in Dating, Fishing, and Combo 
                modes. We believe trust is the catch of the day.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-background rounded-full px-4 py-2 border border-border text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last Updated: January 6, 2026
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-6 sticky top-24">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search (e.g. cookies)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Navigation */}
              <nav className="space-y-1 mb-8 max-h-[400px] overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <section.icon className="h-4 w-4 flex-shrink-0" />
                    {section.label}
                  </button>
                ))}
              </nav>

              {/* Need Help Box */}
              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-foreground mb-2">Need help?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Our privacy team is available to answer your questions.
                </p>
                <a 
                  href="mailto:privacy@fishx.app" 
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  privacy@fishx.app
                </a>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
              
              {/* Section: Introduction */}
              <section id="introduction" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Introduction</h2>
                </div>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Welcome to FishX ("we," "us," or "our"). FishX LLC ("Company") is the data controller responsible for your personal information. We are committed to protecting your privacy and ensuring you understand how we collect, use, and safeguard your data.
                  </p>
                  <p>
                    FishX is a fishing community platform open to users aged 13 and older. Our core features include catch logging, fishing spot discovery, buddy connections, trip planning, and a social feed. For users 18 and older, we offer an optional <span className="bg-primary/10 px-2 py-0.5 rounded font-medium text-primary">Dating Add-On</span> that enables romantic matching with fellow anglers.
                  </p>
                  <p>
                    This Privacy Policy explains what information we collect, how we use it, who we share it with, and your rights regarding your personal data. By using FishX, you consent to the practices described in this policy.
                  </p>
                  <p>
                    <strong className="text-foreground">Data Protection Officer:</strong> For privacy-related inquiries, you may contact our Data Protection Officer at <a href="mailto:dpo@fishx.app" className="text-primary hover:underline">dpo@fishx.app</a>.
                  </p>
                </div>
              </section>

              {/* Section: Information We Collect */}
              <section id="data-collection" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Information We Collect</h2>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  We collect various types of information to provide and improve our services. The data we collect depends on which features you use and your account mode.
                </p>
                
                {/* Account Information */}
                <div className="mb-6">
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Account Information</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Full name and display name</li>
                        <li>Email address and phone number</li>
                        <li>Date of birth (to verify eligibility: 13+ for fishing, 18+ for dating)</li>
                        <li>Gender identity and pronouns</li>
                        <li>Profile photos and bio content</li>
                        <li>Location (city, state, ZIP code)</li>
                        <li>Account credentials (password stored securely hashed)</li>
                        <li>Account mode preference (Dating, Fishing, or Both)</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Verification Data */}
                <div className="mb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Verification Data</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <p><strong>ID Verification:</strong></p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Government-issued ID images (driver's license, passport, state ID)</li>
                        <li>ID document type and expiration date</li>
                        <li>Verification status and timestamps</li>
                        <li>ID images are stored encrypted and deleted within 30 days of review</li>
                      </ul>
                      <p><strong>Live Verification:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Real-time selfie photos for facial comparison</li>
                        <li>Selfie images are processed and deleted within 30 days</li>
                        <li>Verification badge status (white checkmark for ID, blue for Live)</li>
                        <li>Verification expiry dates (annual renewal required)</li>
                        <li>Verification reminder preferences</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Dating Mode Data */}
                <div className="mb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Dating Mode Data</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Match preferences (age range, distance, gender preferences)</li>
                        <li>Relationship goals (relationship, casual, friends)</li>
                        <li>Matching style preference (Mutual or Women First)</li>
                        <li>Swipe history and match data</li>
                        <li>Conversation messages (text, images, voice messages)</li>
                        <li>Message reactions and read receipts</li>
                        <li>Likes, Super Likes, and boost usage</li>
                        <li>Profile prompts and responses</li>
                        <li>Height, education, occupation, and lifestyle preferences</li>
                        <li>Zodiac sign and personality type</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Fishing Mode Data */}
                <div className="mb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Fish className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Fishing Mode Data</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Fishing experience level (beginner, intermediate, advanced, expert)</li>
                        <li>Preferred fish species and target species</li>
                        <li>Fishing gear and tackle preferences</li>
                        <li>Catch logs (photos, species, size, weight, location, date/time)</li>
                        <li>Fishing spot data (GPS coordinates, names, descriptions)</li>
                        <li>Spot privacy settings (public or private)</li>
                        <li>Spot ratings and reviews</li>
                        <li>Trip plans (dates, locations, participants, notes)</li>
                        <li>Buddy connections and requests</li>
                        <li>Buddy messages and conversations</li>
                        <li>Weather preferences and alerts</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Technical Data */}
                <div className="mb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Technical & Usage Data</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Device information (model, operating system, browser type)</li>
                        <li>IP addresses and approximate location derived from IP</li>
                        <li>GPS coordinates when location services are enabled</li>
                        <li>App usage analytics (features used, time spent, navigation patterns)</li>
                        <li>Crash reports and error logs</li>
                        <li>Push notification tokens</li>
                        <li>Cookies and local storage data</li>
                        <li>Last active timestamp and online status</li>
                        <li>Login history and session data</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Payment Data */}
                <div className="mb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Payment Data</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Stripe customer ID (payment processing handled by Stripe)</li>
                        <li>Subscription status and plan type</li>
                        <li>Subscription start date and renewal/expiry dates</li>
                        <li>Billing history and transaction records</li>
                        <li>We do NOT store credit card numbers or CVV codes</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Note:</strong> All payment processing is handled securely by Stripe. We never have access to your full credit card details.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Third-Party Data */}
                <div className="mb-6">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-xl px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Third-Party Data</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Social login data (Google, Apple) - email and profile info you authorize</li>
                        <li>Mapbox location services data for fishing spots and maps</li>
                        <li>Weather API data for trip planning</li>
                        <li>Email delivery confirmations from our email provider</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </section>

              {/* Section: How We Use Your Data */}
              <section id="data-usage" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">How We Use Your Data</h2>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We use your information to provide, improve, and secure our services. Here's how:
                </p>

                <h3 className="font-semibold text-foreground mb-3">Core Services</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Profile Matching:</span>
                      <span className="text-muted-foreground"> We use your preferences, location, and interests to suggest potential dates or fishing buddies that match your criteria.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Real-time Messaging:</span>
                      <span className="text-muted-foreground"> Deliver messages, voice notes, and reactions between you and your matches or buddies.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Verification Processing:</span>
                      <span className="text-muted-foreground"> Review ID documents and selfies to verify user identities and display trust badges.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Fishing Spots:</span>
                      <span className="text-muted-foreground"> Display fishing spots on maps, provide ratings and reviews, and show catches from locations.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Trip Coordination:</span>
                      <span className="text-muted-foreground"> Manage fishing trips, send invitations to buddies, and provide weather updates.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Catch Logging:</span>
                      <span className="text-muted-foreground"> Store and display your fishing catches, including photos, species, and statistics.</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-3">Safety and Security</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Fraud Detection:</span>
                      <span className="text-muted-foreground"> Monitor for suspicious activity, fake accounts, and potential scams to protect our community.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">User Reports:</span>
                      <span className="text-muted-foreground"> Investigate reports of harassment, inappropriate content, or policy violations.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Verification Expiry:</span>
                      <span className="text-muted-foreground"> Track verification status and send renewal reminders to maintain trust in our community.</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-3">Service Improvement</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Algorithm optimization to improve match quality and spot recommendations</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Feature usage analytics to understand what our users value most</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Bug detection and fixing to improve app stability</span>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-3">Communications</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Match and message notifications via push or email</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Verification status emails (approval, rejection, renewal reminders)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Trip reminders and weather alerts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Marketing communications (with opt-out available in settings)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Safety tips and community updates</span>
                  </div>
                </div>
              </section>

              {/* Section: Data Retention */}
              <section id="data-retention" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Data Retention</h2>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We retain your data only as long as necessary to provide our services and comply with legal obligations:
                </p>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Active Account Data</h4>
                    <p className="text-sm text-muted-foreground">Retained while your account is active. Profile information, matches, and messages are available as long as you use our service.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Verification Documents</h4>
                    <p className="text-sm text-muted-foreground">ID photos and selfies are deleted within 30 days of review completion. Verification status is retained but source documents are purged.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Message History</h4>
                    <p className="text-sm text-muted-foreground">Retained until you delete individual messages, unmatch, or delete your account. Deleted messages are permanently removed.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Catch Logs & Fishing Data</h4>
                    <p className="text-sm text-muted-foreground">Retained indefinitely unless you delete individual entries or your account. Public spot contributions may remain anonymized after deletion.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Location History</h4>
                    <p className="text-sm text-muted-foreground">Precise GPS data is retained on a rolling 90-day window for analytics. Approximate location (city/state) is retained with your account.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Deleted Accounts</h4>
                    <p className="text-sm text-muted-foreground">All personal data is permanently purged within 30 days of account deletion request. Some anonymized, aggregated data may be retained for analytics.</p>
                  </div>
                </div>
              </section>

              {/* Section: Sharing & Disclosures */}
              <section id="sharing" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Sharing & Disclosures</h2>
                </div>
                
                <div className="bg-primary/5 border-l-4 border-primary pl-6 py-4 mb-6">
                  <p className="text-foreground font-medium">We do not sell your personal data to third parties.</p>
                </div>
                
                <p className="text-muted-foreground mb-6">We may share information with the following parties:</p>

                <div className="space-y-4">
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-foreground">Service Providers</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Supabase:</strong> Database hosting and user authentication</li>
                        <li><strong>Stripe:</strong> Secure payment processing for premium subscriptions</li>
                        <li><strong>Mapbox:</strong> Mapping, geocoding, and location services for fishing spots</li>
                        <li><strong>Resend:</strong> Transactional email delivery (verification, notifications)</li>
                        <li><strong>Weather APIs:</strong> Weather data for trip planning features</li>
                      </ul>
                      <p className="mt-2">All service providers are bound by data processing agreements and cannot use your data for their own purposes.</p>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-foreground">Legal Requirements</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground">
                      <p>We may disclose your information when required by law, including:</p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Valid court orders and subpoenas</li>
                        <li>Law enforcement requests with proper legal process</li>
                        <li>Emergency situations involving imminent harm or safety threats</li>
                        <li>Protection of our legal rights and property</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-foreground">Business Transfers</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground">
                      <p>In the event of a merger, acquisition, or sale of assets:</p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Your data may be transferred to the acquiring entity</li>
                        <li>You will be notified via email and in-app notification before any transfer</li>
                        <li>This Privacy Policy will continue to apply until updated by the new owner</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-foreground">Other Users</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground">
                      <p>Certain information is shared with other users as part of the service:</p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Your public profile information (photos, bio, fishing interests)</li>
                        <li>Approximate distance (not exact location)</li>
                        <li>Verification badge status</li>
                        <li>Public fishing spots and catches you've shared</li>
                        <li>Online status (if enabled in your settings)</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </section>

              {/* Section: Your Rights */}
              <section id="rights" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Your Rights</h2>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Depending on your location, you may have specific rights regarding your personal information:
                </p>

                <h3 className="font-semibold text-foreground mb-4">All Users</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Access</h4>
                      <p className="text-sm text-muted-foreground">Request a copy of the data we hold about you.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Rectification</h4>
                      <p className="text-sm text-muted-foreground">Update inaccurate or incomplete information via your profile settings.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Deletion</h4>
                      <p className="text-sm text-muted-foreground">Request that we delete your personal data by deleting your account.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Opt-Out</h4>
                      <p className="text-sm text-muted-foreground">Opt-out of marketing communications at any time in Settings.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Data Export</h4>
                      <p className="text-sm text-muted-foreground">Export your data in a portable format (JSON) via Settings.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Withdraw Consent</h4>
                      <p className="text-sm text-muted-foreground">Withdraw consent for optional processing at any time.</p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-4">California Residents (CCPA)</h3>
                <div className="bg-muted/30 rounded-xl p-5 border border-border mb-6">
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li><strong>Right to Know:</strong> Request information about categories of personal data collected and purposes.</li>
                    <li><strong>Right to Delete:</strong> Request deletion of personal information we've collected.</li>
                    <li><strong>Right to Opt-Out of Sale:</strong> We do not sell personal data, but you may exercise this right.</li>
                    <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">To exercise these rights, email <a href="mailto:privacy@fishx.app" className="text-primary hover:underline">privacy@fishx.app</a> with "California Privacy Rights" in the subject line.</p>
                </div>

                <h3 className="font-semibold text-foreground mb-4">European Users (GDPR)</h3>
                <div className="bg-muted/30 rounded-xl p-5 border border-border mb-6">
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                    <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain circumstances.</li>
                    <li><strong>Right to Object:</strong> Object to processing based on legitimate interests.</li>
                    <li><strong>Right to Lodge Complaint:</strong> File a complaint with your local data protection authority.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3"><strong>Legal Basis for Processing:</strong> We process your data based on contractual necessity (providing our service), legitimate interests (security, improvement), and consent (marketing).</p>
                </div>

                <h3 className="font-semibold text-foreground mb-4">Other U.S. State Residents</h3>
                <div className="bg-muted/30 rounded-xl p-5 border border-border">
                  <p className="text-sm text-muted-foreground">Residents of Nevada, Virginia, Colorado, Connecticut, and other states with privacy laws may have similar rights. Contact us at <a href="mailto:privacy@fishx.app" className="text-primary hover:underline">privacy@fishx.app</a> to exercise your state-specific rights.</p>
                </div>
              </section>

              {/* Section: Cookies */}
              <section id="cookies" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Cookie className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Cookies & Tracking</h2>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We use cookies and similar technologies to provide and improve our services:
                </p>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">Required for authentication, security, and basic functionality. Cannot be disabled.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">Help us understand how you use our service to improve features. Can be disabled in settings.</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Preference Cookies</h4>
                    <p className="text-sm text-muted-foreground">Remember your settings like theme preference and language. Can be disabled in settings.</p>
                  </div>
                </div>

                <p className="text-muted-foreground mt-6">
                  <strong>Managing Cookies:</strong> You can manage cookie preferences through your browser settings. Note that disabling essential cookies may prevent you from using our service.
                </p>
              </section>

              {/* Section: Children's Privacy */}
              <section id="children" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Baby className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Children's Privacy</h2>
                </div>
                
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 mb-4">
                   <p className="text-sm text-foreground font-medium">FishX fishing features are available to users aged 13 and older. The Dating Add-On is strictly for users aged 18 and older.</p>
                </div>
                
                <div className="text-muted-foreground space-y-4">
                  <p>We do not knowingly collect personal information from anyone under the age of 13. Our service includes age verification during signup. Users aged 13–17 may only access fishing features; they cannot create a Dating profile.</p>
                  <p>If we discover that we have collected personal information from a minor, we will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Immediately delete the account and all associated data</li>
                    <li>Take steps to prevent future access</li>
                    <li>Notify the appropriate parties if required by law</li>
                  </ul>
                  <p>If you believe someone under 13 has created an account, please contact us immediately at <a href="mailto:safety@fishx.app" className="text-primary hover:underline">safety@fishx.app</a>.</p>
                </div>
              </section>

              {/* Section: International Transfers */}
              <section id="international" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">International Data Transfers</h2>
                </div>
                
                <div className="text-muted-foreground space-y-4">
                  <p>Your data is primarily stored and processed in the United States. If you are located outside the United States, please be aware that your information will be transferred to, stored, and processed in the United States.</p>
                  <p>For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we implement appropriate safeguards for international data transfers, including:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Standard Contractual Clauses approved by the European Commission</li>
                    <li>Data Processing Agreements with all service providers</li>
                    <li>Technical and organizational security measures</li>
                  </ul>
                  <p>By using our service, you consent to the transfer of your data to the United States and acknowledge that U.S. data protection laws may differ from those in your country.</p>
                </div>
              </section>

              {/* Section: Policy Updates */}
              <section id="updates" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Policy Updates</h2>
                </div>
                
                <div className="text-muted-foreground space-y-4">
                  <p>We may update this Privacy Policy from time to time. When we make changes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>We will update the "Last Updated" date at the top of this page</li>
                    <li>For material changes, we will notify you via email and/or in-app notification at least 30 days before they take effect</li>
                    <li>We will provide a summary of what has changed</li>
                    <li>Your continued use of the service after changes constitutes acceptance</li>
                  </ul>
                  <p>We encourage you to review this policy periodically to stay informed about how we protect your information.</p>
                </div>
              </section>

              {/* Section: Contact Us */}
              <section id="contact" className="scroll-mt-24">
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
                    <p className="text-primary-foreground/80 mb-6 max-w-md">
                      If you have any questions about this Privacy Policy or how we handle your data, please contact us.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <a 
                        href="mailto:privacy@findfishingdates.com"
                        className="flex items-center gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-full px-5 py-2.5 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-xs opacity-80">PRIVACY INQUIRIES</div>
                          <div className="text-sm font-medium">privacy@findfishingdates.com</div>
                        </div>
                      </a>
                      
                      <a 
                        href="mailto:dpo@findfishingdates.com"
                        className="flex items-center gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-full px-5 py-2.5 transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-xs opacity-80">DATA PROTECTION OFFICER</div>
                          <div className="text-sm font-medium">dpo@findfishingdates.com</div>
                        </div>
                      </a>
                      
                      <div className="flex items-center gap-2 bg-primary-foreground/20 rounded-full px-5 py-2.5">
                        <MapPin className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-xs opacity-80">MAILING ADDRESS</div>
                          <div className="text-sm font-medium">123 Fishing Lane, Lake City, FL 32055</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-primary-foreground/20">
                      <p className="text-sm text-primary-foreground/70">
                        <strong>Find Fishing Dates LLC</strong><br />
                        Registered in Florida, United States
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Privacy;