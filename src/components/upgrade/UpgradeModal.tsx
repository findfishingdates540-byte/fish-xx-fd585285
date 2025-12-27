import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Fish, MapPin, Users, Calendar, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const fishingFeatures = [
  { icon: MapPin, label: 'Interactive Fishing Maps' },
  { icon: Fish, label: 'Secret Fishing Spots' },
  { icon: Users, label: 'Fishing Buddies' },
  { icon: Calendar, label: 'Trip Planning' },
];

export function UpgradeModal({ isOpen, onClose, featureName = 'fishing features' }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Unlock {featureName}</h2>
                    <p className="text-sm opacity-90">Upgrade to access fishing features</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <p className="text-muted-foreground mb-6">
                  Your current Dating account doesn't include fishing features. 
                  Upgrade to unlock everything Find Fishing Dates has to offer!
                </p>
                
                {/* Features grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {fishingFeatures.map((feature) => (
                    <div
                      key={feature.label}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <feature.icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Pricing options */}
                <div className="space-y-3 mb-6">
                  <Link to="/pricing" onClick={onClose} className="block">
                    <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">The Trophy</span>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          BEST VALUE
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fishing + Dating features combined
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        $19.99<span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                  </Link>
                  
                  <Link to="/pricing" onClick={onClose} className="block">
                    <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">The Angler</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fishing features only
                      </p>
                      <p className="text-lg font-bold text-foreground mt-2">
                        $9.99<span className="text-sm font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                  </Link>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Maybe Later
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/pricing" onClick={onClose}>
                      View Plans
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
