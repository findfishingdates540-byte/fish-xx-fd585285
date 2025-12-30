import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Fish, Heart } from 'lucide-react';
import coupleFishing from '@/assets/couple-fishing.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MobileHomeLanding = () => {
  const { user, loading } = useAuth();
  const [accountMode, setAccountMode] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user's account mode when authenticated
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

  // Show loading state while checking auth or fetching profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <Fish className="w-12 h-12 text-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </motion.div>
      </div>
    );
  }

  // Redirect authenticated users based on account mode
  if (user && accountMode) {
    if (accountMode === 'dating') {
      return <Navigate to="/app/discover" replace />;
    } else if (accountMode === 'fishing') {
      return <Navigate to="/app/spots" replace />;
    } else {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Image Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mx-4 mt-4"
      >
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
          <img 
            src={coupleFishing} 
            alt="Couple fishing together" 
            className="w-full h-full object-cover"
          />
          
          {/* Brand badge */}
          <div className="absolute top-4 left-4 bg-foreground/90 text-background px-3 py-1.5 rounded-full flex items-center gap-2">
            <Fish className="w-4 h-4" />
            <span className="text-sm font-semibold">FindFish</span>
          </div>
          
          {/* Floating icons */}
          <motion.div 
            className="absolute bottom-8 left-4 bg-background rounded-full p-2 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <Fish className="w-5 h-5 text-foreground" />
          </motion.div>
          
          <motion.div 
            className="absolute bottom-12 right-4 bg-background rounded-full p-2 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Heart className="w-5 h-5 text-foreground fill-foreground" />
          </motion.div>
        </div>
      </motion.div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-4"
        >
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            Catch feelings,
            <br />
            <span className="italic">catch fish.</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-6"
        >
          <p className="text-muted-foreground">The #1 App for Anglers.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Dating • Fishing Spots • Combo Mode
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3 mb-6"
        >
          <Link to="/auth?mode=signup" className="block w-full">
            <Button className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-base font-semibold rounded-xl">
              Sign Up Free
            </Button>
          </Link>
          <Link to="/auth?mode=signin" className="block w-full">
            <Button 
              variant="secondary" 
              className="w-full bg-muted text-foreground hover:bg-muted/80 py-6 text-base font-semibold rounded-xl border-0"
            >
              Log In
            </Button>
          </Link>
        </motion.div>

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-auto"
        >
          By continuing, you agree to our{' '}
          <Link to="/terms" className="underline font-medium text-foreground">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline font-medium text-foreground">Privacy Policy</Link>.
        </motion.p>
      </div>
    </div>
  );
};

export default MobileHomeLanding;
