import { useState } from 'react';
import { PageMeta } from '@/components/seo/PageMeta';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Search, 
  User, 
  Heart, 
  Fish, 
  CreditCard, 
  Shield, 
  MessageCircle, 
  Settings, 
  ArrowRight,
  MapPin,
  Users,
  Award,
  Calendar
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/layout';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { icon: User, title: 'Account & Profile', description: 'Manage your account settings and profile', link: '#account' },
    { icon: Heart, title: 'Dating & Matching', description: 'Learn about our matching system', link: '#dating' },
    { icon: Fish, title: 'Fishing Features', description: 'Catch logging, spots, and buddies', link: '#fishing' },
    { icon: CreditCard, title: 'Premium & Billing', description: 'Subscription and payment info', link: '#billing' },
    { icon: Shield, title: 'Safety & Privacy', description: 'Stay safe on our platform', link: '#safety' },
    { icon: Settings, title: 'Technical Support', description: 'Troubleshooting and tech help', link: '#technical' },
    { icon: MapPin, title: 'Trips & Adventures', description: 'Plan and manage fishing trips', link: '#trips' },
    { icon: Award, title: 'Verification', description: 'Get verified and build trust', link: '#verification' }
  ];

  const faqs = {
    account: [
      { question: 'How do I create an account?', answer: 'Visit our website or download the app and click "Sign Up". You\'ll need to provide your email address, create a password, and verify your age (13+ for fishing features). Complete the onboarding process to set up your profile with photos, bio, and fishing preferences.' },
      { question: 'How do I edit my profile?', answer: 'Go to your Profile tab and tap "Edit Profile". From there, you can update your photos, bio, fishing preferences, and other information. Make sure to save your changes before leaving the page.' },
      { question: 'How do I enable dating features?', answer: 'Dating is an optional add-on for users 18 and older. Go to Settings → Account and tap "Create Dating Profile". You\'ll need to verify your age (18+) before the dating features are unlocked. Once enabled, you can access Discover, Matches, and dating Messages.' },
      { question: 'How do I change my password?', answer: 'Go to Settings → Account → Change Password. You\'ll need to enter your current password and then create a new one. For security, your new password should be at least 8 characters with a mix of letters and numbers.' },
      { question: 'How do I enable two-factor authentication?', answer: 'Go to Settings → Security → Two-Factor Authentication and toggle it on. You can choose to receive codes via SMS or authenticator app. We strongly recommend enabling 2FA for account security.' },
      { question: 'How do I delete my account?', answer: 'Go to Settings → Account → Delete Account. Please note this action is permanent and will delete all your data, matches, catches, and conversations. You\'ll have 30 days to reactivate before permanent deletion.' },
      { question: 'Can I pause my account instead of deleting it?', answer: 'Yes! Go to Settings → Account → Pause Account. While paused, your profile won\'t be shown to others, you won\'t receive new matches, but your data is preserved. You can unpause at any time.' },
      { question: 'Why was my account suspended?', answer: 'Accounts may be suspended for violating our Terms of Service or Community Guidelines. Common reasons include harassment, fake profiles, inappropriate content, or suspicious activity. Check your email for details about the suspension.' },
      { question: 'How do I appeal an account suspension?', answer: 'Email appeals@fish-x.com within 30 days of suspension. Include your registered email, explain your situation, and provide any relevant context. Our team reviews appeals within 5-7 business days.' },
      { question: 'How do I update my location?', answer: 'Go to Settings → Location. You can enable automatic location updates, or manually set your city and state. Accurate location helps with matches and finding nearby fishing spots.' },
      { question: 'How do I export my data?', answer: 'Go to Settings → Privacy → Export My Data. You\'ll receive a JSON file containing your profile information, catches, messages, and other data within 24-48 hours.' }
    ],
    dating: [
      { question: 'How does matching work?', answer: 'Our matching algorithm considers your location, age preferences, fishing interests, and relationship goals to show compatible profiles. When both you and another user like each other, it\'s a match and you can start chatting!' },
      { question: 'What do the verification badges mean?', answer: 'A white checkmark means the user has verified their identity with a government ID. A blue checkmark means they\'ve also completed live verification (real-time selfie). Verified users have confirmed their identity, but this is not a safety guarantee.' },
      { question: 'What are the different matching styles?', answer: 'Mutual Matching: Both parties must like each other to match (traditional). Women First: In opposite-gender matches, women must initiate the conversation after matching. Choose your preference in Settings → Matching Preferences.' },
      { question: 'What are Super Likes?', answer: 'Super Likes let someone know you\'re especially interested in them. When you Super Like someone, they\'ll see a special notification and your profile is highlighted. Free users get 1 Super Like per week; Premium users get 5 per day.' },
      { question: 'How do Profile Boosts work?', answer: 'Profile Boosts increase your visibility for 30 minutes, putting you at the top of the discovery queue in your area. Premium users receive free boosts monthly. Additional boosts can be purchased.' },
      { question: 'How do I see who liked me?', answer: 'Premium subscribers can see everyone who liked them in the Likes tab. Free users see blurred previews and must upgrade to reveal identities. You can also match with someone by liking them back from the discover screen.' },
      { question: 'Can I undo a swipe?', answer: 'Premium subscribers can use "Rewind" to undo their last swipe. Free users cannot undo swipes, so swipe carefully! If you accidentally passed on someone, you may see them again eventually.' },
      { question: 'How do I unmatch someone?', answer: 'Open the conversation, tap the menu (three dots), and select "Unmatch". This removes the match and deletes the conversation for both parties. The other person won\'t be notified of the unmatch.' },
      { question: 'Why am I not getting matches?', answer: 'Try: 1) Add more photos showing your face clearly, 2) Write a detailed bio, 3) Expand your age and distance preferences, 4) Be active daily, 5) Get verified for a trust boost, 6) Consider Premium for priority visibility.' },
      { question: 'How does the matching algorithm work?', answer: 'We consider: location/distance, age preferences, shared fishing interests, experience level compatibility, activity patterns, and your like/pass history. The algorithm learns from your behavior to show better matches over time.' },
      { question: 'Can someone I unmatched see my profile again?', answer: 'Once unmatched, that person won\'t see your profile in discovery. However, if you both delete and recreate accounts, you might see each other again. Blocking prevents all future contact.' },
      { question: 'How do I report inappropriate behavior?', answer: 'Tap the menu (three dots) on any profile or chat and select "Report". Choose the reason and provide details. Reports are confidential - the other person won\'t know you reported them. Our safety team reviews all reports within 24 hours.' }
    ],
    fishing: [
      { question: 'How do I log a catch?', answer: 'Go to the Catches tab and tap "Log Catch". Add photos, select the species (or enter a custom one), enter size/weight, tag the location (optionally keep private), and note the gear and bait used. Your catch is saved to your personal log.' },
      { question: 'What information should I include in catch logs?', answer: 'At minimum: a photo and species. For best results: accurate weight/length, GPS location, date/time, weather conditions, water temperature, bait/lure used, and any notes. Detailed logs help you identify patterns.' },
      { question: 'How do I find fishing spots?', answer: 'The Spots tab shows a map of community fishing locations. Use filters to search by species, water type, access (public/private), and ratings. Tap any spot for details, reviews, and recent catches.' },
      { question: 'What\'s the difference between public and private spots?', answer: 'Public spots are visible to all users on the community map. Private spots are only visible to you - perfect for secret honey holes! When logging catches, choose "Keep Location Private" to hide the GPS.' },
      { question: 'How do I add a new fishing spot?', answer: 'Go to Spots → Add Spot (+ button). Pin the location on the map, add a name and description, select species available, add photos, and choose public or private visibility. Community spots help everyone!' },
      { question: 'How do I rate a fishing spot?', answer: 'Visit any spot\'s detail page and tap "Rate This Spot". Give 1-5 stars, write a review, and optionally add photos. Honest reviews help the community find quality fishing locations.' },
      { question: 'How do I find fishing buddies?', answer: 'Enable Fishing Mode or Both Mode, then go to the Buddies tab. Browse profiles of anglers looking for fishing partners, filtered by location, experience level, and fishing style. Send buddy requests to connect.' },
      { question: 'What\'s the difference between a buddy and a date match?', answer: 'Buddies are platonic fishing partners - focus on shared fishing interests and trip compatibility. Matches are romantic connections with dating potential. You can have both with the same person if you\'re in Both mode.' },
      { question: 'How do I send a buddy request?', answer: 'From the Buddies discovery screen, tap "Request" on any profile. Add an optional message about your fishing interests. If they accept, you can chat and plan trips together.' },
      { question: 'Can I delete a fishing spot I added?', answer: 'Go to your profile → My Spots, find the spot, and select "Delete". Note: if others have rated or logged catches at your spot, it becomes community property and can only be flagged, not deleted.' },
      { question: 'How do I view tide and weather information?', answer: 'On any spot detail page, scroll to the Weather section. We show current conditions, hourly forecast, tide charts (for coastal spots), and solunar data. Weather updates in real-time from trusted sources.' }
    ],
    billing: [
      { question: 'What does Premium include?', answer: 'Premium includes: Unlimited likes, See who liked you, Priority discovery, Advanced filters, Super Likes (5/day), Profile Boosts, Ad-free experience, Rewind swipes, Read receipts, Extended spot analytics, and Trip planning tools.' },
      { question: 'What\'s the difference between The Angler and The Trophy plans?', answer: 'The Angler ($9.99/mo) is fishing-focused: spot analytics, buddy priority, trip tools. The Trophy ($24.99/mo) includes everything in Angler plus all dating features: unlimited likes, see who liked you, priority matching, and boosts.' },
      { question: 'What is included in the free trial?', answer: 'New users get 30 days of full Premium access - all features, no restrictions. No credit card required. After the trial, you\'ll have a 3-day grace period before reverting to the free tier.' },
      { question: 'How do I check my subscription status?', answer: 'Go to Settings → Subscription. You\'ll see your current plan, billing date, renewal date, and payment method. You can also view billing history here.' },
      { question: 'How do I change my payment method?', answer: 'Go to Settings → Subscription → Payment Method. Tap "Update" to add a new card. Your new card will be used for the next billing cycle.' },
      { question: 'How do I switch from monthly to annual billing?', answer: 'Go to Settings → Subscription → Change Plan. Annual plans save 20% compared to monthly. The change takes effect at your next renewal date.' },
      { question: 'What happens if my payment fails?', answer: 'We\'ll retry the charge after 3 days. If it fails again, your Premium access is suspended. Update your payment method within 7 days to avoid losing your subscription. We\'ll email you about failed payments.' },
      { question: 'How do I cancel my subscription?', answer: 'Go to Settings → Subscription → Cancel Subscription. Your Premium features remain active until the end of your current billing period. You won\'t be charged again after cancellation.' },
      { question: 'Can I get a refund?', answer: 'We offer a 7-day money-back guarantee on new subscriptions. Email billing@fish-x.com within 7 days of purchase. Refunds after 7 days are considered on a case-by-case basis.' },
      { question: 'Are there any discounts available?', answer: 'Annual plans are 20% off vs monthly. We occasionally offer promotions - check your email or the app for special deals. We don\'t currently offer student or military discounts but may in the future.' },
      { question: 'Can I share my subscription with family?', answer: 'Subscriptions are tied to individual accounts and cannot be shared. Each family member needs their own account and subscription.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, Apple Pay, and Google Pay. All payments are processed securely through Stripe.' }
    ],
    safety: [
      { question: 'How do I block someone?', answer: 'Tap the menu (three dots) on their profile or in chat, then select "Block". Blocked users cannot see your profile, message you, or find you in discovery. You can manage blocked users in Settings → Privacy.' },
      { question: 'How do I report a scammer?', answer: 'Use the report button and select "Scam or Fraud". Provide screenshots and details. Signs of scams: asking for money, moving off-app quickly, inconsistent stories, refusing video calls. Never send money to anyone you\'ve met online.' },
      { question: 'How do I report harassment?', answer: 'Report from their profile or chat using "Harassment". Include screenshots if possible. Our safety team prioritizes harassment reports and typically responds within 12 hours. You can also email safety@fish-x.com.' },
      { question: 'What happens after I report someone?', answer: 'Our safety team reviews all reports within 24 hours. We may contact you for additional information. The reported user is not told who reported them. Depending on severity, they may receive a warning, suspension, or ban.' },
      { question: 'What information do other users see about me?', answer: 'Other users see: your profile photos, bio, age, approximate distance (not exact location), fishing interests, and verification badges. They cannot see your email, phone, exact address, or private spots.' },
      { question: 'How do I make my profile less visible?', answer: 'Go to Settings → Privacy → Discovery. You can hide from discovery temporarily, show only to people you\'ve liked, or limit who sees your profile based on their verification status.' },
      { question: 'How do I hide my online status?', answer: 'Go to Settings → Privacy → Activity Status and toggle off "Show Online Status". Note: if you hide your status, you also won\'t see others\' online status.' },
      { question: 'How can I verify someone is real before meeting?', answer: 'Look for verification badges, have a video call first, ask questions about their profile details, check their social media, and trust your gut. Meet in public places for first meetings.' },
      { question: 'What should I do if I feel unsafe during a date?', answer: 'Leave immediately. Call a friend, Uber/Lyft, or 911 if needed. Report the user to us afterward. Always tell someone your plans before meeting and share your live location with a trusted contact.' },
      { question: 'Tips for safe first dates', answer: 'Meet in a public place, tell a friend your plans, arrange your own transportation, avoid alcohol on first meetings, keep your phone charged, and trust your instincts. Consider a video call before meeting in person.' },
      { question: 'Tips for safe fishing trips with new people', answer: 'Meet at a public launch ramp first, tell someone your float plan, bring your own safety gear, share live location, have an exit strategy, and don\'t go to remote areas on first trips.' },
      { question: 'What are red flags to watch for?', answer: 'Red flags: asking for money, moving off-app immediately, refusing video calls, inconsistent information, pressuring to meet quickly, making you uncomfortable, extremely attractive + very forward, and too-good-to-be-true stories.' }
    ],
    technical: [
      { question: 'The app keeps crashing, what do I do?', answer: 'Try: 1) Force close and reopen, 2) Check for app updates, 3) Restart your device, 4) Clear app cache (Settings → Storage → Clear Cache), 5) Reinstall the app. If issues persist, contact support with your device model and OS version.' },
      { question: 'My photos won\'t upload', answer: 'Check that photos are JPG/PNG format and under 10MB. Ensure stable internet connection. Try uploading from camera roll vs taking a new photo. If using VPN, try disabling it temporarily.' },
      { question: 'Messages aren\'t sending', answer: 'Check your internet connection. Force close and reopen the app. Check if you\'ve been unmatched (you won\'t see the chat anymore). Make sure the app is updated to the latest version.' },
      { question: 'I\'m not receiving push notifications', answer: 'Check: 1) Device settings have notifications enabled for our app, 2) In-app Settings → Notifications has relevant options on, 3) Do Not Disturb is off, 4) Battery saver isn\'t restricting the app.' },
      { question: 'The map isn\'t loading', answer: 'Ensure location services are enabled. Check your internet connection. Try switching between WiFi and cellular. Clear app cache and restart. Maps require an active data connection.' },
       { question: 'How do I clear the app cache?', answer: 'On iOS: Delete and reinstall the app. On Android: Settings → Apps → Fish-X → Storage → Clear Cache. This can resolve many display and performance issues.' },
       { question: 'How do I update the app?', answer: 'iOS: App Store → Profile → Fish-X → Update. Android: Play Store → My Apps → Fish-X → Update. We recommend enabling auto-updates for the best experience.' },
       { question: 'What browsers are supported?', answer: 'We officially support the latest versions of Chrome, Safari, Firefox, and Edge. For the best experience, use our mobile apps on iOS 14+ or Android 10+.' },
       { question: 'Why is my location inaccurate?', answer: 'Ensure location services are enabled and set to "precise". GPS accuracy varies by device and environment. Urban areas and indoors may reduce accuracy. For fishing spots, you can manually adjust the pin location.' },
       { question: 'How do I report a bug?', answer: 'Email support@fish-x.com with: device model, OS version, app version, description of the issue, and screenshots/videos if possible. The more detail you provide, the faster we can fix it.' }
    ],
    trips: [
      { question: 'How do I create a new trip?', answer: 'Go to Trips → Plan New Trip (+ button). Enter trip details: title, date, location/fishing spot, target species, and notes. You can add buddies, set reminders, and attach gear checklists.' },
      { question: 'How do I find spots for my trip?', answer: 'When creating a trip, tap "Select Spot" to browse your saved spots or the community map. Filter by species, ratings, and recent activity. Tap any spot to add it to your trip.' },
      { question: 'How do I invite people to my trip?', answer: 'From your trip detail page, tap "Invite Buddies". Select from your connected buddies or enter an email. Invitees receive a notification and can accept or decline.' },
      { question: 'How do I accept or decline a trip invitation?', answer: 'You\'ll receive a notification when invited. Go to Trips → Invitations or tap the notification. Review trip details and tap Accept or Decline. You can add notes when accepting.' },
      { question: 'How do I cancel a trip?', answer: 'Go to the trip detail page → Menu → Cancel Trip. All participants will be notified. Consider providing a reason so others can adjust their plans.' },
      { question: 'How do I leave a trip I was invited to?', answer: 'Go to the trip detail page → Menu → Leave Trip. The trip organizer will be notified. You can rejoin later if re-invited.' },
      { question: 'How do I share trip details with non-app users?', answer: 'From the trip page, tap "Share". You can copy a link, share via text/email, or export trip details as a PDF with all the important information.' },
      { question: 'How do I log catches during a trip?', answer: 'When logging a catch, select "Add to Trip" and choose the active trip. Catches will be grouped under that trip for everyone to see. Great for friendly competitions!' }
    ],
    verification: [
      { question: 'What is ID Verification?', answer: 'ID Verification confirms your identity using a government-issued ID (driver\'s license, passport, or state ID). After approval, you receive a white checkmark badge. Documents are encrypted and deleted within 30 days of review.' },
      { question: 'What is Live Verification?', answer: 'Live Verification confirms you match your photos by taking a real-time selfie in a specific pose. It\'s processed instantly using facial recognition. Upon success, you receive a blue checkmark badge.' },
      { question: 'What documents are accepted for ID Verification?', answer: 'We accept: Driver\'s license, Passport, State ID card, Military ID, and Permanent Resident Card. Documents must be unexpired, government-issued, and contain your photo and full name.' },
      { question: 'How long does ID Verification take?', answer: 'Most ID verifications are reviewed within 24-72 hours. During peak times, it may take up to 5 business days. You\'ll receive an email once reviewed.' },
      { question: 'Why was my ID Verification rejected?', answer: 'Common reasons: blurry or unreadable image, expired document, document doesn\'t match profile name, photo taken of a screen instead of the physical document, or document not on our accepted list.' },
      { question: 'How do I complete Live Verification?', answer: 'Go to Settings → Verification → Live Verification. Follow the on-screen prompts to position your face and match the requested pose. Good lighting and a plain background help ensure success.' },
      { question: 'Why does verification expire?', answer: 'Verifications expire after one year to ensure ongoing authenticity. This confirms users still match their verified identity. You\'ll receive renewal reminders before expiry.' },
      { question: 'How do I renew my verification?', answer: 'When your verification is expiring (you\'ll get email reminders), go to Settings → Verification → Renew. Re-submit your ID or complete live verification again. It\'s the same process as initial verification.' },
      { question: 'What do the white and blue checkmarks mean?', answer: 'White checkmark: ID Verified - user confirmed their identity with a government ID. Blue checkmark: Live Verified - user also confirmed they match their photos in real-time. Both indicate verified identity.' },
      { question: 'Does verification guarantee safety?', answer: 'No. Verification confirms identity but does not include background checks or guarantee behavior. Always exercise caution when meeting new people, regardless of verification status.' }
    ]
  };

  const filteredFaqs = searchQuery ? 
    Object.entries(faqs).reduce((acc, [category, items]) => {
      const filtered = items.filter(
        faq => faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
               faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) acc[category] = filtered;
      return acc;
    }, {} as typeof faqs) 
    : faqs;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Help Center — Fish-X"
        description="Answers about catches, trips, tournaments, billing, and account settings. Search the Fish-X help center."
        path="/help"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: Object.values(faqs).flat().map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />
      <PublicHeader />

      {/* Hero Section */}
      <header className="pt-32 pb-16 px-6 section-muted">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">Help Center</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to your questions and learn how to get the most out of Fish-X.
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <h3 className="text-lg font-semibold text-foreground group-hover:underline">{category.title}</h3>
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
            {filteredFaqs.account && (
              <div id="account">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Account & Profile</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.account.map((faq, index) => (
                    <AccordionItem key={index} value={`account-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Dating Section */}
            {filteredFaqs.dating && (
              <div id="dating">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Dating & Matching</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.dating.map((faq, index) => (
                    <AccordionItem key={index} value={`dating-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Fishing Section */}
            {filteredFaqs.fishing && (
              <div id="fishing">
                <div className="flex items-center gap-3 mb-4">
                  <Fish className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Fishing Features</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.fishing.map((faq, index) => (
                    <AccordionItem key={index} value={`fishing-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Billing Section */}
            {filteredFaqs.billing && (
              <div id="billing">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Premium & Billing</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.billing.map((faq, index) => (
                    <AccordionItem key={index} value={`billing-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Safety Section */}
            {filteredFaqs.safety && (
              <div id="safety">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Safety & Privacy</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.safety.map((faq, index) => (
                    <AccordionItem key={index} value={`safety-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Technical Section */}
            {filteredFaqs.technical && (
              <div id="technical">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Technical Support</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.technical.map((faq, index) => (
                    <AccordionItem key={index} value={`technical-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Trips Section */}
            {filteredFaqs.trips && (
              <div id="trips">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Trips & Adventures</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.trips.map((faq, index) => (
                    <AccordionItem key={index} value={`trips-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Verification Section */}
            {filteredFaqs.verification && (
              <div id="verification">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Verification</h3>
                </div>
                <Accordion type="single" collapsible className="bg-background rounded-2xl border border-border">
                  {filteredFaqs.verification.map((faq, index) => (
                    <AccordionItem key={index} value={`verification-${index}`} className="px-6">
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-foreground text-background rounded-3xl p-12 md:p-16 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Still need help?</h2>
            <p className="text-xl text-background/70 mb-8 max-w-xl mx-auto">
              Our support team is available 24/7 to answer your questions and help you out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-10 py-6">
                  Contact Support
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="mailto:support@fish-x.com">
                <Button size="lg" variant="outline" className="border-background bg-transparent text-background hover:bg-background/10 font-semibold rounded-full px-10 py-6">
                  Email Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Help;