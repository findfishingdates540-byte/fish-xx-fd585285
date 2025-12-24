import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, MessageCircle, Users, MapPin, Shield, Star, Check, Sparkles } from 'lucide-react';
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
              Finding Love Made Simple
            </h2>
          </ScrollReveal>
          
          <StaggerContainer className="grid md:grid-cols-4 gap-8" staggerDelay={0.15}>
            <StaggerItem className="text-center space-y-4">
              <motion.div 
                className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold"
                whileHover={{ scale: 1.1 }}
              >
                1
              </motion.div>
              <h3 className="text-xl font-bold text-foreground">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Share your fishing interests, favorite spots, and what you're looking for in a partner.
              </p>
            </StaggerItem>
            
            <StaggerItem className="text-center space-y-4">
              <motion.div 
                className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold"
                whileHover={{ scale: 1.1 }}
              >
                2
              </motion.div>
              <h3 className="text-xl font-bold text-foreground">Discover Matches</h3>
              <p className="text-muted-foreground">
                Browse profiles of fishing enthusiasts who match your preferences and interests.
              </p>
            </StaggerItem>
            
            <StaggerItem className="text-center space-y-4">
              <motion.div 
                className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold"
                whileHover={{ scale: 1.1 }}
              >
                3
              </motion.div>
              <h3 className="text-xl font-bold text-foreground">Connect & Chat</h3>
              <p className="text-muted-foreground">
                When you both like each other, start chatting and get to know each other better.
              </p>
            </StaggerItem>
            
            <StaggerItem className="text-center space-y-4">
              <motion.div 
                className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mx-auto text-2xl font-bold"
                whileHover={{ scale: 1.1 }}
              >
                4
              </motion.div>
              <h3 className="text-xl font-bold text-foreground">Plan Your Date</h3>
              <p className="text-muted-foreground">
                Use our fishing spots feature to plan the perfect first date on the water.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Dating Features */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <ScrollReveal direction="left" className="space-y-8">
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
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Safe & Secure Dating
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Your safety is our priority. We've built comprehensive safety features to ensure 
                you can focus on finding love without worry.
              </p>
              <StaggerContainer className="grid grid-cols-2 gap-6" staggerDelay={0.1}>
                <StaggerItem className="space-y-2">
                  <Shield className="w-8 h-8 text-foreground" />
                  <h4 className="font-semibold text-foreground">Profile Verification</h4>
                  <p className="text-sm text-muted-foreground">Verified profiles for authentic connections</p>
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

      {/* Matching Styles */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Choose Your Style</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Dating Your Way
            </h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              We offer different matching styles to suit your preferences and comfort level.
            </p>
          </ScrollReveal>
          
          <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" staggerDelay={0.15}>
            <StaggerItem>
              <motion.div 
                className="bg-background rounded-3xl p-8 space-y-4 border border-border h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div 
                className="bg-background rounded-3xl p-8 space-y-4 border border-border h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
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
      <section className="py-24 px-6 section-dark overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
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
        </ScrollReveal>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Dating;
