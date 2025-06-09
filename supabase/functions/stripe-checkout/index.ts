import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment variables');
      return new Response(
        JSON.stringify({
          error: "Stripe configuration is missing. Please contact support.",
          details: "STRIPE_SECRET_KEY not found in environment variables"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { priceId, successUrl, cancelUrl, userEmail } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: "priceId, successUrl, and cancelUrl are required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get user information if email is provided
    let customerId = null;
    if (userEmail) {
      // Check if customer already exists in Stripe
      const existingCustomerResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${userEmail}'`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (existingCustomerResponse.ok) {
        const existingCustomers = await existingCustomerResponse.json();
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }
      }

      // Create customer if doesn't exist
      if (!customerId) {
        const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'email': userEmail,
          }),
        });

        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          customerId = customer.id;
        }
      }
    }

    // Prepare checkout session parameters
    const sessionParams = new URLSearchParams({
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'payment_method_types[0]': 'card',
      'billing_address_collection': 'required',
      'allow_promotion_codes': 'true',
    });

    // Add customer if available
    if (customerId) {
      sessionParams.append('customer', customerId);
    } else if (userEmail) {
      sessionParams.append('customer_email', userEmail);
    }

    // Create Stripe checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionParams,
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('Stripe API error:', errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to create checkout session",
          details: errorText
        }),
        {
          status: stripeResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const session = await stripeResponse.json();

    // If we have user email, create a preliminary subscription record
    if (userEmail && customerId) {
      try {
        // Get user ID from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (profile) {
          // Create preliminary subscription record using user_id as conflict resolution
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: profile.id,
              stripe_customer_id: customerId,
              plan: 'free', // Will be updated by webhook
              status: 'incomplete',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });
        }
      } catch (error) {
        console.error('Error creating preliminary subscription record:', error);
        // Don't fail the checkout if this fails
      }
    }

    return new Response(
      JSON.stringify({ id: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in stripe-checkout function:', error);
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