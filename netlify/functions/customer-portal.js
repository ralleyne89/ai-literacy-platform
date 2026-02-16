const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const resolveAllowedOrigin = (event) => {
  const configured = process.env.FRONTEND_URL || "";
  const requestOrigin = event.headers.origin || event.headers.Origin || "";
  if (configured) {
    return configured;
  }
  if (requestOrigin) {
    return requestOrigin;
  }
  return "http://localhost:5173";
};

exports.handler = async (event) => {
  const allowedOrigin = resolveAllowedOrigin(event);
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!supabase) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: "Supabase service role is not configured" }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const accessToken = authHeader.split(" ", 2)[1]?.trim();
    if (!accessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData?.user?.id) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const userId = authData.user.id;
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Unable to load subscription profile",
          details: profileError.message,
        }),
      };
    }

    if (!profile?.stripe_customer_id) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "No active subscription customer found" }),
      };
    }

    const requestData = JSON.parse(event.body || "{}");
    const defaultReturnUrl = `${(process.env.FRONTEND_URL || "https://litmusai.netlify.app").replace(/\/$/, "")}/billing`;
    const requestedReturnUrl = requestData.return_url || defaultReturnUrl;
    const returnUrl = requestedReturnUrl.startsWith(defaultReturnUrl.replace(/\/billing$/, ""))
      ? requestedReturnUrl
      : defaultReturnUrl;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: portalSession.url,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unable to create customer portal session",
        details: error.message,
      }),
    };
  }
};
