import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Lock, Shield, Loader2, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

type PaymentMethod = 'card' | 'paypal' | 'google';

interface PlanInfo {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
}

const plans: Record<string, PlanInfo> = {
  angler: {
    id: 'angler',
    name: "The Angler",
    description: "Fishing Spots Access",
    monthlyPrice: 9.99,
    annualPrice: 95.90,
  },
  trophy: {
    id: 'trophy',
    name: "Captain's Combo",
    description: "Dating + Fishing Spots",
    monthlyPrice: 24.99,
    annualPrice: 239.90,
  },
  catch: {
    id: 'catch',
    name: "The Catch",
    description: "Dating Features",
    monthlyPrice: 14.99,
    annualPrice: 143.90,
  },
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const planId = searchParams.get('plan') || 'trophy';
  const billing = searchParams.get('billing') || 'monthly';
  const isAnnual = billing === 'annual';
  
  const plan = plans[planId] || plans.trophy;
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const tax = 0;
  const total = price + tax;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    streetAddress: '',
    city: '',
    zipCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted.slice(0, 19) }));
      return;
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        setFormData(prev => ({ ...prev, [name]: `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` }));
      } else {
        setFormData(prev => ({ ...prev, [name]: cleaned }));
      }
      return;
    }
    
    // Limit CVV
    if (name === 'cvv') {
      setFormData(prev => ({ ...prev, [name]: value.slice(0, 4) }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to complete the purchase.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing (replace with actual Stripe integration)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update user's premium status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        premium_expires_at: new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    // Redirect to payment success page
    navigate(`/payment-success?plan=${planId}&billing=${billing}&amount=${total.toFixed(2)}`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Find Fishing Dates" className="h-8 w-auto" />
            <span className="font-bold text-lg text-foreground">FindFish Date</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-full px-4 py-2">
            <Lock className="w-4 h-4" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-12">
          {/* Left - Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Payment Details</h1>
              <p className="text-muted-foreground">
                Complete your subscription to unlock {plan.name}.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Payment Method Tabs */}
              <div className="border-b border-border">
                <div className="flex gap-8">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                      paymentMethod === 'card' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                      paymentMethod === 'paypal' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                    </svg>
                    PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('google')}
                    className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                      paymentMethod === 'google' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Google Pay
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-6">
                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-foreground font-medium">
                      Card Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="pr-12 h-12 bg-muted/50 border-border"
                        required
                      />
                      <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate" className="text-foreground font-medium">
                        Expiry Date
                      </Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM / YY"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="h-12 bg-muted/50 border-border"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-foreground font-medium flex items-center gap-1">
                        CVV
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </Label>
                      <Input
                        id="cvv"
                        name="cvv"
                        type="password"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="h-12 bg-muted/50 border-border"
                        required
                      />
                    </div>
                  </div>

                  {/* Name on Card */}
                  <div className="space-y-2">
                    <Label htmlFor="nameOnCard" className="text-foreground font-medium">
                      Name on Card
                    </Label>
                    <Input
                      id="nameOnCard"
                      name="nameOnCard"
                      placeholder="J. Fisherman"
                      value={formData.nameOnCard}
                      onChange={handleInputChange}
                      className="h-12 bg-muted/50 border-border"
                      required
                    />
                  </div>

                  {/* Billing Information */}
                  <div className="pt-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">Billing Information</h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress" className="text-foreground font-medium">
                          Street Address
                        </Label>
                        <Input
                          id="streetAddress"
                          name="streetAddress"
                          placeholder="123 Ocean View Dr"
                          value={formData.streetAddress}
                          onChange={handleInputChange}
                          className="h-12 bg-muted/50 border-border"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-foreground font-medium">
                            City
                          </Label>
                          <Input
                            id="city"
                            name="city"
                            placeholder="Portsmouth"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="h-12 bg-muted/50 border-border"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-foreground font-medium">
                            ZIP Code
                          </Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            placeholder="00000"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="h-12 bg-muted/50 border-border"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    You will be redirected to PayPal to complete your purchase.
                  </p>
                  <Button type="submit" className="btn-primary px-8" disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Continue to PayPal
                  </Button>
                </div>
              )}

              {paymentMethod === 'google' && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    You will be redirected to Google Pay to complete your purchase.
                  </p>
                  <Button type="submit" className="btn-primary px-8" disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Continue to Google Pay
                  </Button>
                </div>
              )}
            </form>
          </motion.div>

          {/* Right - Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-8 h-fit"
          >
            <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

              {/* Plan Info */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {isAnnual ? 'Annual Plan' : 'Monthly Plan'}
                  </span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span className="text-foreground">${tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total due today</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">${total.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground ml-1">USD</span>
                  </div>
                </div>
              </div>

              {/* Submit Button (for card payment) */}
              {paymentMethod === 'card' && (
                <Button
                  onClick={handleSubmit}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-5 h-5 mr-2" />
                  )}
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground mt-4">
                100% Secure transaction. Cancel anytime from your account settings.
              </p>

              {/* Security Badges */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  SSL Secure
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  256-bit Encryption
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <Link to="/help" className="text-primary hover:underline">
              Refund Policy
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} FindFish Date. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
