const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Supabase client for updating user subscriptions
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Webhook secret not configured" }),
    };
  }

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  console.log("Received webhook event:", stripeEvent.type);

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(stripeEvent.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(stripeEvent.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(stripeEvent.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Webhook processing failed" }),
    };
  }
};

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  console.log("Checkout session completed:", session.id);

  const customerEmail = session.customer_email;
  const subscriptionId = session.subscription;
  const planId = session.metadata?.plan_id;

  console.log(
    `Customer: ${customerEmail}, Subscription: ${subscriptionId}, Plan: ${planId}`
  );

  if (supabase && customerEmail) {
    try {
      // Find user by email
      const { data: users, error: findError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", customerEmail)
        .limit(1);

      if (findError) {
        console.error("Error finding user:", findError);
        return;
      }

      if (users && users.length > 0) {
        const user = users[0];

        // Update user subscription
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_tier: planId || "premium",
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating user subscription:", updateError);
        } else {
          console.log(
            `Updated subscription for user ${user.id} to ${planId || "premium"}`
          );
        }
      } else {
        console.log(`No user found with email: ${customerEmail}`);
      }
    } catch (error) {
      console.error("Error in handleCheckoutSessionCompleted:", error);
    }
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  console.log("Subscription created:", subscription.id);

  const customerId = subscription.customer;
  const status = subscription.status;

  console.log(`Customer: ${customerId}, Status: ${status}`);

  // You can add additional logic here if needed
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);

  const subscriptionId = subscription.id;
  const status = subscription.status;

  console.log(`Subscription: ${subscriptionId}, New Status: ${status}`);

  if (supabase) {
    try {
      // Update subscription status in database
      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (error) {
        console.error("Error updating subscription status:", error);
      } else {
        console.log(`Updated subscription status to: ${status}`);
      }
    } catch (error) {
      console.error("Error in handleSubscriptionUpdated:", error);
    }
  }
}

// Handle subscription deleted (cancelled)
async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

  const subscriptionId = subscription.id;

  if (supabase) {
    try {
      // Downgrade user to free plan
      const { error } = await supabase
        .from("users")
        .update({
          subscription_tier: "free",
          subscription_status: "cancelled",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (error) {
        console.error("Error handling subscription cancellation:", error);
      } else {
        console.log(`Downgraded user to free plan`);
      }
    } catch (error) {
      console.error("Error in handleSubscriptionDeleted:", error);
    }
  }
}

// Handle successful payment
async function handleInvoicePaymentSucceeded(invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convert from cents

  console.log(
    `Subscription: ${subscriptionId}, Amount: $${amountPaid.toFixed(2)}`
  );

  // You can send email notifications here
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice) {
  console.log("Invoice payment failed:", invoice.id);

  const subscriptionId = invoice.subscription;
  const customerEmail = invoice.customer_email;

  console.log(`Subscription: ${subscriptionId}, Customer: ${customerEmail}`);

  // You can send email notifications here to alert the customer
}
