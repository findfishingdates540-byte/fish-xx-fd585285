// Stripe configuration - key is fetched from Supabase secrets via edge function
// See supabase/functions/get-stripe-config for the implementation
// Updated: Forces cache invalidation
export const getStripePublishableKey = async (): Promise<string> => {
  const response = await fetch(
    "https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/get-stripe-config"
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch Stripe configuration");
  }
  
  const data = await response.json();
  return data.publishableKey;
};

export const isStripeTestMode = (key: string) => key.startsWith("pk_test_");
