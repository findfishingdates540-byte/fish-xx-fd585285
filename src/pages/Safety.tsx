import { useState } from 'react';
import { PageMeta } from '@/components/seo/PageMeta';
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
  Camera,
  Video,
  UserCheck,
  Lock,
  Eye,
  Ban,
  DollarSign,
  Smartphone,
  Users,
  Car,
  LifeBuoy,
  CloudSun,
  Award
} from 'lucide-react';
import safetyHero from '@/assets/safety-hero.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';

type FilterTab = 'all' | 'dating' | 'fishing' | 'guidelines' | 'digital';

const Safety = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'all' as FilterTab, label: 'All Topics', icon: null },
    { id: 'dating' as FilterTab, label: 'Dating Safety', icon: Heart },
    { id: 'fishing' as FilterTab, label: 'Fishing Safety', icon: Fish },
    { id: 'digital' as FilterTab, label: 'Digital Safety', icon: Lock },
    { id: 'guidelines' as FilterTab, label: 'Guidelines', icon: FileText },
  ];

  const essentialGuides = [
    {
      id: 'profile-photos',
      title: 'Profile Photo Safety',
      description: 'Avoid photos that reveal your home, workplace, car plates, or other identifying info. Use recent photos only.',
      icon: Camera,
      link: '#profile-photos',
      linkText: 'Photo Tips',
      category: 'digital',
    },
    {
      id: 'first-date',
      title: 'First Date Checklist',
      description: 'Video call first, meet in public, tell a friend, arrange own transport, set check-in times, and trust your instincts.',
      icon: Heart,
      link: '#first-date',
      linkText: 'Date Safety Guide',
      category: 'dating',
    },
    {
      id: 'fishing-trip',
      title: 'Fishing Trip Safety',
      description: 'Check weather, file a float plan, bring safety gear, share live location, and always use the buddy system.',
      icon: Anchor,
      link: '#fishing-trip',
      linkText: 'Trip Checklist',
      category: 'fishing',
    },
    {
      id: 'verification',
      title: 'Verification Guide',
      description: 'Learn what verification badges mean, how to get verified, and why it matters for building trust.',
      icon: Award,
      link: '#verification',
      linkText: 'Get Verified',
      category: 'all',
    },
    {
      id: 'scam-prevention',
      title: 'Scam Prevention',
      description: 'Recognize red flags like money requests, off-app moves, and inconsistent stories. Never send money to matches.',
      icon: AlertTriangle,
      link: '#scam-prevention',
      linkText: 'Spot Scams',
      category: 'digital',
    },
    {
      id: 'digital-safety',
      title: 'Digital Privacy',
      description: 'Strong passwords, 2FA, secure messaging, and knowing what not to share online protect your digital life.',
      icon: Lock,
      link: '#digital-safety',
      linkText: 'Privacy Tips',
      category: 'digital',
    },
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
      id: 'harassment',
      title: 'Harassment Policy',
      description: 'We have zero tolerance for harassment. Learn how to block, report, and document bad behavior effectively.',
      icon: Ban,
      link: '/terms',
      linkText: 'Read Policy',
      category: 'guidelines',
    },
  ];

  const faqs = [
    // Verification FAQs
    { question: 'What does a white checkmark mean?', answer: 'A white checkmark indicates the user has completed ID Verification by submitting a government-issued ID that matches their profile. This confirms their identity but is not a background check or safety guarantee.', category: 'verification' },
    { question: 'What does a blue checkmark mean?', answer: 'A blue checkmark indicates Live Verification - the user has taken a real-time selfie that matches their profile photos using facial recognition. This confirms they are who their photos represent.', category: 'verification' },
    { question: 'How do I get verified?', answer: 'Go to Settings → Verification. For ID Verification, upload a photo of your government ID. For Live Verification, take a selfie matching the on-screen pose. Both are reviewed (ID takes 24-72 hours, Live is instant).', category: 'verification' },
    { question: 'Does verification guarantee safety?', answer: 'No. Verification confirms identity only - we do not perform criminal background checks. Always exercise caution when meeting new people, regardless of their verification status. Trust your instincts.', category: 'verification' },
    { question: 'How often do I need to renew verification?', answer: 'Verifications expire after one year and must be renewed. You\'ll receive email reminders at 30 days, 7 days, and 1 day before expiry. Renewing uses the same process as initial verification.', category: 'verification' },
    
    // Meeting Safety FAQs
    { question: 'Where should I meet for a first date?', answer: 'Always choose a public place with other people around - coffee shops, restaurants, public parks. Avoid private locations, their home, or your home. For fishing dates, start at a busy public boat ramp or verified high-traffic spot.', category: 'meeting' },
    { question: 'What if I feel uncomfortable during a date?', answer: 'Trust your instincts and leave immediately. You don\'t owe anyone an explanation. Have an exit plan ready: "I have an early morning" works. Text a friend a code word if you need backup. Call 911 if you feel in danger.', category: 'meeting' },
    { question: 'Should I share my real phone number?', answer: 'Not until you\'re comfortable. Keep conversations in-app as long as possible. When ready, consider using Google Voice or a similar service to protect your real number. Never share your address early on.', category: 'meeting' },
    { question: 'How do I safely end a date early?', answer: 'Have an excuse ready: early morning, pet needs walking, friend emergency. Leave confidently without over-explaining. Trust your gut - your safety is more important than politeness. Have your own transportation arranged.', category: 'meeting' },
    
    // Fishing Safety FAQs
    { question: 'What gear should I bring for safety?', answer: 'Essential safety gear: life jacket (always), first aid kit, charged phone in waterproof case, whistle, flashlight, sunscreen, water, and weather-appropriate clothing. For boats: flares, fire extinguisher, and throwable flotation device.', category: 'fishing' },
    { question: 'How do I check if a fishing spot is safe?', answer: 'Read community reviews, check recent catches for activity level, verify legal access (public vs private), check weather and water conditions, and look for any reported hazards. When in doubt, choose a different spot.', category: 'fishing' },
    { question: 'What if my fishing buddy cancels last minute?', answer: 'Never go to remote locations alone, especially on water. Reschedule or find another buddy. If you must go solo, stick to high-traffic public areas, file a float plan with someone, and share your live location.', category: 'fishing' },
    { question: 'What emergency procedures should I know for boat trouble?', answer: 'Call 911 or Coast Guard (VHF Channel 16). Anchor if possible to prevent drifting. Don life jackets. Use flares/horn for signaling. Stay with the boat unless it\'s sinking. Always file a float plan beforehand.', category: 'fishing' },
    
    // Digital Safety FAQs
    { question: 'How do I protect my privacy online?', answer: 'Use strong unique passwords, enable 2FA, don\'t reuse passwords across sites, be cautious what you share in bios/photos (no home addresses, workplace), use in-app messaging, and regularly review your privacy settings.', category: 'digital' },
    { question: 'What information should I never share?', answer: 'Never share: home/work address, financial info, SSN, passwords, credit card numbers, daily routine, when you\'re home alone, or photos with identifiable locations. Be cautious with last name until comfortable.', category: 'digital' },
    { question: 'How do I recognize a catfish?', answer: 'Red flags: refusing video calls, few photos or only professional-looking ones, inconsistent stories, moving off-app immediately, overly romantic early on, vague about personal details, always has excuses for not meeting.', category: 'digital' },
    { question: 'What are signs of a romance scam?', answer: 'Warning signs: professes love quickly, claims to be overseas/military, creates urgency, has tragedies requiring money, can\'t video chat, asks for money (any reason), wants to move off-app immediately, offers to send you money.', category: 'digital' },
    
    // Blocking & Reporting FAQs
    { question: 'How do I block a user?', answer: 'Tap the three dots on their profile or in chat, select "Block". They won\'t be able to see your profile, message you, or find you in discovery. Manage blocked users in Settings → Privacy → Blocked Users.', category: 'reporting' },
    { question: 'How do I report someone?', answer: 'Tap the three dots on their profile or in chat, select "Report". Choose the reason, provide details and screenshots if possible. Reports are confidential - they won\'t know who reported them. Our team reviews within 24 hours.', category: 'reporting' },
    { question: 'What happens after I report?', answer: 'Our safety team reviews all reports within 24 hours (harassment/safety reports within 12 hours). We may contact you for more info. Based on severity, the user may receive a warning, temporary suspension, or permanent ban.', category: 'reporting' },
    { question: 'Can I report anonymously?', answer: 'Yes, all reports are confidential. The reported user is never told who reported them. You can also email safety@fishx.app for sensitive issues if you prefer not to use in-app reporting.', category: 'reporting' },
    
    // Video & Photo Safety
    { question: 'How does photo verification work?', answer: 'You take a live selfie matching a specific pose shown on screen. Our system compares it to your profile photos using facial recognition. This confirms you\'re real and match your photos. Processing is instant.', category: 'verification' },
    { question: 'What are video chat safety tips?', answer: 'Use in-app video features, choose a neutral background (not your home), trust your instincts, never share financial info, report inappropriate behavior using the flag icon. Video calls are great for verifying someone before meeting.', category: 'digital' },
    { question: 'Are my photos safe on the app?', answer: 'Photos are encrypted and stored securely. Only matches can see photos shared in chat. We never sell or share photos with third parties. Avoid photos with identifying info (home, license plates, workplace).', category: 'digital' },
    
    // Scam-specific FAQs
    { question: 'What if someone asks for money?', answer: 'Never send money to anyone you\'ve met online, regardless of their story. Scammers create elaborate emergencies. If asked for money: refuse, report the user, block them. If you\'ve sent money, contact your bank and local authorities.', category: 'scam' },
    { question: 'What should I do if I encounter a scammer?', answer: 'Stop all communication immediately. Don\'t send money or share financial info. Screenshot suspicious messages. Report the profile (select "Scam or Fraud"). Block the user. Our team investigates all scam reports within 24 hours.', category: 'scam' },
    { question: 'How can I verify someone is real before meeting?', answer: 'Look for verification badges, request a video call (scammers avoid these), ask about profile details, reverse-image search their photos, check social media consistency, and trust your gut. For fishing dates, meet at public spots first.', category: 'meeting' },
  ];

  const quickActions = [
    { label: 'File a Report', icon: Flag, link: '/contact' },
    { label: 'Share Location', icon: Navigation, link: '/app/profile' },
    { label: 'Download Data', icon: Download, link: '/app/profile' },
    { label: 'Block User Guide', icon: Ban, link: '#blocking' },
  ];

  const emergencyResources = [
    { name: 'Emergency Services', number: '911', description: 'For immediate danger or emergencies' },
    { name: 'National Domestic Violence Hotline', number: '1-800-799-7233', description: '24/7 support for abuse victims' },
    { name: 'National Sexual Assault Hotline', number: '1-800-656-4673', description: 'RAINN - 24/7 confidential support' },
    { name: 'Suicide Prevention Lifeline', number: '988', description: '24/7 crisis support' },
    { name: 'U.S. Coast Guard', number: 'VHF Channel 16', description: 'Maritime emergencies' },
    { name: 'FBI Internet Crime', number: 'ic3.gov', description: 'Report online fraud' },
  ];

  const externalResources = [
    { title: 'National Center for Victims of Crime', description: 'Resources for crime victims', url: 'https://victimsofcrime.org' },
    { title: 'U.S. Coast Guard Boating Safety', description: 'Boating regulations and safety', url: 'https://www.uscgboating.org' },
    { title: 'FBI Romance Scam Awareness', description: 'Learn about online romance scams', url: 'https://www.fbi.gov/scams-and-safety/common-scams-and-crimes/romance-scams' },
    { title: 'FTC Report Fraud', description: 'Report scams to the FTC', url: 'https://reportfraud.ftc.gov' },
    { title: 'Identity Theft Resource Center', description: 'Identity theft prevention and recovery', url: 'https://www.idtheftcenter.org' },
  ];

  const filteredGuides = essentialGuides.filter(
    guide => activeFilter === 'all' || guide.category === activeFilter || guide.category === 'all'
  );

  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Safety Center — Stay Safe on FishX"
        description="Profile photo safety, first-date checklists, fishing trip planning, scam prevention, and digital privacy tips for the FishX community."
        path="/safety"
      />
      <PublicHeader />

      {/* Main Layout */}
      <div className="pt-24 flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border min-h-[calc(100vh-6rem)] p-6 sticky top-24 h-fit">
          {/* User Profile Placeholder */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Safety Center</p>
              <p className="text-xs text-muted-foreground">Your safety matters</p>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-1 mb-8">
            <Link to="/app/discover" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <Link to="/help" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Help Center</span>
            </Link>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted text-foreground">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Safety Center</span>
            </div>
            <Link to="/guidelines" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <FileText className="w-5 h-5" />
              <span className="text-sm">Community Guidelines</span>
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
            <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" asChild>
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
              Your safety is our priority. Find guides, verification info, and emergency contacts for both your dates and your fishing trips.
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
            <h2 className="text-xl font-bold text-foreground mb-6">Essential Safety Guides</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <div key={guide.id} className="bg-muted/30 border border-border rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <guide.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
                  <Link to={guide.link} className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline">
                    {guide.linkText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency Resources */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-6">Emergency Resources</h2>
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergencyResources.map((resource) => (
                  <div key={resource.name} className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{resource.name}</p>
                      <p className="text-destructive font-bold">{resource.number}</p>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {filteredFaqs.map((faq, index) => (
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
              Our support team is available 24/7 for urgent safety concerns.
            </p>
            <Button className="w-full btn-primary" asChild>
              <Link to="/contact">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
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

          {/* Safety Image */}
          <div className="relative rounded-2xl overflow-hidden h-40">
            <img src={safetyHero} alt="Stay safe" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <p className="text-background font-semibold text-center px-4">Stay Safe Out There</p>
            </div>
          </div>
        </aside>
      </div>

      <PublicFooter />
    </div>
  );
};

export default Safety;