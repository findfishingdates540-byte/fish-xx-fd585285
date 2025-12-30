import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Fish, Heart, Globe, Smartphone, Mail } from 'lucide-react';
import coupleFishing from '@/assets/couple-fishing.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MobileHomeLanding = () => {
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
    } else if (accountMode === 'fishing') {
      return <Navigate to="/app/spots" replace />;
    } else {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img 
            src={coupleFishing} 
            alt="Couple fishing together" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Brand Badge */}
        <div className="absolute top-4 left-4 bg-foreground text-background px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <Fish className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">Find Fishing Dates</span>
        </div>
        
        {/* Floating Fish Icon */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="absolute bottom-6 left-4 bg-background rounded-full p-2.5 shadow-xl"
        >
          <Fish className="w-5 h-5 text-foreground" />
        </motion.div>
        
        {/* Floating Heart Icon */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
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
            Catch feelings,
          </h1>
          <h1 className="text-2xl font-bold italic text-foreground">
            catch fish.
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
          className="text-center mb-6"
        >
          <p className="text-muted-foreground text-sm">
            Dating • Fishing Spots • Combo Mode
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
