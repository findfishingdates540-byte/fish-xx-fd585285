import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';

const MobileHomeLanding = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <img src={logo} alt="Find Fishing Dates" className="w-24 h-24 rounded-2xl shadow-lg animate-pulse" />
        </motion.div>
      </div>
    );
  }

  // Redirect authenticated users to the app
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="mb-8"
      >
        <img src={logo} alt="Find Fishing Dates" className="w-28 h-28 rounded-2xl shadow-lg" />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold text-foreground mb-3">Find Fishing Dates</h1>
        <p className="text-muted-foreground text-lg">
          Connect with fellow fishing enthusiasts
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full space-y-4 max-w-sm"
      >
        <Link to="/auth?mode=signup" className="block w-full">
          <Button className="w-full btn-primary py-6 text-lg font-semibold">
            Get Started
          </Button>
        </Link>
        <Link to="/auth?mode=signin" className="block w-full">
          <Button variant="outline" className="w-full btn-outline py-6 text-lg font-semibold">
            Sign In
          </Button>
        </Link>
      </motion.div>

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-auto pt-12 pb-8 flex gap-6 text-sm text-muted-foreground"
      >
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
      </motion.div>
    </div>
  );
};

export default MobileHomeLanding;
