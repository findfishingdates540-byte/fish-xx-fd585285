import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Apple, Smartphone, Check, Trophy, Heart, Fish } from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';
import { FishXIcon } from '@/components/ui/fishx-icon';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import logo from '@/assets/logo.png';
import heroFishing1 from '@/assets/hero-fishing-1.jpg';
import heroFishing2 from '@/assets/hero-fishing-2.jpg';
import heroFishing3 from '@/assets/hero-fishing-3.jpg';
import fishingBuddies1 from '@/assets/fishing-buddies-1.jpg';
import fishingBuddies2 from '@/assets/fishing-buddies-2.jpg';
import fishingPhoto1 from '@/assets/fishing-photo-1.jpg';
import mobileAppScreen from '@/assets/mobile-app-screen.png';
import fishingPhoto2 from '@/assets/fishing-photo-2.jpg';
import fishingPhoto3 from '@/assets/fishing-photo-3.jpg';
import fishingPhoto4 from '@/assets/fishing-photo-4.jpg';
import fishingPhoto5 from '@/assets/fishing-photo-5.jpg';
import fishingPhoto6 from '@/assets/fishing-photo-6.jpg';
import fishingPhoto7 from '@/assets/fishing-photo-7.jpg';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { CountUp } from '@/components/ui/count-up';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHomeLanding from '@/components/home/MobileHomeLanding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppPreloader } from '@/components/layout/AppPreloader';

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
    return <AppPreloader />;
  }

  if (user && accountMode) {
    if (accountMode === 'dating') {
      return <Navigate to="/app/discover" replace />;
    } else {
      return <Navigate to="/app/feed" replace />;
    }
  }

  // Desktop/Tablet: Show full marketing homepage
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="FishX — Catch More Fish. Compete. Win Money."
        description="Find spots, log catches, join tournaments, and connect with anglers. The #1 social app for fishing."
        path="/"
      />
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
                Catch more fish.
                <br />
                <motion.span 
                  className="italic inline-block"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Compete.
                </motion.span>
                <br />
                Win money.
              </h1>
              <motion.p 
                className="text-xl text-muted-foreground max-w-lg leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Find better fishing spots, connect with other anglers, and compete in live tournaments from your phone.
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
                <img src={fishingPhoto1} alt="Woman with snook catch" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                className="absolute right-64 top-20 w-56 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-background"
                initial={{ opacity: 0, y: 80, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.05, zIndex: 40 }}
              >
                <img src={fishingPhoto2} alt="Woman with permit catch" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                className="absolute right-20 bottom-0 w-64 h-80 rounded-3xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.05, zIndex: 40 }}
              >
                <img src={fishingPhoto3} alt="Woman with largemouth bass" className="w-full h-full object-cover" />
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
                  <img src={fishingPhoto4} alt="Man with salmon catch" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
                <ScrollReveal delay={0.3} className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={fishingPhoto5} alt="Night fishing with trout" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
              </div>
              <div className="space-y-6 pt-12">
                <ScrollReveal delay={0.2} className="aspect-square rounded-3xl overflow-hidden shadow-lg">
                  <img src={fishingPhoto6} alt="Father and son with mahi-mahi" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </ScrollReveal>
                <ScrollReveal delay={0.4} className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img src={fishingPhoto7} alt="Marlin release" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
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
                icon={<FishXIcon name="search" size={48} />}
                title="Smart Matching"
                description="Find fishing buddies who match your style, experience level, and preferred species."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<FishXIcon name="catchlog" size={48} />}
                title="Catch Logs"
                description="Track and share your catches. Show off your skills and find partners who appreciate the sport."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<FishXIcon name="map" size={48} />}
                title="Fishing Spots"
                description="Discover and share the best local fishing spots with an interactive community map."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<FishXIcon name="team" size={48} />}
                title="Fishing Buddies"
                description="Not looking for romance? Find local fishing companions for your next adventure."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<FishXIcon name="chat" size={48} />}
                title="Real-time Chat"
                description="Message your fishing buddies instantly and plan your next trip together."
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={<FishXIcon name="achievement" size={48} />}
                title="Premium Features"
                description="Unlock unlimited connections, priority discovery, and exclusive fishing spot data."
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Compete & Win Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="bg-foreground text-background rounded-3xl p-12 md:p-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span className="text-sm font-medium tracking-widest uppercase">Competitions</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Compete & Win Real Prizes
                  </h2>
                  <p className="text-xl text-background/70 leading-relaxed">
                    Enter photo challenges and fishing tournaments for as little as $5. 
                    Compete against anglers nationwide and win cash prizes, gift cards, and bragging rights.
                  </p>
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold rounded-full px-10 py-6 mt-[30px]">
                      Join a Challenge
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                    <Check className="w-6 h-6 flex-shrink-0" />
                    <span className="text-lg">Photo challenges — community votes pick the winner</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                    <Check className="w-6 h-6 flex-shrink-0" />
                    <span className="text-lg">Fishing tournaments — bracket-style competitions</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                    <Check className="w-6 h-6 flex-shrink-0" />
                    <span className="text-lg">Team competitions — form a crew and dominate</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/10">
                    <Check className="w-6 h-6 flex-shrink-0" />
                    <span className="text-lg">Entry from just $5 — winner takes the pot</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Find Your Crew Section */}
      <section className="py-32 px-6 overflow-hidden relative">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <ScrollReveal delay={0} direction="up">
            <motion.div 
              className="relative rounded-[2rem] overflow-hidden cursor-pointer group"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Background photo collage */}
              <div className="relative grid grid-cols-3 gap-1 h-[420px] md:h-[480px]">
                <div className="overflow-hidden">
                  <motion.img 
                    src={fishingPhoto4} 
                    alt="Angler with salmon catch" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="overflow-hidden">
                  <motion.img 
                    src={fishingPhoto6} 
                    alt="Father and son fishing together" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 delay-75"
                  />
                </div>
                <div className="overflow-hidden">
                  <motion.img 
                    src={fishingPhoto5} 
                    alt="Night fishing adventure" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 delay-150"
                  />
                </div>
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              </div>

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
                <motion.p 
                  className="text-white/60 text-sm font-medium tracking-[0.2em] uppercase mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Better together
                </motion.p>
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
                  Find Your<br />Fishing Crew
                </h3>
                <p className="text-white/70 text-lg md:text-xl max-w-lg mb-8 leading-relaxed">
                  Connect with local anglers who share your style. Plan trips, share spots, and build your circle.
                </p>
                <Link 
                  to="/auth?mode=signup" 
                  className="inline-flex items-center gap-3 bg-white text-foreground font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:bg-white/90 hover:gap-4 shadow-lg"
                >
                  Get started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" className="order-2 lg:order-1">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <img src={fishingPhoto2} alt="Happy anglers on FishX" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
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
                  FishX changed everything for us. We found the best fishing spots, planned amazing trips, 
                  and built friendships that last a lifetime.
                </blockquote>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <div>
                  <p className="font-semibold text-foreground">Jake & Friends</p>
                  <p className="text-muted-foreground">FishX members since 2023</p>
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
            Ready to catch more fish, compete, and win money?
          </motion.h2>
          <motion.p 
            className="text-xl text-background/70 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join thousands of anglers who are discovering spots, logging catches, 
            and connecting with fishing buddies on FishX.
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
                Download our mobile app and start connecting with anglers 
                wherever you are. Discover spots, log catches, and plan trips on the go.
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
                <motion.a
                  href="/downloads/Fish-X.apk"
                  download="Fish-X.apk"
                  className="flex items-center gap-3 bg-foreground text-background px-6 py-4 rounded-xl group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Smartphone className="w-8 h-8" />
                  <div className="text-left">
                    <p className="text-xs opacity-80">Get it on</p>
                    <p className="text-lg font-semibold -mt-1">Google Play</p>
                  </div>
                </motion.a>
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

                    {/* App screenshot */}
                    <img
                      src={mobileAppScreen}
                      alt="FishX mobile app preview"
                      className="w-full h-full object-cover"
                    />
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
