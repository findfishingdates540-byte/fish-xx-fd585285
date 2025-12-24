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
      // Stripe Checkout can't be embedded in an iframe (e.g., Lovable preview).
      // Open a tab synchronously to avoid popup blockers, then navigate it once we have the URL.
      const isInIframe = window.self !== window.top;
      const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planId: options.planId,
          billing: options.billing,
          successUrl:
            options.successUrl ||
            `${window.location.origin}/payment-success?plan=${options.planId}&billing=${options.billing}`,
          cancelUrl: options.cancelUrl || `${window.location.origin}/pricing`,
        },
      });

      if (error) {
        if (pendingTab) pendingTab.close();
        throw new Error(error.message || "Failed to create checkout session");
      }

      const url = data?.url as string | undefined;
      if (!url) {
        if (pendingTab) pendingTab.close();
        throw new Error("No checkout URL returned");
      }

      if (pendingTab) {
        pendingTab.location.href = url;
        return;
      }

      window.location.href = url;
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
