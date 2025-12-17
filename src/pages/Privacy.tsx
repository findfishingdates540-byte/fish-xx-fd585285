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
  Calendar
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import logo from '@/assets/logo.jpg';

const sections = [
  { id: 'introduction', label: 'Introduction', icon: Info },
  { id: 'data-collection', label: 'Data Collection', icon: Database },
  { id: 'data-usage', label: 'Data Usage', icon: BarChart3 },
  { id: 'sharing', label: 'Sharing & Disclosures', icon: Share2 },
  { id: 'rights', label: 'Your Rights', icon: Shield },
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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-1 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">FindFish Date</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <Link to="/" className="text-foreground hover:opacity-60 transition-opacity">Home</Link>
            <Link to="/dating" className="text-foreground hover:opacity-60 transition-opacity">Modes</Link>
            <Link to="/safety" className="text-foreground hover:opacity-60 transition-opacity">Safety</Link>
            <Link to="/auth" className="text-foreground hover:opacity-60 transition-opacity">Login</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="pt-20 pb-8 px-6 bg-gradient-to-r from-sky-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
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
              Last Updated: Oct 26, 2023
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
              <nav className="space-y-1 mb-8">
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
                    <section.icon className="h-4 w-4" />
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
                  href="mailto:privacy@findfishdate.com" 
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  privacy@findfishdate.com
                  <span>↗</span>
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
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Welcome to FindFish Date! We are a unique community offering three distinct modes for our users: <span className="bg-muted px-2 py-0.5 rounded font-medium text-foreground">Dating Only</span>, <span className="bg-muted px-2 py-0.5 rounded font-medium text-foreground">Fishing Spots Only</span>, and our signature <span className="bg-primary/10 px-2 py-0.5 rounded font-medium text-primary">Combo Mode</span>. We understand that your privacy is as important as finding the perfect catch or match.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This Privacy Policy outlines how we collect, use, process, and share your personal data. By using our services, you consent to the practices described in this policy.
                </p>
              </section>

              {/* Section: Information We Collect */}
              <section id="data-collection" className="mb-12 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Information We Collect</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">Account Information</h4>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When you sign up, we collect basic details such as your name, email address, date of birth, and gender identity to create your profile.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">Location Data</h4>
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Essential for <em>Fishing Spots</em> and <em>Combo Mode</em>. We collect precise geolocation to show nearby spots and potential matches.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">User Content</h4>
                      <Image className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Photos of your catches, profile pictures, and messages sent within the app are stored securely on our servers.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-5 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">Usage Data</h4>
                      <Activity className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We collect information about how you interact with our services, such as which features you use and the time spent on the app.
                    </p>
                  </div>
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
                  We use your information to provide, improve, and secure our services. Specifically:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">To provide matches:</span>
                      <span className="text-muted-foreground"> We use your preferences and location to suggest potential dates or fishing buddies.</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">To recommend spots:</span>
                      <span className="text-muted-foreground"> In Fishing Mode, we analyze community data to suggest the best local fishing spots.</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">For safety and security:</span>
                      <span className="text-muted-foreground"> We monitor accounts for fraudulent activity and ensure compliance with our community guidelines.</span>
                    </div>
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
                
                <div className="border-l-4 border-primary/30 pl-6">
                  <p className="text-muted-foreground mb-4">
                    We do not sell your personal data. We may share information with:
                  </p>
                  
                  <div className="space-y-2">
                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                        <span className="font-medium text-foreground">Service Providers</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground">
                        Third-party companies that help us operate our platform, including hosting, payment processing, and analytics providers.
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="w-full flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                        <span className="font-medium text-foreground">Legal Authorities</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground">
                        When required by law, court order, or to protect the safety of our users and the public.
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
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
                  Depending on your location (e.g., GDPR for Europe, CCPA for California), you may have specific rights regarding your personal information:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
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
                      <p className="text-sm text-muted-foreground">Update inaccurate or incomplete information.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Deletion</h4>
                      <p className="text-sm text-muted-foreground">Request that we delete your personal data.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Right to Opt-Out</h4>
                      <p className="text-sm text-muted-foreground">Opt-out of marketing communications at any time.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Contact Us */}
              <section id="contact" className="scroll-mt-24">
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
                    <p className="text-primary-foreground/80 mb-6 max-w-md">
                      If you have any questions about this Privacy Policy or how we handle your data, please contact our Data Protection Officer.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <a 
                        href="mailto:privacy@findfishdate.com"
                        className="flex items-center gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-full px-5 py-2.5 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-xs opacity-80">EMAIL</div>
                          <div className="text-sm font-medium">privacy@findfishdate.com</div>
                        </div>
                      </a>
                      
                      <div className="flex items-center gap-2 bg-primary-foreground/20 rounded-full px-5 py-2.5">
                        <MapPin className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-xs opacity-80">OFFICE</div>
                          <div className="text-sm font-medium">123 Angler Way, Seattle, WA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
                    <Mail className="h-32 w-32" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Fish className="h-4 w-4 text-primary" />
            <span className="text-sm">© 2023 FindFish Date</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/help" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
