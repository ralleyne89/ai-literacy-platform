const PLAN_DEFINITIONS = {
  free: {
    id: "free",
    name: "Free",
    description: "Perfect for individuals exploring LitmusAI.",
    amount: 0,
    currency: "usd",
    billing_interval: "month",
    features: [
      "Access to assessments",
      "Foundational training modules",
      "Basic progress tracking",
    ],
    cta: "You are on this plan",
    is_free: true,
    checkout_enabled: true,
    configured: true,
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Unlock premium training, certifications, and analytics.",
    amount: 15,
    currency: "usd",
    billing_interval: "month",
    features: [
      "All Free features",
      "Premium training catalog",
      "Certification exam access",
      "Email support",
    ],
    cta: "Upgrade to Premium",
    is_free: false,
    checkout_enabled: true,
    configured: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Tailored enablement for teams and departments.",
    amount: 99,
    currency: "usd",
    billing_interval: "month",
    features: [
      "Custom learning paths",
      "Dedicated customer success",
      "SSO & advanced reporting",
      "Licensing & partnerships",
    ],
    cta: "Upgrade to Enterprise",
    is_free: false,
    checkout_enabled: false, // Temporarily disabled
    configured: false, // Hide from UI
  },
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
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
    const plans = Object.values(PLAN_DEFINITIONS);
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        publishable_key: publishableKey,
        plans: plans,
      }),
    };
  } catch (error) {
    console.error("Billing config error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unable to fetch billing configuration",
        details: error.message,
      }),
    };
  }
};
