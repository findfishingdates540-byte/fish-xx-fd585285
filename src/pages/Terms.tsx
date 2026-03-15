import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Heart, 
  Fish, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  CreditCard,
  FileText,
  Scale,
  UserCheck,
  Image,
  MessageSquare,
  Ban,
  Calendar,
  Clock,
  RefreshCw,
  XCircle,
  DollarSign,
  Pause,
  Award,
  Anchor,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PublicHeader, PublicFooter } from '@/components/layout';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'eligibility', label: 'Eligibility & Account' },
  { id: 'verification', label: 'Verification' },
  { id: 'mode-rules', label: 'Mode-Specific Rules' },
  { id: 'premium', label: 'Premium Subscriptions' },
  { id: 'content', label: 'User Content' },
  { id: 'safety', label: 'Safety & Conduct' },
  { id: 'intellectual', label: 'Intellectual Property' },
  { id: 'disclaimers', label: 'Disclaimers & Liability' },
  { id: 'dispute', label: 'Dispute Resolution' },
  { id: 'miscellaneous', label: 'Miscellaneous' },
];

const Terms = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground text-sm font-medium mb-2">
                <span>LEGAL CENTER</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
              <p className="text-muted-foreground">Last Updated: January 6, 2026</p>
            </div>
            <Button variant="outline" className="hidden md:flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-6 sticky top-32">
              <div className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  TABLE OF CONTENTS
                </h3>
                <nav className="space-y-1 max-h-[400px] overflow-y-auto">
                  {sections.map((section, index) => (
                    <button 
                      key={section.id} 
                      onClick={() => scrollToSection(section.id)} 
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        activeSection === section.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                        activeSection === section.id 
                          ? 'bg-primary-foreground/20 text-primary-foreground' 
                          : 'bg-muted-foreground/20'
                      }`}>
                        {index + 1}
                      </span>
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Need Help Box */}
              <div className="bg-muted rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-foreground font-medium mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Need Help?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  If you have questions about these terms, please contact our legal team.
                </p>
                <Link to="/contact" className="text-primary text-sm font-medium hover:underline">
                  Contact Support
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
              
              {/* Section 1: Introduction */}
              <section id="introduction" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">1</span>
                  <h2 className="text-2xl font-bold text-foreground">Introduction</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-4 text-muted-foreground">
                  <p>
                    Welcome to FishX! These Terms and Conditions ("Terms") govern your use of the FishX website and mobile application (collectively, the "Service") operated by FishX LLC ("Company," "we," "us," or "our").
                  </p>
                  <p>
                    By accessing or using FishX, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our Service.
                  </p>
                  
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Definitions</h4>
                    <ul className="text-sm space-y-2">
                      <li><strong>"Service"</strong> refers to the FishX website, mobile applications, and all related features.</li>
                      <li><strong>"User"</strong> or <strong>"you"</strong> refers to any individual who accesses or uses the Service.</li>
                      <li><strong>"Content"</strong> refers to any photos, text, messages, or other materials you upload or share.</li>
                      <li><strong>"Match"</strong> refers to a mutual connection between users in the Dating add-on.</li>
                      <li><strong>"Buddy"</strong> refers to a connection between users for fishing activities.</li>
                      <li><strong>"Dating Add-On"</strong> refers to the optional dating profile feature available to users 18 and older.</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-800">Arbitration Notice</h4>
                      <p className="text-sm text-amber-700">
                        These Terms contain a binding arbitration clause and class action waiver in Section 10. By using the Service, you agree to resolve most disputes through individual arbitration rather than in court. Please read Section 10 carefully.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Eligibility & Account */}
              <section id="eligibility" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">2</span>
                  <h2 className="text-2xl font-bold text-foreground">Eligibility & Account</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  
                  <h3 className="font-semibold text-foreground">Age Requirements</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>You must be at least <strong className="text-foreground">18 years old</strong> to use any feature of Find Fishing Dates.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>You must be at least <strong className="text-foreground">21 years old</strong> to participate in fishing events or trips where alcohol may be present.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>We may require age verification at any time to confirm eligibility.</span>
                    </li>
                  </ul>

                  <h3 className="font-semibold text-foreground">Account Creation</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>You may only create <strong className="text-foreground">one account per person</strong>. Multiple accounts may result in permanent bans.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>All information you provide must be <strong className="text-foreground">accurate and complete</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>You are responsible for maintaining the <strong className="text-foreground">security of your account credentials</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>We strongly recommend enabling <strong className="text-foreground">two-factor authentication</strong> for additional security.</span>
                    </li>
                  </ul>

                  <h3 className="font-semibold text-foreground">Account Suspension & Termination</h3>
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <p className="mb-3">We may suspend or terminate your account if you:</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Violate these Terms or our Community Guidelines</li>
                      <li>Engage in fraudulent, harmful, or illegal activity</li>
                      <li>Create safety concerns for other users</li>
                      <li>Receive multiple valid reports from other users</li>
                      <li>Attempt to circumvent security measures</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      <strong>Appeal Process:</strong> You may appeal a suspension by contacting <a href="mailto:appeals@findfishingdates.com" className="text-primary hover:underline">appeals@findfishingdates.com</a> within 30 days. Appeals are reviewed within 5-7 business days.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Verification */}
              <section id="verification" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">3</span>
                  <h2 className="text-2xl font-bold text-foreground">Verification</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  <p>
                    Find Fishing Dates offers optional verification to build trust within our community. Verification is strongly encouraged but not required for basic use.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-xl p-5 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-foreground">ID Verification</h4>
                      </div>
                      <ul className="text-sm space-y-2">
                        <li>Submit a government-issued ID (driver's license, passport, or state ID)</li>
                        <li>Receive a <strong>white checkmark badge</strong> on your profile</li>
                        <li>Documents are encrypted and deleted within 30 days of review</li>
                        <li>Review typically takes 24-72 hours</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-5 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-foreground">Live Verification</h4>
                      </div>
                      <ul className="text-sm space-y-2">
                        <li>Take a real-time selfie matching a specific pose</li>
                        <li>Receive a <strong>blue checkmark badge</strong> on your profile</li>
                        <li>Confirms you are who your photos represent</li>
                        <li>Processing is typically instant</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4" />
                      Annual Renewal Required
                    </h4>
                    <p className="text-sm text-amber-700">
                      All verifications expire after one year and must be renewed. You will receive email reminders 30 days, 7 days, and 1 day before expiry. Failure to renew will remove your verification badge.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Important Notes</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>Verification is <strong>not a guarantee of safety</strong>. Always exercise caution when meeting new people.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>We do <strong>not perform background checks</strong>. Verification only confirms identity.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>Submitting fraudulent documents will result in <strong>permanent account termination</strong>.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 4: Mode-Specific Rules */}
              <section id="mode-rules" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">4</span>
                  <h2 className="text-2xl font-bold text-foreground">Mode-Specific Rules</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  <p>
                    Find Fishing Dates operates in three distinct modes. You must follow the rules specific to your active mode(s).
                  </p>
                  
                  {/* Dating Mode */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full">
                      <div className="bg-rose-50 rounded-xl p-5 border border-rose-100 hover:bg-rose-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-rose-600 font-semibold">
                            <Heart className="h-5 w-5" />
                            Dating Mode
                          </div>
                          <ChevronDown className="h-4 w-4 text-rose-400" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm space-y-3">
                      <h4 className="font-medium text-foreground">Profile Requirements</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All profile photos must be recent (within the last 2 years) and accurately represent your current appearance</li>
                        <li>Photos must clearly show your face; group photos alone are not permitted</li>
                        <li>No nudity, explicit content, or inappropriate images</li>
                        <li>Bio must be truthful and not misleading</li>
                      </ul>
                      
                      <h4 className="font-medium text-foreground mt-4">Messaging Conduct</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Respectful communication is required at all times</li>
                        <li>No harassment, bullying, or unwanted sexual messages</li>
                        <li>No commercial solicitation, spam, or scams</li>
                        <li>Respect when someone is not interested; continued contact after being told to stop is harassment</li>
                        <li>After unmatching, do not contact that person through other means</li>
                      </ul>
                      
                      <h4 className="font-medium text-foreground mt-4">Meeting Safety</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Consider video calling before meeting in person</li>
                        <li>Always meet in public places for initial dates</li>
                        <li>Inform a friend or family member of your plans</li>
                        <li>Arrange your own transportation</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Fishing Mode */}
                  <Collapsible>
                    <CollapsibleTrigger className="w-full">
                      <div className="bg-sky-50 rounded-xl p-5 border border-sky-100 hover:bg-sky-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sky-600 font-semibold">
                            <Fish className="h-5 w-5" />
                            Fishing Mode
                          </div>
                          <ChevronDown className="h-4 w-4 text-sky-400" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm space-y-3">
                      <h4 className="font-medium text-foreground">Fishing Spot Rules</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Only share accurate location information for fishing spots</li>
                        <li>Never share spots on private property without owner permission</li>
                        <li>Respect spots marked as private by other users</li>
                        <li>Report any safety hazards at fishing locations</li>
                      </ul>
                      
                      <h4 className="font-medium text-foreground mt-4">Catch Logging</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Log catches accurately with correct species, size, and weight</li>
                        <li>Do not claim catches you did not make</li>
                        <li>Photos must be your own catches, not copied from others</li>
                      </ul>
                      
                      <h4 className="font-medium text-foreground mt-4">Conservation & Regulations</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Follow all local, state, and federal fishing regulations</li>
                        <li>Practice catch-and-release when appropriate</li>
                        <li>Do not promote or share content about poaching or illegal fishing</li>
                        <li>Respect wildlife and natural habitats</li>
                      </ul>
                      
                      <h4 className="font-medium text-foreground mt-4">Buddy System</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Buddy connections are for platonic fishing partnerships</li>
                        <li>Respect buddy preferences and fishing styles</li>
                        <li>Honor trip commitments or provide reasonable notice if canceling</li>
                        <li>Share safety information when planning remote trips</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Combo Mode */}
                  <Collapsible>
                    <CollapsibleTrigger className="w-full">
                      <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 hover:bg-amber-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-600 font-semibold">
                            <Users className="h-5 w-5" />
                            Combo Mode (Dating + Fishing)
                          </div>
                          <ChevronDown className="h-4 w-4 text-amber-400" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 py-4 text-sm space-y-3">
                      <p>Combo Mode users must follow all rules from both Dating and Fishing modes.</p>
                      
                      <h4 className="font-medium text-foreground mt-4">Additional Guidelines</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Be transparent about your intentions (dating vs. buddy)</li>
                        <li>Fishing dates to remote locations require extra safety precautions</li>
                        <li>Always inform a third party of your whereabouts when meeting in remote areas</li>
                        <li>Consider verified public spots for first meetings</li>
                        <li>Do not use buddy features to circumvent dating rejections</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </section>

              {/* Section 5: Premium Subscriptions */}
              <section id="premium" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">5</span>
                  <h2 className="text-2xl font-bold text-foreground">Premium Subscriptions</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Plan Types
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-xl p-5 border border-border">
                      <h4 className="font-semibold text-foreground mb-2">The Angler - $9.99/month</h4>
                      <ul className="text-sm space-y-1">
                        <li>Unlimited spot access and ratings</li>
                        <li>Advanced fishing analytics</li>
                        <li>Buddy matching priority</li>
                        <li>Trip planning tools</li>
                        <li>Ad-free experience</li>
                      </ul>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-5 border border-border">
                      <h4 className="font-semibold text-foreground mb-2">The Trophy - $24.99/month</h4>
                      <ul className="text-sm space-y-1">
                        <li>All Angler features plus:</li>
                        <li>Unlimited likes and Super Likes</li>
                        <li>See who liked you</li>
                        <li>Priority in discovery</li>
                        <li>Advanced match filters</li>
                        <li>Profile boosts included</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Billing
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Subscriptions are billed monthly or annually (annual saves 20%)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Auto-renewal is enabled by default; manage in Settings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Price changes require 30 days advance notice</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Payment processing handled securely by Stripe</span>
                    </li>
                  </ul>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Free Trial
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>New users receive a 30-day premium trial</li>
                    <li>No credit card required for trial</li>
                    <li>3-day grace period after trial ends before features are restricted</li>
                    <li>One trial per person; creating new accounts for trials is prohibited</li>
                  </ul>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Cancellation
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>Cancel anytime in Settings → Subscription → Cancel</li>
                    <li>Access continues until the end of your current billing period</li>
                    <li>No prorated refunds for early cancellation</li>
                    <li>You may resubscribe at any time</li>
                  </ul>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Refunds
                  </h3>
                  <div className="bg-muted/30 rounded-xl p-5 border border-border text-sm">
                    <ul className="space-y-2">
                      <li><strong>7-Day Money-Back Guarantee:</strong> If you're not satisfied within the first 7 days of a new subscription, contact support for a full refund.</li>
                      <li><strong>How to Request:</strong> Email <a href="mailto:billing@findfishingdates.com" className="text-primary hover:underline">billing@findfishingdates.com</a> with your account email and reason.</li>
                      <li><strong>Exceptions:</strong> Refunds may be denied if the account has been suspended for Terms violations or if refund requests appear to be abusive.</li>
                    </ul>
                  </div>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Pause className="h-5 w-5" />
                    Subscription Pause
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>Pause your subscription for up to 3 months</li>
                    <li>No charges during pause period</li>
                    <li>Premium features are suspended during pause</li>
                    <li>Your profile remains visible unless you also hide it</li>
                    <li>Pause available in Settings → Subscription</li>
                  </ul>
                </div>
              </section>

              {/* Section 6: User Content */}
              <section id="content" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">6</span>
                  <h2 className="text-2xl font-bold text-foreground">User Content</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Content You Upload
                  </h3>
                  <p>You may upload the following types of content:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Profile photos and bio text</li>
                    <li>Catch photos and fishing logs</li>
                    <li>Fishing spot information and photos</li>
                    <li>Messages, voice notes, and reactions</li>
                    <li>Reviews and ratings</li>
                    <li>Feed posts and comments</li>
                  </ul>

                  <h3 className="font-semibold text-foreground">License Grant</h3>
                  <div className="bg-muted/30 rounded-xl p-5 border border-border text-sm">
                    <p className="mb-3">By uploading content, you grant Find Fishing Dates a:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Non-exclusive, worldwide, royalty-free license</li>
                      <li>Right to use, copy, modify, display, and distribute your content</li>
                      <li>Right to create derivative works (e.g., cropping photos)</li>
                    </ul>
                    <p className="mt-3">This license is necessary to operate the Service (displaying your profile to other users, storing messages, etc.). You retain ownership of your content.</p>
                    <p className="mt-2"><strong>Public Content:</strong> Content shared publicly (spots, catches, feed posts) may be visible even after account deletion if others have interacted with it. Anonymization will be applied.</p>
                  </div>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    Content Restrictions
                  </h3>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5">
                    <p className="text-sm text-foreground mb-3">The following content is strictly prohibited:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Nudity, sexually explicit material, or pornography</li>
                      <li>Violence, gore, or graphic content (catch photos showing fish are acceptable)</li>
                      <li>Hate speech, discrimination, or content promoting harm</li>
                      <li>Copyright-infringing material</li>
                      <li>Spam, advertisements, or commercial solicitations</li>
                      <li>False or misleading information</li>
                      <li>Content involving minors</li>
                      <li>Illegal activities including poaching</li>
                    </ul>
                  </div>

                  <h3 className="font-semibold text-foreground">Content Moderation</h3>
                  <ul className="text-sm space-y-2">
                    <li>We reserve the right to remove any content that violates these Terms</li>
                    <li>We are not obligated to monitor all content but may do so</li>
                    <li>Reported content is reviewed by our moderation team</li>
                    <li>You are responsible for ensuring your content complies with all applicable laws</li>
                  </ul>
                </div>
              </section>

              {/* Section 7: Safety & Conduct */}
              <section id="safety" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">7</span>
                  <h2 className="text-2xl font-bold text-foreground">Safety & Conduct</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  
                  <h3 className="font-semibold text-foreground">Community Guidelines</h3>
                  <p>All users must:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Treat all users with respect and dignity</li>
                    <li>Communicate honestly and in good faith</li>
                    <li>Respect boundaries and consent</li>
                    <li>Report suspicious or harmful behavior</li>
                    <li>Follow all applicable laws</li>
                  </ul>
                  <p className="mt-3">
                    <Link to="/guidelines" className="text-primary hover:underline">Read our full Community Guidelines →</Link>
                  </p>

                  {/* Zero Tolerance Alert */}
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-destructive">Zero Tolerance Policy</h4>
                        <p className="text-sm text-foreground mt-2">
                          The following behaviors result in immediate, permanent account termination with no appeal:
                        </p>
                        <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                          <li>Sexual harassment or assault</li>
                          <li>Threats of violence</li>
                          <li>Child exploitation or content involving minors</li>
                          <li>Hate speech targeting protected groups</li>
                          <li>Documented stalking or doxxing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground">Reporting</h3>
                  <ul className="text-sm space-y-2">
                    <li>Report violations using the report button on profiles or in chats</li>
                    <li>Provide as much detail as possible with your report</li>
                    <li>Reports are confidential; the reported user will not know who reported them</li>
                    <li>False reports made in bad faith may result in action against the reporter</li>
                    <li>Urgent safety concerns can be reported to <a href="mailto:safety@findfishingdates.com" className="text-primary hover:underline">safety@findfishingdates.com</a></li>
                  </ul>

                  <h3 className="font-semibold text-foreground">Meeting Safety</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm">
                    <p className="font-medium text-amber-800 mb-2">Important Reminders</p>
                    <ul className="text-amber-700 space-y-1">
                      <li>Verification badges do not guarantee safety</li>
                      <li>We do not perform criminal background checks</li>
                      <li>Always meet in public places first</li>
                      <li>Share your plans with someone you trust</li>
                      <li>Trust your instincts - if something feels wrong, leave</li>
                    </ul>
                    <p className="mt-3">
                      <Link to="/safety" className="text-amber-800 font-medium hover:underline">Visit our Safety Center →</Link>
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 8: Intellectual Property */}
              <section id="intellectual" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">8</span>
                  <h2 className="text-2xl font-bold text-foreground">Intellectual Property</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  
                  <h3 className="font-semibold text-foreground">Our Property</h3>
                  <p className="text-sm">
                    The Service and its original content (excluding user-generated content), features, and functionality are the exclusive property of Find Fishing Dates LLC. This includes:
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                    <li>Trademarks: "Find Fishing Dates," logos, and brand assets</li>
                    <li>App design, user interface, and code</li>
                    <li>Matching algorithms and recommendation systems</li>
                    <li>Documentation, guides, and marketing materials</li>
                  </ul>

                  <h3 className="font-semibold text-foreground">Your Rights</h3>
                  <ul className="text-sm space-y-2">
                    <li>You retain ownership of all content you create and upload</li>
                    <li>The license you grant us is limited to operating the Service</li>
                    <li>You may delete your content at any time (subject to data retention policies)</li>
                  </ul>

                  <h3 className="font-semibold text-foreground">DMCA Compliance</h3>
                  <div className="bg-muted/30 rounded-xl p-5 border border-border text-sm">
                    <p className="mb-3">If you believe your copyright has been infringed, submit a DMCA takedown notice to:</p>
                    <p>
                      <strong>Email:</strong> <a href="mailto:dmca@findfishingdates.com" className="text-primary hover:underline">dmca@findfishingdates.com</a><br />
                      <strong>Mail:</strong> Find Fishing Dates LLC, ATTN: DMCA Agent, 123 Fishing Lane, Lake City, FL 32055
                    </p>
                    <p className="mt-3">Your notice must include: identification of the copyrighted work, location of infringing material, your contact information, and a statement of good faith belief and accuracy under penalty of perjury.</p>
                  </div>
                </div>
              </section>

              {/* Section 9: Disclaimers & Liability */}
              <section id="disclaimers" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">9</span>
                  <h2 className="text-2xl font-bold text-foreground">Disclaimers & Liability</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6">
                  
                  <div className="bg-muted/50 rounded-xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-3">No Guarantees</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li><strong>Matches:</strong> We do not guarantee you will find romantic partners or fishing buddies</li>
                      <li><strong>Safety:</strong> We cannot guarantee the safety or behavior of other users</li>
                      <li><strong>Fishing Spots:</strong> Spot information is community-contributed; we do not guarantee accuracy of conditions, fish availability, or legal access</li>
                      <li><strong>Service Availability:</strong> While we strive for 99.9% uptime, we do not guarantee uninterrupted service</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-3 uppercase text-sm">Disclaimer of Warranties</h3>
                    <p className="text-sm text-muted-foreground uppercase">
                      THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-5 border border-border">
                    <h3 className="font-semibold text-foreground mb-3 uppercase text-sm">Limitation of Liability</h3>
                    <p className="text-sm text-muted-foreground uppercase">
                      IN NO EVENT SHALL FIND FISHING DATES LLC, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE SERVICE.
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      OUR MAXIMUM LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN SUBSCRIPTION FEES DURING THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 10: Dispute Resolution */}
              <section id="dispute" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">10</span>
                  <h2 className="text-2xl font-bold text-foreground">Dispute Resolution</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-6 text-muted-foreground">
                  
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Informal Resolution First
                  </h3>
                  <p className="text-sm">
                    Before initiating formal proceedings, you agree to contact us at <a href="mailto:legal@findfishingdates.com" className="text-primary hover:underline">legal@findfishingdates.com</a> and attempt to resolve the dispute informally for at least 30 days.
                  </p>

                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Binding Arbitration
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm">
                    <p className="text-amber-800 mb-3">
                      <strong>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.</strong>
                    </p>
                    <ul className="text-amber-700 space-y-2">
                      <li>Any dispute not resolved informally will be resolved through binding individual arbitration</li>
                      <li>Arbitration will be administered by the American Arbitration Association (AAA)</li>
                      <li>You waive the right to participate in class action lawsuits or class-wide arbitration</li>
                      <li>The arbitrator's decision will be final and binding</li>
                    </ul>
                    <p className="mt-3 text-amber-700">
                      <strong>Exceptions:</strong> Small claims court actions and injunctive relief for IP violations may proceed in court.
                    </p>
                    <p className="mt-3 text-amber-800">
                      <strong>Opt-Out:</strong> You may opt out of arbitration by sending written notice to legal@findfishingdates.com within 30 days of account creation.
                    </p>
                  </div>

                  <h3 className="font-semibold text-foreground">Governing Law</h3>
                  <p className="text-sm">
                    These Terms are governed by the laws of the State of California, without regard to conflict of law provisions. For matters not subject to arbitration, you consent to the personal jurisdiction of courts in San Francisco County, California.
                  </p>
                </div>
              </section>

              {/* Section 11: Miscellaneous */}
              <section id="miscellaneous" className="mb-12 scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-semibold">11</span>
                  <h2 className="text-2xl font-bold text-foreground">Miscellaneous</h2>
                </div>
                <div className="border-t border-border pt-6 space-y-4 text-muted-foreground text-sm">
                  
                  <div>
                    <h4 className="font-medium text-foreground">Severability</h4>
                    <p>If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground">Entire Agreement</h4>
                    <p>These Terms, along with our Privacy Policy and Community Guidelines, constitute the entire agreement between you and Find Fishing Dates.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground">No Waiver</h4>
                    <p>Our failure to enforce any right or provision of these Terms shall not be considered a waiver of those rights.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground">Assignment</h4>
                    <p>You may not assign or transfer these Terms without our consent. We may assign our rights to any affiliate or successor.</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground">Contact</h4>
                    <p>
                      For questions about these Terms, contact us at <a href="mailto:legal@findfishingdates.com" className="text-primary hover:underline">legal@findfishingdates.com</a> or:
                    </p>
                    <p className="mt-2">
                      Find Fishing Dates LLC<br />
                      123 Fishing Lane<br />
                      Lake City, FL 32055
                    </p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Sticky Acceptance Bar */}
      <div className="sticky bottom-0 bg-background border-t border-border py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">I accept the Terms & Conditions</p>
            <p className="text-sm text-muted-foreground">By using our service, you agree to these terms</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="px-6">
              Decline
            </Button>
            <Link to="/auth?mode=signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
                Accept & Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default Terms;