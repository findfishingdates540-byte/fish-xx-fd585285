import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Check, X, Star, Shield, Lock, CreditCard, HelpCircle } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PlanType = 'angler' | 'trophy' | 'catch';

interface PricingPlan {
  id: PlanType;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: { name: string; included: boolean }[];
  popular?: boolean;
  buttonText: string;
  accountType: 'fishing' | 'both' | 'dating';
}

const plans: PricingPlan[] = [
  {
    id: 'angler',
    name: 'The Angler',
    tagline: 'For dedicated fishers',
    monthlyPrice: 9.99,
    annualPrice: 95.90,
    accountType: 'fishing',
    buttonText: 'Start Fishing',
    features: [
      { name: 'Interactive Fishing Maps', included: true },
      { name: 'Real-time Tide Charts', included: true },
      { name: 'Secret Spot Sharing', included: true },
      { name: 'Unlimited Catch Logbook', included: true },
      { name: 'Weather Alerts', included: true },
      { name: 'Dating Profiles', included: false },
      { name: 'See Who Liked You', included: false },
    ],
  },
  {
    id: 'trophy',
    name: 'The Trophy',
    tagline: 'Best of both worlds',
    monthlyPrice: 24.99,
    annualPrice: 239.90,
    accountType: 'both',
    buttonText: 'Get Trophy',
    popular: true,
    features: [
      { name: 'Everything in Angler', included: true },
      { name: 'Everything in Catch', included: true },
      { name: 'VIP 24/7 Support', included: true },
      { name: '3x Monthly Profile Boosts', included: true },
      { name: 'Exclusive Events Access', included: true },
      { name: 'Verified Badge', included: true },
      { name: 'Priority Matching', included: true },
    ],
  },
  {
    id: 'catch',
    name: 'The Catch',
    tagline: 'Find your fishing partner',
    monthlyPrice: 14.99,
    annualPrice: 143.90,
    accountType: 'dating',
    buttonText: 'Find Love',
    features: [
      { name: 'Unlimited Swipes', included: true },
      { name: 'See Who Liked You', included: true },
      { name: '5 Super Likes/Day', included: true },
      { name: 'Advanced Dating Filters', included: true },
      { name: 'Read Receipts', included: true },
      { name: 'Fishing Spot Maps', included: false },
      { name: 'Catch Logbook', included: false },
    ],
  },
];

const comparisonFeatures = [
  { name: 'Interactive Maps', angler: true, trophy: true, catch: false },
  { name: 'Real-time Tide Charts', angler: true, trophy: true, catch: false },
  { name: 'Secret Spot Sharing', angler: true, trophy: true, catch: false },
  { name: 'Catch Logbook', angler: true, trophy: true, catch: false },
  { name: 'Weather Alerts', angler: true, trophy: true, catch: false },
  { name: 'Unlimited Swipes', angler: false, trophy: true, catch: true },
  { name: 'See Who Liked You', angler: false, trophy: true, catch: true },
  { name: 'Super Likes', angler: false, trophy: true, catch: true },
  { name: 'Advanced Filters', angler: false, trophy: true, catch: true },
  { name: 'VIP Support', angler: false, trophy: true, catch: false },
  { name: 'Profile Boosts', angler: false, trophy: true, catch: false },
  { name: 'Verified Badge', angler: false, trophy: true, catch: false },
];

