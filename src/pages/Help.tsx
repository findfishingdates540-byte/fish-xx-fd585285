import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, User, Heart, Fish, CreditCard, Shield, MessageCircle, Settings, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.jpg';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: User,
      title: 'Account & Profile',
      description: 'Manage your account settings and profile',
      link: '#account'
    },
    {
      icon: Heart,
      title: 'Dating & Matching',
      description: 'Learn about our matching system',
      link: '#dating'
    },
    {
      icon: Fish,
      title: 'Fishing Features',
      description: 'Catch logging, spots, and buddies',
      link: '#fishing'
    },
    {
      icon: CreditCard,
      title: 'Premium & Billing',
      description: 'Subscription and payment info',
      link: '#billing'
    },
    {
      icon: Shield,
      title: 'Safety & Privacy',
      description: 'Stay safe on our platform',
      link: '#safety'
    },
    {
      icon: Settings,
      title: 'Technical Support',
      description: 'Troubleshooting and tech help',
      link: '#technical'
    }
  ];

  const faqs = {
    account: [
      {
        question: 'How do I create an account?',
        answer: 'To create an account, download our app or visit our website and click "Sign Up". You\'ll need to provide your email address, create a password, and verify your age (18+). Then, you can set up your profile with photos and information about yourself and your fishing interests.'
      },
      {
        question: 'How do I edit my profile?',
        answer: 'Go to your Profile tab and tap the "Edit Profile" button. From there, you can update your photos, bio, fishing preferences, and other information. Remember to save your changes before leaving the page.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'To delete your account, go to Settings > Account > Delete Account. Please note that this action is permanent and will delete all your data, matches, and conversations. If you just want a break, consider pausing your account instead.'
      },
      {
        question: 'Can I change my email address?',
        answer: 'Yes, you can change your email address in Settings > Account > Email. You\'ll need to verify your new email address before the change takes effect.'
      }
    ],
    dating: [
      {
        question: 'How does matching work?',
        answer: 'Our matching algorithm considers your location, age preferences, fishing interests, and relationship goals to show you compatible profiles. When both you and another user like each other, it\'s a match and you can start chatting!'
      },
      {
        question: 'What are the different matching styles?',
        answer: 'We offer two matching styles: Mutual Matching (traditional - both parties must like each other) and Women First (women initiate conversations). You can choose your preferred style in Settings > Matching Preferences.'
      },
      {
        question: 'Why am I not getting matches?',
        answer: 'Try updating your profile with more photos and detailed information. Expand your search radius or age preferences. Make sure your profile is complete and showcases your personality and fishing interests.'
      },
      {
        question: 'How do I unmatch someone?',
        answer: 'Open your conversation with that person, tap the menu icon (three dots) in the top right, and select "Unmatch". This will remove the match and delete your conversation history.'
      }
    ],
    fishing: [
      {
        question: 'How do I log a catch?',
        answer: 'Go to the Catches tab and tap "Log Catch". Add photos, select the species, enter the size and weight, tag the location, and note the gear and bait used. Your catches are saved to your personal log and can be shared on your profile.'
      },
      {
        question: 'How do I find fishing spots?',
        answer: 'The Spots tab shows a map of fishing locations in your area. You can filter by species, access type, and ratings. Tap on a spot to see details, reviews, and what other anglers have caught there.'
      },
      {
        question: 'How do I find fishing buddies?',
        answer: 'If you\'re using the Fishing Only or Both account mode, you can access the Buddies feature. Swipe through profiles of local anglers looking for fishing partners and connect with those who match your style.'
      },
      {
        question: 'Can I keep my fishing spots private?',
        answer: 'Yes! When logging catches or adding spots, you can choose to keep the location private. Private spots won\'t be visible to other users on the community map.'
      }
    ],
    billing: [
      {
        question: 'What does Premium include?',
        answer: 'Premium membership includes unlimited likes, the ability to see who liked you, priority in discovery, advanced filters, ad-free experience, and access to exclusive fishing spot data and analytics.'
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'Go to Settings > Subscription > Cancel Subscription. Your premium features will remain active until the end of your current billing period. You won\'t be charged again after cancellation.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'We generally don\'t offer refunds for partial subscription periods. However, if you have a specific issue, please contact our support team and we\'ll review your case.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay/Google Pay on mobile devices.'
      }
    ],
    safety: [
      {
        question: 'How do I report someone?',
        answer: 'Tap the menu icon (three dots) on any profile or in a chat, then select "Report". Choose the reason for your report and provide any additional details. Our team reviews all reports within 24 hours.'
      },
      {
        question: 'How do I block someone?',
        answer: 'You can block someone from their profile or from a chat conversation. Tap the menu icon and select "Block". Blocked users won\'t be able to see your profile or contact you.'
      },
      {
        question: 'Is my location shared with other users?',
        answer: 'We only show your approximate distance to other users, not your exact location. You can control location settings in Settings > Privacy. For fishing spots you log, you can choose to keep locations private.'
      },
      {
        question: 'How are profiles verified?',
        answer: 'Users can verify their profile by submitting a selfie that matches their profile photos. Verified profiles display a blue checkmark badge. Verification is optional but recommended for building trust.'
      }
    ],
    technical: [
      {
        question: 'The app is not loading properly',
        answer: 'Try these steps: 1) Close and reopen the app, 2) Check your internet connection, 3) Update to the latest version, 4) Clear the app cache in Settings, 5) Reinstall the app. If issues persist, contact support.'
      },
      {
        question: 'I\'m not receiving notifications',
        answer: 'Make sure notifications are enabled in both your device settings and the app settings. Check that Do Not Disturb is off, and verify your notification preferences in Settings > Notifications.'
      },
      {
        question: 'My photos won\'t upload',
        answer: 'Ensure your photos are in JPG or PNG format and under 10MB. Check your internet connection. If the issue persists, try uploading from a different device or contact support.'
      },
      {
        question: 'How do I contact support?',
        answer: 'You can reach our support team through the app (Settings > Help & Support), by email at support@findfishingdates.com, or by calling 1-800-FISH-DATE. We\'re available 24/7.'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-1 max-w-7xl mx-auto">
          <Link to="/">
            <img src={logo} alt="Find Fishing Dates" className="h-24 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <Link to="/about" className="text-foreground hover:opacity-60 transition-opacity">About</Link>
            <Link to="/dating" className="text-foreground hover:opacity-60 transition-opacity">Dating</Link>
            <Link to="/fishing" className="text-foreground hover:opacity-60 transition-opacity">Fishing</Link>
            <Link to="/safety" className="text-foreground hover:opacity-60 transition-opacity">Safety</Link>
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

      {/* Hero Section */}
      <header className="pt-32 pb-16 px-6 section-muted">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Help Center
          </h1>
          <p className="text-xl text-muted-foreground">
            Find answers to your questions and learn how to get the most out of Find Fishing Dates.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-background"
            />
          </div>
        </div>
      </header>

      {/* Categories */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <a
                key={category.title}
                href={category.link}
                className="bg-muted rounded-2xl p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:underline">
                      {category.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">{category.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6 section-muted">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-12">
            {/* Account Section */}
            <div id="account">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-foreground" />
                <h3 className="text-xl font-bold text-foreground">Account & Profile</h3>
              </div>
              <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                {faqs.account.map((faq, index) => (
                  <AccordionItem key={index} value={`account-${index}`} className="px-6">
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Dating Section */}
            <div id="dating">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-foreground" />
                <h3 className="text-xl font-bold text-foreground">Dating & Matching</h3>
              </div>
              <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                {faqs.dating.map((faq, index) => (
                  <AccordionItem key={index} value={`dating-${index}`} className="px-6">
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Fishing Section */}
            <div id="fishing">
              <div className="flex items-center gap-3 mb-4">
                <Fish className="w-6 h-6 text-foreground" />
                <h3 className="text-xl font-bold text-foreground">Fishing Features</h3>
              </div>
              <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                {faqs.fishing.map((faq, index) => (
                  <AccordionItem key={index} value={`fishing-${index}`} className="px-6">
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Billing Section */}
            <div id="billing">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-foreground" />
                <h3 className="text-xl font-bold text-foreground">Premium & Billing</h3>
              </div>
              <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                {faqs.billing.map((faq, index) => (
                  <AccordionItem key={index} value={`billing-${index}`} className="px-6">
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Safety Section */}
            <div id="safety">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-foreground" />
                <h3 className="text-xl font-bold text-foreground">Safety & Privacy</h3>
              </div>
              <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                {faqs.safety.map((faq, index) => (
                  <AccordionItem key={index} value={`safety-${index}`} className="px-6">
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Technical Section */}
            <div id="technical">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-foreground" />
                <h3 className="text-xl font-bold text-foreground">Technical Support</h3>
              </div>
              <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                {faqs.technical.map((faq, index) => (
                  <AccordionItem key={index} value={`technical-${index}`} className="px-6">
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-foreground text-background rounded-3xl p-12 md:p-16 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still need help?
            </h2>
            <p className="text-xl text-background/70 mb-8 max-w-xl mx-auto">
              Our support team is available 24/7 to answer your questions and help you out.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-10 py-6">
                Contact Support
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <img src={logo} alt="Find Fishing Dates" className="h-16 w-auto" />
              <p className="text-muted-foreground">
                The dating app for fishing enthusiasts.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-3">
                <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link to="/help" className="block text-muted-foreground hover:text-foreground transition-colors">Help Center</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Features</h4>
              <div className="space-y-3">
                <Link to="/dating" className="block text-muted-foreground hover:text-foreground transition-colors">Dating</Link>
                <Link to="/fishing" className="block text-muted-foreground hover:text-foreground transition-colors">Fishing</Link>
                <Link to="/safety" className="block text-muted-foreground hover:text-foreground transition-colors">Safety</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <div className="space-y-3">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Find Fishing Dates. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Help;
