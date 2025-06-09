import { createClient } from "npm:@supabase/supabase-js@2";

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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration missing",
          details: "Required environment variables not found",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      subscriptionId,
      reason,
      feedback,
      cancelAtPeriodEnd = true,
    } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: "subscriptionId is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update subscription in Stripe
    const updateParams = new URLSearchParams();
    updateParams.append("cancel_at_period_end", cancelAtPeriodEnd.toString());

    if (reason || feedback) {
      const metadata: any = {};
      if (reason) metadata.cancel_reason = reason;
      if (feedback) metadata.cancel_feedback = feedback;

      Object.keys(metadata).forEach((key) => {
        updateParams.append(`metadata[${key}]`, metadata[key]);
      });
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: updateParams,
      }
    );

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error("Stripe API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to update subscription in Stripe",
          details: errorText,
        }),
        {
          status: stripeResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const subscription = await stripeResponse.json();

    // Update subscription in database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update subscription record",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log cancellation feedback if provided
    if (reason || feedback) {
      try {
        await supabase.from("subscription_feedback").insert({
          subscription_id: subscriptionId,
          action: "cancel",
          reason: reason,
          feedback: feedback,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error logging feedback:", error);
        // Don't fail the request if feedback logging fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: cancelAtPeriodEnd
          ? "Subscription will be canceled at the end of the billing period"
          : "Subscription canceled immediately",
        subscription: {
          id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in cancel-subscription function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
