import { loadStripe, Stripe } from "@stripe/stripe-js";

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default getStripe;

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  plans: {
    free: {
      id: "free",
      name: "Free",
      price: 0,
      interval: "month",
      features: [
        "1 chatbot",
        "100 messages/month",
        "Basic templates",
        "Web deployment",
        "Email support",
      ],
      limits: {
        chatbots: 1,
        messages: 100,
        aiFeatures: false,
        multiChannel: false,
        analytics: false,
        customBranding: false,
      },
      priceId: null,
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: 29,
      priceId: "price_1RXqqFIkLcXk4oh5C08YZzjU",
      interval: "month",
      features: [
        "5 chatbots",
        "5,000 messages/month",
        "AI-powered responses",
        "Multi-channel deployment",
        "Advanced analytics",
        "A/B testing",
        "Priority support",
      ],
      limits: {
        chatbots: 5,
        messages: 5000,
        aiFeatures: true,
        multiChannel: true,
        analytics: true,
        customBranding: false,
      },
    },
    enterprise: {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      priceId: "price_1RXqrvIkLcXk4oh5PvoiXRwN",
      interval: "month",
      features: [
        "Unlimited chatbots",
        "Unlimited messages",
        "Advanced AI features",
        "White-label solution",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
      ],
      limits: {
        chatbots: -1, // Unlimited
        messages: -1, // Unlimited
        aiFeatures: true,
        multiChannel: true,
        analytics: true,
        customBranding: true,
      },
    },
  },
};

// Stripe service class
export class StripeService {
  private stripe: Stripe | null = null;

  async initialize() {
    if (!this.stripe) {
      this.stripe = await getStripe();
      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe. Please check your configuration.');
      }
    }
    return this.stripe;
  }

  async createCheckoutSession(
    priceId: string,
    customerId?: string,
    userEmail?: string
  ) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing. Please check your environment variables.");
      }

      const apiUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;

      console.log('Creating checkout session with:', {
        priceId,
        customerId,
        userEmail,
        apiUrl
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          customerId,
          userEmail,
          successUrl: `${window.location.origin}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        }),
      });

      console.log('Checkout session response status:', response.status);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP error response:", response.status, errorText);

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error as JSON, use the status text
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('Checkout session response text:', responseText);

      if (!responseText) {
        throw new Error("Empty response from server");
      }

      let session;
      try {
        session = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error("Invalid response format from server");
      }

      if (session.error) {
        throw new Error(session.error);
      }

      if (!this.stripe) {
        await this.initialize();
      }

      if (!session.id) {
        throw new Error("No session ID received from server");
      }

      console.log('Redirecting to checkout with session ID:', session.id);

      const result = await this.stripe!.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  }

  async createPortalSession(customerId: string) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration is missing. Please check your environment variables.");
      }

      const apiUrl = `${supabaseUrl}/functions/v1/stripe-portal`;

      console.log('Creating portal session for customer:', customerId);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          returnUrl: `${window.location.origin}/settings`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Portal session error response:", response.status, errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error as JSON, use the status text
        }
        
        throw new Error(errorMessage);
      }

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      if (session.url) {
        console.log('Redirecting to portal URL:', session.url);
        window.location.href = session.url;
      } else {
        throw new Error("No portal URL received from server");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      throw error;
    }
  }

  getPlanByPriceId(priceId: string) {
    return Object.values(STRIPE_CONFIG.plans).find(
      (plan) => plan.priceId === priceId
    );
  }

  getPlanById(planId: string) {
    return STRIPE_CONFIG.plans[planId as keyof typeof STRIPE_CONFIG.plans];
  }

  canUsePlanFeature(userPlan: string, feature: string): boolean {
    const plan = this.getPlanById(userPlan);
    if (!plan) return false;

    switch (feature) {
      case "ai_features":
        return plan.limits.aiFeatures;
      case "multi_channel":
        return plan.limits.multiChannel;
      case "analytics":
        return plan.limits.analytics;
      case "custom_branding":
        return plan.limits.customBranding;
      default:
        return true;
    }
  }

  canCreateChatbot(userPlan: string, currentCount: number): boolean {
    const plan = this.getPlanById(userPlan);
    if (!plan) return false;

    return plan.limits.chatbots === -1 || currentCount < plan.limits.chatbots;
  }

  canSendMessage(userPlan: string, currentUsage: number): boolean {
    const plan = this.getPlanById(userPlan);
    if (!plan) return false;

    return plan.limits.messages === -1 || currentUsage < plan.limits.messages;
  }
}

export const stripeService = new StripeService();