import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Heart, Anchor, X, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/contexts/ActiveModeContext';

const modeOptions = [
  { value: 'unified' as ActiveMode, icon: LayoutDashboard, label: 'Combo', color: 'bg-primary' },
  { value: 'dating' as ActiveMode, icon: Heart, label: 'Dating', color: 'bg-pink-500' },
  { value: 'fishing' as ActiveMode, icon: Anchor, label: 'Fishing', color: 'bg-blue-500' },
];

export function MobileModeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMode, setActiveMode, isComboUser, isPremium, premiumExpiresAt } = useActiveMode();

  // Check if premium is expired
  const isPremiumExpired = premiumExpiresAt 
    ? new Date(premiumExpiresAt).getTime() < Date.now() 
    : false;

  // Hide on chat/messages pages to avoid blocking the send button
  const isChatPage = location.pathname.includes('/buddy-chat/') || location.pathname.includes('/chat/') || location.pathname.includes('/messages');
  
  // Only show for combo users who have active premium, and not on chat pages
  // Non-combo users (dating-only, fishing-only) should NOT see the mode switcher
  if (!isComboUser || !isPremium || isPremiumExpired || isChatPage) {
    return null;
  }

  // For combo users, this just switches their view preference (not account type)
  const handleModeSwitch = (mode: ActiveMode) => {
    setActiveMode(mode);
    setIsOpen(false);
    
    // Navigate to the appropriate home page for the selected mode
    switch (mode) {
      case 'dating':
        navigate('/app/discover');
        break;
      case 'fishing':
        navigate('/app/spots');
        break;
      case 'unified':
      default:
        navigate('/app/dashboard');
        break;
    }
  };

  const currentMode = modeOptions.find(m => m.value === activeMode) || modeOptions[0];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container - positioned above bottom nav */}
      <div className="fixed bottom-20 right-4 z-[70] md:hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
            >
              {modeOptions.map((mode, index) => (
                <motion.button
                  key={mode.value}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleModeSwitch(mode.value)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all",
                    activeMode === mode.value
                      ? `${mode.color} text-white`
                      : "bg-background text-foreground border border-border hover:bg-muted"
                  )}
                >
                  <mode.icon className="h-5 w-5" />
                  <span className="font-medium text-sm whitespace-nowrap">{mode.label} Mode</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
            isOpen
              ? "bg-muted text-foreground rotate-0"
              : `${currentMode.color} text-white`
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="switch"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ArrowLeftRight className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
