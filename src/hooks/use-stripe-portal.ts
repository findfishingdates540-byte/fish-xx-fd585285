import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStripePortal = () => {
  const [isLoading, setIsLoading] = useState(false);

  const openPortal = async (returnUrl?: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to manage your subscription");
        return;
      }

      // Stripe portal can't be embedded in an iframe (e.g., Lovable preview).
      // Open a tab synchronously to avoid popup blockers.
      const isInIframe = window.self !== window.top;
      const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;

      const { data, error } = await supabase.functions.invoke("create-customer-portal-session", {
        body: { 
          returnUrl: returnUrl || `${window.location.origin}/app/settings` 
        },
      });

      if (error) {
        console.error("Portal error:", error);
        if (pendingTab) pendingTab.close();
        toast.error(error.message || "Failed to open billing portal");
        return;
      }

      const url = data?.url as string | undefined;
      if (!url) {
        if (pendingTab) pendingTab.close();
        toast.error("Failed to create portal session");
        return;
      }

      if (pendingTab) {
        pendingTab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("An error occurred while opening billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  return { openPortal, isLoading };
};
