import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  Shield,
  Heart,
  Fish,
  FileText,
  MessageSquare,
  MapPin,
  Anchor,
  AlertTriangle,
  Phone,
  Flag,
  Navigation,
  Download,
  ExternalLink,
  Headphones,
  LayoutDashboard,
  Settings,
  ArrowRight,
} from 'lucide-react';
import logo from '@/assets/logo.jpg';
import safetyHero from '@/assets/safety-hero.jpg';

type FilterTab = 'all' | 'dating' | 'fishing' | 'guidelines';

const Safety = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'all' as FilterTab, label: 'All Topics', icon: null },
    { id: 'dating' as FilterTab, label: 'Dating Safety', icon: Heart },
    { id: 'fishing' as FilterTab, label: 'Fishing Safety', icon: Fish },
    { id: 'guidelines' as FilterTab, label: 'Guidelines', icon: FileText },
  ];

  const essentialGuides = [
    {
      id: 'messaging',
      title: 'Safe Messaging',
      description: 'Keep conversations on the app until you\'re ready to meet. Learn how to spot scammers and catfish early.',
      icon: MessageSquare,
      link: '#messaging',
      linkText: 'Read Guide',
      category: 'all',
    },
    {
      id: 'meeting',
      title: 'Meeting Spots',
      description: 'Always meet in public places first. For fishing dates, choose verified high-traffic spots before going remote.',
      icon: MapPin,
      link: '/app/spots',
      linkText: 'View Verified Spots',
      category: 'all',
    },
    {
      id: 'gear',
      title: 'Gear & Trip Safety',
      description: 'Check weather conditions, bring life jackets, and share your live location with a friend before casting off.',
      icon: Anchor,
      link: '#trip-checklist',
      linkText: 'Pre-Trip Checklist',
      category: 'fishing',
    },
    {
      id: 'harassment',
      title: 'Harassment Policy',
      description: 'We have zero tolerance for harassment. Learn how to block, report, and document bad behavior effectively.',
      icon: AlertTriangle,
      link: '/terms',
      linkText: 'Read Policy',
      category: 'guidelines',
    },
  ];

  const faqs = [
    {
      question: 'How do I block a user?',
      answer: 'You can block any user by tapping the three dots on their profile or in your chat conversation with them. Once blocked, they won\'t be able to see your profile or contact you. You can manage your blocked users list in Settings → Privacy → Blocked Users.',
    },
    {
      question: 'What if a fishing spot feels unsafe?',
      answer: 'If you encounter an unsafe fishing spot, please report it immediately through the app. Go to the spot\'s page, tap "Report Issue" and describe the safety concern. Our team reviews all reports within 24 hours and may remove or flag the spot.',
    },
    {
      question: 'Can I share my location through the app?',
      answer: 'Yes! You can share your live location with trusted contacts through the Safety features in your profile settings. This is especially useful for fishing trips. Your location is only visible to people you explicitly choose to share with.',
    },
    {
      question: 'How do I report inappropriate behavior?',
      answer: 'Use the report button available on profiles and in chat conversations. You can also contact our support team directly through Settings → Help & Support or email safety@findfishingdates.com. All reports are reviewed by our safety team.',
    },
    {
      question: 'What verification methods does the app use?',
      answer: 'We offer photo verification where you take a real-time selfie matching a pose, email and phone verification, and optional ID verification for enhanced trust badges. Verified profiles display badges on their profiles.',
    },
    {
      question: 'How does photo verification work?',
      answer: 'Photo verification requires you to take a live selfie that matches a specific pose shown on screen. Our system compares this selfie to your profile photos using facial recognition to confirm you\'re a real person. Verified users receive a blue checkmark badge visible on their profile, giving potential matches confidence they\'re talking to who they think they are.',
    },
    {
      question: 'What are some video chat safety tips?',
      answer: 'Before video chatting: 1) Use our in-app video feature rather than sharing personal contact info. 2) Choose a neutral background that doesn\'t reveal your home address. 3) Trust your instincts—if something feels off, end the call. 4) Never share financial information or send money. 5) Report any inappropriate behavior during the call using the flag icon. Video calls are a great way to verify someone before meeting in person.',
    },
    {
      question: 'What should I do if I encounter a scammer?',
      answer: 'If you suspect someone is a scammer: 1) Stop all communication immediately. 2) Do NOT send money or share financial information. 3) Take screenshots of suspicious messages. 4) Report the profile using the flag icon and select "Scam or Fraud." 5) Block the user. Common scam signs include: asking for money, moving conversations off-app quickly, overly romantic language too soon, inconsistent stories, and refusing video calls. Our team investigates all scam reports within 24 hours.',
    },
    {
      question: 'How can I verify someone is real before meeting?',
      answer: 'Before meeting in person: 1) Look for the verification badge on their profile. 2) Request a video call to confirm they match their photos. 3) Check if their social media accounts seem legitimate. 4) Ask questions about details mentioned in their profile. 5) Trust your gut—if anything seems off, don\'t meet. For fishing dates, suggest meeting at a public boat ramp or verified fishing spot first.',
    },
    {
      question: 'What should I do if someone asks for money?',
      answer: 'Never send money to someone you\'ve met online, regardless of the reason they give. Scammers often create elaborate stories about emergencies, medical bills, or travel costs. If someone asks for money: 1) Refuse immediately. 2) Report the user to our safety team. 3) Block them. Legitimate matches will never ask for financial assistance. If you\'ve already sent money, contact your bank and local authorities.',
    },
    {
      question: 'Are my private photos safe on the app?',
      answer: 'Your photos are protected with industry-standard encryption. Only users you\'ve matched with can see photos you share in chat. Profile photos are visible based on your privacy settings. We never sell or share your photos with third parties. You can delete any photo at any time, and it will be removed from our servers. For extra privacy, avoid photos that show identifying information like your home, workplace, or license plates.',
    },
  ];

  const quickActions = [
    { label: 'File a Report', icon: Flag, link: '/contact' },
    { label: 'Share Location', icon: Navigation, link: '/app/profile' },
    { label: 'Download Data', icon: Download, link: '/app/profile' },
  ];

  const externalResources = [
    {
      title: 'National Center for Victims of Crime',
      description: 'Resources for victims of crime.',
      url: 'https://victimsofcrime.org',
    },
    {
      title: 'U.S. Coast Guard Boating',
      description: 'Boating safety regulations.',
      url: 'https://www.uscgboating.org',
    },
  ];

  const filteredGuides = essentialGuides.filter(
    guide => activeFilter === 'all' || guide.category === activeFilter || guide.category === 'all'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-1 max-w-7xl mx-auto">
          <Link to="/">
            <img src={logo} alt="Find Fishing Dates" className="h-20 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <Link to="/" className="text-foreground hover:opacity-60 transition-opacity">Home</Link>
            <Link to="/app/discover" className="text-foreground hover:opacity-60 transition-opacity">Matches</Link>
            <Link to="/app/spots" className="text-foreground hover:opacity-60 transition-opacity">Fishing Map</Link>
            <Link to="/safety" className="text-foreground font-semibold">Safety Center</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:bg-muted font-medium">
                Log in
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="btn-primary">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="pt-24 flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border min-h-[calc(100vh-6rem)] p-6 sticky top-24 h-fit">
          {/* User Profile Placeholder */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">👤</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Guest User</p>
              <p className="text-xs text-muted-foreground">Safety Center</p>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-1 mb-8">
            <Link
              to="/app/discover"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <Link
              to="/app/messages"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Messages</span>
            </Link>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted text-foreground">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Safety Center</span>
            </div>
            <Link
              to="/app/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </Link>
          </nav>

          {/* Emergency Section */}
          <div className="mt-auto p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-destructive">SOS</span>
              <span className="text-sm font-semibold text-foreground">Emergency?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              If you are in immediate danger, call local authorities.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              asChild
            >
              <a href="tel:911">
                <Phone className="w-4 h-4 mr-2" />
                Call 911
              </a>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Safety Center</h1>
            <p className="text-muted-foreground max-w-2xl">
              Your safety is our priority. Find guides, verified spot info, and emergency contacts for both your dates and your fishing trips.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search safety topics, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 bg-background border-border"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === tab.id
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Essential Guides */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-6">Essential Guides</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-muted/30 border border-border rounded-2xl p-6 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <guide.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {guide.description}
                  </p>
                  <Link
                    to={guide.link}
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {guide.linkText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* FAQs */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-border rounded-xl px-6 bg-background"
                >
                  <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80 p-6 sticky top-24 h-fit">
          {/* Need Help Now */}
          <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Headphones className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Need help now?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available 24/7 for urgent safety concerns regarding dates or trips.
            </p>
            <Button className="w-full btn-primary" asChild>
              <Link to="/contact">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Live Chat
              </Link>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.link}
                  className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl hover:bg-muted transition-colors"
                >
                  <action.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* External Resources */}
          <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4">External Resources</h3>
            <div className="space-y-4">
              {externalResources.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-l-2 border-foreground pl-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{resource.title}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Promo Image */}
          <div className="relative rounded-2xl overflow-hidden h-40">
            <img
              src={safetyHero}
              alt="Stay safe out there"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <p className="text-background font-semibold text-center px-4">
                Stay Safe Out There.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Find Fishing Dates. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Safety;
