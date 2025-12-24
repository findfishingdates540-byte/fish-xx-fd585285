// Stripe configuration
// Publishable keys are safe for frontend use

export const STRIPE_PUBLISHABLE_KEY = "pk_test_51SgUmJGOepGHxjg7O9IbMh0cfmdBZcPRdkJCreM5TlISAkdMlw6uyrvjH1LKel31bSaNWsUq2zcxK3BeMKkQLhyB00Z8u1YaGC";

// This is a test/sandbox key - replace with live key for production
export const isStripeTestMode = STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_");
