import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Fish, Heart, Globe, Smartphone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import heroFishing1 from '@/assets/hero-fishing-1.jpg';
import heroFishing2 from '@/assets/hero-fishing-2.jpg';
import heroFishing3 from '@/assets/hero-fishing-3.jpg';
import fishingPhoto1 from '@/assets/fishing-photo-1.jpg';
import fishingPhoto2 from '@/assets/fishing-photo-2.jpg';
import fishingPhoto3 from '@/assets/fishing-photo-3.jpg';
import fishingPhoto4 from '@/assets/fishing-photo-4.jpg';

const heroImages = [heroFishing1, heroFishing2, heroFishing3];

const MobileHomeLanding = () => {
  const { user, loading } = useAuth();
  const [accountMode, setAccountMode] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);

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

  // Auto-rotate hero images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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

  if (user && accountMode) {
    if (accountMode === 'dating') {
      return <Navigate to="/app/discover" replace />;
    } else {
      return <Navigate to="/app/feed" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Carousel */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentHero}
              src={heroImages[currentHero]}
              alt="Fishing adventure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover block absolute inset-0"
            />
          </AnimatePresence>
        </div>
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

        {/* Brand Badge */}
        <div className="absolute top-4 left-4 bg-foreground text-background px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <Fish className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">FishX</span>
        </div>

        {/* Carousel Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentHero(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentHero ? 'w-4 bg-foreground' : 'w-1.5 bg-foreground/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Floating Fish Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: 0.3, duration: 0.3 },
            scale: { delay: 0.3, type: "spring", stiffness: 200 },
            y: { delay: 0.6, duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-6 left-4 bg-background rounded-full p-2.5 shadow-xl"
        >
          <Fish className="w-5 h-5 text-foreground" />
        </motion.div>

        {/* Floating Heart Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: 0.4, duration: 0.3 },
            scale: { delay: 0.4, type: "spring", stiffness: 200 },
            y: { delay: 0.8, duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-10 right-4 bg-background rounded-full p-2.5 shadow-xl"
        >
          <Heart className="w-5 h-5 text-foreground fill-foreground" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-8 flex flex-col">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-2"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Fish. Connect.
          </h1>
          <h1 className="text-2xl font-bold italic text-foreground">
            Explore.
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-1"
        >
          <p className="text-muted-foreground text-sm">The #1 App for Anglers.</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center mb-5"
        >
          <p className="text-muted-foreground text-sm">
            Spots • Buddies • Catches • Feed
          </p>
        </motion.div>

        {/* Community Photos Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="grid grid-cols-4 gap-1.5 mb-5 rounded-xl overflow-hidden"
        >
          {[fishingPhoto1, fishingPhoto2, fishingPhoto3, fishingPhoto4].map((photo, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-lg">
              <img
                src={photo}
                alt={`Fishing community ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-6"
        >
          <Link to="/auth?mode=signup" className="block">
            <Button className="w-full bg-foreground text-background hover:bg-foreground/90 h-14 text-base font-semibold rounded-2xl">
              Sign Up Free
            </Button>
          </Link>
          <Link to="/auth?mode=signin" className="block">
            <Button
              variant="ghost"
              className="w-full bg-muted hover:bg-muted/80 text-foreground h-14 text-base font-semibold rounded-2xl"
            >
              Log In
            </Button>
          </Link>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Social Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4 mb-6"
        >
          <button className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <Globe className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <Smartphone className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <Mail className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-xs text-muted-foreground mt-auto"
        >
          By continuing, you agree to our{' '}
          <Link to="/terms" className="font-semibold text-foreground underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="font-semibold text-foreground underline">Privacy Policy</Link>.
        </motion.p>
      </div>
    </div>
  );
};

export default MobileHomeLanding;
