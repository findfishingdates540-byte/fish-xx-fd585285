import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, ArrowRight, Users, Compass, MessageCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import logoImage from "@/assets/logo.png";

const fireConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ['#000000', '#333333', '#666666', '#999999'];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors,
    });
  }, 200);
};

type AccountMode = 'dating' | 'fishing' | 'both';

// Mode-specific content configuration
const modeContent = {
  dating: {
    title: "You're Ready to Mingle!",
    highlight: "Ready to Mingle",
    emoji: "💕",
    description: "Your dating profile is all set! Start swiping to find your perfect match.",
    progressText: "Profile complete!",
    ctaText: "Start Swiping",
    ctaRoute: "/app/discover",
    nextSteps: [
      { icon: Heart, label: "Browse Matches", description: "Discover singles who share your interests" },
      { icon: MessageCircle, label: "Start Chatting", description: "Connect with your matches instantly" },
      { icon: Users, label: "Find Friends", description: "Meet people looking for friendship too" },
    ],
  },
  fishing: {
    title: "You're Hooked Up!",
    highlight: "Hooked Up",
    emoji: "🐟",
    description: "Welcome to the community! Start exploring fishing spots and connecting with fellow anglers.",
    progressText: "Your tackle box is packed!",
    ctaText: "Explore Spots",
    ctaRoute: "/app/spots",
    nextSteps: [
      { icon: MapPin, label: "Find Spots", description: "Discover the best fishing locations nearby" },
      { icon: Compass, label: "Log Catches", description: "Track your catches and share your wins" },
      { icon: Users, label: "Find Buddies", description: "Connect with fishing buddies in your area" },
    ],
  },
  both: {
    title: "You're Hooked Up!",
    highlight: "Hooked Up",
    emoji: "🎣",
    description: "Your profile is rigged and ready! Find love on the water or your next fishing buddy.",
    progressText: "Your tackle box is packed!",
    ctaText: "Start Exploring",
    ctaRoute: "/app/discover",
    nextSteps: [
      { icon: Heart, label: "Find Matches", description: "Meet singles who love fishing as much as you" },
      { icon: MapPin, label: "Explore Spots", description: "Discover the best fishing spots nearby" },
      { icon: Users, label: "Connect", description: "Chat with matches and fishing buddies" },
    ],
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function OnboardingSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [accountMode, setAccountMode] = useState<AccountMode>('both');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fireConfetti();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase
          .from('profiles')
          .select('account_mode, display_name, is_premium')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'moderator'])
          .maybeSingle(),
      ]);

      if (profile) {
        setAccountMode(profile.account_mode || 'both');
        setDisplayName(profile.display_name || '');
        // Note: Users now get a 30-day free trial, no pricing redirect needed
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const content = modeContent[accountMode];

  const handleContinue = () => {
    navigate(content.ctaRoute);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <motion.header 
        className="bg-background border-b border-border px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="FishX" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-bold text-lg text-foreground">FishX</span>
          </div>
          {displayName && (
            <div className="text-right">
              <p className="font-semibold text-foreground text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{accountMode} Mode</p>
            </div>
          )}
        </div>
      </motion.header>

      <motion.main 
        className="max-w-4xl mx-auto px-6 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Progress Card */}
        <motion.div 
          className="bg-background rounded-2xl p-6 border border-border"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-semibold text-foreground">Onboarding Complete</h2>
              <p className="text-sm text-muted-foreground">{content.progressText}</p>
            </div>
            <motion.span 
              className="text-primary font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              100%
            </motion.span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Success Hero */}
        <motion.div 
          className="bg-background rounded-2xl p-8 border border-border overflow-hidden relative"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-foreground"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                You&apos;re <span className="text-primary">{content.highlight}!</span>
              </motion.h1>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {content.description}
              </motion.p>
              <motion.div 
                className="flex gap-4 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleContinue}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {content.ctaText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/profile')}
                  >
                    View Profile
                  </Button>
                </motion.div>
              </motion.div>
            </div>
            <motion.div 
              className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-primary/5 border-4 border-primary/20 flex items-center justify-center overflow-hidden"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            >
              <motion.div 
                className="text-8xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                {content.emoji}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div className="space-y-4" variants={itemVariants}>
          <div>
            <h2 className="text-xl font-bold text-foreground">What You Can Do</h2>
            <p className="text-muted-foreground">
              Here&apos;s how to get started with your {accountMode === 'both' ? 'combo' : accountMode} experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.nextSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.label}
                  className="p-6 rounded-2xl border border-border bg-background"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Edit Profile Link */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={() => navigate('/app/profile/edit')}
            className="text-sm text-primary hover:underline"
          >
            Need to change something? Edit Profile
          </button>
        </motion.div>
      </motion.main>
    </div>
  );
}