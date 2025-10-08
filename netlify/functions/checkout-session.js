const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PLAN_DEFINITIONS = {
  free: {
    name: "Free",
    amount_cents: 0,
    is_free: true,
  },
  premium: {
    name: "Premium",
    amount_cents: 4900,
    currency: "usd",
    description: "Unlock premium training, certifications, and analytics.",
    billing_interval: "month",
  },
  enterprise: {
    name: "Enterprise",
    amount_cents: 9900,
    currency: "usd",
    description: "Tailored enablement for teams and departments.",
    billing_interval: "month",
  },
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  try {
    const { plan, email } = JSON.parse(event.body || "{}");

    // Validate plan
    if (!plan) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Plan is required" }),
      };
    }

    const planDefinition = PLAN_DEFINITIONS[plan.toLowerCase()];
    if (!planDefinition) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Unknown plan selected" }),
      };
    }

    if (planDefinition.is_free) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Free plan does not require checkout" }),
      };
    }

    // Validate email
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Email is required to start checkout" }),
      };
    }

    // Get frontend URL
    const frontendUrl = process.env.URL || "https://litmusai.netlify.app";
    const successUrl = `${frontendUrl}/billing?success=true`;
    const cancelUrl = `${frontendUrl}/billing?canceled=true`;

    // Check for mock mode
    const mockMode = process.env.STRIPE_MOCK_MODE === "true";
    if (mockMode) {
      console.log("Stripe checkout mock mode", { plan, email });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: `${successUrl}&mock_checkout=true` }),
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: planDefinition.currency || "usd",
            product_data: {
              name: planDefinition.name,
              description: planDefinition.description || "",
            },
            unit_amount: planDefinition.amount_cents,
            recurring: {
              interval: planDefinition.billing_interval || "month",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        plan_id: plan,
        email: email,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unable to start checkout with Stripe",
        details: error.message,
        hint: "Verify STRIPE_SECRET_KEY is set correctly in Netlify environment variables.",
      }),
    };
  }
};
