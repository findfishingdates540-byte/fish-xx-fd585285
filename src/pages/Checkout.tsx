import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Lock, Shield, Loader2, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

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

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#666EE8',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

interface CheckoutFormProps {
  planId: string;
  billing: string;
  plan: PlanInfo;
  price: number;
  total: number;
  isAnnual: boolean;
}

function CheckoutForm({ planId, billing, plan, price, total, isAnnual }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nameOnCard: '',
    streetAddress: '',
    city: '',
    zipCode: '',
  });

  // Fetch payment intent on mount
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      if (!user) return;
      
      try {
        setIsLoadingIntent(true);
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: { planId, billing },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret returned');
        }
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        toast({
          title: "Error",
          description: err.message || "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingIntent(false);
      }
    };

    fetchPaymentIntent();
  }, [user, planId, billing, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast({
        title: "Not ready",
        description: "Payment system is still loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to complete the purchase.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Error",
        description: "Card element not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.nameOnCard,
            address: {
              line1: formData.streetAddress,
              city: formData.city,
              postal_code: formData.zipCode,
            },
          },
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Activate the subscription
        const { data, error } = await supabase.functions.invoke('create-subscription', {
          body: {
            paymentIntentId: paymentIntent.id,
            planId,
            billing,
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to activate subscription');
        }

        toast({
          title: "Payment successful!",
          description: "Your subscription has been activated.",
        });

        // Redirect to success page
        navigate(`/payment-success?plan=${planId}&billing=${billing}&amount=${total.toFixed(2)}`);
      } else {
        throw new Error('Payment was not completed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: "Payment failed",
        description: err.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tax = 0;

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

            {isLoadingIntent ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Initializing payment...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Payment Method Header */}
                <div className="border-b border-border pb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Credit or Debit Card</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Stripe Card Element */}
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Card Details
                    </Label>
                    <div className="p-4 h-12 flex items-center bg-muted/50 border border-border rounded-md">
                      <CardElement 
                        options={cardElementOptions} 
                        onChange={handleCardChange}
                        className="w-full"
                      />
                    </div>
                    {cardError && (
                      <p className="text-sm text-destructive">{cardError}</p>
                    )}
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

                {/* Security Notice */}
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>
                    Your payment is secured with Stripe. We never store your card details.
                  </span>
                </div>

                {/* Submit Button - Mobile Only */}
                <div className="lg:hidden">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={isProcessing || !stripe || !clientSecret}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Lock className="w-5 h-5 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                  </Button>
                </div>
              </form>
            )}
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

              {/* Submit Button - Desktop Only */}
              <div className="hidden lg:block">
                <Button
                  onClick={handleSubmit}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isProcessing || isLoadingIntent || !stripe || !clientSecret}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-5 h-5 mr-2" />
                  )}
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>

              {/* Security badges */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs">SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Money-back guarantee */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              7-day money-back guarantee. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/help" className="hover:text-foreground transition-colors">Need Help?</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const planId = searchParams.get('plan') || 'trophy';
  const billing = searchParams.get('billing') || 'monthly';
  const isAnnual = billing === 'annual';
  
  const plan = plans[planId] || plans.trophy;
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const total = price;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        planId={planId}
        billing={billing}
        plan={plan}
        price={price}
        total={total}
        isAnnual={isAnnual}
      />
    </Elements>
  );
}
