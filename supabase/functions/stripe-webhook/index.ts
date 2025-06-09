import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature",
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
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error('Missing Stripe configuration');
      return new Response(
        JSON.stringify({
          error: "Stripe configuration is missing",
          details: "STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not found"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({
          error: "Supabase configuration is missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.text();
    
    // Verify webhook signature
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(stripeWebhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Parse signature
    const sigElements = signature.split(',');
    const timestamp = sigElements.find(el => el.startsWith('t='))?.split('=')[1];
    const sig = sigElements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !sig) {
      return new Response(
        JSON.stringify({ error: "Invalid signature format" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create payload for verification
    const payload = `${timestamp}.${body}`;
    const payloadData = encoder.encode(payload);
    const expectedSig = await crypto.subtle.sign('HMAC', key, payloadData);
    const expectedSigHex = Array.from(new Uint8Array(expectedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSigHex !== sig) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const event = JSON.parse(body);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing webhook event: ${event.type}`);

    // Helper function to get plan from price ID
    const getPlanFromPriceId = (priceId: string) => {
      const planMapping = {
        'price_1RXqqFIkLcXk4oh5C08YZzjU': 'pro',
        'price_1RXqrvIkLcXk4oh5PvoiXRwN': 'enterprise'
      };
      return planMapping[priceId] || 'free';
    };

    // Helper function to get message quota from plan
    const getMessageQuota = (plan: string) => {
      const quotas = {
        'free': 100,
        'pro': 5000,
        'enterprise': -1 // unlimited
      };
      return quotas[plan] || 100;
    };

    // Helper function to find user by customer ID or email
    const findUserByCustomerIdOrEmail = async (customerId: string, email?: string) => {
      // First try to find by customer ID
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();
      
      if (subscription?.user_id) {
        return subscription.user_id;
      }

      // If not found and we have email, try to find by email
      if (email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        return profile?.id;
      }

      return null;
    };

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        console.log('Customer email:', session.customer_details?.email);
        console.log('Customer ID:', session.customer);
        
        // Get subscription details from Stripe
        if (session.subscription) {
          const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          });
          
          if (subscriptionResponse.ok) {
            const subscription = await subscriptionResponse.json();
            const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
            const messageQuota = getMessageQuota(plan);
            
            console.log('Processing subscription:', subscription.id, 'Plan:', plan);
            
            // Find user by customer ID or email
            const userId = await findUserByCustomerIdOrEmail(
              subscription.customer, 
              session.customer_details?.email
            );
            
            if (userId) {
              console.log('Found user ID:', userId);
              
              // Safely convert timestamps
              const currentPeriodStart = safeTimestampToISO(subscription.current_period_start);
              const currentPeriodEnd = safeTimestampToISO(subscription.current_period_end);
              
              // Create or update subscription record
              const { error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                  user_id: userId,
                  stripe_subscription_id: subscription.id,
                  stripe_customer_id: subscription.customer,
                  plan: plan,
                  status: subscription.status,
                  current_period_start: currentPeriodStart,
                  current_period_end: currentPeriodEnd,
                  stripe_price_id: subscription.items.data[0].price.id,
                  stripe_product_id: subscription.items.data[0].price.product,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id'
                });

              if (subError) {
                console.error('Error creating subscription:', subError);
              } else {
                console.log('Subscription created successfully');
                
                // Update user profile with new plan
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({
                    plan: plan,
                    subscription_id: subscription.id,
                    subscription_status: subscription.status,
                    message_quota: messageQuota,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', userId);

                if (profileError) {
                  console.error('Error updating profile:', profileError);
                } else {
                  console.log('Profile updated successfully for user:', userId);
                }
              }
            } else {
              console.error('Could not find user for customer:', subscription.customer, 'email:', session.customer_details?.email);
            }
          }
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
        const messageQuota = getMessageQuota(plan);
        
        console.log(`Subscription ${event.type}:`, subscription.id, 'Plan:', plan);
        
        // Find user by customer ID
        const userId = await findUserByCustomerIdOrEmail(subscription.customer);
        
        if (userId) {
          // Safely convert timestamps
          const currentPeriodStart = safeTimestampToISO(subscription.current_period_start);
          const currentPeriodEnd = safeTimestampToISO(subscription.current_period_end);
          const trialStart = safeTimestampToISO(subscription.trial_start);
          const trialEnd = safeTimestampToISO(subscription.trial_end);
          const canceledAt = safeTimestampToISO(subscription.canceled_at);

          // Update subscription in database
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
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
            console.error('Error updating subscription:', subError);
          } else {
            console.log('Subscription updated successfully');
            
            // Update user profile
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                plan: plan,
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                message_quota: messageQuota,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (profileError) {
              console.error('Error updating profile:', profileError);
            } else {
              console.log('Profile updated successfully for user:', userId);
            }
          }
        } else {
          console.error('Could not find user for customer:', subscription.customer);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('Subscription deleted:', deletedSub.id);
        
        // Update subscription status
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', deletedSub.id);

        if (deleteError) {
          console.error('Error updating canceled subscription:', deleteError);
        } else {
          console.log('Subscription canceled successfully');
          
          // Downgrade user to free plan
          const userId = await findUserByCustomerIdOrEmail(deletedSub.customer);
          if (userId) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                plan: 'free',
                subscription_status: 'canceled',
                message_quota: 100,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (profileError) {
              console.error('Error downgrading profile:', profileError);
            } else {
              console.log('Profile downgraded to free plan for user:', userId);
            }
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Find user by customer ID
        const invoiceUserId = await findUserByCustomerIdOrEmail(invoice.customer);
        
        if (invoiceUserId) {
          // Safely convert timestamps
          const periodStart = safeTimestampToISO(invoice.period_start);
          const periodEnd = safeTimestampToISO(invoice.period_end);
          const dueDate = safeTimestampToISO(invoice.due_date);
          const paidAt = invoice.status_transitions?.paid_at ? safeTimestampToISO(invoice.status_transitions.paid_at) : null;

          // Record successful payment
          const { error: invoiceError } = await supabase
            .from('invoices')
            .upsert({
              stripe_invoice_id: invoice.id,
              user_id: invoiceUserId,
              subscription_id: invoice.subscription ? 
                (await supabase.from('subscriptions').select('id').eq('stripe_subscription_id', invoice.subscription).single())?.data?.id : null,
              amount_paid: invoice.amount_paid,
              amount_due: invoice.amount_due,
              currency: invoice.currency,
              status: invoice.status,
              invoice_pdf: invoice.invoice_pdf,
              hosted_invoice_url: invoice.hosted_invoice_url,
              period_start: periodStart,
              period_end: periodEnd,
              due_date: dueDate,
              paid_at: paidAt,
            });

          if (invoiceError) {
            console.error('Error recording invoice:', invoiceError);
          } else {
            console.log('Invoice recorded successfully');
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        
        // Update subscription status to past_due if needed
        if (failedInvoice.subscription) {
          const { error: subError } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', failedInvoice.subscription);

          if (subError) {
            console.error('Error updating subscription to past_due:', subError);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in stripe-webhook function:', error);
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