import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Star, MapPin, Heart, Fish, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface UpgradeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

const fireConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};

export function UpgradeCelebrationModal({ isOpen, onClose, planName }: UpgradeCelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen]);

  const isCombo = planName.toLowerCase().includes('trophy') || planName.toLowerCase().includes('combo');
  
  const features = isCombo ? [
    { icon: MapPin, label: 'Premium Fishing Maps', color: 'text-blue-500' },
    { icon: Heart, label: 'Unlimited Dating', color: 'text-pink-500' },
    { icon: Fish, label: 'Secret Fishing Spots', color: 'text-primary' },
    { icon: Sparkles, label: 'VIP Support', color: 'text-amber-500' },
  ] : [
    { icon: MapPin, label: 'Interactive Maps', color: 'text-blue-500' },
    { icon: Fish, label: 'Fishing Spots', color: 'text-primary' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-background rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Celebration Header */}
              <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                    <Star className="h-10 w-10 text-white" fill="currentColor" />
                  </div>
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    🎉 Welcome to {planName}!
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/80"
                  >
                    Your account has been upgraded successfully
                  </motion.p>
                </motion.div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
                    <Check className="h-4 w-4" />
                    Account mode updated automatically
                  </div>
                  <p className="text-muted-foreground">
                    You now have access to all your new features. Start exploring!
                  </p>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <feature.icon className={`h-4 w-4 ${feature.color} flex-shrink-0`} />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button onClick={onClose} className="w-full" size="lg">
                    Start Exploring
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
