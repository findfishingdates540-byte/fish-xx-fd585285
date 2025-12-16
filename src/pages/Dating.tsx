import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, MessageCircle, Users, MapPin, Shield, Star, Check, Sparkles } from 'lucide-react';
import logo from '@/assets/logo.jpg';
import datingHero from '@/assets/dating-hero.jpg';
import coupleFishing from '@/assets/couple-fishing.jpg';
import datingCouple1 from '@/assets/dating-couple-1.jpg';
import datingCouple2 from '@/assets/dating-couple-2.jpg';

const Dating = () => {
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
            <Link to="/dating" className="text-foreground font-semibold">Dating</Link>
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
      <header className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Dating Features</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Find Love on the Water
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Connect with singles who share your passion for fishing. Our dating features help you find 
                meaningful relationships with people who truly understand your lifestyle.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="btn-primary text-lg px-10 py-6">
                  Start Dating
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img src={datingHero} alt="Romantic fishing date" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Finding Love Made Simple
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Share your fishing interests, favorite spots, and what you're looking for in a partner.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground">Discover Matches</h3>
              <p className="text-muted-foreground">
                Browse profiles of fishing enthusiasts who match your preferences and interests.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground">Connect & Chat</h3>
              <p className="text-muted-foreground">
                When you both like each other, start chatting and get to know each other better.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-foreground">Plan Your Date</h3>
              <p className="text-muted-foreground">
                Use our fishing spots feature to plan the perfect first date on the water.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dating Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Smart Matching Algorithm
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our matching system goes beyond basic compatibility. We consider your fishing style, 
                experience level, preferred species, and relationship goals to find your perfect match.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Fishing Compatibility</h4>
                    <p className="text-muted-foreground">Match with people who share your fishing preferences</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Location-Based</h4>
                    <p className="text-muted-foreground">Find matches near your favorite fishing spots</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Relationship Goals</h4>
                    <p className="text-muted-foreground">Connect with people looking for the same thing</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                <img src={datingCouple1} alt="Couple on fishing date" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg mt-12">
                <img src={datingCouple2} alt="Happy fishing couple" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
                <img src={coupleFishing} alt="Couple fishing together" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Safe & Secure Dating
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Your safety is our priority. We've built comprehensive safety features to ensure 
                you can focus on finding love without worry.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Shield className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">Profile Verification</h4>
                  <p className="text-sm text-muted-foreground">Verified profiles for authentic connections</p>
                </div>
                <div className="space-y-2">
                  <MessageCircle className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">In-App Messaging</h4>
                  <p className="text-sm text-muted-foreground">Keep conversations within the app</p>
                </div>
                <div className="space-y-2">
                  <Users className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">Block & Report</h4>
                  <p className="text-sm text-muted-foreground">Easy tools to manage unwanted contact</p>
                </div>
                <div className="space-y-2">
                  <MapPin className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">Location Privacy</h4>
                  <p className="text-sm text-muted-foreground">Control what location info you share</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Matching Styles */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Choose Your Style</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Dating Your Way
            </h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              We offer different matching styles to suit your preferences and comfort level.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Heart className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Mutual Matching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Both people need to like each other before a connection is made. Traditional swiping 
                with instant matches when there's mutual interest.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" />
                  Equal opportunity for everyone
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" />
                  Instant match notifications
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" />
                  Both parties are interested
                </li>
              </ul>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Women First</h3>
              <p className="text-muted-foreground leading-relaxed">
                Women make the first move. Only women can initiate conversations, giving them 
                more control over their dating experience.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" />
                  Women control the conversation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" />
                  Less unwanted messages
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground" />
                  More intentional connections
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-foreground text-background rounded-3xl p-12 md:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6" />
                  <span className="text-sm font-medium tracking-widest uppercase">Premium</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">
                  Upgrade Your Dating Experience
                </h2>
                <p className="text-xl text-background/70 leading-relaxed">
                  Get more matches, more visibility, and more features with our premium subscription.
                </p>
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-10 py-6">
                    Try Premium Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Unlimited likes and matches</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">See who likes you</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Priority in discovery</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Advanced filters</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Ad-free experience</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 section-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Your fishing date is waiting
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join thousands of singles who have found love through their shared passion for fishing.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg">
              Start Dating Now
              <ArrowRight className="ml-2 w-5 h-5" />
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

export default Dating;
