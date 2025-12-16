import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Lock, Eye, AlertTriangle, UserX, MessageSquare, MapPin, Phone, Check, Heart } from 'lucide-react';
import logo from '@/assets/logo.jpg';
import safetyHero from '@/assets/safety-hero.jpg';

const Safety = () => {
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
            <Link to="/safety" className="text-foreground font-semibold">Safety</Link>
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
      <header className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Safety Center</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Your Safety is Our Priority
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                We've built comprehensive safety features to ensure you can connect with confidence. 
                Here's everything you need to know about staying safe on Find Fishing Dates.
              </p>
            </div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img src={safetyHero} alt="Online safety and trust" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Safety Features */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Platform Safety</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Built-in Safety Features
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Shield className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Profile Verification</h3>
              <p className="text-muted-foreground leading-relaxed">
                Verified badges help you identify authentic profiles. We use multiple verification 
                methods to ensure users are who they say they are.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Lock className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Secure Messaging</h3>
              <p className="text-muted-foreground leading-relaxed">
                All messages are encrypted and stay within our platform. We never share your 
                contact information without your explicit consent.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Eye className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Photo Moderation</h3>
              <p className="text-muted-foreground leading-relaxed">
                All photos are reviewed for inappropriate content. Our AI and human moderators 
                work 24/7 to keep the platform safe.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <UserX className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Block & Report</h3>
              <p className="text-muted-foreground leading-relaxed">
                Easily block anyone and report inappropriate behavior. Our team reviews all 
                reports and takes action quickly.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <MapPin className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Location Privacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                You control what location information is shared. We never reveal your exact 
                location to other users without permission.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">24/7 Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our safety team is available around the clock. Contact us anytime if you 
                experience any issues or concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meeting Safety */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Meeting In Person</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
                Tips for Meeting Safely
              </h2>
              <p className="text-xl text-muted-foreground mt-4">
                When you're ready to take your connection offline, follow these guidelines to stay safe.
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Meet in Public Places</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Always meet in public, well-populated areas for your first few dates. Popular fishing spots, 
                    bait shops, or restaurants near the water are great options. Avoid isolated locations until 
                    you've built trust.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Tell Someone Your Plans</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Let a friend or family member know where you're going, who you're meeting, and when you 
                    expect to be back. Share your date's profile with them and check in during and after the date.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Arrange Your Own Transportation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Drive yourself or use public transportation for your first few meetings. Don't let your date 
                    pick you up from home, and have a way to leave independently if needed.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  4
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Video Chat First</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Before meeting in person, have a video call to verify your match is who they claim to be. 
                    This adds an extra layer of verification and helps you feel more comfortable.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  5
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Trust Your Instincts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If something feels wrong, it probably is. Don't feel obligated to continue a date if you're 
                    uncomfortable. Your safety is more important than being polite.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  6
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Stay Sober</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Keep a clear head when meeting someone new. Alcohol can impair your judgment and reaction time. 
                    Never leave your drink unattended.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Red Flags */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Stay Alert</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Red Flags to Watch For
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <AlertTriangle className="w-8 h-8 text-foreground" />
              <h3 className="text-xl font-bold text-foreground">Requests for Money</h3>
              <p className="text-muted-foreground leading-relaxed">
                Never send money to someone you haven't met in person. Scammers often build emotional 
                connections before asking for financial help.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <AlertTriangle className="w-8 h-8 text-foreground" />
              <h3 className="text-xl font-bold text-foreground">Refuses to Video Chat</h3>
              <p className="text-muted-foreground leading-relaxed">
                If someone consistently avoids video calls or meeting in person, they may be hiding 
                something or using fake photos.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <AlertTriangle className="w-8 h-8 text-foreground" />
              <h3 className="text-xl font-bold text-foreground">Too Good to Be True</h3>
              <p className="text-muted-foreground leading-relaxed">
                Be wary of profiles that seem perfect or people who fall in love very quickly. 
                Real relationships take time to develop.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <AlertTriangle className="w-8 h-8 text-foreground" />
              <h3 className="text-xl font-bold text-foreground">Pressures You</h3>
              <p className="text-muted-foreground leading-relaxed">
                Anyone who pressures you to meet quickly, share personal info, or do things you're 
                uncomfortable with is not respecting your boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report & Support */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-foreground text-background rounded-3xl p-12 md:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold">
                  Need Help? We're Here
                </h2>
                <p className="text-xl text-background/70 leading-relaxed">
                  If you encounter any issues or feel unsafe, our team is available 24/7 to help. 
                  Don't hesitate to reach out.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6" />
                    <span className="text-lg">Emergency: 911</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-lg">In-app support: Available 24/7</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Heart className="w-6 h-6" />
                    <span className="text-lg">National Domestic Violence Hotline: 1-800-799-7233</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6">How to Report</h3>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <p>Tap the three dots on any profile to report or block</p>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <p>Use the report button in any chat conversation</p>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <p>Contact support through Settings → Help & Support</p>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <p>Email us at safety@findfishingdates.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Community Standards</span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-8">
            Our Community Guidelines
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            We expect all members to treat each other with respect. Harassment, hate speech, 
            and inappropriate content are not tolerated and will result in account termination.
          </p>
          <Link to="/terms">
            <Button variant="outline" className="btn-outline">
              Read Full Guidelines
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
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

export default Safety;
