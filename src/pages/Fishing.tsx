import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Fish, MapPin, Camera, Users, Trophy, Compass, Anchor, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import fishingHero from '@/assets/fishing-hero.jpg';
import fishingBuddies1 from '@/assets/fishing-buddies-1.jpg';
import fishingBuddies2 from '@/assets/fishing-buddies-2.jpg';
import heroFishing1 from '@/assets/hero-fishing-1.jpg';
import heroFishing2 from '@/assets/hero-fishing-2.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const Fishing = () => {
  return (
    <div className="min-h-screen bg-background">
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
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Fishing Features</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Your Fishing Companion
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                More than just dating—we're a complete fishing platform. Log catches, discover spots, 
                find fishing buddies, and track your angling journey.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="btn-primary text-lg px-10 py-6">
                  Start Fishing
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
              <img src={fishingHero} alt="Group of friends fishing" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Everything an Angler Needs
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Fish className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Catch Logging</h3>
              <p className="text-muted-foreground leading-relaxed">
                Record every catch with photos, species, size, weight, and location. Build your 
                personal fishing history and track your progress.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <MapPin className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Fishing Spots</h3>
              <p className="text-muted-foreground leading-relaxed">
                Discover and share fishing spots with the community. Get insider tips on the best 
                locations, what's biting, and when to go.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Fishing Buddies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find local fishing partners who match your style. Whether you prefer shore fishing 
                or deep sea adventures, find your crew.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Camera className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Photo Gallery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Show off your best catches with high-quality photos. Share your fishing stories 
                and inspire the community.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Trophy className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Personal Stats</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your fishing statistics over time. See your biggest catches, favorite species, 
                and most productive spots.
              </p>
            </div>
            
            <div className="bg-background rounded-3xl p-8 space-y-4 border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Compass className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Gear Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Log the gear and bait that works best for each catch. Learn what equipment 
                brings the best results in your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catch Logging Detail */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Catch Logging</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Document Every Catch
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our catch logging system is designed by anglers, for anglers. Capture every detail 
                of your fishing adventures and build a comprehensive record of your skills.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Species Identification</h4>
                    <p className="text-muted-foreground">Log the exact species with our extensive database</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Size & Weight Tracking</h4>
                    <p className="text-muted-foreground">Record length and weight to track personal bests</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Location Tagging</h4>
                    <p className="text-muted-foreground">GPS tag your catches to remember winning spots</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Gear & Bait Notes</h4>
                    <p className="text-muted-foreground">Remember what worked with detailed equipment logs</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                <img src={heroFishing1} alt="Angler with catch" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg mt-12">
                <img src={heroFishing2} alt="Fishing success" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fishing Spots */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl bg-muted flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="w-16 h-16 text-foreground mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">Interactive Map</h3>
                  <p className="text-muted-foreground">Discover fishing spots near you</p>
                </div>
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Fishing Spots</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Discover Hidden Gems
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our community-driven fishing spots map helps you find the best places to fish. 
                Get real insights from local anglers who know the waters.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">5,000+</h4>
                  <p className="text-sm text-muted-foreground">Fishing spots listed</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Community Ratings</h4>
                  <p className="text-sm text-muted-foreground">Real reviews from anglers</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Species Info</h4>
                  <p className="text-sm text-muted-foreground">Know what's biting where</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Add Your Own</h4>
                  <p className="text-sm text-muted-foreground">Share your secret spots</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fishing Buddies */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Fishing Buddies</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Find Your Fishing Crew
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Not everyone is looking for romance. Our fishing buddies feature helps you connect 
                with local anglers who share your passion and style.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <Anchor className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Match by Fishing Style</h4>
                    <p className="text-muted-foreground">Fly fishing, bass fishing, deep sea—find people who fish like you</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Compass className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Local Connections</h4>
                    <p className="text-muted-foreground">Find buddies near your favorite fishing spots</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Experience Matching</h4>
                    <p className="text-muted-foreground">Connect with anglers at your skill level or learn from experts</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                <img src={fishingBuddies1} alt="Fishing friends" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg mt-12">
                <img src={fishingBuddies2} alt="Fishing group" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-24 px-6 section-muted">
        <div className="max-w-7xl mx-auto">
          <div className="bg-foreground text-background rounded-3xl p-12 md:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6" />
                  <span className="text-sm font-medium tracking-widest uppercase">Premium Fishing</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">
                  Advanced Fishing Analytics
                </h2>
                <p className="text-xl text-background/70 leading-relaxed">
                  Premium members get access to advanced fishing features that take your angling to the next level.
                </p>
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-10 py-6">
                    Go Premium
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Advanced catch statistics & trends</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Exclusive fishing spot data</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Weather & conditions insights</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Unlimited buddy connections</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                  <Check className="w-6 h-6" />
                  <span className="text-lg">Priority support</span>
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
            Ready to level up your fishing?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Join our community of anglers and start logging catches, discovering spots, and finding fishing buddies.
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

export default Fishing;
