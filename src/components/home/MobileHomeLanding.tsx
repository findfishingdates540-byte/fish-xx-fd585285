import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Fish, Heart, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppPreloader } from '@/components/layout/AppPreloader';

import fishingPhoto1 from '@/assets/fishing-photo-1.jpg';
import fishingPhoto2 from '@/assets/fishing-photo-2.jpg';
import fishingPhoto3 from '@/assets/fishing-photo-3.jpg';
import fishingPhoto4 from '@/assets/fishing-photo-4.jpg';

const heroImages = [fishingPhoto1, fishingPhoto2, fishingPhoto3, fishingPhoto4];

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-2"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Fish. Connect. <span className="italic">Explore.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-1"
        >
          <p className="text-muted-foreground text-sm">The #1 App for Anglers.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center mb-6"
        >
          <p className="text-muted-foreground text-sm">
            Spots • Buddies • Catches • Feed
          </p>
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4 mb-6"
        >
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
            className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } })}
            className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Sign in with Apple"
          >
            <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </button>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: window.location.origin } })}
            className="w-16 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Sign in with Facebook"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </motion.div>

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
