import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, MapPin, MessageCircle, Fish, Star, Apple, Smartphone, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import logo from '@/assets/logo.png';
import heroFishing1 from '@/assets/hero-fishing-1.jpg';
import heroFishing2 from '@/assets/hero-fishing-2.jpg';
import heroFishing3 from '@/assets/hero-fishing-3.jpg';
import coupleFishing from '@/assets/couple-fishing.jpg';
import datingCouple1 from '@/assets/dating-couple-1.jpg';
import datingCouple2 from '@/assets/dating-couple-2.jpg';
import fishingBuddies1 from '@/assets/fishing-buddies-1.jpg';
import fishingBuddies2 from '@/assets/fishing-buddies-2.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { CountUp } from '@/components/ui/count-up';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHomeLanding from '@/components/home/MobileHomeLanding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();
  const [accountMode, setAccountMode] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      supabase
        .from('profiles')
        .select('account_mode')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setAccountMode(data?.account_mode || 'both');
          setProfileLoading(false);
        });
    }
  }, [user]);

  // Mobile: Show clean app launcher screen (ideal for APK)
  if (isMobile) {
    return <MobileHomeLanding />;
  }

  // Show loading state while checking auth
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Fish className="w-12 h-12 text-foreground animate-pulse" />
        </motion.div>
      </div>
    );
  }

  // Redirect authenticated users to their dashboard
  if (user && accountMode) {
    if (accountMode === 'dating') {
      return <Navigate to="/app/discover" replace />;
    } else if (accountMode === 'fishing') {
      return <Navigate to="/app/feed" replace />;
    } else {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  // Desktop/Tablet: Show full marketing homepage
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-8"
            >
              <h1 className="display-text text-foreground">
                Your
                <br />
                <motion.span 
                  className="italic inline-block"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Ultimate
                </motion.span>
                <br />
                Fishing Platform
              </h1>
              <motion.p 
                className="text-xl text-muted-foreground max-w-lg leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Discover fishing spots, log your catches, find fishing buddies, and connect with anglers worldwide. All in one platform.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="btn-primary text-lg px-10 py-6 w-full sm:w-auto group">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="btn-outline text-lg px-10 py-6 w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right - Image Grid */}
            <div className="relative h-[600px] hidden lg:block">
              <motion.div 
                className="absolute right-0 top-0 w-80 h-[420px] rounded-3xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, y: 60, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.05, zIndex: 40 }}
              >
                <img src={heroFishing1} alt="Person fishing at sunset" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                className="absolute right-64 top-20 w-56 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-background"
                initial={{ opacity: 0, y: 80, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.05, zIndex: 40 }}
              >
                <img src={heroFishing2} alt="Woman with caught fish" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                className="absolute right-20 bottom-0 w-64 h-80 rounded-3xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.05, zIndex: 40 }}
              >
                <img src={heroFishing3} alt="Friends fishing together" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8" staggerDelay={0.15}>
            <StaggerItem className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">
                <CountUp end={50} suffix="K+" duration={2} />
              </p>
              <p className="text-muted-foreground mt-2">Active Users</p>
            </StaggerItem>
            <StaggerItem className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">
                <CountUp end={10} suffix="K+" duration={2} />
              </p>
               <p className="text-muted-foreground mt-2">Matches Made</p>
             </StaggerItem>
            <StaggerItem className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">
                <CountUp end={5} suffix="K+" duration={2} />
              </p>
              <p className="text-muted-foreground mt-2">Fishing Spots</p>
            </StaggerItem>
            <StaggerItem className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-foreground">
                <CountUp end={98} suffix="%" duration={2} />
              </p>
              <p className="text-muted-foreground mt-2">Happy Users</p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Our Mission</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Built by anglers, for anglers.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We believe the best fishing experiences happen when you share them. 
                That's why we built a platform where anglers can discover spots, 
                log catches, find buddies, and connect with a passionate community.
              </p>
              <Link to="/about">
                <Button className="btn-primary group">
                  About Us
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </ScrollReveal>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <ScrollReveal delay={0.1} className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={heroFishing1} alt="Fishing at sunset" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
                <ScrollReveal delay={0.3} className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={heroFishing2} alt="Proud angler" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
              </div>
              <div className="space-y-6 pt-12">
                <ScrollReveal delay={0.2} className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={heroFishing3} alt="Friends fishing" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
                <ScrollReveal delay={0.4} className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={coupleFishing} alt="Couple fishing together" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 section-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
              Everything you need
            </h2>
          </ScrollReveal>
          
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
            <StaggerItem>
              <FeatureCard
                icon={<Heart className="w-8 h-8" />}
                title="Smart Matching"
                description="Find fishing buddies who match your style, experience level, and preferred species."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<Fish className="w-8 h-8" />}
                title="Catch Logs"
                description="Track and share your catches. Show off your skills and find partners who appreciate the sport."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<MapPin className="w-8 h-8" />}
                title="Fishing Spots"
                description="Discover and share the best local fishing spots with an interactive community map."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<Users className="w-8 h-8" />}
                title="Fishing Buddies"
                description="Not looking for romance? Find local fishing companions for your next adventure."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<MessageCircle className="w-8 h-8" />}
                title="Real-time Chat"
                description="Message your fishing buddies instantly and plan your next trip together."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<Star className="w-8 h-8" />}
                title="Premium Features"
                description="Unlock unlimited matches, priority discovery, and exclusive fishing spot data."
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Account Types Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Dating Card */}
            <ScrollReveal delay={0} direction="up">
              <motion.div 
                className="bg-muted rounded-3xl p-8 md:p-12 cursor-pointer group h-full"
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative h-80 mb-8">
                  <motion.div 
                    className="absolute left-0 top-0 w-48 h-64 rounded-2xl overflow-hidden shadow-lg z-10"
                    whileHover={{ y: -4 }}
                  >
                    <img src={datingCouple1} alt="Couple fishing at sunset" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                  <motion.div 
                    className="absolute right-0 top-8 w-44 h-56 rounded-2xl overflow-hidden shadow-xl z-20"
                    whileHover={{ y: -6 }}
                  >
                    <img src={datingCouple2} alt="Happy couple on fishing date" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                  <motion.div 
                    className="absolute left-24 bottom-0 w-40 h-48 rounded-2xl overflow-hidden shadow-lg z-30 border-4 border-muted"
                    whileHover={{ y: -8 }}
                  >
                    <img src={coupleFishing} alt="Romantic fishing moment" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Find Your Date</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Connect with fellow fishing enthusiasts looking for love. 
                  Find someone who shares your passion for the water and early morning adventures.
                </p>
                <Link to="/auth?mode=signup" className="inline-flex items-center text-foreground font-medium transition-all duration-200 hover:translate-x-1 underline underline-offset-4">
                  Find your person
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </ScrollReveal>

            {/* Fishing Buddies Card */}
            <ScrollReveal delay={0.2} direction="up">
              <motion.div 
                className="bg-muted rounded-3xl p-8 md:p-12 cursor-pointer group h-full"
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative h-80 mb-8">
                  <motion.div 
                    className="absolute right-0 top-0 w-48 h-64 rounded-2xl overflow-hidden shadow-lg z-10"
                    whileHover={{ y: -4 }}
                  >
                    <img src={fishingBuddies1} alt="Group of friends fishing" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                  <motion.div 
                    className="absolute left-0 top-8 w-44 h-56 rounded-2xl overflow-hidden shadow-xl z-20"
                    whileHover={{ y: -6 }}
                  >
                    <img src={fishingBuddies2} alt="Friends celebrating a catch" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                  <motion.div 
                    className="absolute right-24 bottom-0 w-40 h-48 rounded-2xl overflow-hidden shadow-lg z-30 border-4 border-muted"
                    whileHover={{ y: -8 }}
                  >
                    <img src={heroFishing3} alt="Fishing adventure" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Find Fishing Buddies</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Not looking for romance? Find local fishing companions for your next adventure. 
                  Connect with anglers in your area who share your fishing style.
                </p>
                <Link to="/auth?mode=signup" className="inline-flex items-center text-foreground font-medium transition-all duration-200 hover:translate-x-1 underline underline-offset-4">
                  Find your crew
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" className="order-2 lg:order-1">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <img src={coupleFishing} alt="Happy couple who met on Find Fishing Dates" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </ScrollReveal>
            
            <div className="space-y-8 order-1 lg:order-2">
              <ScrollReveal delay={0.1}>
                <motion.span 
                  className="text-8xl font-serif text-foreground/20 block"
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  "
                </motion.span>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <blockquote className="text-3xl md:text-4xl font-medium text-foreground leading-snug -mt-12">
                  We met on Find Fishing Dates and now we spend every weekend on the water together. 
                  It's the best decision we ever made.
                </blockquote>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <div>
                  <p className="font-semibold text-foreground">Sarah & Michael</p>
                  <p className="text-muted-foreground">Married in 2023</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.4}>
                <Link to="/stories" className="mt-6 inline-block">
                  <Button variant="outline" className="btn-outline group">
                    Read More Stories
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 section-dark overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto text-center" scale={0.95}>
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to find your perfect fishing date?
          </motion.h2>
          <motion.p 
            className="text-xl text-background/70 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join thousands of fishing enthusiasts who have found love, friendship, 
            and their next fishing adventure on our platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/auth?mode=signup">
              <Button 
                size="lg" 
                className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-12 py-6 text-lg group"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </ScrollReveal>
      </section>

      {/* App Download Section */}
      <section className="py-24 px-6 border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" className="space-y-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Mobile App</span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Take the catch<br />with you
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Download our mobile app and start connecting with fishing enthusiasts 
                wherever you are. Swipe, match, and plan your next fishing date on the go.
              </p>
              
              {/* App Features */}
              <StaggerContainer className="space-y-3" staggerDelay={0.1}>
                <StaggerItem className="flex items-center gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span>Instant match notifications</span>
                </StaggerItem>
                <StaggerItem className="flex items-center gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span>Log catches anywhere</span>
                </StaggerItem>
                <StaggerItem className="flex items-center gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                  <span>Discover nearby fishing spots</span>
                </StaggerItem>
              </StaggerContainer>

              {/* App Store Buttons */}
              <motion.div 
                className="flex flex-wrap gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.button 
                  className="flex items-center gap-3 bg-foreground text-background px-6 py-4 rounded-xl group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Apple className="w-8 h-8" />
                  <div className="text-left">
                    <p className="text-xs opacity-80">Download on the</p>
                    <p className="text-lg font-semibold -mt-1">App Store</p>
                  </div>
                </motion.button>
                <motion.button 
                  className="flex items-center gap-3 bg-foreground text-background px-6 py-4 rounded-xl group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Smartphone className="w-8 h-8" />
                  <div className="text-left">
                    <p className="text-xs opacity-80">Get it on</p>
                    <p className="text-lg font-semibold -mt-1">Google Play</p>
                  </div>
                </motion.button>
              </motion.div>
            </ScrollReveal>
            
            {/* Phone Mockup */}
            <ScrollReveal direction="right" delay={0.2} className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow effect */}
                <motion.div 
                  className="absolute inset-0 bg-foreground/10 blur-3xl rounded-full scale-150"
                  animate={{ 
                    scale: [1.5, 1.6, 1.5],
                    opacity: [0.3, 0.4, 0.3]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Phone frame */}
                <motion.div 
                  className="relative w-72 h-[580px] bg-foreground rounded-[3rem] p-2 shadow-2xl"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Screen bezel */}
                  <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-foreground rounded-b-2xl z-10" />
                    
                    {/* App content mockup */}
                    <div className="w-full h-full flex flex-col">
                      {/* Status bar area */}
                      <div className="h-12" />
                      
                      {/* App header */}
                      <div className="px-6 py-4 border-b border-border">
                        <img src={logo} alt="Find Fishing Dates" className="h-8 w-auto" />
                      </div>
                      
                      {/* Profile card preview */}
                      <div className="flex-1 p-4">
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg relative">
                          <img src={heroFishing1} alt="Profile preview" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 to-transparent p-4">
                            <p className="text-background font-bold text-xl">Sarah, 28</p>
                            <p className="text-background/80 text-sm">Bass fishing enthusiast</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom nav mockup */}
                      <div className="h-20 border-t border-border flex items-center justify-around px-6">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                          <Heart className="w-6 h-6 text-background" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating elements */}
                <motion.div 
                  className="absolute -left-8 top-32 bg-background rounded-2xl p-4 shadow-xl"
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Fish className="w-8 h-8 text-foreground" />
                </motion.div>
                <motion.div 
                  className="absolute -right-8 bottom-40 bg-background rounded-2xl p-4 shadow-xl"
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    delay: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Heart className="w-8 h-8 text-foreground" />
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <motion.div 
    className="feature-card bg-background cursor-pointer group h-full"
    whileHover={{ scale: 1.03, y: -4 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div 
      className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-foreground mb-6"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ duration: 0.2 }}
    >
      {icon}
    </motion.div>
    <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

export default Index;
