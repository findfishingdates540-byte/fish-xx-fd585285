import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, MapPin, MessageCircle, Fish, Star } from 'lucide-react';
import logo from '@/assets/logo.jpg';
import heroFishing1 from '@/assets/hero-fishing-1.jpg';
import heroFishing2 from '@/assets/hero-fishing-2.jpg';
import heroFishing3 from '@/assets/hero-fishing-3.jpg';
import coupleFishing from '@/assets/couple-fishing.jpg';
import datingCouple1 from '@/assets/dating-couple-1.jpg';
import datingCouple2 from '@/assets/dating-couple-2.jpg';
import fishingBuddies1 from '@/assets/fishing-buddies-1.jpg';
import fishingBuddies2 from '@/assets/fishing-buddies-2.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <img src={logo} alt="Find Fishing Dates" className="h-14 w-auto" />
          
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
      <header className="pt-32 pb-20 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-slide-up">
              <h1 className="display-text text-foreground">
                Find Your
                <br />
                <span className="italic">Perfect</span>
                <br />
                Fishing Date
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                The dating app built for fishing enthusiasts. Connect with people who share your passion for the water.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="btn-primary text-lg px-10 py-6 w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="btn-outline text-lg px-10 py-6 w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Image Grid */}
            <div className="relative h-[600px] hidden lg:block animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute right-0 top-0 w-80 h-[420px] rounded-3xl overflow-hidden shadow-xl">
                <img src={heroFishing1} alt="Person fishing at sunset" className="w-full h-full object-cover" />
              </div>
              <div className="absolute right-64 top-20 w-56 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-background">
                <img src={heroFishing2} alt="Woman with caught fish" className="w-full h-full object-cover" />
              </div>
              <div className="absolute right-20 bottom-0 w-64 h-80 rounded-3xl overflow-hidden shadow-xl">
                <img src={heroFishing3} alt="Friends fishing together" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">50K+</p>
              <p className="text-muted-foreground mt-2">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">10K+</p>
              <p className="text-muted-foreground mt-2">Matches Made</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">5K+</p>
              <p className="text-muted-foreground mt-2">Fishing Spots</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">98%</p>
              <p className="text-muted-foreground mt-2">Happy Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Our Mission</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                We exist to bring fishing lovers closer to love.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We believe meaningful connections happen when people share genuine passions. 
                That's why we built a platform where fishing enthusiasts can find love, 
                friendship, and their next fishing buddy.
              </p>
              <Link to="/about">
                <Button className="btn-primary">
                  About Us
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={heroFishing1} alt="Fishing at sunset" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={heroFishing2} alt="Proud angler" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={heroFishing3} alt="Friends fishing" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={coupleFishing} alt="Couple fishing together" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Everything you need
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Smart Matching"
              description="Our algorithm connects you with people who share your fishing preferences and dating goals."
            />
            <FeatureCard
              icon={<Fish className="w-8 h-8" />}
              title="Catch Logs"
              description="Track and share your catches. Show off your skills and find partners who appreciate the sport."
            />
            <FeatureCard
              icon={<MapPin className="w-8 h-8" />}
              title="Fishing Spots"
              description="Discover and share the best local fishing spots with an interactive community map."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Fishing Buddies"
              description="Not looking for romance? Find local fishing companions for your next adventure."
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8" />}
              title="Real-time Chat"
              description="Message your matches instantly and plan your first fishing date together."
            />
            <FeatureCard
              icon={<Star className="w-8 h-8" />}
              title="Premium Features"
              description="Unlock unlimited matches, priority discovery, and exclusive fishing spot data."
            />
          </div>
        </div>
      </section>

      {/* Account Types Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Dating Card */}
            <div className="bg-muted rounded-3xl p-8 md:p-12">
              <div className="relative h-80 mb-8">
                <div className="absolute left-0 top-0 w-48 h-64 rounded-2xl overflow-hidden shadow-lg z-10">
                  <img src={datingCouple1} alt="Couple fishing at sunset" className="w-full h-full object-cover" />
                </div>
                <div className="absolute right-0 top-8 w-44 h-56 rounded-2xl overflow-hidden shadow-xl z-20">
                  <img src={datingCouple2} alt="Happy couple on fishing date" className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-24 bottom-0 w-40 h-48 rounded-2xl overflow-hidden shadow-lg z-30 border-4 border-muted">
                  <img src={coupleFishing} alt="Romantic fishing moment" className="w-full h-full object-cover" />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Find Your Date</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Connect with fellow fishing enthusiasts looking for love. 
                Find someone who shares your passion for the water and early morning adventures.
              </p>
              <Link to="/auth?mode=signup" className="inline-flex items-center text-foreground font-medium hover:opacity-70 transition-opacity underline underline-offset-4">
                Find your person
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

            {/* Fishing Buddies Card */}
            <div className="bg-muted rounded-3xl p-8 md:p-12">
              <div className="relative h-80 mb-8">
                <div className="absolute right-0 top-0 w-48 h-64 rounded-2xl overflow-hidden shadow-lg z-10">
                  <img src={fishingBuddies1} alt="Group of friends fishing" className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-0 top-8 w-44 h-56 rounded-2xl overflow-hidden shadow-xl z-20">
                  <img src={fishingBuddies2} alt="Friends celebrating a catch" className="w-full h-full object-cover" />
                </div>
                <div className="absolute right-24 bottom-0 w-40 h-48 rounded-2xl overflow-hidden shadow-lg z-30 border-4 border-muted">
                  <img src={heroFishing3} alt="Fishing adventure" className="w-full h-full object-cover" />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Find Fishing Buddies</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Not looking for romance? Find local fishing companions for your next adventure. 
                Connect with anglers in your area who share your fishing style.
              </p>
              <Link to="/auth?mode=signup" className="inline-flex items-center text-foreground font-medium hover:opacity-70 transition-opacity underline underline-offset-4">
                Find your crew
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <img src={coupleFishing} alt="Happy couple who met on Find Fishing Dates" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <span className="text-8xl font-serif text-foreground/20">"</span>
              <blockquote className="text-3xl md:text-4xl font-medium text-foreground leading-snug -mt-12">
                We met on Find Fishing Dates and now we spend every weekend on the water together. 
                It's the best decision we ever made.
              </blockquote>
              <div>
                <p className="font-semibold text-foreground">Sarah & Michael</p>
                <p className="text-muted-foreground">Married in 2023</p>
              </div>
              <Link to="/stories">
                <Button variant="outline" className="btn-outline">
                  Read More Stories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 section-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Ready to find your perfect fishing date?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join thousands of fishing enthusiasts who have found love, friendship, 
            and their next fishing adventure on our platform.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Mobile App</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Get the app
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Download our mobile app and start connecting with fishing enthusiasts 
                wherever you are. Available on iOS and Android.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="btn-primary">
                  App Store
                </Button>
                <Button className="btn-outline">
                  Google Play
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-64 h-[500px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-background rounded-[2.5rem] flex items-center justify-center">
                  <img src={logo} alt="Find Fishing Dates App" className="w-32 h-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 md:col-span-1">
              <img src={logo} alt="Find Fishing Dates" className="h-12 w-auto mb-6" />
              <p className="text-sm text-muted-foreground">
                Connecting fishing enthusiasts worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Products</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/dating" className="hover:text-foreground transition-colors">Dating</Link></li>
                <li><Link to="/fishing" className="hover:text-foreground transition-colors">Fishing Buddies</Link></li>
                <li><Link to="/premium" className="hover:text-foreground transition-colors">Premium</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link to="/guidelines" className="hover:text-foreground transition-colors">Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Find Fishing Dates. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
              <a href="#" className="hover:text-foreground transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="feature-card bg-background">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-foreground mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Index;
