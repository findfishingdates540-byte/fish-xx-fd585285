import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Fish, Users, Target, Award, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import aboutHero from '@/assets/about-hero.jpg';
import coupleFishing from '@/assets/couple-fishing.jpg';
import fishingBuddies1 from '@/assets/fishing-buddies-1.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const About = () => {
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
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">About Us</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Your Ultimate Fishing Community
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                FishX was built by anglers, for anglers. We believe fishing is better together — whether 
                you're discovering new spots, finding buddies, or logging your personal best.
              </p>
            </motion.div>
            <motion.div 
              className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src={aboutHero} alt="Anglers fishing together at sunset" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Our Story Section */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="max-w-3xl mx-auto text-center space-y-8">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Our Story</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Born from a Love of Fishing
            </h2>
            <div className="text-lg text-muted-foreground leading-relaxed space-y-6">
              <p>
                FishX was founded by a group of avid anglers who wanted a better way to connect with 
                the fishing community. Traditional social platforms didn't capture what makes fishing 
                special — the early mornings, the patience, the thrill of the catch, and the peace of being on the water.
              </p>
              <p>
                We built FishX as the ultimate fishing platform: log catches, discover spots, find 
                fishing buddies, plan trips, and share your adventures. Whether you're a beginner 
                learning the ropes or an expert chasing your next trophy, FishX is your home.
              </p>
              <p>
                For adult users (18+), we also offer an optional dating add-on — because some of the 
                best relationships start with a shared passion for the water. But at its core, FishX 
                is about the fishing community.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">What We Stand For</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Our Mission & Values
            </h2>
          </ScrollReveal>
          
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
            <StaggerItem>
              <motion.div className="bg-muted rounded-3xl p-8 space-y-4 h-full" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                  <Fish className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Fishing First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Everything we build starts with the angler in mind. From catch logging to spot discovery, 
                  our platform is designed to enhance your fishing experience.
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div className="bg-muted rounded-3xl p-8 space-y-4 h-full" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Inclusive Community</h3>
                <p className="text-muted-foreground leading-relaxed">
                  FishX welcomes everyone — all ages (13+), all experience levels, all backgrounds. 
                  Our community is united by a love of fishing.
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div className="bg-muted rounded-3xl p-8 space-y-4 h-full" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                  <Target className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Smart Matching</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find fishing buddies who match your style, experience level, and preferred species. 
                  Connect with anglers who fish the way you do.
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div className="bg-muted rounded-3xl p-8 space-y-4 h-full" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                  <Award className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Youth-Friendly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Users 13+ can join the fishing community. Age-appropriate content guidelines and 
                  safety measures protect younger anglers. Dating features require 18+.
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div className="bg-muted rounded-3xl p-8 space-y-4 h-full" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                  <Globe className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Conservation Minded</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We encourage sustainable fishing practices and give back to conservation efforts. 
                  Protecting our waterways means protecting our passion.
                </p>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div className="bg-muted rounded-3xl p-8 space-y-4 h-full" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Always Improving</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We're constantly listening to our community and improving our platform. Your feedback 
                  shapes the future of FishX.
                </p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-6">
              <ScrollReveal delay={0.1}>
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={coupleFishing} alt="Anglers fishing together" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.2} className="pt-12">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={fishingBuddies1} alt="Fishing friends" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              </ScrollReveal>
            </div>
            
            <ScrollReveal direction="right" className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Our Community</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Built by Anglers, for Anglers
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our team is made up of passionate fishers who understand exactly what you need. 
                From freshwater lakes to ocean shores, we've built FishX to be the platform 
                we always wished existed.
              </p>
              <StaggerContainer className="grid grid-cols-2 gap-8" staggerDelay={0.1}>
                <StaggerItem>
                  <p className="text-4xl font-bold text-foreground">50K+</p>
                  <p className="text-muted-foreground">Active anglers</p>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-4xl font-bold text-foreground">25K+</p>
                  <p className="text-muted-foreground">Catches logged</p>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-4xl font-bold text-foreground">5K+</p>
                  <p className="text-muted-foreground">Fishing spots</p>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-4xl font-bold text-foreground">50+</p>
                  <p className="text-muted-foreground">States covered</p>
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
            Ready to join the community?
          </h2>
          <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
            Start your journey today and connect with thousands of anglers who share your passion.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
};

export default About;