const faqItems = [
  {
    question: "Can I switch between plans?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the remaining credit will be applied to future billing cycles."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as PayPal. All payments are processed securely through Stripe."
  },
  {
    question: "Is there a free trial?",
    answer: "We offer a 7-day free trial for all new users. No credit card required to start. You can explore all features and decide which plan works best for you."
  },
  {
    question: "What happens if I cancel my subscription?",
    answer: "If you cancel, you'll continue to have access to your plan's features until the end of your current billing period. After that, your account will be downgraded to our free tier with limited features."
  },
  {
    question: "Can I get a refund?",
    answer: "Yes! We offer a 7-day money-back guarantee. If you're not satisfied with your subscription within the first 7 days, contact our support team for a full refund."
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! When you choose annual billing, you save 20% compared to monthly billing. That's like getting 2+ months free every year."
  },
  {
    question: "Can I pause my subscription?",
    answer: "Yes, you can pause your subscription for up to 3 months. During the pause, you won't be charged, but you'll also lose access to premium features until you resume."
  },
  {
    question: "Is my payment information secure?",
    answer: "Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant. We never store your full credit card details on our servers."
  },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSelectPlan = (plan: PricingPlan) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Navigate to custom checkout page with plan details
    const billing = isAnnual ? 'annual' : 'monthly';
    navigate(`/checkout?plan=${plan.id}&billing=${billing}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Choose Your <span className="text-primary">Catch</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Whether you're here to fish, find love, or both — we've got the perfect plan for you.
            </p>
          </ScrollReveal>
          
          {/* Billing Toggle */}
          <ScrollReveal delay={0.1}>
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annually
              </span>
              {isAnnual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/20 text-green-600 text-xs font-semibold px-2 py-1 rounded-full"
                >
                  Save 20%
                </motion.span>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <StaggerContainer className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <StaggerItem key={plan.id}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`relative rounded-2xl p-8 h-full flex flex-col ${
                  plan.popular
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/30'
                    : 'bg-card border border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-500 text-yellow-950 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-2xl font-bold mb-1 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {plan.tagline}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>
                      ${isAnnual ? (plan.annualPrice / 12).toFixed(2) : plan.monthlyPrice.toFixed(2)}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      /month
                    </span>
                  </div>
                  {isAnnual && (
                    <p className={`text-xs mt-1 ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      ${plan.annualPrice.toFixed(2)} billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-green-300' : 'text-green-500'}`} />
                      ) : (
                        <X className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-primary-foreground/40' : 'text-muted-foreground/50'}`} />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? plan.popular ? 'text-primary-foreground' : 'text-foreground'
                          : plan.popular ? 'text-primary-foreground/50' : 'text-muted-foreground/60'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  variant={plan.popular ? 'secondary' : 'default'}
                  className={`w-full py-6 text-base font-semibold ${
                    plan.popular 
                      ? 'bg-white text-primary hover:bg-white/90' 
                      : 'btn-primary'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Testimonial */}
      <section className="py-16 px-4 bg-muted/30">
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
              alt="Happy customer"
              className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/20"
            />
          </div>
          <blockquote className="text-xl md:text-2xl text-foreground font-medium mb-4 italic">
            "Best decision I ever made! Found my fishing partner AND my life partner. 
            The Trophy plan paid for itself on the first date."
          </blockquote>
          <cite className="text-muted-foreground not-italic">
            — Jake M., Trophy Member since 2023
          </cite>
          <div className="flex justify-center gap-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare All Features
            </h2>
            <p className="text-muted-foreground">
              See exactly what you get with each plan
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-foreground font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 text-foreground font-semibold">The Angler</th>
                    <th className="text-center py-4 px-4 text-primary font-semibold bg-primary/5 rounded-t-lg">The Trophy</th>
                    <th className="text-center py-4 px-4 text-foreground font-semibold">The Catch</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-4 px-4 text-foreground">{feature.name}</td>
                      <td className="text-center py-4 px-4">
                        {feature.angler ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-4 px-4 bg-primary/5">
                        {feature.trophy ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature.catch ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-6 px-4"></td>
                    <td className="text-center py-6 px-4">
                      <Button 
                        onClick={() => handleSelectPlan(plans[0])}
                        variant="outline" 
                        className="w-full"
                      >
                        Select
                      </Button>
                    </td>
                    <td className="text-center py-6 px-4 bg-primary/5 rounded-b-lg">
                      <Button 
                        onClick={() => handleSelectPlan(plans[1])}
                        className="w-full btn-primary"
                      >
                        Select
                      </Button>
                    </td>
                    <td className="text-center py-6 px-4">
                      <Button 
                        onClick={() => handleSelectPlan(plans[2])}
                        variant="outline" 
                        className="w-full"
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 border-t border-border">
        <ScrollReveal className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-6 h-6" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-6 h-6" />
              <span className="text-sm font-medium">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-6 h-6" />
              <span className="text-sm font-medium">Privacy Protected</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
              <span className="text-sm font-medium">Stripe Powered</span>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about billing and subscriptions
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
                >
                  <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="text-center mt-10">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're here to help.
            </p>
            <Link to="/help">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
