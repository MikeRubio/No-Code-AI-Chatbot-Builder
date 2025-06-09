import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper function to safely convert Stripe timestamp to ISO string
const safeTimestampToISO = (timestamp: any): string | null => {
  if (typeof timestamp === 'number' && !isNaN(timestamp) && timestamp >= 0) {
    try {
      return new Date(timestamp * 1000).toISOString();
    } catch (error) {
      console.warn('Failed to convert timestamp:', timestamp, error);
      return null;
    }
  }
  return null;
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration missing",
          details: "Required environment variables not found"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { userEmail, sessionId } = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: "userEmail is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper functions
    const getPlanFromPriceId = (priceId: string) => {
      const planMapping = {
        'price_1RXqqFIkLcXk4oh5C08YZzjU': 'pro',
        'price_1RXqrvIkLcXk4oh5PvoiXRwN': 'enterprise'
      };
      return planMapping[priceId] || 'free';
    };

    const getMessageQuota = (plan: string) => {
      const quotas = {
        'free': 100,
        'pro': 5000,
        'enterprise': -1 // unlimited
      };
      return quotas[plan] || 100;
    };

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          details: "Could not find user profile"
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Syncing subscription for user:', profile.id, 'email:', userEmail);

    // Find customer in Stripe by email
    const customerSearchResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${userEmail}'`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!customerSearchResponse.ok) {
      throw new Error('Failed to search for customer in Stripe');
    }

    const customerSearch = await customerSearchResponse.json();
    
    if (customerSearch.data.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No Stripe customer found",
          details: "User has no Stripe customer record"
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const customer = customerSearch.data[0];
    console.log('Found Stripe customer:', customer.id);

    // Get customer's subscriptions
    const subscriptionsResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!subscriptionsResponse.ok) {
      throw new Error('Failed to fetch subscriptions from Stripe');
    }

    const subscriptions = await subscriptionsResponse.json();
    console.log('Found subscriptions:', subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      // No active subscriptions, ensure user is on free plan
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_status: 'inactive',
          message_quota: 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profileUpdateError) {
        console.error('Error updating profile to free:', profileUpdateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "User set to free plan (no active subscriptions)",
          plan: 'free'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process the most recent active subscription
    const subscription = subscriptions.data[0];
    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const messageQuota = getMessageQuota(plan);

    console.log('Processing subscription:', subscription.id, 'Plan:', plan);

    // Safely convert timestamps
    const currentPeriodStart = safeTimestampToISO(subscription.current_period_start);
    const currentPeriodEnd = safeTimestampToISO(subscription.current_period_end);
    const trialStart = safeTimestampToISO(subscription.trial_start);
    const trialEnd = safeTimestampToISO(subscription.trial_end);
    const canceledAt = safeTimestampToISO(subscription.canceled_at);

    // Update or create subscription record using user_id as the conflict resolution
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: profile.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        plan: plan,
        status: subscription.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_product_id: subscription.items.data[0].price.product,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: canceledAt,
        trial_start: trialStart,
        trial_end: trialEnd,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      console.error('Error upserting subscription:', subError);
      return new Response(
        JSON.stringify({
          error: "Failed to update subscription record",
          details: subError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update user profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        plan: plan,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        message_quota: messageQuota,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update user profile",
          details: profileUpdateError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully synced subscription for user:', profile.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription synced successfully",
        plan: plan,
        status: subscription.status,
        messageQuota: messageQuota
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-subscription function:', error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});