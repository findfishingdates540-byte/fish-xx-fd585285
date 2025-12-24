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

      const { data, error } = await supabase.functions.invoke("create-customer-portal-session", {
        body: { 
          returnUrl: returnUrl || `${window.location.origin}/app/settings` 
        },
      });

      if (error) {
        console.error("Portal error:", error);
        toast.error(error.message || "Failed to open billing portal");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create portal session");
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
