import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckoutOptions {
  planId: string;
  billing: "monthly" | "annual";
  successUrl?: string;
  cancelUrl?: string;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (options: CheckoutOptions) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planId: options.planId,
          billing: options.billing,
          successUrl: options.successUrl || `${window.location.origin}/payment-success?plan=${options.planId}&billing=${options.billing}`,
          cancelUrl: options.cancelUrl || `${window.location.origin}/pricing`,
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        throw new Error(error.message || "Failed to create checkout session");
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading,
  };
}
