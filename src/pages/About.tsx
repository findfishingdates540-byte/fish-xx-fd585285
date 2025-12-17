import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, Target, Award, Globe, Sparkles } from 'lucide-react';
import aboutHero from '@/assets/about-hero.jpg';
import coupleFishing from '@/assets/couple-fishing.jpg';
import fishingBuddies1 from '@/assets/fishing-buddies-1.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">About Us</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Where Passion Meets Connection
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                We built Find Fishing Dates because we believe the best relationships start with shared passions. 
                When you love fishing, you deserve to find someone who loves it too.
              </p>
            </div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img src={aboutHero} alt="Couple fishing together at sunset" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Our Story Section */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Our Story</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Born from a Love of Fishing
            </h2>
            <div className="text-lg text-muted-foreground leading-relaxed space-y-6">
              <p>
                Find Fishing Dates was founded in 2022 by a group of avid anglers who struggled to find partners 
                who understood their passion. Traditional dating apps didn't capture what made fishing special—the 
                early mornings, the patience, the thrill of the catch, and the peace of being on the water.
              </p>
              <p>
                We realized there was a whole community of people looking for the same thing: someone to share 
                their love of fishing with. Whether that's a romantic partner or a new fishing buddy, we wanted 
                to create a space where those connections could happen naturally.
              </p>
              <p>
                Today, we're proud to have helped thousands of fishing enthusiasts find love, friendship, and 
                their next great fishing adventure. Our community spans across the country, from freshwater lakes 
                to ocean shores, united by a shared passion for the sport.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">What We Stand For</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Our Mission & Values
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-muted rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <Heart className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Authentic Connections</h3>
              <p className="text-muted-foreground leading-relaxed">
                We believe in real connections built on shared passions. No games, no gimmicks—just genuine 
                people looking for meaningful relationships.
              </p>
            </div>
            
            <div className="bg-muted rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Inclusive Community</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our platform welcomes everyone. We're LGBTQ+ friendly and support all forms of connection—romantic, 
                platonic, and everything in between.
              </p>
            </div>
            
            <div className="bg-muted rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <Target className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Passion-First Matching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our matching algorithm prioritizes shared fishing interests, experience levels, and preferred 
                fishing styles to create the most compatible connections.
              </p>
            </div>
            
            <div className="bg-muted rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Quality Over Quantity</h3>
              <p className="text-muted-foreground leading-relaxed">
                We focus on helping you find the right connections, not endless swiping. Every match is 
                meaningful and based on genuine compatibility.
              </p>
            </div>
            
            <div className="bg-muted rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <Globe className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Conservation Minded</h3>
              <p className="text-muted-foreground leading-relaxed">
                We encourage sustainable fishing practices and give back to conservation efforts. 
                Protecting our waterways means protecting our passion.
              </p>
            </div>
            
            <div className="bg-muted rounded-3xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Always Improving</h3>
              <p className="text-muted-foreground leading-relaxed">
                We're constantly listening to our community and improving our platform. Your feedback 
                shapes the future of Find Fishing Dates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team/Community Section */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={coupleFishing} alt="Happy couple fishing" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={fishingBuddies1} alt="Fishing friends" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Our Community</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Built by Anglers, for Anglers
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our team is made up of passionate fishers who understand exactly what you're looking for. 
                From bass fishing in freshwater lakes to deep-sea adventures, we've done it all—and we 
                built Find Fishing Dates to help you find someone to share those experiences with.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-4xl font-bold text-foreground">50K+</p>
                  <p className="text-muted-foreground">Active members</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-foreground">10K+</p>
                  <p className="text-muted-foreground">Successful matches</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-foreground">50+</p>
                  <p className="text-muted-foreground">States covered</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-foreground">500+</p>
                  <p className="text-muted-foreground">Fishing dates daily</p>
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
            Ready to join our community?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Start your journey today and connect with thousands of fishing enthusiasts who share your passion.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default About;
