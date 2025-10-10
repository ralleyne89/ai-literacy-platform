// Diagnostic function to test Stripe API connection
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Check if environment variables are set
    const envCheck = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET (starts with: " + process.env.STRIPE_SECRET_KEY.substring(0, 10) + "...)" : "NOT SET",
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? "SET (starts with: " + process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 10) + "...)" : "NOT SET",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "NOT SET",
      URL: process.env.URL || "NOT SET",
      FRONTEND_URL: process.env.FRONTEND_URL || "NOT SET",
    };

    // Test Stripe API connection by listing products (should work with any valid key)
    let stripeTest = { status: "unknown", error: null };
    try {
      const products = await stripe.products.list({ limit: 1 });
      stripeTest = {
        status: "SUCCESS",
        message: "Stripe API connection successful",
        productsCount: products.data.length,
      };
    } catch (stripeError) {
      stripeTest = {
        status: "FAILED",
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        environment: envCheck,
        stripeConnection: stripeTest,
        timestamp: new Date().toISOString(),
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Test failed",
        message: error.message,
        stack: error.stack,
      }, null, 2),
    };
  }
};

