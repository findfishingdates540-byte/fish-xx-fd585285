import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, MessageCircle, Users, MapPin, Shield, Star, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import datingHero from '@/assets/dating-hero.jpg';
import coupleFishing from '@/assets/couple-fishing.jpg';
import datingCouple1 from '@/assets/dating-couple-1.jpg';
import datingCouple2 from '@/assets/dating-couple-2.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const Dating = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="FishX Dating — Meet Anglers Who Share Your Passion"
        description="Optional dating mode for anglers 18+. Match with people who love fishing — plan trips, share spots, and build real connections."
        path="/dating"
      />
      <PublicHeader />

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">FishX Dating — 18+ Add-On</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Find Love on the Water
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                FishX Dating is an optional add-on for users 18 and older. Create a dating profile 
                from your Settings to discover romantic connections with fellow anglers.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>You must be 18+ and have a FishX account to use dating features.</span>
              </div>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="btn-primary text-lg px-10 py-6">
                  Join FishX Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div 
              className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src={datingHero} alt="Romantic fishing date" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Add Dating to Your FishX Account
            </h2>
          </ScrollReveal>
          
          <StaggerContainer className="grid md:grid-cols-4 gap-8" staggerDelay={0.15}>
            <StaggerItem className="text-center space-y-4">
              <motion.div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold" whileHover={{ scale: 1.1 }}>1</motion.div>
              <h3 className="text-xl font-bold text-foreground">Sign Up for FishX</h3>
              <p className="text-muted-foreground">Create your free fishing account and set up your angler profile.</p>
            </StaggerItem>
            <StaggerItem className="text-center space-y-4">
              <motion.div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold" whileHover={{ scale: 1.1 }}>2</motion.div>
              <h3 className="text-xl font-bold text-foreground">Create Dating Profile</h3>
              <p className="text-muted-foreground">If you're 18+, go to Settings and add a dating profile to your account.</p>
            </StaggerItem>
            <StaggerItem className="text-center space-y-4">
              <motion.div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold" whileHover={{ scale: 1.1 }}>3</motion.div>
              <h3 className="text-xl font-bold text-foreground">Discover Matches</h3>
              <p className="text-muted-foreground">Browse profiles of anglers who match your preferences and interests.</p>
            </StaggerItem>
            <StaggerItem className="text-center space-y-4">
              <motion.div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold" whileHover={{ scale: 1.1 }}>4</motion.div>
              <h3 className="text-xl font-bold text-foreground">Plan Your Date</h3>
              <p className="text-muted-foreground">Use FishX fishing spots to plan the perfect first date on the water.</p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Dating Features */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <ScrollReveal direction="left" className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Smart Matching Algorithm</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our matching system considers your fishing style, experience level, preferred species, 
                and relationship goals to find your perfect match.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1"><Check className="w-4 h-4 text-background" /></div>
                  <div><h4 className="font-semibold text-foreground">Fishing Compatibility</h4><p className="text-muted-foreground">Match with people who share your fishing preferences</p></div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1"><Check className="w-4 h-4 text-background" /></div>
                  <div><h4 className="font-semibold text-foreground">Location-Based</h4><p className="text-muted-foreground">Find matches near your favorite fishing spots</p></div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1"><Check className="w-4 h-4 text-background" /></div>
                  <div><h4 className="font-semibold text-foreground">Relationship Goals</h4><p className="text-muted-foreground">Connect with people looking for the same thing</p></div>
                </li>
              </ul>
            </ScrollReveal>
            <div className="grid grid-cols-2 gap-4">
              <ScrollReveal delay={0.1} className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                <img src={datingCouple1} alt="Couple on fishing date" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </ScrollReveal>
              <ScrollReveal delay={0.2} className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg mt-12">
                <img src={datingCouple2} alt="Happy fishing couple" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </ScrollReveal>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" className="order-2 lg:order-1">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
                <img src={coupleFishing} alt="Couple fishing together" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" className="space-y-8 order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Safe & Secure Dating</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Your safety is our priority. All dating users must be 18+, and we've built comprehensive 
                safety features into the experience.
              </p>
              <StaggerContainer className="grid grid-cols-2 gap-6" staggerDelay={0.1}>
                <StaggerItem className="space-y-2">
                  <Shield className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">18+ Age Gate</h4>
                  <p className="text-sm text-muted-foreground">Dating is only available to verified adults</p>
                </StaggerItem>
                <StaggerItem className="space-y-2">
                  <MessageCircle className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">In-App Messaging</h4>
                  <p className="text-sm text-muted-foreground">Keep conversations within the app</p>
                </StaggerItem>
                <StaggerItem className="space-y-2">
                  <Users className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">Block & Report</h4>
                  <p className="text-sm text-muted-foreground">Easy tools to manage unwanted contact</p>
                </StaggerItem>
                <StaggerItem className="space-y-2">
                  <MapPin className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">Location Privacy</h4>
                  <p className="text-sm text-muted-foreground">Control what location info you share</p>
                </StaggerItem>
              </StaggerContainer>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 section-dark overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Ready to find your fishing partner?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join FishX for free, then add a dating profile from your Settings to start matching with fellow anglers.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg">
              Join FishX Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Dating;
