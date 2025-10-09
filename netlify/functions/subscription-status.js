const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Get customer_id or subscription_id from query parameters
    const params = event.queryStringParameters || {};
    const customerId = params.customer_id;
    const subscriptionId = params.subscription_id;

    if (!customerId && !subscriptionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing parameter",
          details: "Please provide either customer_id or subscription_id",
        }),
      };
    }

    let subscription = null;

    if (subscriptionId) {
      // Get subscription by ID
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else if (customerId) {
      // Get active subscriptions for customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
      }
    }

    if (!subscription) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          has_subscription: false,
          plan: "free",
          status: null,
        }),
      };
    }

    // Extract plan information
    const planItem = subscription.items.data[0];
    const planAmount = planItem.price.unit_amount / 100;
    const planInterval = planItem.price.recurring.interval;

    // Determine plan ID based on amount
    let planId = "free";
    if (planAmount === 49) {
      planId = "premium";
    } else if (planAmount === 99) {
      planId = "enterprise";
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        has_subscription: true,
        plan: planId,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        subscription_id: subscription.id,
        customer_id: subscription.customer,
        amount: planAmount,
        interval: planInterval,
      }),
    };
  } catch (error) {
    console.error("Subscription status error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unable to retrieve subscription status",
        details: error.message,
      }),
    };
  }
};

