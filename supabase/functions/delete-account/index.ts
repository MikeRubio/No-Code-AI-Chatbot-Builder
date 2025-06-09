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

    const { userId, confirmEmail } = await req.json();

    if (!userId || !confirmEmail) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: "userId and confirmEmail are required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user exists and email matches
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .eq('email', confirmEmail)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          error: "User verification failed",
          details: "Could not verify user identity"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's subscription to cancel in Stripe
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    // Cancel subscription in Stripe if exists
    if (subscription?.stripe_subscription_id) {
      try {
        await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });
      } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        // Continue with account deletion even if Stripe cancellation fails
      }
    }

    // Delete customer in Stripe if exists
    if (subscription?.stripe_customer_id) {
      try {
        await fetch(`https://api.stripe.com/v1/customers/${subscription.stripe_customer_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });
      } catch (error) {
        console.error('Error deleting Stripe customer:', error);
        // Continue with account deletion even if Stripe deletion fails
      }
    }

    // Create account deletion record for audit trail
    const { error: deletionError } = await supabase
      .from('account_deletions')
      .insert({
        user_id: userId,
        email: confirmEmail,
        deletion_requested_at: new Date().toISOString(),
        stripe_customer_id: subscription?.stripe_customer_id,
        stripe_subscription_id: subscription?.stripe_subscription_id,
      });

    if (deletionError) {
      console.error('Error creating deletion record:', deletionError);
    }

    // Delete user data in order (due to foreign key constraints)
    const tablesToCleanup = [
      'conversation_feedback',
      'conversation_logs', 
      'conversation_exports',
      'ab_test_results',
      'survey_responses',
      'human_handoffs',
      'file_uploads',
      'messages',
      'conversations',
      'faq_entries',
      'faq_documents',
      'conditional_logic',
      'api_integrations',
      'surveys',
      'ab_tests',
      'deployment_channels',
      'analytics',
      'funnel_analytics',
      'user_journey_heatmaps',
      'chatbots',
      'invoices',
      'payment_methods',
      'subscriptions',
      'usage_tracking',
    ];

    // Delete data from each table
    for (const table of tablesToCleanup) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
        }
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }

    // Delete the user profile (this will cascade to auth.users)
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete user profile",
          details: profileDeleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the user from auth.users
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete user authentication",
          details: authDeleteError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update deletion record to mark as completed
    await supabase
      .from('account_deletions')
      .update({
        deletion_completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in delete-account function:', error);
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