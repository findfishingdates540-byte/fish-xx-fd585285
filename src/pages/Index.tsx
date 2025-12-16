import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Fish, Heart, Users, MapPin, Waves, Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsla(174,72%,50%,0.15)_0%,_transparent_50%)]" />
        
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Fish className="w-8 h-8 text-primary" />
              <Heart className="w-4 h-4 text-secondary absolute -bottom-1 -right-1" />
            </div>
            <span className="text-xl font-bold">FishMatch</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="btn-gradient-primary rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
          <div className="animate-slide-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              The #1 Dating App for Fishing Enthusiasts
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            Find Your <span className="gradient-text-dating">Match</span>,
            <br />
            Share Your <span className="gradient-text-fishing">Catch</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            Connect with fishing enthusiasts who share your passion. Date, fish, or both — 
            all in one location-based community app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="btn-gradient-primary rounded-full px-8 py-6 text-lg">
                <Heart className="w-5 h-5 mr-2" />
                Start Matching
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg glass border-border/50 hover:bg-card">
                <Fish className="w-5 h-5 mr-2" />
                Join Community
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            One App, <span className="text-primary">Two Passions</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Whether you're looking for love, fishing buddies, or both — FishMatch brings together 
            like-minded people who love the water.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              iconColor="text-secondary"
              title="Swipe & Match"
              description="Tinder-style matching with a twist. Connect with people who share your love for fishing."
            />
            <FeatureCard
              icon={<Fish className="w-6 h-6" />}
              iconColor="text-primary"
              title="Log Your Catches"
              description="Track your catches, share photos, and build your fishing portfolio."
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
              iconColor="text-primary"
              title="Discover Spots"
              description="Find and share the best fishing spots with an interactive map."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              iconColor="text-secondary"
              title="Find Fishing Buddies"
              description="Connect with local anglers for your next fishing trip."
            />
            <FeatureCard
              icon={<Waves className="w-6 h-6" />}
              iconColor="text-primary"
              title="Real-time Chat"
              description="Message your matches and plan your next adventure together."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              iconColor="text-secondary"
              title="Premium Features"
              description="Unlock unlimited swipes, see who likes you, and get priority discovery."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center glass rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Cast Your Line?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of fishing enthusiasts finding love and friendship on FishMatch.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="btn-gradient-primary rounded-full px-10 py-6 text-lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6 text-primary" />
            <span className="font-semibold">FishMatch</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 FishMatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, iconColor, title, description }: FeatureCardProps) => (
  <div className="glass rounded-2xl p-6 card-hover">
    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card mb-4 ${iconColor}`}>
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default Index;