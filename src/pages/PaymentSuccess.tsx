import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Download, MapPin, Heart, Ban, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import logo from '@/assets/logo.png';
import { toast } from 'sonner';
import { UpgradeCelebrationModal } from '@/components/upgrade';

interface PlanInfo {
  name: string;
  displayName: string;
  accountType: 'fishing' | 'both' | 'dating';
}

const plans: Record<string, PlanInfo> = {
  angler: { name: 'angler', displayName: 'The Angler', accountType: 'fishing' },
  trophy: { name: 'trophy', displayName: 'The Trophy', accountType: 'both' },
  catch: { name: 'catch', displayName: 'Dating Mode', accountType: 'dating' },
};

const fireConfetti = () => {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ['#22c55e', '#3b82f6', '#f59e0b'];

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
};

const generateReceiptContent = (
  planName: string,
  billingCycle: string,
  amount: string,
  transactionId: string,
  date: string
) => {
  return `
================================================================================
                            FISHX
                              PAYMENT RECEIPT
================================================================================

Transaction ID: #${transactionId}
Date: ${date}

--------------------------------------------------------------------------------
                              ORDER DETAILS
--------------------------------------------------------------------------------

Plan:           ${planName} (${billingCycle})
Amount Paid:    $${amount} USD

--------------------------------------------------------------------------------
                              PAYMENT STATUS
--------------------------------------------------------------------------------

Status:         ✓ PAYMENT SUCCESSFUL

--------------------------------------------------------------------------------

Thank you for subscribing to FishX!
Your premium features are now active.

For support, visit: https://fishx.app/help
To manage your subscription: https://fishx.app/app/settings

================================================================================
                    This receipt is for your records.
================================================================================
`;
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);
  
  const planId = searchParams.get('plan') || 'trophy';
  const billing = searchParams.get('billing') || 'annual';
  const amount = searchParams.get('amount') || '59.99';
  const isUpgrade = searchParams.get('upgrade') === 'true';
  
  const plan = plans[planId] || plans.trophy;
  const isAnnual = billing === 'annual';
  
  // Generate a fake transaction ID
  const [transactionId] = useState(() => `TXN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    // Only fire default confetti if not showing celebration modal
    if (!isUpgrade) {
      fireConfetti();
    }
  }, [isUpgrade]);

  const handleDownloadReceipt = () => {
    setIsDownloading(true);
    
    try {
      const receiptContent = generateReceiptContent(
        plan.displayName,
        isAnnual ? 'Annual' : 'Monthly',
        amount,
        transactionId,
        today
      );
      
      // Create blob and download
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FindFishingDates_Receipt_${transactionId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const features = [
    { icon: MapPin, label: 'Premium Spots', color: 'bg-primary/10 text-primary' },
    { icon: Heart, label: 'Unlimited Dates', color: 'bg-pink-100 text-pink-500' },
    { icon: Ban, label: 'Ad-Free', color: 'bg-amber-100 text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="FishX" className="h-8 w-auto" />
            <span className="font-bold text-lg text-foreground">FishX</span>
          </Link>
          <Link to="/app">
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/5">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-background rounded-3xl border border-border shadow-lg p-8 md:p-12"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Hook, Line, and Sinker!
            </h1>
            <p className="text-muted-foreground">
              Payment successful. You've officially caught the big one!
              <br />
              Your receipt has been sent to your email.
            </p>
          </motion.div>

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-muted/50 rounded-xl p-6 mb-8"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                  Plan
                </div>
                <span className="font-semibold text-foreground">
                  {plan.displayName} ({isAnnual ? 'Annual' : 'Monthly'})
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="w-6 text-center">$</span>
                  Amount Paid
                </div>
                <span className="font-semibold text-foreground">${amount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                  Transaction ID
                </div>
                <span className="font-mono text-muted-foreground">#{transactionId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Date
                </div>
                <span className="font-semibold text-foreground">{today}</span>
              </div>
            </div>
          </motion.div>

          {/* Premium Features */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <p className="text-xs font-semibold tracking-wider text-primary mb-6">
              YOUR PREMIUM CATCH INCLUDES
            </p>
            <div className="flex justify-center gap-8 md:gap-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{feature.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={() => navigate('/app')}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
            >
              Start Exploring
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Download Receipt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <button 
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? 'Downloading...' : 'Download Receipt'}
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Link to="/help" className="hover:text-primary transition-colors">
              Help Center
            </Link>
            <span>•</span>
            <Link to="/app/settings" className="hover:text-primary transition-colors">
              Manage Subscription
            </Link>
          </div>
        </div>
      </footer>

      {/* Celebration Modal for Upgrades */}
      <UpgradeCelebrationModal 
        isOpen={showCelebration && isUpgrade}
        onClose={() => {
          setShowCelebration(false);
          fireConfetti();
        }}
        planName={plan.displayName}
      />
    </div>
  );
}
