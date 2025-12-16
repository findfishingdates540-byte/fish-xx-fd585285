import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Users, MapPin, MessageCircle, Fish, Sparkles } from 'lucide-react';
import logo from '@/assets/logo.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Find Fishing Dates" className="h-10 w-auto" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/dating" className="text-muted-foreground hover:text-foreground transition-colors">Dating</Link>
            <Link to="/fishing" className="text-muted-foreground hover:text-foreground transition-colors">Fishing</Link>
            <Link to="/safety" className="text-muted-foreground hover:text-foreground transition-colors">Safety</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:bg-muted">
                Log in
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="btn-brand">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Bumble Style */}
      <header className="relative pt-24 overflow-hidden">
        <div className="hero-accent">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6 animate-slide-in-up">
                <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                  Find
                  <br />
                  Fishing
                  <br />
                  Dates
                </h1>
                <p className="text-lg text-foreground/80 max-w-md">
                  The dating app for fishing enthusiasts. Connect with people who share your passion for the water.
                </p>
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="btn-brand text-lg px-10 py-6">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Right - Image Grid (Bumble style overlapping images) */}
              <div className="relative h-[500px] hidden md:block">
                <div className="absolute right-0 top-0 w-72 h-96 bg-muted rounded-3xl overflow-hidden shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Fish className="w-24 h-24 text-primary/50" />
                  </div>
                </div>
                <div className="absolute right-48 top-24 w-48 h-64 bg-card rounded-3xl overflow-hidden shadow-xl border border-border">
                  <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                    <Heart className="w-16 h-16 text-secondary/50" />
                  </div>
                </div>
                <div className="absolute right-12 bottom-0 w-56 h-72 bg-muted rounded-3xl overflow-hidden shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                    <Users className="w-20 h-20 text-primary/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                We exist to bring fishing lovers closer to love.
              </h2>
              <p className="text-lg text-muted-foreground">
                We know our community has the ability to find meaningful and authentic relationships. 
                That's why we challenge outdated dating rules and encourage kindness and respect in all online interactions.
              </p>
              <Link to="/about">
                <Button className="btn-brand">
                  Learn about us
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-accent rounded-3xl flex items-center justify-center">
                  <span className="text-accent-foreground font-semibold text-lg rotate-12">Dating</span>
                </div>
                <div className="aspect-[3/4] bg-muted rounded-3xl flex items-center justify-center mt-8">
                  <span className="text-muted-foreground font-semibold text-lg -rotate-12">Fishing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-card rounded-2xl shadow-card flex items-center justify-center">
                  <Fish className="w-8 h-8 text-primary/30" />
                </div>
              ))}
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Be the first to know
              </h2>
              <p className="text-muted-foreground">
                Find Fishing Dates has led to millions of matches, stories, and dating tips 
                around the world. Want to see what you're missing? Sign up to 
                get our latest updates and feature announcements straight to your inbox.
              </p>
              <Link to="/auth?mode=signup">
                <Button className="btn-brand">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Dating Card */}
            <div className="feature-card bg-accent">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-[4/3] bg-background/50 rounded-2xl flex items-center justify-center">
                    <Heart className="w-12 h-12 text-secondary" />
                  </div>
                  <div className="aspect-[4/3] bg-background/50 rounded-2xl flex items-center justify-center">
                    <Fish className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-accent-foreground mb-2">Find Fishing Dates</h3>
                  <p className="text-accent-foreground/80">
                    Whether you're new to dating or ready for love again, Find Fishing Dates is built 
                    to bring you closer to wonderfully real, meaningful connections.
                  </p>
                </div>
                <Link to="/dating" className="text-accent-foreground font-semibold hover:underline inline-flex items-center gap-2">
                  Find your person <span>→</span>
                </Link>
              </div>
            </div>

            {/* Fishing Buddies Card */}
            <div className="feature-card bg-card border border-border">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-[4/3] bg-muted rounded-2xl flex items-center justify-center">
                    <Users className="w-12 h-12 text-primary" />
                  </div>
                  <div className="aspect-[4/3] bg-muted rounded-2xl flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Fishing Buddies</h3>
                  <p className="text-muted-foreground">
                    Whether you've moved to a new city or just want to expand your circle, 
                    find local fishing enthusiasts and plan your next adventure together.
                  </p>
                </div>
                <Link to="/fishing" className="text-foreground font-semibold hover:underline inline-flex items-center gap-2">
                  Find your crew <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-6xl text-muted-foreground">"</span>
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed">
                We are both naturally positive, happy-go-getters, but when you 
                put us together, it feels like there is nothing we can't accomplish.
              </blockquote>
              <p className="text-muted-foreground">
                Lisa & Thomas, married in 2023
              </p>
              <Link to="/stories" className="inline-block">
                <Button variant="outline" className="rounded-full">
                  Read more stories
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/5] bg-muted rounded-3xl flex items-center justify-center">
                <Heart className="w-24 h-24 text-secondary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet in Person Section */}
      <section className="py-20 px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square bg-background/10 rounded-3xl flex items-center justify-center">
                <MapPin className="w-24 h-24 text-background/30" />
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Start the chat in person
              </h2>
              <p className="text-background/80 text-lg">
                Find Fishing Dates IRL lets you explore your own backyard and start talking. Come 
                alone or bring a friend — and leave with a new connection.
              </p>
              <Button variant="outline" className="rounded-full border-background text-background hover:bg-background hover:text-foreground">
                Meet in person
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-20 px-6 bg-accent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-accent-foreground">
                Get the app
              </h2>
              <p className="text-accent-foreground/80 text-lg">
                Just scan the QR code to get started.
              </p>
              <div className="w-32 h-32 bg-background rounded-2xl flex items-center justify-center">
                <span className="text-muted-foreground text-sm">QR Code</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex justify-center gap-4">
                <div className="w-48 h-96 bg-background rounded-3xl shadow-xl flex items-center justify-center">
                  <img src={logo} alt="Find Fishing Dates App" className="w-24 h-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div>
              <img src={logo} alt="Find Fishing Dates" className="h-10 w-auto mb-4" />
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/dating" className="hover:text-foreground transition-colors">Dating</Link></li>
                <li><Link to="/fishing" className="hover:text-foreground transition-colors">Fishing Buddies</Link></li>
                <li><Link to="/premium" className="hover:text-foreground transition-colors">Premium</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact us</Link></li>
                <li><Link to="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link to="/safety" className="hover:text-foreground transition-colors">Safety</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Find Fishing Dates. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Follow us</span>
              <div className="flex gap-3">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
